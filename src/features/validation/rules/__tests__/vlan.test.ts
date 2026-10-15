import { describe, expect, it } from 'vitest';
import { auditDiagramDocument } from '@/features/validation/diagramAuditor';
import { cable, emptyDoc, ofRule, switchedDoc, GROUP_ALL, MGMT_COMPUTE, STORAGE } from '@/test/fixtures';
import type { AreaEntity } from '@/types/document';

function area(overrides: Partial<AreaEntity>): AreaEntity {
  return { id: 'a1', type: 'area', x: 0, y: 0, width: 100, height: 100, label: 'Area', fill: '', borderColor: '', glowColor: '', locked: false, zIndex: 1, ...overrides };
}

describe('RULE-VLAN-ALIGNMENT', () => {
  const RULE = 'RULE-VLAN-ALIGNMENT';

  it('passes when both ToR paths carry the same VLAN and the trunk allows it', () => {
    const doc = switchedDoc(1);
    doc.nodes = doc.nodes.map((n) => (n.id.startsWith('tor') ? { ...n, trunkVlans: [7, 8] } : n));
    expect(ofRule(auditDiagramDocument(doc), RULE)).toEqual([]);
  });

  it('errors when a tagged VLAN is not on the switch trunk', () => {
    const doc = switchedDoc(1);
    doc.nodes = doc.nodes.map((n) => (n.id === 'torB' ? { ...n, trunkVlans: [8] } : n));
    const issues = ofRule(auditDiagramDocument(doc), RULE);
    expect(issues).toHaveLength(1);
    expect(issues[0].targetConnectorId).toBe('h1-b');
  });

  it('does not audit trunks that are not specified (edge)', () => {
    expect(ofRule(auditDiagramDocument(switchedDoc(1)), RULE)).toEqual([]);
  });

  it('errors when the two ToR paths carry different management VLANs', () => {
    const doc = switchedDoc(1);
    doc.connectors = doc.connectors.map((c) => (c.id === 'h1-b' ? { ...c, vlanId: 9 } : c));
    const issues = ofRule(auditDiagramDocument(doc), RULE);
    expect(issues.map((i) => i.id)).toContain('issue-vlan-tor-mismatch-h1');
  });

  it('does not compare storage VLANs between ToRs (storage may use one VLAN per ToR)', () => {
    const doc = switchedDoc(1, { intents: [MGMT_COMPUTE, STORAGE] });
    doc.connectors.push(
      cable('s1', 'h1', 'torA', { sourcePortId: 'Slot1-P1', vlanId: 711 }),
      cable('s2', 'h1', 'torB', { sourcePortId: 'Slot1-P2', vlanId: 712 }),
    );
    expect(ofRule(auditDiagramDocument(doc), RULE)).toEqual([]);
  });

  it('errors on mismatched VLANs inside one SET intent', () => {
    const doc = switchedDoc(1, { intents: [GROUP_ALL] });
    doc.connectors = doc.connectors.map((c) => (c.id === 'h1-b' ? { ...c, vlanId: 99 } : c));
    expect(ofRule(auditDiagramDocument(doc), RULE).map((i) => i.id)).toContain('issue-vlan-intent-h1-i-all');
  });

  it('warns when both storage adapters of a switched design share one VLAN', () => {
    const doc = switchedDoc(1, { intents: [MGMT_COMPUTE, STORAGE] });
    doc.connectors.push(
      cable('s1', 'h1', 'torA', { sourcePortId: 'Slot1-P1', vlanId: 711 }),
      cable('s2', 'h1', 'torB', { sourcePortId: 'Slot1-P2', vlanId: 711 }),
    );
    const issue = ofRule(auditDiagramDocument(doc), RULE).find((i) => i.id.startsWith('issue-vlan-storage-shared'));
    expect(issue?.severity).toBe('warning');
  });

  it('allows a converged intent whose adapters keep their own storage VLANs (711 and 712)', () => {
    const doc = switchedDoc(1, { intents: [GROUP_ALL] });
    doc.connectors = doc.connectors.map((c) => (c.id === 'h1-a' ? { ...c, vlanId: 711 } : c.id === 'h1-b' ? { ...c, vlanId: 712 } : c));
    expect(ofRule(auditDiagramDocument(doc), RULE)).toEqual([]);
  });

  it('skips untagged cables (edge)', () => {
    const doc = switchedDoc(1);
    doc.connectors = doc.connectors.map((c) => ({ ...c, vlanId: undefined }));
    expect(ofRule(auditDiagramDocument(doc), RULE)).toEqual([]);
  });
});

describe('RULE-VLAN-ATC-COLLISION', () => {
  const RULE = 'RULE-VLAN-ATC-COLLISION';

  it('warns (non-blocking) when management is on a Network ATC storage default', () => {
    const doc = emptyDoc({ areas: [area({ label: 'Management Network', vlanId: 711 })] });
    const issues = ofRule(auditDiagramDocument(doc), RULE);
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe('warning');
    expect(issues[0].message).toMatch(/711 to 719/);
  });

  it('does not warn for storage on 711 and 712', () => {
    const doc = emptyDoc({ areas: [area({ label: 'Storage 1', vlanId: 711 }), area({ id: 'a2', label: 'Storage 2', vlanId: 712 })] });
    expect(ofRule(auditDiagramDocument(doc), RULE)).toEqual([]);
  });

  it('does not warn for custom VLANs outside 711 to 719', () => {
    const doc = emptyDoc({ areas: [area({ label: 'Management', vlanId: 7 }), area({ id: 'a2', label: 'Compute', vlanId: 8 })] });
    expect(ofRule(auditDiagramDocument(doc), RULE)).toEqual([]);
  });

  it('does not warn for an unlabelled area (treated as storage)', () => {
    expect(ofRule(auditDiagramDocument(emptyDoc({ areas: [area({ vlanId: 712 })] })), RULE)).toEqual([]);
  });

  it('warns for a compute area with an explicit purpose on 719', () => {
    const doc = emptyDoc({ areas: [area({ label: 'VMs', vlanId: 719, purpose: 'compute' })] });
    expect(ofRule(auditDiagramDocument(doc), RULE)).toHaveLength(1);
  });

  it('warns when a management intent cable is tagged with 712', () => {
    const doc = switchedDoc(1, { intents: [MGMT_COMPUTE, STORAGE] });
    doc.connectors = doc.connectors.map((c) => (c.id === 'h1-a' ? { ...c, vlanId: 712 } : c));
    expect(ofRule(auditDiagramDocument(doc), RULE).map((i) => i.targetConnectorId)).toContain('h1-a');
  });

  it('does not warn when a storage-intent cable uses 711', () => {
    const doc = switchedDoc(1, { intents: [MGMT_COMPUTE, STORAGE] });
    doc.connectors.push(cable('s1', 'h1', 'torA', { sourcePortId: 'Slot1-P1', vlanId: 711 }));
    expect(ofRule(auditDiagramDocument(doc), RULE)).toEqual([]);
  });
});
