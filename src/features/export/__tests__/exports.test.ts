import { describe, expect, it } from 'vitest';
import { buildCableScheduleCsv, CABLE_SCHEDULE_HEADERS, csvCell } from '../exportCableScheduleCsv';
import { buildSwitchPortMap } from '../exportSwitchPortMap';
import { exportFileStem } from '../download';
import { buildWizardDocument } from '@/features/wizard/buildTopology';
import { cable, emptyDoc, host, switchedDoc, tor, MGMT_COMPUTE, STORAGE } from '@/test/fixtures';

/** Minimal CSV parser for the tests (quoted cells, doubled quotes). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  row.push(cell);
  rows.push(row);
  return rows;
}

describe('cable schedule CSV', () => {
  it('has the documented header row and one row per cable', () => {
    const doc = switchedDoc(2);
    const rows = parseCsv(buildCableScheduleCsv(doc));
    expect(rows[0]).toEqual([...CABLE_SCHEDULE_HEADERS]);
    expect(rows).toHaveLength(doc.connectors.length + 1);
  });

  it('writes devices, ports, medium, speed and VLAN for a cable', () => {
    const doc = emptyDoc({
      nodes: [host('h1', { title: 'Node-1' }), tor('t1', { title: 'ToR-A' })],
      connectors: [cable('c1', 'h1', 't1', { sourcePortId: 'OCP-P1', targetPortId: 'Eth1', vlanId: 7, cableType: 'dac', cableTagLabel: 'CBL-0001' })],
    });
    const [, row] = parseCsv(buildCableScheduleCsv(doc));
    expect(row.slice(0, 9)).toEqual(['CBL-0001', 'Node-1', 'OCP-P1', 'ToR-A', 'Eth1', 'DAC (Direct Attach Copper)', '25G / 100G', 'VLAN 7', '']);
  });

  it('numbers untagged cables and marks untagged VLANs', () => {
    const doc = emptyDoc({ nodes: [host('h1'), tor('t1')], connectors: [cable('c1', 'h1', 't1')] });
    const [, row] = parseCsv(buildCableScheduleCsv(doc));
    expect(row[0]).toBe('CBL-001');
    expect(row[7]).toBe('Untagged');
    expect(row[2]).toBe('Front Face');
  });

  it('includes the Network ATC intent of the host port', () => {
    const doc = switchedDoc(1, { intents: [MGMT_COMPUTE, STORAGE] });
    const rows = parseCsv(buildCableScheduleCsv(doc));
    const intentCol = rows[0].indexOf('Intent');
    expect(rows.slice(1).find((r) => r[2] === 'OCP-P1')?.[intentCol]).toBe('Management_Compute');
    expect(rows.slice(1).find((r) => r[2] === 'iDRAC1')?.[intentCol]).toBe('');
  });

  it('escapes quotes and neutralizes spreadsheet formulas', () => {
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('=SUM(A1)')).toBe('"\'=SUM(A1)"');
    expect(csvCell('-1')).toBe('"\'-1"');
    const doc = emptyDoc({ nodes: [host('h1', { title: 'Node "1"' }), tor('t1')], connectors: [cable('c1', 'h1', 't1', { notes: 'a,b\nc' })] });
    const rows = parseCsv(buildCableScheduleCsv(doc));
    expect(rows[1][1]).toBe('Node "1"');
    expect(rows[1][9]).toBe('a,b\nc');
  });

  it('reports unknown devices for dangling cables (edge)', () => {
    const doc = emptyDoc({ connectors: [cable('c1', 'gone1', 'gone2')] });
    expect(parseCsv(buildCableScheduleCsv(doc))[1][1]).toBe('Unknown Device');
  });

  it('exports only the header for an empty diagram', () => {
    expect(buildCableScheduleCsv(emptyDoc())).toBe(CABLE_SCHEDULE_HEADERS.join(','));
  });

  it('lists every cable of a generated rack-aware design', () => {
    const doc = buildWizardDocument({
      nodeCount: 4,
      pattern: 'rack-aware',
      serverModel: 'AX-760',
      switchModel: 'Arista 7050SX3',
      oobConsole: 'Dell PowerSwitch N3248TE-ON',
      vlanProfile: { mgmtVlan: 7, computeVlan: 8, storageVlan1: 711, storageVlan2: 712, mtu: 9000 },
      cableMedia: 'DAC 25G',
    });
    expect(parseCsv(buildCableScheduleCsv(doc))).toHaveLength(doc.connectors.length + 1);
  });
});

describe('switch port map', () => {
  const at = new Date('2026-01-02T03:04:05.000Z');

  it('lists each switch with its ports and remote devices', () => {
    const doc = emptyDoc({
      name: 'Rack 1',
      nodes: [host('h1', { title: 'Node-1' }), tor('t1', { title: 'ToR-A', zoneId: 'zone-1', trunkVlans: [7, 8, 711] })],
      connectors: [cable('c1', 'h1', 't1', { sourcePortId: 'OCP-P1', targetPortId: 'P1', vlanId: 7 })],
    });
    const text = buildSwitchPortMap(doc, at);
    expect(text).toContain('Diagram: Rack 1');
    expect(text).toContain('Generated: 2026-01-02T03:04:05.000Z');
    expect(text).toContain('SWITCH: ToR-A');
    expect(text).toContain('Model : Dell PowerSwitch S5248F-ON (1U)');
    expect(text).toContain('Zone  : zone-1');
    expect(text).toContain('Trunk VLANs: 7, 8, 711');
    expect(text).toContain('Port [ P1         ] -> Connected to Node-1 [ OCP-P1 ] (VLAN 7)');
  });

  it('reports a switch without cables and a diagram without switches', () => {
    expect(buildSwitchPortMap(emptyDoc({ nodes: [tor('t1')] }), at)).toContain('[No active port connections]');
    expect(buildSwitchPortMap(emptyDoc(), at)).toContain('No network switches or console managers found');
  });

  it('shows the switch end whichever side of the cable it is on', () => {
    const doc = emptyDoc({ nodes: [host('h1', { title: 'Node-1' }), tor('t1', { title: 'ToR-A' })], connectors: [cable('c1', 't1', 'h1', { sourcePortId: 'P9', targetPortId: 'OCP-P2' })] });
    expect(buildSwitchPortMap(doc, at)).toContain('Port [ P9         ] -> Connected to Node-1 [ OCP-P2 ] (Trunk/Native)');
  });
});

describe('file names', () => {
  it('builds safe stems', () => {
    expect(exportFileStem('Azure Local 4-Node AX-760 / Rack-Aware')).toBe('azure_local_4_node_ax_760_rack_aware');
    expect(exportFileStem('   ')).toBe('diagram');
  });
});
