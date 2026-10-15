import { isStorageArea } from '@/lib/topology/analysis';
import type { ValidationIssue } from '@/types/validation';
import type { Rule } from './context';

/**
 * RULE-MTU-JUMBO: storage networks and MTU. Learn: jumbo frames are required only for iWARP when the hosts
 * use jumbo frames; RoCEv2 does not require them. With iWARP selected a standard MTU is a warning, otherwise
 * a recommendation (info): MTU 9000 on storage is common practice but not a RoCE requirement.
 * https://learn.microsoft.com/azure/azure-local/concepts/rack-aware-cluster-reference-architecture#tor-switch-architecture
 */
export const storageMtuRule: Rule = ({ doc, cluster }) => {
  const issues: ValidationIssue[] = [];
  const iwarp = cluster.rdma === 'iwarp';
  for (const area of doc.areas) {
    if (!isStorageArea(area)) continue;
    if (area.mtu && area.mtu >= 9000) continue;
    issues.push({
      id: `issue-mtu-${area.id}`,
      ruleId: 'RULE-MTU-JUMBO',
      severity: iwarp ? 'warning' : 'info',
      title: iwarp ? 'Storage MTU Below Jumbo (iWARP)' : 'Storage MTU Not Jumbo',
      message: `${area.label} uses MTU ${area.mtu || 1500}. ${
        iwarp
          ? 'iWARP storage needs jumbo frames end to end when the hosts use them.'
          : 'Jumbo frames (MTU 9000) are recommended for SMB Direct but not required for RoCEv2.'
      }`,
      targetAreaId: area.id,
      suggestedFix: 'Set MTU to 9000 on the storage network and on every storage-carrying switch port, or document the decision to stay at 1500.',
    });
  }
  return issues;
};
