import { describe, expect, it } from 'vitest';
import { auditDiagramDocument } from '@/features/validation/diagramAuditor';
import { emptyDoc, host, ofRule, switchedDoc, GROUP_ALL, MGMT_COMPUTE, STORAGE } from '@/test/fixtures';
import type { NetworkIntent } from '@/types/topology';

const standard = [MGMT_COMPUTE, STORAGE];

describe('RULE-INTENT-COVERAGE', () => {
  const RULE = 'RULE-INTENT-COVERAGE';
  it('passes when management, compute and storage are all carried', () => {
    expect(ofRule(auditDiagramDocument(switchedDoc(2, { intents: standard })), RULE)).toEqual([]);
  });
  it('errors when storage has no intent', () => {
    const issues = ofRule(auditDiagramDocument(switchedDoc(2, { intents: [MGMT_COMPUTE] })), RULE);
    expect(issues).toHaveLength(2);
    expect(issues[0].message).toMatch(/storage/);
  });
  it('does not require storage on a single-node cluster (edge)', () => {
    expect(ofRule(auditDiagramDocument(switchedDoc(1, { intents: [MGMT_COMPUTE] })), RULE)).toEqual([]);
  });
  it('errors when a port belongs to two intents', () => {
    const dup: NetworkIntent = { ...STORAGE, portIds: ['OCP-P1', 'Slot1-P2'] };
    expect(ofRule(auditDiagramDocument(switchedDoc(1, { intents: [MGMT_COMPUTE, dup] })), RULE).some((i) => i.id.includes('port-dup'))).toBe(true);
  });
  it('errors on a port the hardware profile does not have', () => {
    const bad: NetworkIntent = { ...STORAGE, portIds: ['Slot9-P1', 'Slot9-P2'] };
    expect(ofRule(auditDiagramDocument(switchedDoc(1, { intents: [MGMT_COMPUTE, bad] })), RULE).some((i) => i.id.includes('port-unknown'))).toBe(true);
  });
  it('does not audit hosts without intents', () => {
    expect(ofRule(auditDiagramDocument(switchedDoc(2)), RULE)).toEqual([]);
  });
});

describe('RULE-INTENT-SYMMETRY', () => {
  const RULE = 'RULE-INTENT-SYMMETRY';
  it('passes when every node has identical intents', () => {
    expect(ofRule(auditDiagramDocument(switchedDoc(3, { intents: standard })), RULE)).toEqual([]);
  });
  it('errors when one node has a different NIC count', () => {
    const doc = switchedDoc(2, { intents: standard });
    doc.nodes = doc.nodes.map((n) => (n.id === 'h2' ? { ...n, intents: [MGMT_COMPUTE, { ...STORAGE, portIds: ['Slot1-P1'] }] } : n));
    expect(ofRule(auditDiagramDocument(doc), RULE).map((i) => i.id)).toEqual(['issue-intent-mismatch-h2']);
  });
  it('errors when one node has no intents while another does', () => {
    const doc = switchedDoc(2, { intents: standard });
    doc.nodes = doc.nodes.map((n) => (n.id === 'h2' ? { ...n, intents: undefined } : n));
    expect(ofRule(auditDiagramDocument(doc), RULE).map((i) => i.id)).toEqual(['issue-intent-missing-h2']);
  });
  it('errors when an intent mixes adapter speeds', () => {
    // iDRAC1 is 1G RJ45; OCP-P1 is 25G SFP28.
    const mixed: NetworkIntent = { ...MGMT_COMPUTE, portIds: ['OCP-P1', 'iDRAC1'] };
    expect(ofRule(auditDiagramDocument(switchedDoc(1, { intents: [mixed, STORAGE] })), RULE).some((i) => i.id.includes('asym'))).toBe(true);
  });
});

describe('RULE-INTENT-STORAGE-RDMA', () => {
  const RULE = 'RULE-INTENT-STORAGE-RDMA';
  it('passes for SFP28 storage ports', () => {
    expect(ofRule(auditDiagramDocument(switchedDoc(2, { intents: standard })), RULE)).toEqual([]);
  });
  it('errors when a storage intent uses the 1G RJ45 iDRAC port', () => {
    const bad: NetworkIntent = { ...STORAGE, portIds: ['iDRAC1', 'Slot1-P2'] };
    const issues = ofRule(auditDiagramDocument(switchedDoc(1, { intents: [MGMT_COMPUTE, bad] })), RULE);
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toMatch(/iDRAC1/);
  });
  it('checks converged intents that carry storage', () => {
    const bad: NetworkIntent = { ...GROUP_ALL, portIds: ['iDRAC1', 'OCP-P2'] };
    expect(ofRule(auditDiagramDocument(switchedDoc(1, { intents: [bad] })), RULE)).toHaveLength(1);
  });
  it('skips hosts without a hardware profile (edge)', () => {
    const doc = emptyDoc({ nodes: [host('h1', { hardwareProfileId: undefined, intents: standard })] });
    expect(ofRule(auditDiagramDocument(doc), RULE)).toEqual([]);
  });
});

describe('RULE-INTENT-LAYOUT', () => {
  const RULE = 'RULE-INTENT-LAYOUT';
  it('passes for the two standard layouts on a switched single-rack design', () => {
    expect(ofRule(auditDiagramDocument(switchedDoc(2, { intents: standard })), RULE)).toEqual([]);
    expect(ofRule(auditDiagramDocument(switchedDoc(2, { intents: [GROUP_ALL] })), RULE)).toEqual([]);
  });
  it('errors on a storage intent with one port', () => {
    const one: NetworkIntent = { ...STORAGE, portIds: ['Slot1-P1'] };
    expect(ofRule(auditDiagramDocument(switchedDoc(2, { intents: [MGMT_COMPUTE, one] })), RULE).some((i) => i.id.includes('ports'))).toBe(true);
  });
  it('allows one storage port on a single-node cluster (edge)', () => {
    const one: NetworkIntent = { ...STORAGE, portIds: ['Slot1-P1'] };
    expect(ofRule(auditDiagramDocument(switchedDoc(1, { intents: [MGMT_COMPUTE, one] })), RULE)).toEqual([]);
  });
  it('warns above three intents', () => {
    const four: NetworkIntent[] = [
      { id: 'a', name: 'A', traffic: ['management'], portIds: ['OCP-P1'] },
      { id: 'b', name: 'B', traffic: ['compute'], portIds: ['OCP-P2'] },
      { id: 'c', name: 'C', traffic: ['storage'], portIds: ['Slot1-P1', 'Slot1-P2'] },
      { id: 'd', name: 'D', traffic: ['compute'], portIds: ['Slot2-P1'] },
    ];
    const issue = ofRule(auditDiagramDocument(switchedDoc(2, { intents: four })), RULE).find((i) => i.id.includes('count'));
    expect(issue?.severity).toBe('warning');
  });
  it('errors on grouped storage in a switchless design', () => {
    const doc = switchedDoc(2, { intents: [GROUP_ALL] });
    doc.cluster = { pattern: 'single-rack', storage: 'switchless' };
    expect(ofRule(auditDiagramDocument(doc), RULE).some((i) => i.id.includes('switchless'))).toBe(true);
  });
  it('errors on grouped storage in a rack-aware design and passes with a dedicated intent', () => {
    const doc = switchedDoc(2, { intents: [GROUP_ALL] });
    doc.cluster = { pattern: 'rack-aware', storage: 'switched' };
    expect(ofRule(auditDiagramDocument(doc), RULE).some((i) => i.id.includes('rack'))).toBe(true);
    const ok = switchedDoc(2, { intents: standard });
    ok.cluster = { pattern: 'rack-aware', storage: 'switched' };
    expect(ofRule(auditDiagramDocument(ok), RULE)).toEqual([]);
  });
});
