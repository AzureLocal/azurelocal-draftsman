import { describe, expect, it } from 'vitest';
import { auditDiagramDocument } from '@/features/validation/diagramAuditor';
import { buildWizardDocument, type WizardTopologyConfig } from '../buildTopology';
import { InfrastructureImportError, readInfrastructureDesign } from '../fromInfrastructure';
import { TOPOLOGY_PRESETS } from '../presets';

// The network design part of an infrastructure.yml (azurelocal-toolkit, schema 5), with the Infinite Improbability Corp
// placeholder values. Only the keys Draftsman reads.
const FOUR_NODE = `
_metadata:
  schema_version: "5.6.30"
scenario:
  topology: standard
  storage_connectivity: switched
hardware:
  vendor: "Dell"
  model: "AX-760"
nodes:
  - { name: "iic-azl-n01" }
  - { name: "iic-azl-n02" }
  - { name: "iic-azl-n03" }
  - { name: "iic-azl-n04" }
network_devices:
  - { hostname: "sw01-iic", type: switch, vendor: "Dell", model: "S5248F-ON" }
  - { hostname: "sw02-iic", type: switch, vendor: "Dell", model: "S5248F-ON" }
networking:
  management:
    vlan_id: 711
  intents:
    - name: management_compute
      traffic: [management, compute]
      adapters: ["Port1", "Port2"]
    - name: storage
      traffic: [storage]
      adapters: ["Port3", "Port4"]
      overrides:
        adapter:
          jumbo_packet: 9014
  storage:
    auto_ip: true
    networks:
      - { name: "StorageNetwork1", adapter: "Port3", vlan_id: 711 }
      - { name: "StorageNetwork2", adapter: "Port4", vlan_id: 712 }
  vlans:
    - { name: "management", id: 7, purpose: management }
    - { name: "storage-1", id: 711 }
    - { name: "storage-2", id: 712 }
    - { name: "workloads", id: 2204, subnet: "203.0.113.0/24", purpose: compute }
`;

const withEdit = (edit: (text: string) => string) => edit(FOUR_NODE);

describe('readInfrastructureDesign', () => {
  it('reads the topology, intents, VLANs and models of a 4-node switched design', () => {
    const d = readInfrastructureDesign(FOUR_NODE);
    expect(d.schemaVersion).toBe('5.6.30');
    expect(d.nodeCount).toBe(4);
    expect(d.pattern).toBe('single-rack');
    expect(d.storage).toBe('switched');
    expect(d.presetId).toBe('switched-4');
    expect(d.intentModel).toBe('mgmt-compute-storage');
    expect(d.intents).toEqual([
      { name: 'management_compute', traffic: ['management', 'compute'] },
      { name: 'storage', traffic: ['storage'] },
    ]);
    expect(d.mgmtVlan).toBe(711 /* networking.management.vlan_id wins over the VLAN list */);
    expect(d.computeVlan).toBe(2204);
    expect(d.storageVlans).toEqual([711, 712]);
    expect(d.mtu).toBe(9000);
    expect(d.serverModel).toBe('AX-760');
    expect(d.switchModel).toBe('Dell PowerSwitch S5248F-ON');
    expect(d.notes).toEqual([]);
  });

  it('takes the management VLAN from networking.vlans when networking.management has none', () => {
    const d = readInfrastructureDesign(withEdit((t) => t.replace('    vlan_id: 711\n', '    subnet: "192.0.2.0/24"\n')));
    expect(d.mgmtVlan).toBe(7);
  });

  it('finds the storage VLANs by name when networking.storage.networks is absent', () => {
    const d = readInfrastructureDesign(withEdit((t) => t.replace(/ {2}storage:\n {4}auto_ip: true\n {4}networks:\n.*\n.*\n/, '')));
    expect(d.storageVlans).toEqual([711, 712]);
  });

  it('recognises the three intent layouts and leaves an unknown one to the wizard with a note', () => {
    const all = readInfrastructureDesign(withEdit((t) => t.replace(/ {4}- name: management_compute[\s\S]*?jumbo_packet: 9014\n/, '    - name: all\n      traffic: [management, compute, storage]\n      adapters: ["Port1", "Port2"]\n')));
    expect(all.intentModel).toBe('group-all');
    const three = readInfrastructureDesign(withEdit((t) => t.replace('traffic: [management, compute]', 'traffic: [management]').replace(/(\n {4}- name: storage\n)/, '\n    - { name: compute, traffic: [compute], adapters: ["Port5", "Port6"] }$1')));
    expect(three.intentModel).toBe('disaggregated');
    const odd = readInfrastructureDesign(withEdit((t) => t.replace('traffic: [management, compute]', 'traffic: [management, storage]')));
    expect(odd.intentModel).toBeUndefined();
    expect(odd.notes.join(' ')).toContain('match none of the wizard');
  });

  it('maps rack_aware and switchless to the presets that exist, and says so when none does', () => {
    const rack = readInfrastructureDesign(withEdit((t) => t.replace('topology: standard', 'topology: rack_aware')));
    expect(rack.pattern).toBe('rack-aware');
    expect(rack.presetId).toBe('rack-aware-4');
    const none = readInfrastructureDesign(withEdit((t) => t.replace('  - { name: "iic-azl-n04" }\n', '')));
    expect(none.nodeCount).toBe(3);
    expect(none.presetId).toBeUndefined();
    expect(none.notes.join(' ')).toContain('no preset for 3 nodes');
    const mesh = readInfrastructureDesign(withEdit((t) => t.replace('storage_connectivity: switched', 'storage_connectivity: switchless').replace('  - { name: "iic-azl-n04" }\n', '')));
    expect(mesh.presetId).toBe('switchless-3');
  });

  it('keeps the wizard values and says so for what the file does not name or Draftsman has no profile for', () => {
    const d = readInfrastructureDesign(withEdit((t) => t.replace('model: "AX-760"', 'model: "R760xa"').replaceAll('model: "S5248F-ON"', 'model: "Z9100"').replace(/ {4}- \{ name: "workloads".*\n/, '').replace('    vlan_id: 711\n', '')));
    expect(d.serverModel).toBeUndefined();
    expect(d.switchModel).toBeUndefined();
    expect(d.mgmtVlan).toBe(7);
    expect(d.computeVlan).toBeUndefined();
    const notes = d.notes.join(' ');
    expect(notes).toContain("hardware.model 'R760xa'");
    expect(notes).toContain("network_devices switch 'Dell Z9100'");
    expect(notes).toContain('No compute VLAN');
  });

  it('reads a standard frame size as MTU 1500', () => {
    expect(readInfrastructureDesign(withEdit((t) => t.replace('jumbo_packet: 9014', 'jumbo_packet: 1514'))).mtu).toBe(1500);
  });

  it('refuses a file that is not YAML, not a mapping, not schema 5, or has no intents, and says which', () => {
    expect(() => readInfrastructureDesign('a: [unclosed')).toThrow(InfrastructureImportError);
    expect(() => readInfrastructureDesign('- just\n- a list\n')).toThrow('not a mapping');
    expect(() => readInfrastructureDesign('_metadata:\n  schema_version: "4.2"\n')).toThrow("schema 5 (_metadata.schema_version is '4.2')");
    expect(() => readInfrastructureDesign('_metadata:\n  schema_version: "5.6.0"\nnetworking: {}\n')).toThrow('no networking.intents');
  });
});

describe('an infrastructure.yml design drives the wizard builder', () => {
  it.each(TOPOLOGY_PRESETS)('$title built from a file is audit-clean', (preset) => {
    const yaml = FOUR_NODE
      .replace('topology: standard', `topology: ${preset.pattern === 'rack-aware' ? 'rack_aware' : 'standard'}`)
      .replace('storage_connectivity: switched', `storage_connectivity: ${preset.storage}`)
      .replace(/nodes:\n(?: {2}- .*\n)+/, `nodes:\n${Array.from({ length: preset.nodeCount }, (_, i) => `  - { name: "iic-azl-n0${i + 1}" }\n`).join('')}`);
    const d = readInfrastructureDesign(yaml);
    expect(d.presetId).toBe(preset.id);
    const config: WizardTopologyConfig = {
      nodeCount: preset.nodeCount,
      pattern: d.pattern,
      storage: d.storage,
      intentModel: d.intentModel,
      serverModel: d.serverModel ?? 'AX-760',
      switchModel: d.switchModel ?? 'Arista 7050SX3',
      oobConsole: 'Opengear OM2248',
      vlanProfile: { mgmtVlan: d.mgmtVlan ?? 7, computeVlan: d.computeVlan ?? 8, storageVlan1: d.storageVlans[0], storageVlan2: d.storageVlans[1], storageVlan3: d.storageVlans[2], mtu: d.mtu ?? 9000 },
      cableMedia: 'DAC 25G',
    };
    const doc = buildWizardDocument(config);
    // The VLANs of the file are the VLANs of the diagram.
    expect(doc.areas.find((a) => a.id === 'area-mgmt')?.vlanId).toBe(711);
    expect(doc.areas.find((a) => a.id === 'area-compute')?.vlanId).toBe(2204);
    expect(doc.areas.find((a) => a.id === 'area-storage-1')?.vlanId).toBe(711);
    expect(doc.areas.find((a) => a.id === 'area-storage-2')?.vlanId).toBe(712);
    const bad = auditDiagramDocument(doc).filter((i) => i.severity === 'error');
    expect(bad.map((i) => `${i.ruleId}: ${i.message}`)).toEqual([]);
  });
});
