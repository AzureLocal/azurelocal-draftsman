import { CLUSTER_LIMITS } from '@/types/topology';
import { linksOfHost, trafficOfLink, torSwitchesOf, carriesStorage } from '@/lib/topology/analysis';
import type { ValidationIssue } from '@/types/validation';
import type { Rule } from './context';

/**
 * RULE-SWITCHLESS-SCALE: switchless storage supports 1 to 4 nodes (error above that). Three-node switchless
 * has no Network ATC automatic storage IP: plan addressing (info).
 * https://learn.microsoft.com/azure/azure-local/plan/network-patterns-overview#storage-switchless-connectivity-considerations
 */
export const switchlessScaleRule: Rule = ({ cluster, hosts }) => {
  if (cluster.storage !== 'switchless') return [];
  const issues: ValidationIssue[] = [];
  if (hosts.length > CLUSTER_LIMITS.switchlessMaxNodes) {
    issues.push({
      id: 'issue-switchless-scale',
      ruleId: 'RULE-SWITCHLESS-SCALE',
      severity: 'error',
      title: 'Too Many Nodes for Switchless Storage',
      message: `Switchless storage supports 1 to ${CLUSTER_LIMITS.switchlessMaxNodes} nodes; this design has ${hosts.length}.`,
      suggestedFix: 'Use switched storage (one MLAG ToR pair carrying management, compute and storage).',
    });
  }
  if (hosts.length === 3) {
    issues.push({
      id: 'issue-switchless-3node-ip',
      ruleId: 'RULE-SWITCHLESS-SCALE',
      severity: 'info',
      title: 'Plan Storage IPs for 3-Node Switchless',
      message: 'Network ATC does not support automatic storage IP addressing on 3-node switchless deployments. Plan the storage subnets and addresses yourself.',
      suggestedFix: 'Record one subnet per node pair (for example 10.71.1.0/24, 10.71.2.0/24, 10.71.3.0/24) in the design notes.',
    });
  }
  return issues;
};

/**
 * RULE-SWITCHLESS-MESH: in a switchless design every node pair needs a direct storage cable and each node needs
 * at least two storage ports (one for a two-node cluster would leave a single path).
 */
export const switchlessMeshRule: Rule = ({ doc, cluster, hosts }) => {
  if (cluster.storage !== 'switchless' || hosts.length < 2) return [];
  const issues: ValidationIssue[] = [];
  const hostIds = new Set(hosts.map((h) => h.id));
  const pairCount = new Map<string, number>();
  const perHost = new Map<string, number>();
  for (const c of doc.connectors) {
    if (!hostIds.has(c.sourceId) || !hostIds.has(c.targetId)) continue;
    const key = [c.sourceId, c.targetId].sort().join('|');
    pairCount.set(key, (pairCount.get(key) ?? 0) + 1);
    perHost.set(c.sourceId, (perHost.get(c.sourceId) ?? 0) + 1);
    perHost.set(c.targetId, (perHost.get(c.targetId) ?? 0) + 1);
  }
  for (let i = 0; i < hosts.length; i++) {
    for (let j = i + 1; j < hosts.length; j++) {
      const key = [hosts[i].id, hosts[j].id].sort().join('|');
      if (!pairCount.get(key)) {
        issues.push({
          id: `issue-mesh-missing-${key}`,
          ruleId: 'RULE-SWITCHLESS-MESH',
          severity: 'error',
          title: 'Missing Storage Link Between Nodes',
          message: `${hosts[i].title} and ${hosts[j].title} have no direct storage cable. Switchless storage needs a full mesh.`,
          targetNodeId: hosts[i].id,
          suggestedFix: 'Cable a storage port on each node to the other node.',
        });
      }
    }
  }
  for (const host of hosts) {
    if ((perHost.get(host.id) ?? 0) < 2) {
      issues.push({
        id: `issue-mesh-ports-${host.id}`,
        ruleId: 'RULE-SWITCHLESS-MESH',
        severity: 'error',
        title: 'Fewer Than Two Storage Links',
        message: `${host.title} has ${perHost.get(host.id) ?? 0} direct storage link(s). Storage needs at least two ports per node.`,
        targetNodeId: host.id,
        suggestedFix: 'Add a second node-to-node storage cable (two links between two nodes, or one to each peer in a 3-node mesh).',
      });
    }
  }
  return issues;
};

/**
 * RULE-STORAGE-SWITCH-ISOLATION: in a single-rack switched design all host traffic runs over the same MLAG ToR
 * pair; a separate storage-only switch pair is discouraged (warning).
 * https://learn.microsoft.com/azure/azure-local/plan/cloud-deployment-network-considerations#decision-3-determine-cluster-topology
 */
export const storageSwitchIsolationRule: Rule = ({ doc, cluster, hosts }) => {
  if (cluster.pattern !== 'single-rack' || cluster.storage !== 'switched') return [];
  const storageOnly = new Set<string>();
  const carriesOther = new Set<string>();
  for (const host of hosts) {
    for (const link of linksOfHost(doc, host)) {
      if (link.kind !== 'tor') continue;
      const t = trafficOfLink(link);
      if (!Array.isArray(t)) {
        carriesOther.add(link.other!.id);
        continue;
      }
      if (t.length === 1 && t[0] === 'storage') storageOnly.add(link.other!.id);
      else carriesOther.add(link.other!.id);
    }
  }
  const isolated = [...storageOnly].filter((id) => !carriesOther.has(id));
  if (isolated.length === 0 || carriesOther.size === 0) return [];
  return isolated.map((id) => {
    const sw = doc.nodes.find((n) => n.id === id)!;
    return {
      id: `issue-storage-isolated-${id}`,
      ruleId: 'RULE-STORAGE-SWITCH-ISOLATION',
      severity: 'warning' as const,
      title: 'Storage-Only Switch in a Single-Rack Design',
      message: `${sw.title} carries only storage while other ToR switches carry management and compute. Learn recommends one MLAG ToR pair for all host traffic, not a separate storage-only pair.`,
      targetNodeId: id,
      suggestedFix: 'Move storage, management and compute onto the same ToR pair, or use a rack-aware pattern if you need separate room-level storage paths.',
    };
  });
};

/**
 * RULE-RACK-AWARE: rack-aware clusters use switched storage, an even number of nodes (up to 8) split evenly over
 * two zones (rooms), at least one ToR in each zone and a path between the zones for storage.
 * https://learn.microsoft.com/azure/azure-local/plan/cloud-deployment-network-considerations#decision-3-determine-cluster-topology
 * https://learn.microsoft.com/azure/azure-local/concepts/rack-aware-cluster-reference-architecture
 */
export const rackAwareRule: Rule = ({ doc, cluster, hosts }) => {
  if (cluster.pattern !== 'rack-aware') return [];
  const issues: ValidationIssue[] = [];
  const add = (id: string, severity: ValidationIssue['severity'], title: string, message: string, suggestedFix: string, targetNodeId?: string) =>
    issues.push({ id: `issue-rack-${id}`, ruleId: 'RULE-RACK-AWARE', severity, title, message, suggestedFix, targetNodeId });

  if (cluster.storage === 'switchless') {
    add('switched', 'error', 'Rack-Aware Needs Switched Storage', 'Rack-aware clusters need switched storage with room-to-room storage paths; switchless storage is not supported.', 'Set storage to switched and cable the storage ports to the ToR switches.');
  }
  if (hosts.length % 2 !== 0 || hosts.length < 2 || hosts.length > CLUSTER_LIMITS.rackAwareMaxNodes) {
    add('nodes', 'error', 'Rack-Aware Node Count', `Rack-aware clusters need an even number of nodes, up to ${CLUSTER_LIMITS.rackAwareMaxNodes}; this design has ${hosts.length}.`, 'Use 2, 4, 6 or 8 nodes split evenly over two zones.');
  }
  const unzoned = hosts.filter((h) => !h.zoneId);
  unzoned.forEach((h) => add(`zone-${h.id}`, 'error', 'Node Without Zone', `${h.title} has no zone. Every node belongs to one of the two rack-aware zones.`, 'Set the zone in the node inspector.', h.id));
  const zoneCounts = new Map<string, number>();
  hosts.forEach((h) => h.zoneId && zoneCounts.set(h.zoneId, (zoneCounts.get(h.zoneId) ?? 0) + 1));
  if (unzoned.length === 0 && hosts.length > 0) {
    if (zoneCounts.size !== 2) {
      add('zones', 'error', 'Rack-Aware Needs Two Zones', `Nodes are spread over ${zoneCounts.size} zone(s); rack-aware uses exactly two.`, 'Place half of the nodes in each of two zones (rooms).');
    } else {
      const [a, b] = [...zoneCounts.values()];
      if (a !== b) add('balance', 'error', 'Unbalanced Zones', `Zones hold ${a} and ${b} nodes. Each zone must hold the same number of nodes.`, 'Move nodes so both zones have the same count.');
    }
  }

  const tors = torSwitchesOf(doc);
  const zones = [...zoneCounts.keys()];
  for (const zone of zones) {
    const zoneTors = tors.filter((t) => t.zoneId === zone);
    if (tors.some((t) => t.zoneId) && zoneTors.length === 0) {
      add(`tor-${zone}`, 'error', 'Zone Without ToR', `Zone ${zone} has no ToR switch assigned.`, 'Assign at least one ToR (two recommended) to each zone.');
    } else if (zoneTors.length === 1 && cluster.torPerZone !== 1) {
      add(`tor-single-${zone}`, 'warning', 'Single ToR in Zone', `Zone ${zone} has one ToR. Learn strongly recommends two ToR switches per room; one is a cost-driven edge option.`, 'Add a second ToR to the zone, or set the design to one ToR per room.');
    }
  }
  const zonedTors = tors.filter((t) => t.zoneId);
  if (zonedTors.length > 0 && zones.length === 2) {
    const torIds = new Set(zonedTors.map((t) => t.id));
    const zoneOf = new Map(zonedTors.map((t) => [t.id, t.zoneId]));
    const interZone = doc.connectors.some((c) => torIds.has(c.sourceId) && torIds.has(c.targetId) && zoneOf.get(c.sourceId) !== zoneOf.get(c.targetId));
    // Option 4 (cross-room node connectivity) replaces the room-to-room link: then EVERY node reaches a ToR in each room.
    const reachesBothRooms = (h: (typeof hosts)[number]) => {
      const reached = new Set(linksOfHost(doc, h).filter((l) => l.kind === 'tor' && l.other?.zoneId).map((l) => l.other!.zoneId));
      return reached.size >= 2;
    };
    const crossRoomAll = hosts.length > 0 && hosts.every(reachesBothRooms);
    if (!interZone && !crossRoomAll) {
      add('room-link', 'error', 'No Room-to-Room Storage Path', 'No ToR-to-ToR link crosses between the zones and not every node is cabled to a ToR in both rooms. Storage replication (1 ms or less) needs a room-to-room path.', 'Cable ToR1 to ToR3 and ToR2 to ToR4 (dedicated storage links), or cable every node to both rooms.');
    }
  }
  return issues;
};

/**
 * RULE-MLAG-PEER-LINK: in a single-rack design a host that spans two ToR switches expects them to be an MLAG pair,
 * so the two switches need a cable between them (peer link). Not applied to rack-aware designs, where the room
 * layouts differ per option.
 * https://learn.microsoft.com/azure/azure-local/plan/cloud-deployment-network-considerations#decision-3-determine-cluster-topology
 */
export const mlagPeerLinkRule: Rule = ({ doc, cluster, hosts }) => {
  if (cluster.pattern !== 'single-rack') return [];
  const issues: ValidationIssue[] = [];
  const done = new Set<string>();
  for (const host of hosts) {
    const torIds = [...new Set(linksOfHost(doc, host).filter((l) => l.kind === 'tor').map((l) => l.other!.id))].sort();
    for (let i = 0; i < torIds.length; i++) {
      for (let j = i + 1; j < torIds.length; j++) {
        const key = `${torIds[i]}|${torIds[j]}`;
        if (done.has(key)) continue;
        done.add(key);
        const linked = doc.connectors.some((c) => (c.sourceId === torIds[i] && c.targetId === torIds[j]) || (c.sourceId === torIds[j] && c.targetId === torIds[i]));
        if (!linked) {
          const a = doc.nodes.find((n) => n.id === torIds[i])!;
          const b = doc.nodes.find((n) => n.id === torIds[j])!;
          issues.push({
            id: `issue-mlag-${key}`,
            ruleId: 'RULE-MLAG-PEER-LINK',
            severity: 'warning',
            title: 'No MLAG Peer Link Between ToR Switches',
            message: `${a.title} and ${b.title} both serve hosts but no cable joins them. A single-rack design uses one MLAG ToR pair for all host traffic.`,
            targetNodeId: a.id,
            suggestedFix: 'Draw the MLAG peer link (inter-switch cable) between the two ToR switches.',
          });
        }
      }
    }
  }
  return issues;
};

/**
 * RULE-RDMA-QOS (info): RoCE storage needs PFC, ETS and DCB on every RDMA-carrying port, including the switch
 * ports and room-to-room links. The diagram cannot show QoS, so one reminder is raised per cluster.
 * https://learn.microsoft.com/azure/azure-local/concepts/host-network-requirements#rdma-traffic-considerations
 */
export const rdmaQosRule: Rule = ({ doc, cluster, hosts }) => {
  if (cluster.rdma === 'iwarp') return [];
  const hostIds = new Set(hosts.map((h) => h.id));
  const storageOnSwitch = hosts.some((h) => linksOfHost(doc, h).some((l) => l.kind === 'tor' && carriesStorage(l)));
  const storageNodeToNode = doc.connectors.some((c) => hostIds.has(c.sourceId) && hostIds.has(c.targetId));
  if (!storageOnSwitch && !storageNodeToNode) return [];
  return [
    {
      id: 'issue-rdma-qos',
      ruleId: 'RULE-RDMA-QOS',
      severity: 'info',
      title: 'RoCE Needs PFC, ETS and DCB End to End',
      message: 'RoCE storage requires priority flow control, ETS and the Network ATC traffic classes on every host and every switch port that carries RDMA, including room-to-room links.',
      suggestedFix: 'Apply the reference ToR QoS policy to all storage-carrying ports, or choose iWARP if you do not manage the ToR switches.',
    },
  ];
};
