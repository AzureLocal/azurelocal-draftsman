import { describe, expect, it } from 'vitest';
import { areaPurpose, carriesNonStorage, carriesStorage, intentOfPort, isHostNode, isOobDevice, isStorageArea, isTorSwitch, linksOfHost, resolveCluster, trafficOfLink } from '../analysis';
import { cable, emptyDoc, host, oob, switchedDoc, tor, MGMT_COMPUTE, STORAGE } from '@/test/fixtures';
import { isAtcDefaultStorageVlan } from '@/types/topology';
import type { AreaEntity } from '@/types/document';

const area = (o: Partial<AreaEntity>): AreaEntity => ({ id: 'a', type: 'area', x: 0, y: 0, width: 1, height: 1, label: '', fill: '', borderColor: '', glowColor: '', locked: false, zIndex: 1, ...o });

describe('node classification', () => {
  it('recognises hosts, ToR and OOB devices by shape or profile category', () => {
    expect(isHostNode(host('h'))).toBe(true);
    expect(isHostNode(host('h', { shape: undefined }))).toBe(true);
    expect(isTorSwitch(tor('t'))).toBe(true);
    expect(isTorSwitch(tor('t', { shape: undefined }))).toBe(true);
    expect(isTorSwitch(oob('o'))).toBe(false);
    expect(isOobDevice(oob('o'))).toBe(true);
    expect(isOobDevice(undefined)).toBe(false);
    expect(isTorSwitch(undefined)).toBe(false);
  });
});

describe('links and traffic', () => {
  it('classifies links and reads traffic from the port intent', () => {
    const doc = switchedDoc(1, { intents: [MGMT_COMPUTE, STORAGE] });
    doc.connectors.push(cable('s1', 'h1', 'torA', { sourcePortId: 'slot1-p1' }));
    const links = linksOfHost(doc, doc.nodes.find((n) => n.id === 'h1')!);
    const byId = new Map(links.map((l) => [l.connector.id, l]));
    expect(byId.get('h1-a')!.kind).toBe('tor');
    expect(byId.get('h1-o')!.kind).toBe('oob');
    expect(trafficOfLink(byId.get('h1-o')!)).toBe('oob');
    expect(trafficOfLink(byId.get('h1-a')!)).toEqual(['management', 'compute']);
    expect(carriesNonStorage(byId.get('h1-a')!)).toBe(true);
    expect(carriesStorage(byId.get('s1')!)).toBe(true); // port ids match case-insensitively
  });

  it('treats a host-to-host cable as storage and an unassigned port as unknown', () => {
    const doc = emptyDoc({ nodes: [host('h1'), host('h2'), tor('t')], connectors: [cable('m', 'h1', 'h2'), cable('u', 'h1', 't', { sourcePortId: 'OCP-P1' })] });
    const links = linksOfHost(doc, doc.nodes[0]);
    expect(trafficOfLink(links.find((l) => l.connector.id === 'm')!)).toEqual(['storage']);
    expect(trafficOfLink(links.find((l) => l.connector.id === 'u')!)).toBe('unknown');
  });

  it('finds the intent of a port', () => {
    const h = host('h', { intents: [MGMT_COMPUTE, STORAGE] });
    expect(intentOfPort(h, 'OCP-P2')?.name).toBe('Management_Compute');
    expect(intentOfPort(h, 'Nope')).toBeUndefined();
    expect(intentOfPort(h, undefined)).toBeUndefined();
    expect(intentOfPort(host('x'), 'OCP-P1')).toBeUndefined();
  });
});

describe('resolveCluster', () => {
  it('defaults to single-rack switched', () => {
    expect(resolveCluster(switchedDoc(2))).toEqual({ pattern: 'single-rack', storage: 'switched' });
  });
  it('infers switchless from a host-to-host cable and rack-aware from two zones', () => {
    const d = emptyDoc({ nodes: [host('a', { zoneId: 'zone-1' }), host('b', { zoneId: 'zone-2' })], connectors: [cable('c', 'a', 'b')] });
    expect(resolveCluster(d)).toEqual({ pattern: 'rack-aware', storage: 'switchless' });
  });
  it('returns the explicit design untouched', () => {
    const cluster = { pattern: 'rack-aware', storage: 'switched', torPerZone: 1 } as const;
    expect(resolveCluster(emptyDoc({ cluster }))).toBe(cluster);
  });
});

describe('areas and VLANs', () => {
  it('reads the purpose from the field first, then the label', () => {
    expect(areaPurpose(area({ label: 'Storage 1', purpose: 'management' }))).toBe('management');
    expect(areaPurpose(area({ label: 'SMB Direct fabric' }))).toBe('storage');
    expect(areaPurpose(area({ label: 'Mgmt network' }))).toBe('management');
    expect(areaPurpose(area({ label: 'Tenant VMs' }))).toBe('compute');
    expect(areaPurpose(area({ label: 'Zone A' }))).toBeUndefined();
  });
  it('knows the Network ATC default storage VLAN range 711 to 719', () => {
    expect([710, 711, 712, 718, 719, 720, undefined].map(isAtcDefaultStorageVlan)).toEqual([false, true, true, true, true, false, false]);
  });
  it('treats an unlabelled area on a default storage VLAN as storage, but not an explicit management area', () => {
    expect(isStorageArea(area({ vlanId: 712 }))).toBe(true);
    expect(isStorageArea(area({ vlanId: 712, label: 'Management' }))).toBe(false);
    expect(isStorageArea(area({ vlanId: 99 }))).toBe(false);
  });
});
