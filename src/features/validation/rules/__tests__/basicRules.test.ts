import { describe, expect, it } from 'vitest';
import { auditDiagramDocument } from '@/features/validation/diagramAuditor';
import { cable, emptyDoc, host, ofRule, oob, switchedDoc, tor } from '@/test/fixtures';
import type { AreaEntity } from '@/types/document';

function area(overrides: Partial<AreaEntity>): AreaEntity {
  return { id: 'a1', type: 'area', x: 0, y: 0, width: 100, height: 100, label: 'Area', fill: '', borderColor: '', glowColor: '', locked: false, zIndex: 1, ...overrides };
}

describe('RULE-MTU-JUMBO', () => {
  const RULE = 'RULE-MTU-JUMBO';

  it('passes for a storage area at MTU 9000', () => {
    const doc = emptyDoc({ areas: [area({ label: 'Storage 1', vlanId: 711, mtu: 9000, purpose: 'storage' })] });
    expect(ofRule(auditDiagramDocument(doc), RULE)).toEqual([]);
  });

  it('reports a recommendation (info) for RoCE storage at MTU 1500', () => {
    const doc = emptyDoc({ areas: [area({ label: 'Storage 1', vlanId: 711, mtu: 1500 })] });
    const issues = ofRule(auditDiagramDocument(doc), RULE);
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe('info');
    expect(issues[0].message).toMatch(/not required for RoCEv2/);
  });

  it('warns for iWARP storage at MTU 1500', () => {
    const doc = emptyDoc({ cluster: { pattern: 'single-rack', storage: 'switched', rdma: 'iwarp' }, areas: [area({ label: 'Storage 1', vlanId: 711 })] });
    expect(ofRule(auditDiagramDocument(doc), RULE)[0].severity).toBe('warning');
  });

  it('treats an unlabelled area on VLAN 712 as storage', () => {
    const doc = emptyDoc({ areas: [area({ label: 'Net', vlanId: 712 })] });
    expect(ofRule(auditDiagramDocument(doc), RULE)).toHaveLength(1);
  });

  it('does not treat a management area on a custom VLAN as storage', () => {
    const doc = emptyDoc({ areas: [area({ label: 'Management', vlanId: 7, mtu: 1500 })] });
    expect(ofRule(auditDiagramDocument(doc), RULE)).toEqual([]);
  });

  it('does not treat a management area on VLAN 711 as storage (custom VLAN collision case)', () => {
    const doc = emptyDoc({ areas: [area({ label: 'Management', vlanId: 711, purpose: 'management' })] });
    expect(ofRule(auditDiagramDocument(doc), RULE)).toEqual([]);
  });
});

describe('RULE-SET-PORT-BALANCE', () => {
  const RULE = 'RULE-SET-PORT-BALANCE';
  const team = { id: 't1', name: 'SET-Team-01', portIds: ['OCP-P1', 'OCP-P2'] };

  it('passes when members go to different ToRs', () => {
    expect(ofRule(auditDiagramDocument(switchedDoc(1, { setTeams: [team] })), RULE)).toEqual([]);
  });

  it('warns when both members go to one ToR', () => {
    const doc = switchedDoc(1, { setTeams: [team] });
    doc.connectors = doc.connectors.map((c) => (c.id === 'h1-b' ? { ...c, targetId: 'torA' } : c));
    expect(ofRule(auditDiagramDocument(doc), RULE)).toHaveLength(1);
  });

  it('is case-insensitive on port ids', () => {
    const doc = switchedDoc(1, { setTeams: [{ ...team, portIds: ['ocp-p1', 'ocp-p2'] }] });
    doc.connectors = doc.connectors.map((c) => (c.id === 'h1-b' ? { ...c, targetId: 'torA' } : c));
    expect(ofRule(auditDiagramDocument(doc), RULE)).toHaveLength(1);
  });

  it('ignores node-to-node links (switchless) for the team', () => {
    const doc = emptyDoc({
      nodes: [host('h1', { setTeams: [{ id: 't', name: 'S', portIds: ['Slot1-P1', 'Slot1-P2'] }] }), host('h2')],
      connectors: [cable('m1', 'h1', 'h2', { sourcePortId: 'Slot1-P1' }), cable('m2', 'h1', 'h2', { sourcePortId: 'Slot1-P2' })],
    });
    expect(ofRule(auditDiagramDocument(doc), RULE)).toEqual([]);
  });

  it('passes with a single connected member (edge)', () => {
    const doc = switchedDoc(1, { setTeams: [team] });
    doc.connectors = doc.connectors.filter((c) => c.id !== 'h1-b');
    expect(ofRule(auditDiagramDocument(doc), RULE)).toEqual([]);
  });
});

describe('RULE-OOB-MANAGEMENT', () => {
  const RULE = 'RULE-OOB-MANAGEMENT';

  it('passes with an iDRAC cable to an OOB switch', () => {
    expect(ofRule(auditDiagramDocument(switchedDoc(1)), RULE)).toEqual([]);
  });

  it('reports a host with no OOB cable', () => {
    const doc = switchedDoc(1);
    doc.connectors = doc.connectors.filter((c) => c.id !== 'h1-o');
    const issues = ofRule(auditDiagramDocument(doc), RULE);
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe('info');
  });

  it('does not accept a Cat6A cable to a ToR as OOB (previous false negative)', () => {
    const doc = emptyDoc({ nodes: [host('h1'), tor('torA')], connectors: [cable('c1', 'h1', 'torA', { cableType: 'cat6a' })] });
    expect(ofRule(auditDiagramDocument(doc), RULE)).toHaveLength(1);
  });

  it('accepts an Opengear console server', () => {
    const doc = emptyDoc({
      nodes: [host('h1'), tor('og', { shape: 'opengearConsole', hardwareProfileId: 'opengear-cm8148-2-dac' })],
      connectors: [cable('c1', 'h1', 'og', { cableType: 'rs232' })],
    });
    expect(ofRule(auditDiagramDocument(doc), RULE)).toEqual([]);
  });

  it('works for a node identified only by hardware profile category', () => {
    const doc = emptyDoc({ nodes: [host('h1', { shape: undefined }), oob('o1', { shape: undefined })], connectors: [cable('c1', 'h1', 'o1')] });
    expect(ofRule(auditDiagramDocument(doc), RULE)).toEqual([]);
  });
});

describe('robustness', () => {
  it('ignores cables whose far end no longer exists', () => {
    const doc = switchedDoc(1);
    doc.connectors.push(cable('dangling', 'h1', 'deleted-node', { sourcePortId: 'Slot1-P1' }));
    expect(() => auditDiagramDocument(doc)).not.toThrow();
  });

  it('an explicit cluster design overrides the cabling inference', () => {
    const doc = emptyDoc({
      cluster: { pattern: 'single-rack', storage: 'switched' },
      nodes: [host('h1'), host('h2')],
      connectors: [cable('c1', 'h1', 'h2')],
    });
    // Treated as switched: no switchless mesh findings even though a node-to-node cable exists.
    expect(auditDiagramDocument(doc).filter((i) => i.ruleId.startsWith('RULE-SWITCHLESS'))).toEqual([]);
  });

  it('every rule id reported exists in the rule catalog', async () => {
    const { COMPLIANCE_RULES } = await import('@/types/validation');
    const known = new Set(COMPLIANCE_RULES.map((r) => r.id));
    const doc = switchedDoc(2, { intents: [{ id: 'x', name: 'X', traffic: ['management'], portIds: ['iDRAC1'] }] });
    for (const issue of auditDiagramDocument(doc)) expect(known.has(issue.ruleId)).toBe(true);
    expect(COMPLIANCE_RULES.every((r) => r.learnUrl.startsWith('https://learn.microsoft.com/azure/azure-local/'))).toBe(true);
  });
});
