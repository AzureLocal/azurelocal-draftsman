import type { NodeEntity } from '@/types/document';
import { getHardwareProfile, isRdmaCapable, listProfilePorts } from '@/types/hardwareProfiles';
import { CLUSTER_LIMITS, type NetworkIntent, type TrafficType } from '@/types/topology';
import type { ValidationIssue } from '@/types/validation';
import type { Rule } from './context';

/**
 * Network ATC intent rules. They apply to hosts that define intents (NodeEntity.intents); a diagram without
 * intents is not audited here.
 * https://learn.microsoft.com/azure/azure-local/deploy/network-atc
 * https://learn.microsoft.com/azure/azure-local/concepts/host-network-requirements
 */

const ALL_TRAFFIC: TrafficType[] = ['management', 'compute', 'storage'];

function hostsWithIntents(hosts: NodeEntity[]): NodeEntity[] {
  return hosts.filter((h) => h.intents && h.intents.length > 0);
}

function isStorageOnly(i: NetworkIntent): boolean {
  return i.traffic.length === 1 && i.traffic[0] === 'storage';
}

/** RULE-INTENT-COVERAGE: management, compute and storage are all carried; a port belongs to one intent only. */
export const intentCoverageRule: Rule = ({ hosts }) => {
  const issues: ValidationIssue[] = [];
  const singleNode = hosts.length === 1;
  for (const host of hostsWithIntents(hosts)) {
    const intents = host.intents!;
    const covered = new Set(intents.flatMap((i) => i.traffic));
    const needed = singleNode ? ALL_TRAFFIC.filter((t) => t !== 'storage') : ALL_TRAFFIC;
    const missing = needed.filter((t) => !covered.has(t));
    if (missing.length > 0) {
      issues.push({
        id: `issue-intent-coverage-${host.id}`,
        ruleId: 'RULE-INTENT-COVERAGE',
        severity: 'error',
        title: 'Traffic Type Without an Intent',
        message: `${host.title}: no intent carries ${missing.join(', ')} traffic. Azure Local needs management, compute and storage traffic.`,
        targetNodeId: host.id,
        suggestedFix: 'Add the missing traffic type to an intent or create an intent for it.',
      });
    }
    const seen = new Map<string, string>();
    for (const intent of intents) {
      for (const port of intent.portIds) {
        const key = port.toLowerCase();
        const previous = seen.get(key);
        if (previous && previous !== intent.id) {
          issues.push({
            id: `issue-intent-port-dup-${host.id}-${key}`,
            ruleId: 'RULE-INTENT-COVERAGE',
            severity: 'error',
            title: 'Port in Two Intents',
            message: `${host.title}: port ${port} is assigned to more than one intent.`,
            targetNodeId: host.id,
            suggestedFix: 'Assign each physical port to exactly one intent.',
          });
        }
        seen.set(key, intent.id);
      }
    }
    const profile = getHardwareProfile(host.hardwareProfileId);
    if (profile) {
      const known = new Set(listProfilePorts(profile).map((p) => p.id.toLowerCase()));
      for (const intent of intents) {
        for (const port of intent.portIds) {
          if (!known.has(port.toLowerCase())) {
            issues.push({
              id: `issue-intent-port-unknown-${host.id}-${port}`,
              ruleId: 'RULE-INTENT-COVERAGE',
              severity: 'error',
              title: 'Unknown Port in Intent',
              message: `${host.title}: intent ${intent.name} lists port ${port}, which ${profile.model} does not have.`,
              targetNodeId: host.id,
              suggestedFix: 'Pick a port from the hardware profile.',
            });
          }
        }
      }
    }
  }
  return issues;
};

function signature(host: NodeEntity): string {
  return (host.intents ?? [])
    .map((i) => `${[...i.traffic].sort().join('+')}:${i.portIds.length}`)
    .sort()
    .join('|');
}

/**
 * RULE-INTENT-SYMMETRY: every node has the same intents (traffic and port count), and the adapters of one
 * intent are symmetric (same speed and media). Asymmetric adapters fail intent deployment.
 */
export const intentSymmetryRule: Rule = ({ hosts }) => {
  const issues: ValidationIssue[] = [];
  const withIntents = hostsWithIntents(hosts);
  if (withIntents.length === 0) return issues;

  const reference = withIntents[0];
  const referenceSig = signature(reference);
  for (const host of hosts) {
    if (!host.intents || host.intents.length === 0) {
      issues.push({
        id: `issue-intent-missing-${host.id}`,
        ruleId: 'RULE-INTENT-SYMMETRY',
        severity: 'error',
        title: 'Node Without Intents',
        message: `${host.title} has no intents while ${reference.title} does. Intents are cluster-wide and identical on every node.`,
        targetNodeId: host.id,
        suggestedFix: 'Copy the intents to this node.',
      });
    } else if (signature(host) !== referenceSig) {
      issues.push({
        id: `issue-intent-mismatch-${host.id}`,
        ruleId: 'RULE-INTENT-SYMMETRY',
        severity: 'error',
        title: 'Intent or NIC Count Mismatch',
        message: `${host.title} has different intents or adapter counts than ${reference.title}. Every node must use the same intent layout.`,
        targetNodeId: host.id,
        suggestedFix: 'Make the intent names, traffic types and port counts identical on every node.',
      });
    }
  }
  for (const host of withIntents) {
    const profile = getHardwareProfile(host.hardwareProfileId);
    if (!profile) continue;
    const ports = new Map(listProfilePorts(profile).map((p) => [p.id.toLowerCase(), p.group]));
    for (const intent of host.intents!) {
      const groups = intent.portIds.map((p) => ports.get(p.toLowerCase())).filter((g): g is NonNullable<typeof g> => !!g);
      const kinds = new Set(groups.map((g) => `${g.speedGbps}G ${g.mediaType}`));
      if (kinds.size > 1) {
        issues.push({
          id: `issue-intent-asym-${host.id}-${intent.id}`,
          ruleId: 'RULE-INTENT-SYMMETRY',
          severity: 'error',
          title: 'Asymmetric Adapters in One Intent',
          message: `${host.title}: intent ${intent.name} mixes ${[...kinds].join(' and ')}. Adapters in an intent must have the same make, model and speed.`,
          targetNodeId: host.id,
          suggestedFix: 'Use two identical adapters or ports for the intent.',
        });
      }
    }
  }
  return issues;
};

/** RULE-INTENT-STORAGE-RDMA: ports in an intent that carries storage must be RDMA-capable (SMB Direct). */
export const intentStorageRdmaRule: Rule = ({ hosts }) => {
  const issues: ValidationIssue[] = [];
  for (const host of hostsWithIntents(hosts)) {
    const profile = getHardwareProfile(host.hardwareProfileId);
    if (!profile) continue;
    const ports = new Map(listProfilePorts(profile).map((p) => [p.id.toLowerCase(), p.group]));
    for (const intent of host.intents!.filter((i) => i.traffic.includes('storage'))) {
      const bad = intent.portIds.filter((p) => {
        const group = ports.get(p.toLowerCase());
        return group && !isRdmaCapable(group);
      });
      if (bad.length > 0) {
        issues.push({
          id: `issue-intent-rdma-${host.id}-${intent.id}`,
          ruleId: 'RULE-INTENT-STORAGE-RDMA',
          severity: 'error',
          title: 'Storage Intent Without RDMA-Capable Ports',
          message: `${host.title}: storage intent ${intent.name} uses ${bad.join(', ')}, which is not an RDMA-capable port (1G or RJ45).`,
          targetNodeId: host.id,
          suggestedFix: 'Use SFP28 or faster RDMA-capable adapter ports (Storage Standard or Premium qualified) for storage.',
        });
      }
    }
  }
  return issues;
};

/**
 * RULE-INTENT-LAYOUT: intent layout against the pattern.
 *  - a storage intent needs at least two ports (single-node clusters excepted)
 *  - switchless: storage adapters are single-purpose, so storage cannot share an intent with management or compute
 *  - rack-aware: management and compute are grouped, storage has its own dedicated intent
 *  - more than three intents per host is outside the documented layouts (warning)
 */
export const intentLayoutRule: Rule = ({ cluster, hosts }) => {
  const issues: ValidationIssue[] = [];
  for (const host of hostsWithIntents(hosts)) {
    const intents = host.intents!;
    const push = (id: string, severity: ValidationIssue['severity'], title: string, message: string, suggestedFix: string) =>
      issues.push({ id: `issue-intent-layout-${id}-${host.id}`, ruleId: 'RULE-INTENT-LAYOUT', severity, title, message, suggestedFix, targetNodeId: host.id });

    if (intents.length > CLUSTER_LIMITS.maxIntentsPerHost) {
      push('count', 'warning', 'More Than Three Intents', `${host.title} defines ${intents.length} intents. The documented layouts use at most three.`, 'Merge intents (for example management and compute).');
    }
    const storage = intents.filter((i) => i.traffic.includes('storage'));
    if (hosts.length > 1) {
      for (const i of storage) {
        if (i.portIds.length < 2) {
          push(`ports-${i.id}`, 'error', 'Storage Intent Needs Two Ports', `${host.title}: storage intent ${i.name} has ${i.portIds.length} port(s); at least two network adapter ports are dedicated to storage.`, 'Add a second storage port to the intent.');
        }
      }
    }
    if (cluster.storage === 'switchless') {
      for (const i of storage.filter((s) => !isStorageOnly(s))) {
        push(`switchless-${i.id}`, 'error', 'Storage Adapters Are Single-Purpose in Switchless', `${host.title}: intent ${i.name} mixes storage with ${i.traffic.filter((t) => t !== 'storage').join(', ')}. In a switchless design storage adapters cannot carry north-south traffic.`, 'Give storage its own intent on the node-to-node ports and keep management and compute on switch-connected ports.');
      }
    }
    if (cluster.pattern === 'rack-aware') {
      for (const i of storage.filter((s) => !isStorageOnly(s))) {
        push(`rack-${i.id}`, 'error', 'Rack-Aware Needs a Dedicated Storage Intent', `${host.title}: intent ${i.name} groups storage with other traffic. Rack-aware clusters group management and compute and use a dedicated storage intent.`, 'Split storage into its own intent on separate ports.');
      }
    }
  }
  return issues;
};
