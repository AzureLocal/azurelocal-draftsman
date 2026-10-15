import { linksOfHost } from '@/lib/topology/analysis';
import type { ValidationIssue } from '@/types/validation';
import type { Rule } from './context';

/**
 * RULE-OOB-MANAGEMENT: every host needs a BMC (iDRAC/iLO) or serial console cable to an OOB switch or
 * console server. A cable counts only when the other end is an OOB device; a Cat6A run to a ToR does not.
 */
export const oobManagementRule: Rule = ({ doc, hosts }) => {
  const issues: ValidationIssue[] = [];
  for (const host of hosts) {
    const hasOob = linksOfHost(doc, host).some((l) => l.kind === 'oob');
    if (!hasOob) {
      issues.push({
        id: `issue-oob-${host.id}`,
        ruleId: 'RULE-OOB-MANAGEMENT',
        severity: 'info',
        title: 'Missing Out-of-Band Management Cable',
        message: `${host.title} has no iDRAC/iLO or serial console cable to an OOB management switch or console server.`,
        targetNodeId: host.id,
        suggestedFix: 'Connect the BMC port (iDRAC) to the 1G OOB switch or the serial port to the console server.',
      });
    }
  }
  return issues;
};
