import { describe, expect, it } from 'vitest';
import { auditDiagramDocument } from '@/features/validation/diagramAuditor';
import { cable, emptyDoc, host, ofRule, oob, switchedDoc, tor, wiredHost, GROUP_ALL, MGMT_COMPUTE, STORAGE } from '@/test/fixtures';

const RULE = 'RULE-TOR-REDUNDANCY';

describe(RULE, () => {
  it('passes for a dual-homed host', () => {
    expect(ofRule(auditDiagramDocument(switchedDoc(2)), RULE)).toEqual([]);
  });

  it('errors when a host has no ToR link', () => {
    const doc = emptyDoc({ nodes: [host('h1'), tor('torA'), tor('torB')], connectors: [] });
    const issues = ofRule(auditDiagramDocument(doc), RULE);
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe('error');
    expect(issues[0].title).toMatch(/No ToR/);
  });

  it('errors when both cables go to the same ToR', () => {
    const doc = switchedDoc(1);
    doc.connectors = doc.connectors.map((c) => (c.id === 'h1-b' ? { ...c, targetId: 'torA' } : c));
    const issues = ofRule(auditDiagramDocument(doc), RULE);
    expect(issues).toHaveLength(1);
    expect(issues[0].title).toMatch(/Single/);
    expect(issues[0].severity).toBe('error');
  });

  it('does not count the OOB cable as a ToR link', () => {
    const doc = emptyDoc({ nodes: [host('h1'), tor('torA'), oob('oob1')], connectors: [cable('c1', 'h1', 'torA', { sourcePortId: 'OCP-P1' }), cable('c2', 'h1', 'oob1', { sourcePortId: 'iDRAC1' })] });
    expect(ofRule(auditDiagramDocument(doc), RULE)[0].title).toMatch(/Single/);
  });

  describe('switchless', () => {
    function switchlessDoc() {
      const doc = switchedDoc(2, { intents: [MGMT_COMPUTE, STORAGE] });
      doc.cluster = { pattern: 'single-rack', storage: 'switchless' };
      doc.connectors.push(
        cable('m1', 'h1', 'h2', { sourcePortId: 'Slot1-P1', targetPortId: 'Slot1-P1', vlanId: 711 }),
        cable('m2', 'h1', 'h2', { sourcePortId: 'Slot1-P2', targetPortId: 'Slot1-P2', vlanId: 712 }),
      );
      return doc;
    }

    it('does not flag node-to-node storage links', () => {
      expect(ofRule(auditDiagramDocument(switchlessDoc()), RULE)).toEqual([]);
    });

    it('does not flag a host whose only links are node-to-node storage plus two ToR uplinks', () => {
      const issues = auditDiagramDocument(switchlessDoc());
      expect(ofRule(issues, RULE)).toHaveLength(0);
    });

    it('still requires two ToR uplinks for management and compute', () => {
      const doc = switchlessDoc();
      doc.connectors = doc.connectors.filter((c) => c.id !== 'h1-b');
      const issues = ofRule(auditDiagramDocument(doc), RULE);
      expect(issues.map((i) => i.id)).toContain('issue-tor-single-h1');
    });

    it('explains that switchless storage still needs a switch when no uplink exists', () => {
      const doc = switchlessDoc();
      doc.connectors = doc.connectors.filter((c) => !/^h1-[ab]$/.test(c.id));
      const issue = ofRule(auditDiagramDocument(doc), RULE).find((i) => i.id === 'issue-tor-zero-h1');
      expect(issue?.message).toMatch(/north-south/);
    });

    it('is inferred from host-to-host cabling when the cluster design is absent', () => {
      const doc = switchlessDoc();
      doc.cluster = undefined;
      expect(ofRule(auditDiagramDocument(doc), RULE)).toEqual([]);
    });
  });

  describe('switched storage', () => {
    it('flags both storage ports landing on one ToR', () => {
      const doc = switchedDoc(1, { intents: [MGMT_COMPUTE, STORAGE] });
      doc.connectors.push(
        cable('s1', 'h1', 'torA', { sourcePortId: 'Slot1-P1', vlanId: 711 }),
        cable('s2', 'h1', 'torA', { sourcePortId: 'Slot1-P2', vlanId: 712 }),
      );
      expect(ofRule(auditDiagramDocument(doc), RULE).map((i) => i.id)).toContain('issue-tor-storage-single-h1');
    });

    it('passes when storage ports are split over the ToR pair', () => {
      const doc = switchedDoc(1, { intents: [MGMT_COMPUTE, STORAGE] });
      doc.connectors.push(
        cable('s1', 'h1', 'torA', { sourcePortId: 'Slot1-P1', vlanId: 711 }),
        cable('s2', 'h1', 'torB', { sourcePortId: 'Slot1-P2', vlanId: 712 }),
      );
      expect(ofRule(auditDiagramDocument(doc), RULE)).toEqual([]);
    });

    it('a converged intent on two ports spanning the pair passes', () => {
      expect(ofRule(auditDiagramDocument(switchedDoc(2, { intents: [GROUP_ALL] })), RULE)).toEqual([]);
    });
  });

  describe('rack-aware', () => {
    it('downgrades a single ToR per room to a warning', () => {
      const w = wiredHost('h1', { zoneId: 'zone-1' });
      const doc = emptyDoc({
        cluster: { pattern: 'rack-aware', storage: 'switched', torPerZone: 1 },
        nodes: [tor('torA', { zoneId: 'zone-1' }), oob('oob1'), ...w.nodes],
        connectors: w.cables.map((c) => (c.id === 'h1-b' ? { ...c, targetId: 'torA' } : c)),
      });
      const issues = ofRule(auditDiagramDocument(doc), RULE);
      expect(issues).toHaveLength(1);
      expect(issues[0].severity).toBe('warning');
    });
  });

  it('ignores diagrams without hosts', () => {
    expect(auditDiagramDocument(emptyDoc({ nodes: [tor('torA')] }))).toEqual([]);
  });
});
