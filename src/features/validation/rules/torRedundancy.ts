import { linksOfHost, trafficOfLink } from '@/lib/topology/analysis';
import type { ValidationIssue } from '@/types/validation';
import type { Rule } from './context';

/**
 * RULE-TOR-REDUNDANCY (pattern-aware).
 *  - Node-to-node (switchless) storage links are never counted and never flagged.
 *  - Management and compute traffic, and storage in a switched design, must reach two distinct ToR switches.
 *  - Rack-aware with one ToR per room is a documented option (no in-room redundancy): reported as a warning.
 * https://learn.microsoft.com/azure/azure-local/plan/cloud-deployment-network-considerations#decision-3-determine-cluster-topology
 */
export const torRedundancyRule: Rule = ({ doc, cluster, hosts }) => {
  const issues: ValidationIssue[] = [];
  const singleTorAllowed = cluster.pattern === 'rack-aware' && cluster.torPerZone === 1;
  const severity = singleTorAllowed ? 'warning' : 'error';

  for (const host of hosts) {
    // Only host-to-switch links count. Host-to-host links (switchless storage) are skipped by the kind filter.
    const torLinks = linksOfHost(doc, host).filter((l) => l.kind === 'tor');
    const torIds = new Set(torLinks.map((l) => l.other!.id));

    if (torIds.size === 0) {
      issues.push({
        id: `issue-tor-zero-${host.id}`,
        ruleId: 'RULE-TOR-REDUNDANCY',
        severity: 'error',
        title: 'No ToR Switch Connections',
        message:
          cluster.storage === 'switchless'
            ? `${host.title} has no uplink to a Top-of-Rack switch. Switchless storage still needs a switch for management and compute (north-south) traffic.`
            : `${host.title} is not cabled to any Top-of-Rack data switch.`,
        targetNodeId: host.id,
        suggestedFix: 'Cable the management/compute (and, for switched storage, storage) ports to ToR-A and ToR-B.',
      });
      continue;
    }

    if (torIds.size === 1) {
      const only = torLinks[0].other!;
      issues.push({
        id: `issue-tor-single-${host.id}`,
        ruleId: 'RULE-TOR-REDUNDANCY',
        severity,
        title: 'Single Point of Failure (Single ToR)',
        message: singleTorAllowed
          ? `${host.title} is cabled to one ToR (${only.title}). One ToR per room is a supported rack-aware option, but a switch failure takes the whole room offline.`
          : `${host.title} is only cabled to 1 ToR switch (${only.title}). Management and compute need two ToR switches.`,
        targetNodeId: host.id,
        suggestedFix: 'Add a second cable run to the partner ToR (MLAG pair) so the SET team spans both switches.',
      });
      continue;
    }

    // Switched storage: dedicated storage ports must also be spread over two ToR switches.
    if (cluster.storage === 'switched') {
      const storageLinks = torLinks.filter((l) => {
        const t = trafficOfLink(l);
        return Array.isArray(t) && t.length === 1 && t[0] === 'storage';
      });
      const storageTors = new Set(storageLinks.map((l) => l.other!.id));
      if (storageLinks.length >= 2 && storageTors.size === 1 && !singleTorAllowed) {
        issues.push({
          id: `issue-tor-storage-single-${host.id}`,
          ruleId: 'RULE-TOR-REDUNDANCY',
          severity: 'error',
          title: 'Storage Ports on a Single ToR',
          message: `${host.title}: all dedicated storage ports go to one ToR switch (${storageLinks[0].other!.title}). A switch failure removes every storage path.`,
          targetNodeId: host.id,
          suggestedFix: 'Cable the second storage port to the partner ToR.',
        });
      }
    }
  }
  return issues;
};
