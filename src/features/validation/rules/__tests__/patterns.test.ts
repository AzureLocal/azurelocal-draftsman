import { describe, expect, it } from 'vitest';
import { auditDiagramDocument } from '@/features/validation/diagramAuditor';
import { cable, emptyDoc, host, ofRule, oob, switchedDoc, tor, MGMT_COMPUTE, STORAGE } from '@/test/fixtures';
import type { ConnectorEntity, DiagramDocument, NodeEntity } from '@/types/document';

/** n hosts, full storage mesh (two links for n = 2), no ToR uplinks (the TOR rule is not under test here). */
function meshDoc(n: number, skipPair?: [number, number]): DiagramDocument {
  const nodes: NodeEntity[] = [];
  const connectors: ConnectorEntity[] = [];
  for (let i = 1; i <= n; i++) nodes.push(host(`h${i}`));
  const ports = ['Slot1-P1', 'Slot1-P2', 'Slot2-P1', 'Slot2-P2'];
  const used = new Array(n + 1).fill(0);
  for (let a = 1; a <= n; a++) {
    for (let b = a + 1; b <= n; b++) {
      if (skipPair && skipPair[0] === a && skipPair[1] === b) continue;
      const links = n === 2 ? 2 : 1;
      for (let l = 0; l < links; l++) {
        connectors.push(cable(`m-${a}-${b}-${l}`, `h${a}`, `h${b}`, { sourcePortId: ports[used[a]++], targetPortId: ports[used[b]++] }));
      }
    }
  }
  return emptyDoc({ cluster: { pattern: 'single-rack', storage: 'switchless' }, nodes, connectors });
}

describe('RULE-SWITCHLESS-SCALE', () => {
  const RULE = 'RULE-SWITCHLESS-SCALE';
  it('passes for 2 nodes', () => expect(ofRule(auditDiagramDocument(meshDoc(2)), RULE)).toEqual([]));
  it('passes for 4 nodes (limit)', () => expect(ofRule(auditDiagramDocument(meshDoc(4)), RULE)).toEqual([]));
  it('errors above 4 nodes', () => {
    const issues = ofRule(auditDiagramDocument(meshDoc(5)), RULE);
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe('error');
  });
  it('adds an info about storage IP planning for 3 nodes', () => {
    const issues = ofRule(auditDiagramDocument(meshDoc(3)), RULE);
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe('info');
  });
  it('does not apply to switched storage', () => {
    const doc = meshDoc(6);
    doc.cluster = { pattern: 'single-rack', storage: 'switched' };
    expect(ofRule(auditDiagramDocument(doc), RULE)).toEqual([]);
  });
});

describe('RULE-SWITCHLESS-MESH', () => {
  const RULE = 'RULE-SWITCHLESS-MESH';
  it('passes for a complete 2-node and 3-node mesh', () => {
    expect(ofRule(auditDiagramDocument(meshDoc(2)), RULE)).toEqual([]);
    expect(ofRule(auditDiagramDocument(meshDoc(3)), RULE)).toEqual([]);
  });
  it('errors on a missing pair', () => {
    const issues = ofRule(auditDiagramDocument(meshDoc(3, [1, 3])), RULE);
    expect(issues.some((i) => i.id.startsWith('issue-mesh-missing'))).toBe(true);
    expect(issues.some((i) => i.id === 'issue-mesh-ports-h1')).toBe(true);
  });
  it('errors when two nodes are joined by a single link', () => {
    const doc = meshDoc(2);
    doc.connectors = doc.connectors.slice(0, 1);
    expect(ofRule(auditDiagramDocument(doc), RULE).map((i) => i.id)).toEqual(['issue-mesh-ports-h1', 'issue-mesh-ports-h2']);
  });
  it('does not apply to a single node (edge)', () => {
    const doc = emptyDoc({ cluster: { pattern: 'single-rack', storage: 'switchless' }, nodes: [host('h1')] });
    expect(ofRule(auditDiagramDocument(doc), RULE)).toEqual([]);
  });
});

describe('RULE-STORAGE-SWITCH-ISOLATION', () => {
  const RULE = 'RULE-STORAGE-SWITCH-ISOLATION';
  function doc(storageOnTorC: boolean) {
    const h = host('h1', { intents: [MGMT_COMPUTE, STORAGE] });
    return emptyDoc({
      cluster: { pattern: 'single-rack', storage: 'switched' },
      nodes: [h, tor('torA'), tor('torB'), tor('torC'), tor('torD')],
      connectors: [
        cable('c1', 'h1', 'torA', { sourcePortId: 'OCP-P1' }),
        cable('c2', 'h1', 'torB', { sourcePortId: 'OCP-P2' }),
        cable('c3', 'h1', storageOnTorC ? 'torC' : 'torA', { sourcePortId: 'Slot1-P1' }),
        cable('c4', 'h1', storageOnTorC ? 'torD' : 'torB', { sourcePortId: 'Slot1-P2' }),
      ],
    });
  }
  it('warns about a storage-only switch pair', () => {
    const issues = ofRule(auditDiagramDocument(doc(true)), RULE);
    expect(issues).toHaveLength(2);
    expect(issues[0].severity).toBe('warning');
  });
  it('passes when one MLAG pair carries everything', () => {
    expect(ofRule(auditDiagramDocument(doc(false)), RULE)).toEqual([]);
  });
  it('does not apply to rack-aware designs (storage on distinct ToRs is the reference layout)', () => {
    const d = doc(true);
    d.cluster = { pattern: 'rack-aware', storage: 'switched' };
    expect(ofRule(auditDiagramDocument(d), RULE)).toEqual([]);
  });
});

describe('RULE-RACK-AWARE', () => {
  const RULE = 'RULE-RACK-AWARE';

  function rack(hosts: Array<[string, string | undefined]>, torZones: string[] = ['zone-1', 'zone-1', 'zone-2', 'zone-2'], link = true): DiagramDocument {
    const nodes: NodeEntity[] = hosts.map(([id, zoneId]) => host(id, { zoneId }));
    torZones.forEach((z, i) => nodes.push(tor(`t${i + 1}`, { zoneId: z })));
    nodes.push(oob('oob1'));
    const connectors: ConnectorEntity[] = link ? [cable('r1', 't1', 't3'), cable('r2', 't2', 't4')] : [];
    return emptyDoc({ cluster: { pattern: 'rack-aware', storage: 'switched' }, nodes, connectors });
  }
  const four: Array<[string, string]> = [['h1', 'zone-1'], ['h2', 'zone-1'], ['h3', 'zone-2'], ['h4', 'zone-2']];

  it('passes for a balanced 4-node, 4-ToR design with room-to-room links', () => {
    expect(ofRule(auditDiagramDocument(rack(four)), RULE)).toEqual([]);
  });
  it('errors on switchless storage', () => {
    const d = rack(four);
    d.cluster = { pattern: 'rack-aware', storage: 'switchless' };
    expect(ofRule(auditDiagramDocument(d), RULE).map((i) => i.id)).toContain('issue-rack-switched');
  });
  it('errors on an odd node count', () => {
    expect(ofRule(auditDiagramDocument(rack([['h1', 'zone-1'], ['h2', 'zone-1'], ['h3', 'zone-2']])), RULE).map((i) => i.id)).toContain('issue-rack-nodes');
  });
  it('errors above 8 nodes', () => {
    const ten: Array<[string, string]> = Array.from({ length: 10 }, (_, i) => [`h${i + 1}`, i < 5 ? 'zone-1' : 'zone-2']);
    expect(ofRule(auditDiagramDocument(rack(ten)), RULE).map((i) => i.id)).toContain('issue-rack-nodes');
  });
  it('accepts exactly 8 nodes (limit)', () => {
    const eight: Array<[string, string]> = Array.from({ length: 8 }, (_, i) => [`h${i + 1}`, i < 4 ? 'zone-1' : 'zone-2']);
    expect(ofRule(auditDiagramDocument(rack(eight)), RULE)).toEqual([]);
  });
  it('errors on nodes without a zone', () => {
    const d = rack([['h1', undefined], ['h2', 'zone-1']]);
    expect(ofRule(auditDiagramDocument(d), RULE).some((i) => i.id === 'issue-rack-zone-h1')).toBe(true);
  });
  it('errors on unbalanced zones', () => {
    const d = rack([['h1', 'zone-1'], ['h2', 'zone-1'], ['h3', 'zone-1'], ['h4', 'zone-2']]);
    expect(ofRule(auditDiagramDocument(d), RULE).map((i) => i.id)).toContain('issue-rack-balance');
  });
  it('errors on a zone with no ToR', () => {
    const d = rack(four, ['zone-1', 'zone-1']);
    expect(ofRule(auditDiagramDocument(d), RULE).map((i) => i.id)).toContain('issue-rack-tor-zone-2');
  });
  it('warns on a single ToR in a zone unless one-per-room is chosen', () => {
    const d = rack(four, ['zone-1', 'zone-1', 'zone-2']);
    const single = ofRule(auditDiagramDocument(d), RULE).find((i) => i.id === 'issue-rack-tor-single-zone-2');
    expect(single?.severity).toBe('warning');
    d.cluster = { pattern: 'rack-aware', storage: 'switched', torPerZone: 1 };
    expect(ofRule(auditDiagramDocument(d), RULE).find((i) => i.id === 'issue-rack-tor-single-zone-2')).toBeUndefined();
  });
  it('errors without a room-to-room path', () => {
    expect(ofRule(auditDiagramDocument(rack(four, undefined, false)), RULE).map((i) => i.id)).toContain('issue-rack-room-link');
  });
  it('accepts cabling every node to both rooms instead of ToR-to-ToR links (option 4)', () => {
    const d = rack(four, undefined, false);
    for (const h of ['h1', 'h2']) d.connectors.push(cable(`x-${h}`, h, 't3', { sourcePortId: 'OCP-P1' }), cable(`y-${h}`, h, 't1', { sourcePortId: 'OCP-P2' }));
    for (const h of ['h3', 'h4']) d.connectors.push(cable(`x-${h}`, h, 't1', { sourcePortId: 'OCP-P1' }), cable(`y-${h}`, h, 't3', { sourcePortId: 'OCP-P2' }));
    expect(ofRule(auditDiagramDocument(d), RULE).map((i) => i.id)).not.toContain('issue-rack-room-link');
  });
  it('rejects option 4 when only some nodes reach both rooms', () => {
    const d = rack(four, undefined, false);
    d.connectors.push(cable('x1', 'h1', 't3', { sourcePortId: 'OCP-P1' }), cable('y1', 'h1', 't1', { sourcePortId: 'OCP-P2' }));
    expect(ofRule(auditDiagramDocument(d), RULE).map((i) => i.id)).toContain('issue-rack-room-link');
  });
  it('does not apply to a single-rack design', () => {
    const d = rack(four);
    d.cluster = { pattern: 'single-rack', storage: 'switched' };
    expect(ofRule(auditDiagramDocument(d), RULE)).toEqual([]);
  });
  it('is inferred from zones when the cluster design is absent', () => {
    const d = rack([['h1', 'zone-1'], ['h2', 'zone-2'], ['h3', 'zone-2']]);
    d.cluster = undefined;
    expect(ofRule(auditDiagramDocument(d), RULE).map((i) => i.id)).toContain('issue-rack-nodes');
  });
});

describe('RULE-MLAG-PEER-LINK', () => {
  const RULE = 'RULE-MLAG-PEER-LINK';
  it('warns when the two ToR switches serving a host are not joined', () => {
    const issues = ofRule(auditDiagramDocument(switchedDoc(2)), RULE);
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe('warning');
  });
  it('passes with a peer link in either direction', () => {
    for (const [a, b] of [['torA', 'torB'], ['torB', 'torA']]) {
      const d = switchedDoc(2);
      d.connectors.push(cable('peer', a, b));
      expect(ofRule(auditDiagramDocument(d), RULE)).toEqual([]);
    }
  });
  it('does not apply to rack-aware designs', () => {
    const d = switchedDoc(2);
    d.cluster = { pattern: 'rack-aware', storage: 'switched' };
    expect(ofRule(auditDiagramDocument(d), RULE)).toEqual([]);
  });
  it('does not apply to a host with a single ToR (the redundancy rule reports that)', () => {
    const d = emptyDoc({ nodes: [host('h1'), tor('torA')], connectors: [cable('c1', 'h1', 'torA', { sourcePortId: 'OCP-P1' })] });
    expect(ofRule(auditDiagramDocument(d), RULE)).toEqual([]);
  });
});

describe('RULE-RDMA-QOS', () => {
  const RULE = 'RULE-RDMA-QOS';
  it('raises one reminder for RoCE storage on switches', () => {
    const d = switchedDoc(2, { intents: [MGMT_COMPUTE, STORAGE] });
    d.connectors.push(cable('s1', 'h1', 'torA', { sourcePortId: 'Slot1-P1' }), cable('s2', 'h2', 'torA', { sourcePortId: 'Slot1-P1' }));
    expect(ofRule(auditDiagramDocument(d), RULE)).toHaveLength(1);
  });
  it('raises it for switchless node-to-node storage', () => {
    const d = emptyDoc({ nodes: [host('h1'), host('h2')], connectors: [cable('m', 'h1', 'h2')] });
    expect(ofRule(auditDiagramDocument(d), RULE)).toHaveLength(1);
  });
  it('is silent for iWARP and for diagrams without storage links', () => {
    const d = switchedDoc(2, { intents: [MGMT_COMPUTE, STORAGE] });
    d.connectors.push(cable('s1', 'h1', 'torA', { sourcePortId: 'Slot1-P1' }));
    d.cluster = { pattern: 'single-rack', storage: 'switched', rdma: 'iwarp' };
    expect(ofRule(auditDiagramDocument(d), RULE)).toEqual([]);
    expect(ofRule(auditDiagramDocument(switchedDoc(2)), RULE)).toEqual([]);
  });
});
