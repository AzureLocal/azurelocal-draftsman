import { describe, expect, it } from 'vitest';
import { normalizeDocument } from '@/lib/serialization/storage';
import { importDocumentFromFile } from '@/features/export/fileActions';
import { buildWizardDocument } from '@/features/wizard/buildTopology';
import { auditDiagramDocument } from '@/features/validation/diagramAuditor';
import { DOCUMENT_VERSION } from '@/types/document';
import { emptyDoc, host, switchedDoc, MGMT_COMPUTE, STORAGE } from '@/test/fixtures';

const wizard = () =>
  buildWizardDocument({
    nodeCount: 4,
    pattern: 'rack-aware',
    serverModel: 'AX-760',
    switchModel: 'Arista 7050SX3',
    oobConsole: 'Dell PowerSwitch N3248TE-ON',
    vlanProfile: { mgmtVlan: 7, computeVlan: 8, storageVlan1: 711, storageVlan2: 712, storageVlan3: 713, mtu: 9000 },
    cableMedia: 'DAC 25G',
  });

describe('diagram JSON round trip', () => {
  it('keeps every field of a wizard document through export, import and normalize', async () => {
    const doc = wizard();
    const file = new File([JSON.stringify(doc, null, 2)], 'd.json', { type: 'application/json' });
    const imported = await importDocumentFromFile(file);
    expect(imported.cluster).toEqual(doc.cluster);
    expect(imported.nodes).toHaveLength(doc.nodes.length);
    for (const n of doc.nodes) {
      const back = imported.nodes.find((x) => x.id === n.id)!;
      expect(back.hardwareProfileId).toBe(n.hardwareProfileId);
      expect(back.intents).toEqual(n.intents);
      expect(back.setTeams).toEqual(n.setTeams);
      expect(back.zoneId).toBe(n.zoneId);
      expect(back.trunkVlans).toEqual(n.trunkVlans);
    }
    expect(imported.areas).toEqual(doc.areas);
    expect(imported.connectors.map((c) => [c.id, c.sourcePortId, c.targetPortId, c.vlanId, c.cableType])).toEqual(
      doc.connectors.map((c) => [c.id, c.sourcePortId, c.targetPortId, c.vlanId, c.cableType]),
    );
  });

  it('produces the same audit result after a round trip', () => {
    const doc = wizard();
    const back = normalizeDocument(JSON.parse(JSON.stringify(doc)));
    expect(auditDiagramDocument(back)).toEqual(auditDiagramDocument(doc));
  });

  it('is stable: normalizing twice gives the same document', () => {
    const once = normalizeDocument(JSON.parse(JSON.stringify(wizard())));
    expect(normalizeDocument(JSON.parse(JSON.stringify(once)))).toEqual(once);
  });

  it('rejects invalid JSON and non-diagrams on import', async () => {
    await expect(importDocumentFromFile(new File(['{nope'], 'x.json'))).rejects.toThrow(/Invalid JSON/);
    await expect(importDocumentFromFile(new File(['42'], 'x.json'))).rejects.toThrow(/valid diagram/);
  });
});

describe('migration of saved diagrams', () => {
  it('loads a version 1 diagram without cluster, intents or zones', () => {
    const v1 = {
      version: 1, id: 'old', name: 'Old', areas: [], connectors: [], texts: [], pipes: [],
      nodes: [{ id: 'h1', type: 'node', shape: 'serverNode', x: 0, y: 0, width: 250, height: 110, title: 'H1', subtitle: '', fill: '#000', glowColor: '#fff', zIndex: 1 }],
    };
    const doc = normalizeDocument(v1);
    expect(doc.version).toBe(DOCUMENT_VERSION);
    expect(doc.cluster).toBeUndefined();
    expect(doc.nodes[0].intents).toBeUndefined();
    expect(auditDiagramDocument(doc).length).toBeGreaterThan(0);
  });

  it('keeps hardware profile and SET teams that the old normalizer dropped', () => {
    const doc = normalizeDocument({ ...emptyDoc(), nodes: [host('h1', { setTeams: [{ id: 't', name: 'T', portIds: ['OCP-P1'] }], hardwareRole: 'node' })] });
    expect(doc.nodes[0].hardwareProfileId).toBe('dell-ax-760');
    expect(doc.nodes[0].setTeams?.[0].portIds).toEqual(['OCP-P1']);
    expect(doc.nodes[0].hardwareRole).toBe('node');
  });

  it('sanitizes malformed new fields instead of failing', () => {
    const doc = normalizeDocument({
      ...emptyDoc(),
      cluster: { pattern: 'stretched', storage: 'switched' },
      nodes: [{ ...host('h1'), intents: [{ name: 5, traffic: ['management', 'bogus'], portIds: ['A', 3] }], trunkVlans: [7, 'x'], zoneId: 5 }],
    });
    expect(doc.cluster).toBeUndefined();
    expect(doc.nodes[0].intents?.[0]).toMatchObject({ traffic: ['management'], portIds: ['A'] });
    expect(doc.nodes[0].trunkVlans).toEqual([7]);
    expect(doc.nodes[0].zoneId).toBeUndefined();
  });

  it('survives garbage input', () => {
    expect(normalizeDocument(null).nodes).toEqual([]);
    expect(normalizeDocument({}).name).toBe('Recovered Diagram');
  });

  it('keeps intents of a fixture document', () => {
    const d = normalizeDocument(JSON.parse(JSON.stringify(switchedDoc(1, { intents: [MGMT_COMPUTE, STORAGE] }))));
    expect(d.nodes.find((n) => n.id === 'h1')?.intents).toEqual([MGMT_COMPUTE, STORAGE]);
  });
});
