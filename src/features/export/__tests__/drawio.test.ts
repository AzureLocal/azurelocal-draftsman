import { describe, expect, it } from 'vitest';
import { attr, buildDrawio, DRAWIO_COLORS } from '../exportDrawio';
import { buildWizardDocument } from '@/features/wizard/buildTopology';
import { cable, emptyDoc, host, tor } from '@/test/fixtures';

const vlans = { mgmtVlan: 7, computeVlan: 8, storageVlan1: 711, storageVlan2: 712, storageVlan3: 713, mtu: 9000 };
const wizardDoc = (over = {}) =>
  buildWizardDocument({ nodeCount: 2, storage: 'switchless', serverModel: 'AX-760', switchModel: 'Arista 7050SX3', oobConsole: 'Dell PowerSwitch N3248TE-ON', vlanProfile: vlans, cableMedia: 'DAC 25G', ...over });

/** Cell ids in file order. */
const cellIds = (xml: string) => [...xml.matchAll(/<mxCell id="([^"]+)"/g)].map((m) => m[1]);

describe('draw.io export', () => {
  it('writes the Trailwright-compatible skeleton', () => {
    const xml = buildDrawio(wizardDoc());
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<mxfile host="draftsman"')).toBe(true);
    expect(xml).toContain('<diagram name="topology"');
    expect(xml).toContain('<mxCell id="0" />');
    expect(xml).toContain('<mxCell id="1" parent="0" />');
    expect(xml.trim().endsWith('</mxfile>')).toBe(true);
  });

  it('uses sw-N, node-N, oob-N, net-N ids and dashed sl-A-B-L edges for switchless storage links', () => {
    const ids = cellIds(buildDrawio(wizardDoc()));
    expect(ids).toEqual(expect.arrayContaining(['sw-0', 'sw-1', 'node-0', 'node-1', 'oob-0', 'net-0']));
    expect(ids.filter((i) => i.startsWith('sl-'))).toEqual(['sl-0-1-0', 'sl-0-1-1']);
  });

  it('has unique cell ids and one edge per cable', () => {
    const doc = wizardDoc({ nodeCount: 4, storage: 'switched', pattern: 'rack-aware' });
    const xml = buildDrawio(doc);
    const ids = cellIds(xml);
    expect(new Set(ids).size).toBe(ids.length);
    expect((xml.match(/edge="1"/g) ?? []).length).toBe(doc.connectors.length);
  });

  it('attaches every edge to existing shapes', () => {
    const xml = buildDrawio(wizardDoc());
    const ids = new Set(cellIds(xml));
    for (const m of xml.matchAll(/ source="([^"]+)" target="([^"]+)"/g)) {
      expect(ids.has(m[1])).toBe(true);
      expect(ids.has(m[2])).toBe(true);
    }
  });

  it('labels edges with ports, VLAN and cable type and colours storage orange', () => {
    const xml = buildDrawio(wizardDoc());
    expect(xml).toMatch(/value="OCP-P1 - [A-Za-z0-9]+  VLAN 7  DAC"/);
    expect(xml).toContain(`strokeColor=${DRAWIO_COLORS.storage}`);
    expect(xml).toContain(`strokeColor=${DRAWIO_COLORS.management}`);
  });

  it('puts intents, zone and trunk VLANs in the shape labels', () => {
    const xml = buildDrawio(wizardDoc({ nodeCount: 4, storage: 'switched', pattern: 'rack-aware' }));
    expect(xml).toContain('intent Management_Compute [management+compute]: OCP-P1, OCP-P2');
    expect(xml).toContain('zone: zone-2');
    expect(xml).toContain('trunk VLANs: 7, 8, 711');
  });

  it('escapes markup in titles so a label cannot become markup', () => {
    expect(attr('a"b<c>&d\ne')).toBe('a&quot;b&lt;c&gt;&amp;d&#xa;e');
    const doc = emptyDoc({ name: 'x"><script>', nodes: [host('h1', { title: '<img src=x onerror=1>' })] });
    const xml = buildDrawio(doc);
    expect(xml).not.toContain('<script>');
    expect(xml).not.toContain('<img');
  });

  it('skips cables whose end no longer exists and handles an empty diagram', () => {
    const doc = emptyDoc({ nodes: [host('h1'), tor('t1')], connectors: [cable('c1', 'h1', 'gone'), cable('c2', 'h1', 't1')] });
    expect((buildDrawio(doc).match(/edge="1"/g) ?? []).length).toBe(1);
    expect(buildDrawio(emptyDoc())).toContain('<mxfile');
  });
});
