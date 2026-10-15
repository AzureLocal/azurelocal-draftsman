import { areaPurpose, intentOfPort, linksOfHost, trafficOfLink, carriesStorage, type HostLink } from '@/lib/topology/analysis';
import { isAtcDefaultStorageVlan } from '@/types/topology';
import type { ValidationIssue } from '@/types/validation';
import type { Rule } from './context';

/**
 * RULE-VLAN-ALIGNMENT: VLAN tags must line up between hosts and switches.
 *  1. A VLAN tagged on a host-to-ToR cable must be allowed on that switch's trunk (only when the switch lists
 *     its trunk VLANs: NodeEntity.trunkVlans).
 *  2. Management and compute VLANs must be the same on both ToR switches of a host (SET members are
 *     switch-independent, so either path can carry a VM or management frame).
 *  3. Ports of one non-storage intent (a SET team) must carry the same VLAN set.
 *  4. Storage: in a switched design each storage adapter should use its own VLAN and subnet; two storage
 *     ports of one intent on the same single VLAN is a warning.
 * Cables without a VLAN are treated as unspecified and not audited.
 * https://learn.microsoft.com/azure/azure-local/concepts/host-network-requirements#storage-traffic-models
 */
export const vlanAlignmentRule: Rule = ({ doc, cluster, hosts }) => {
  const issues: ValidationIssue[] = [];

  for (const host of hosts) {
    const torLinks = linksOfHost(doc, host).filter((l) => l.kind === 'tor');

    // 1. Trunk allow-list.
    for (const link of torLinks) {
      const vlan = link.connector.vlanId;
      const allowed = link.other?.trunkVlans;
      if (vlan !== undefined && allowed && !allowed.includes(vlan)) {
        issues.push({
          id: `issue-vlan-trunk-${link.connector.id}`,
          ruleId: 'RULE-VLAN-ALIGNMENT',
          severity: 'error',
          title: 'VLAN Not Allowed on Switch Trunk',
          message: `${host.title} tags VLAN ${vlan} toward ${link.other!.title}, but that switch only allows ${allowed.join(', ') || 'no VLANs'}.`,
          targetConnectorId: link.connector.id,
          targetNodeId: link.other!.id,
          suggestedFix: `Add VLAN ${vlan} to the trunk on ${link.other!.title} or change the tag on the cable.`,
        });
      }
    }

    // 2. Same management/compute VLAN set on every ToR the host reaches.
    const perTor = new Map<string, { title: string; vlans: Set<number> }>();
    for (const link of torLinks) {
      const vlan = link.connector.vlanId;
      if (vlan === undefined) continue;
      const traffic = trafficOfLink(link);
      if (Array.isArray(traffic) && traffic.length === 1 && traffic[0] === 'storage') continue;
      if (traffic === 'unknown' && isAtcDefaultStorageVlan(vlan)) continue; // looks like a storage tag on an unassigned port
      if (carriesStorage(link) && isAtcDefaultStorageVlan(vlan)) continue; // converged intent: storage adapters keep their own VLAN
      const entry = perTor.get(link.other!.id) ?? { title: link.other!.title, vlans: new Set<number>() };
      entry.vlans.add(vlan);
      perTor.set(link.other!.id, entry);
    }
    if (perTor.size >= 2) {
      const sets = [...perTor.values()];
      const reference = [...sets[0].vlans].sort((a, b) => a - b).join(',');
      const mismatched = sets.find((s) => [...s.vlans].sort((a, b) => a - b).join(',') !== reference);
      if (mismatched) {
        issues.push({
          id: `issue-vlan-tor-mismatch-${host.id}`,
          ruleId: 'RULE-VLAN-ALIGNMENT',
          severity: 'error',
          title: 'VLAN Set Differs Between ToR Switches',
          message: `${host.title}: ${sets[0].title} carries VLAN ${reference} but ${mismatched.title} carries VLAN ${[...mismatched.vlans].sort((a, b) => a - b).join(',')}. A SET team needs the same VLANs on both paths.`,
          targetNodeId: host.id,
          suggestedFix: 'Tag the same management and compute VLANs on the cables to both ToR switches.',
        });
      }
    }

    // 3 and 4. Per-intent consistency.
    for (const intent of host.intents ?? []) {
      const links = linksOfHost(doc, host).filter((l) => intentOfPort(host, l.hostPortId)?.id === intent.id && l.kind === 'tor');
      const isStorageOnly = intent.traffic.length === 1 && intent.traffic[0] === 'storage';
      // In a converged intent each adapter keeps its own storage VLAN, so cables tagged with a storage default are not compared.
      const tagged = links.filter(
        (l) => l.connector.vlanId !== undefined && (isStorageOnly || !(carriesStorage(l) && isAtcDefaultStorageVlan(l.connector.vlanId))),
      );
      if (tagged.length < 2) continue;
      const vlans = new Set(tagged.map((l) => l.connector.vlanId!));
      if (!isStorageOnly && vlans.size > 1) {
        issues.push({
          id: `issue-vlan-intent-${host.id}-${intent.id}`,
          ruleId: 'RULE-VLAN-ALIGNMENT',
          severity: 'error',
          title: 'VLAN Mismatch Inside One Intent',
          message: `${host.title}: ports of intent ${intent.name} are tagged with different VLANs (${[...vlans].sort((a, b) => a - b).join(', ')}).`,
          targetNodeId: host.id,
          suggestedFix: 'Use the same VLAN on every port of the intent (they form one SET team).',
        });
      }
      if (isStorageOnly && cluster.storage === 'switched' && vlans.size === 1) {
        issues.push({
          id: `issue-vlan-storage-shared-${host.id}-${intent.id}`,
          ruleId: 'RULE-VLAN-ALIGNMENT',
          severity: 'warning',
          title: 'Storage Adapters Share One VLAN',
          message: `${host.title}: storage ports of ${intent.name} all use VLAN ${[...vlans][0]}. Use a separate VLAN and subnet per storage adapter so each path stays on one ToR.`,
          targetNodeId: host.id,
          suggestedFix: 'Assign the second storage adapter its own VLAN and subnet (Network ATC default: 711 and 712).',
        });
      }
    }
  }
  return issues;
};

/**
 * RULE-VLAN-ATC-COLLISION (warning, non-blocking): Network ATC assigns storage VLANs 711 to 718 by default (719
 * reserved). A custom management, compute or other non-storage network on one of those IDs collides with the
 * default, so a later storage intent without explicit StorageVlans would reuse it. Custom VLANs stay allowed.
 * https://learn.microsoft.com/azure/azure-local/deploy/network-atc#default-vlans
 */
export const atcVlanCollisionRule: Rule = ({ doc, hosts }) => {
  const issues: ValidationIssue[] = [];

  for (const area of doc.areas) {
    if (!isAtcDefaultStorageVlan(area.vlanId)) continue;
    const purpose = areaPurpose(area);
    if (purpose === undefined || purpose === 'storage') continue;
    issues.push({
      id: `issue-vlan-collision-area-${area.id}`,
      ruleId: 'RULE-VLAN-ATC-COLLISION',
      severity: 'warning',
      title: 'VLAN Collides with Network ATC Storage Default',
      message: `${area.label} uses VLAN ${area.vlanId}, a Network ATC default storage VLAN (711 to 719). It is allowed, but a storage intent that keeps the defaults will use the same ID.`,
      targetAreaId: area.id,
      suggestedFix: 'Pick a management/compute VLAN outside 711 to 719, or set StorageVlans explicitly on the storage intent.',
    });
  }

  for (const host of hosts) {
    const links: HostLink[] = linksOfHost(doc, host).filter((l) => l.kind === 'tor');
    for (const link of links) {
      const vlan = link.connector.vlanId;
      if (!isAtcDefaultStorageVlan(vlan)) continue;
      const traffic = trafficOfLink(link);
      if (!Array.isArray(traffic) || carriesStorage(link)) continue;
      issues.push({
        id: `issue-vlan-collision-link-${link.connector.id}`,
        ruleId: 'RULE-VLAN-ATC-COLLISION',
        severity: 'warning',
        title: 'VLAN Collides with Network ATC Storage Default',
        message: `${host.title}: ${traffic.join('/')} traffic is tagged VLAN ${vlan}, a Network ATC default storage VLAN (711 to 719).`,
        targetConnectorId: link.connector.id,
        suggestedFix: 'Use a VLAN outside 711 to 719 for non-storage traffic, or set StorageVlans explicitly.',
      });
    }
  }
  return issues;
};
