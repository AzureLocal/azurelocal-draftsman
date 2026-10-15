import type { DiagramDocument } from '@/types/document';
import type { ValidationIssue } from '@/types/validation';
import { createContext, type Rule } from './rules/context';
import { torRedundancyRule } from './rules/torRedundancy';
import { storageMtuRule } from './rules/storageMtu';
import { setPortBalanceRule } from './rules/setPortBalance';
import { oobManagementRule } from './rules/oobManagement';
import { atcVlanCollisionRule, vlanAlignmentRule } from './rules/vlan';
import { mlagPeerLinkRule, rackAwareRule, rdmaQosRule, storageSwitchIsolationRule, switchlessMeshRule, switchlessScaleRule } from './rules/patterns';
import { intentCoverageRule, intentLayoutRule, intentStorageRdmaRule, intentSymmetryRule } from './rules/intents';

/** Every rule, in report order. Rule ids and Learn references live in COMPLIANCE_RULES (types/validation). */
export const AUDIT_RULES: Rule[] = [
  torRedundancyRule,
  storageMtuRule,
  setPortBalanceRule,
  oobManagementRule,
  vlanAlignmentRule,
  atcVlanCollisionRule,
  switchlessScaleRule,
  switchlessMeshRule,
  storageSwitchIsolationRule,
  rackAwareRule,
  mlagPeerLinkRule,
  rdmaQosRule,
  intentCoverageRule,
  intentSymmetryRule,
  intentStorageRdmaRule,
  intentLayoutRule,
];

/** Audits the diagram against the Azure Local cabling and Network ATC rules. Pure function of the document. */
export function auditDiagramDocument(doc: DiagramDocument): ValidationIssue[] {
  const ctx = createContext(doc);
  return AUDIT_RULES.flatMap((rule) => rule(ctx));
}
