import { isTorSwitch } from '@/lib/topology/analysis';
import type { ValidationIssue } from '@/types/validation';
import type { Rule } from './context';

/**
 * RULE-SET-PORT-BALANCE: member ports of a SET team must be cabled to different switches.
 * Node-to-node links (switchless storage) and non-switch endpoints are ignored.
 * https://learn.microsoft.com/azure/azure-local/concepts/host-network-requirements#switch-embedded-teaming-set
 */
export const setPortBalanceRule: Rule = ({ doc, hosts, nodeById }) => {
  const issues: ValidationIssue[] = [];
  for (const host of hosts) {
    for (const team of host.setTeams ?? []) {
      const teamPorts = team.portIds.map((p) => p.toLowerCase());
      const switchIds: string[] = [];
      for (const c of doc.connectors) {
        const hostIsSource = c.sourceId === host.id;
        if (!hostIsSource && c.targetId !== host.id) continue;
        const portId = (hostIsSource ? c.sourcePortId : c.targetPortId)?.toLowerCase();
        if (!portId || !teamPorts.includes(portId)) continue;
        const other = nodeById.get(hostIsSource ? c.targetId : c.sourceId);
        if (isTorSwitch(other)) switchIds.push(other!.id);
      }
      if (switchIds.length >= 2 && new Set(switchIds).size === 1) {
        issues.push({
          id: `issue-set-balance-${host.id}-${team.id}`,
          ruleId: 'RULE-SET-PORT-BALANCE',
          severity: 'warning',
          title: 'SET Team Member Port Imbalance',
          message: `${team.name} member ports on ${host.title} are connected to the same physical switch chassis.`,
          targetNodeId: host.id,
          suggestedFix: 'Cross-cable one SET team member port to the partner ToR for host teaming resilience.',
        });
      }
    }
  }
  return issues;
};
