import { describe, expect, it } from 'vitest';
import { auditDiagramDocument } from '@/features/validation/diagramAuditor';
import { getHardwareProfile } from '@/types/hardwareProfiles';
import { buildWizardDocument, resolveIntentModel, serverProfileId, torProfileId, oobProfileId, type WizardTopologyConfig } from '../buildTopology';

const base: WizardTopologyConfig = {
  nodeCount: 4,
  serverModel: 'AX-760',
  switchModel: 'Arista 7050SX3',
  oobConsole: 'Dell PowerSwitch N3248TE-ON',
  vlanProfile: { mgmtVlan: 7, computeVlan: 8, storageVlan1: 711, storageVlan2: 712, storageVlan3: 713, mtu: 9000 },
  cableMedia: 'DAC 25G',
};

const cases: Array<[string, Partial<WizardTopologyConfig>]> = [
  ['4-node switched', {}],
  ['8-node switched', { nodeCount: 8 }],
  ['4-node switched group-all', { intentModel: 'group-all' }],
  ['4-node switched disaggregated', { intentModel: 'disaggregated' }],
  ['2-node switchless', { nodeCount: 2, storage: 'switchless' }],
  ['3-node switchless', { nodeCount: 3, storage: 'switchless' }],
  ['4-node rack-aware', { nodeCount: 4, pattern: 'rack-aware' }],
  ['8-node rack-aware', { nodeCount: 8, pattern: 'rack-aware' }],
  ['Opengear console', { oobConsole: 'Opengear OM2248' }],
  ['Cisco ToR, 100G', { switchModel: 'Cisco Nexus 93180YC', cableMedia: 'MMF 100G' }],
];

describe('wizard output is audit-clean', () => {
  it.each(cases)('%s has no errors or warnings', (_name, overrides) => {
    const doc = buildWizardDocument({ ...base, ...overrides });
    const bad = auditDiagramDocument(doc).filter((i) => i.severity !== 'info');
    expect(bad.map((i) => `${i.ruleId}: ${i.message}`)).toEqual([]);
  });
});

describe('hardware profile ids resolve', () => {
  it('every server, switch and OOB choice maps to a real profile', () => {
    ['AX-760', 'AX-660', 'AX-770', 'AX-670'].forEach((m) => expect(getHardwareProfile(serverProfileId(m))?.category).toBe('serverNode'));
    ['Arista 7050SX3', 'Cisco Nexus 93180YC', 'Dell PowerSwitch S5248F-ON', 'Dell PowerSwitch S5224F-ON', 'Nvidia Spectrum SN2100'].forEach((m) =>
      expect(getHardwareProfile(torProfileId(m))?.category).toBe('torSwitch'),
    );
    ['Opengear OM2248', 'Opengear CM8148', 'Dell PowerSwitch N3248TE-ON', 'Dell PowerSwitch S3148P'].forEach((m) => {
      const c = getHardwareProfile(oobProfileId(m))?.category;
      expect(['oobSwitch', 'opengearConsole']).toContain(c);
    });
  });
});

describe('generated structure', () => {
  it('stores the cluster design and per-host intents', () => {
    const doc = buildWizardDocument({ ...base, pattern: 'rack-aware' });
    expect(doc.cluster).toMatchObject({ pattern: 'rack-aware', storage: 'switched', intentModel: 'mgmt-compute-storage' });
    const hosts = doc.nodes.filter((n) => n.shape === 'serverNode');
    expect(hosts).toHaveLength(4);
    expect(new Set(hosts.map((h) => h.zoneId))).toEqual(new Set(['zone-1', 'zone-2']));
    expect(hosts[0].intents?.map((i) => i.name)).toEqual(['Management_Compute', 'Storage']);
    expect(doc.nodes.filter((n) => n.shape === 'vendorSwitch')).toHaveLength(4);
  });

  it('defaults storage VLANs to the Network ATC defaults 711 and 712 and keeps management off them', () => {
    const doc = buildWizardDocument(base);
    const storageVlans = doc.areas.filter((a) => a.purpose === 'storage').map((a) => a.vlanId);
    expect(storageVlans).toEqual([711, 712]);
    expect(doc.areas.find((a) => a.purpose === 'management')?.vlanId).toBe(7);
    expect(doc.areas.find((a) => a.purpose === 'storage')?.cidr).toBe('10.71.1.0/24');
  });

  it('uses three storage VLANs (711, 712, 713) for a 3-node mesh', () => {
    const doc = buildWizardDocument({ ...base, nodeCount: 3, storage: 'switchless' });
    expect(doc.areas.filter((a) => a.purpose === 'storage').map((a) => a.vlanId)).toEqual([711, 712, 713]);
    expect(doc.connectors.filter((c) => c.id.startsWith('conn-mesh'))).toHaveLength(3);
  });

  it('wires pin-level ports on every cable to a host', () => {
    const doc = buildWizardDocument(base);
    const hostIds = new Set(doc.nodes.filter((n) => n.shape === 'serverNode').map((n) => n.id));
    const hostCables = doc.connectors.filter((c) => hostIds.has(c.sourceId));
    expect(hostCables.length).toBeGreaterThan(0);
    for (const c of hostCables) {
      expect(c.sourcePortId).toBeTruthy();
      expect(c.targetPortId).toBeTruthy();
    }
  });

  it('allocates each ToR port only once', () => {
    const doc = buildWizardDocument({ ...base, nodeCount: 8 });
    const seen = new Set<string>();
    for (const c of doc.connectors) {
      const key = `${c.targetId}:${c.targetPortId}`;
      if (!c.targetPortId) continue;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it('limits trunks per rack-aware ToR to one storage VLAN (storage bypasses MLAG)', () => {
    const doc = buildWizardDocument({ ...base, pattern: 'rack-aware' });
    const a = doc.nodes.find((n) => n.id === 'node-tor-1a')!;
    const b = doc.nodes.find((n) => n.id === 'node-tor-1b')!;
    expect(a.trunkVlans).toEqual([7, 8, 711]);
    expect(b.trunkVlans).toEqual([7, 8, 712]);
  });

  it('allows a custom management VLAN on 711 but the auditor warns (non-blocking)', () => {
    const doc = buildWizardDocument({ ...base, vlanProfile: { ...base.vlanProfile, mgmtVlan: 711 } });
    const warnings = auditDiagramDocument(doc).filter((i) => i.ruleId === 'RULE-VLAN-ATC-COLLISION');
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.every((w) => w.severity === 'warning')).toBe(true);
  });
});

describe('intent model resolution', () => {
  const ax760 = getHardwareProfile('dell-ax-760');
  it('keeps group-all only for switched single-rack', () => {
    expect(resolveIntentModel(ax760, 'group-all', 'single-rack', 'switched').model).toBe('group-all');
    expect(resolveIntentModel(ax760, 'group-all', 'rack-aware', 'switched').model).toBe('mgmt-compute-storage');
    expect(resolveIntentModel(ax760, 'group-all', 'single-rack', 'switchless').model).toBe('mgmt-compute-storage');
  });
  it('needs six data ports for disaggregated', () => {
    expect(resolveIntentModel(ax760, 'disaggregated', 'single-rack', 'switched').intents).toHaveLength(3);
    expect(resolveIntentModel(getHardwareProfile('dell-ax-660'), 'disaggregated', 'single-rack', 'switched').model).toBe('mgmt-compute-storage');
  });
  it('falls back to group-all on a two-port server when switched', () => {
    expect(resolveIntentModel(getHardwareProfile('dell-poweredge-r670'), 'mgmt-compute-storage', 'single-rack', 'switched').model).toBe('group-all');
  });
});
