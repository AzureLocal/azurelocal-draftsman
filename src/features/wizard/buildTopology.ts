import type { ConnectorEntity, DiagramDocument, NodeEntity } from '@/types/document';
import { DOCUMENT_VERSION } from '@/types/document';
import type { CableMediaType } from '@/types/cabling';
import { getHardwareProfile, listHostDataPorts, listProfilePorts, type HardwareProfile } from '@/types/hardwareProfiles';
import { ATC_STORAGE_SUBNETS, type ClusterPattern, type IntentModel, type NetworkIntent, type StoragePattern } from '@/types/topology';

/**
 * Pure builder for the guided setup wizard. Given the wizard answers it returns a complete, pre-wired diagram:
 * switches, hosts with Network ATC intents and SET teams, pin-level cables with VLAN tags, logical networks and
 * the cluster design the auditor reads. No store, no DOM: unit tested in __tests__/buildTopology.test.ts.
 */

export interface WizardTopologyConfig {
  nodeCount: 2 | 3 | 4 | 6 | 8;
  serverModel: string;
  switchModel: string;
  oobConsole: string;
  vlanProfile: {
    mgmtVlan: number;
    computeVlan: number;
    storageVlan1: number;
    storageVlan2: number;
    storageVlan3?: number;
    mtu: number;
  };
  cableMedia: 'DAC 25G' | 'MMF 100G';
  /** Defaults to single-rack. */
  pattern?: ClusterPattern;
  /** Defaults to switched. Switchless supports 2 to 4 nodes here (Learn: 1 to 4). */
  storage?: StoragePattern;
  /** Defaults to mgmt-compute-storage. Unsupported choices fall back (see resolveIntentModel). */
  intentModel?: IntentModel;
}

export const SERVER_PROFILE_IDS: Record<string, string> = {
  'AX-760': 'dell-ax-760',
  'AX-660': 'dell-ax-660',
  'AX-770': 'dell-ax-770',
  'AX-670': 'dell-ax-670',
};

export function serverProfileId(model: string): string {
  const key = Object.keys(SERVER_PROFILE_IDS).find((k) => model.includes(k));
  return key ? SERVER_PROFILE_IDS[key] : 'dell-ax-760';
}

export function torProfileId(model: string): string {
  if (model.includes('Cisco')) return 'cisco-nexus-93180yc-fx3';
  if (model.includes('S5248F')) return 'dell-s5248f-on';
  if (model.includes('S5224F')) return 'dell-s5224f-on';
  if (model.includes('SN2100')) return 'nvidia-spectrum-sn2100';
  return 'arista-7050sx3-48yc8';
}

export function oobProfileId(model: string): string {
  if (model.includes('CM8148')) return 'opengear-cm8148-2-dac';
  if (model.includes('N3248TE')) return 'dell-n3248te-on';
  if (model.includes('S3148P')) return 'dell-s3148p-on';
  return 'opengear-om2248-l';
}

export interface IntentPlan {
  model: IntentModel;
  intents: NetworkIntent[];
}

/**
 * Pick the intent layout for a server profile and pattern.
 *  - group-all needs a switched, single-rack design (switchless storage adapters are single-purpose;
 *    rack-aware needs a dedicated storage intent) and falls back to mgmt-compute-storage otherwise.
 *  - disaggregated needs six data ports and falls back to mgmt-compute-storage otherwise.
 *  - mgmt-compute-storage needs four data ports and falls back to group-all when only two exist and the design allows it.
 */
export function resolveIntentModel(
  profile: HardwareProfile | undefined,
  requested: IntentModel,
  pattern: ClusterPattern,
  storage: StoragePattern,
): IntentPlan {
  const ports = profile ? listHostDataPorts(profile).map((p) => p.id) : ['OCP-P1', 'OCP-P2', 'Slot1-P1', 'Slot1-P2'];
  const groupAllAllowed = pattern === 'single-rack' && storage === 'switched';
  let model = requested === 'custom' ? 'mgmt-compute-storage' : requested;
  if (model === 'group-all' && !groupAllAllowed) model = 'mgmt-compute-storage';
  if (model === 'disaggregated' && ports.length < 6) model = 'mgmt-compute-storage';
  if (model === 'mgmt-compute-storage' && ports.length < 4) model = groupAllAllowed ? 'group-all' : 'mgmt-compute-storage';

  if (model === 'group-all') {
    return { model, intents: [{ id: 'intent-all', name: 'Compute_Management_Storage', traffic: ['management', 'compute', 'storage'], portIds: ports.slice(0, 2) }] };
  }
  if (model === 'disaggregated') {
    return {
      model,
      intents: [
        { id: 'intent-mgmt', name: 'Management', traffic: ['management'], portIds: ports.slice(0, 2) },
        { id: 'intent-compute', name: 'Compute', traffic: ['compute'], portIds: ports.slice(2, 4) },
        { id: 'intent-storage', name: 'Storage', traffic: ['storage'], portIds: ports.slice(4, 6) },
      ],
    };
  }
  return {
    model: 'mgmt-compute-storage',
    intents: [
      { id: 'intent-mgmt-compute', name: 'Management_Compute', traffic: ['management', 'compute'], portIds: ports.slice(0, 2) },
      { id: 'intent-storage', name: 'Storage', traffic: ['storage'], portIds: ports.slice(2, 4) },
    ],
  };
}

/** Whether the wizard can build this combination (used by the UI to disable choices). */
export function validateWizardChoice(config: Pick<WizardTopologyConfig, 'nodeCount' | 'pattern' | 'storage'>): string | null {
  const pattern = config.pattern ?? 'single-rack';
  const storage = config.storage ?? 'switched';
  if (pattern === 'rack-aware' && storage === 'switchless') return 'Rack-aware clusters need switched storage.';
  if (storage === 'switchless' && (config.nodeCount < 2 || config.nodeCount > 3)) return 'The wizard builds 2 and 3 node switchless clusters (Azure Local supports 1 to 4; draw a 4-node mesh by hand and the auditor will check it).';
  if (pattern === 'rack-aware' && (config.nodeCount % 2 !== 0 || config.nodeCount > 8)) return 'Rack-aware clusters need an even node count, up to 8.';
  return null;
}

const NODE_W = 250;
const NODE_SPACING = 280;

function portIdAt(profile: HardwareProfile | undefined, index: number): string | undefined {
  if (!profile) return undefined;
  const ports = listProfilePorts(profile).filter((p) => p.group === profile.portGroups[0]);
  return ports[index]?.id;
}

function subnetFor(vlan: number): string {
  return ATC_STORAGE_SUBNETS[vlan] ?? `192.168.${vlan % 250}.0/24`;
}

export function buildWizardDocument(config: WizardTopologyConfig, base?: Partial<DiagramDocument>): DiagramDocument {
  const pattern = config.pattern ?? 'single-rack';
  const storage = config.storage ?? 'switched';
  const rackAware = pattern === 'rack-aware';
  const switchless = storage === 'switchless';
  const v = config.vlanProfile;
  const cableType: CableMediaType = config.cableMedia.includes('100G') ? 'mmf' : 'dac';
  const hostProfileId = serverProfileId(config.serverModel);
  const hostProfile = getHardwareProfile(hostProfileId);
  const plan = resolveIntentModel(hostProfile, config.intentModel ?? 'mgmt-compute-storage', pattern, storage);
  const storageVlans = [v.storageVlan1, v.storageVlan2, v.storageVlan3 ?? v.storageVlan2 + 1];

  const doc: DiagramDocument = {
    version: DOCUMENT_VERSION,
    id: base?.id ?? crypto.randomUUID(),
    name: `Azure Local ${config.nodeCount}-Node ${config.serverModel} ${rackAware ? 'Rack-Aware' : switchless ? 'Switchless' : 'Switched'} Architecture`,
    areas: [],
    nodes: [],
    connectors: [],
    texts: [],
    pipes: [],
    scenarios: [],
    flowSources: [],
    flowTypes: [],
    cluster: { pattern, storage, intentModel: plan.model, rdma: 'roce', torPerZone: 2 },
  };

  // --- zones ---
  const zoneIds = rackAware ? ['zone-1', 'zone-2'] : ['zone-1'];
  const hostsPerZone = rackAware ? config.nodeCount / 2 : config.nodeCount;
  const zoneWidth = Math.max(hostsPerZone * NODE_SPACING + 60, 2 * 340 + 120);
  const zoneX = (z: number) => 60 + z * (zoneWidth + 60);
  const totalWidth = zoneIds.length * zoneWidth + (zoneIds.length - 1) * 60;

  // --- switches ---
  const torTitleBase = config.switchModel;
  const torProfile = getHardwareProfile(torProfileId(config.switchModel));
  const allStorageVlans = switchless ? [] : storageVlans.slice(0, 2);
  const tors: NodeEntity[][] = zoneIds.map((zone, z) =>
    [0, 1].map((k) => ({
      id: rackAware ? `node-tor-${z + 1}${k === 0 ? 'a' : 'b'}` : k === 0 ? 'node-tor-a' : 'node-tor-b',
      type: 'node' as const,
      shape: 'vendorSwitch' as const,
      title: rackAware ? `${torTitleBase} (Zone${z + 1}-ToR-${k === 0 ? 'A' : 'B'})` : `${torTitleBase} (ToR-${k === 0 ? 'A' : 'B'})`,
      subtitle: rackAware ? `Zone ${z + 1} ToR ${k === 0 ? 'A' : 'B'} (MLAG pair)` : `Top-of-Rack Switch ${k === 0 ? 'A' : 'B'} (MLAG pair)`,
      x: zoneX(z) + 40 + k * 340,
      y: 80,
      width: 300,
      height: 95,
      fill: '#1e293b',
      glowColor: '#3b82f6',
      hardwareProfileId: torProfile?.id,
      zoneId: rackAware ? zone : undefined,
      // Rack-aware option 1: storage VLAN 1 on ToR A, VLAN 2 on ToR B (storage bypasses MLAG). Single rack: pair carries both.
      trunkVlans: switchless
        ? [v.mgmtVlan, v.computeVlan]
        : rackAware
          ? [v.mgmtVlan, v.computeVlan, storageVlans[k]]
          : [v.mgmtVlan, v.computeVlan, ...allStorageVlans],
      zIndex: 10,
    })),
  );
  tors.flat().forEach((t) => doc.nodes.push(t));

  const oobProfile = oobProfileId(config.oobConsole);
  const oobIsConsole = config.oobConsole.includes('Opengear');
  const oob: NodeEntity = {
    id: 'node-oob-1',
    type: 'node',
    shape: oobIsConsole ? 'opengearConsole' : 'oobSwitch',
    title: config.oobConsole,
    subtitle: 'Out-of-Band Management',
    x: Math.max(60, totalWidth / 2 - 170),
    y: -130,
    width: 340,
    height: 90,
    fill: '#0f172a',
    glowColor: '#00e5ff',
    hardwareProfileId: oobProfile,
    notes: 'Out-of-band management',
    zIndex: 10,
  };
  doc.nodes.push(oob);
  const oobPorts = getHardwareProfile(oobProfile);
  const oobPortIds = oobPorts
    ? listProfilePorts(oobPorts)
        .filter((p) => (oobIsConsole ? p.group.mediaType === (oobProfile === 'opengear-om2248-l' ? '1G-RJ45' : 'RS232-RJ45') : p.group.mediaType === '1G-RJ45'))
        .map((p) => p.id)
    : [];

  // --- logical networks ---
  const areaW = totalWidth;
  const half = (areaW - 20) / 2;
  const mkArea = (id: string, label: string, vlanId: number, purpose: 'management' | 'compute' | 'storage', mtu: number, x: number, y: number, w: number, color: string, z: number) =>
    doc.areas.push({
      id, type: 'area', label, vlanId, purpose, mtu, cidr: subnetFor(vlanId),
      fill: `${color}1f`, borderColor: color, glowColor: color, x, y, width: w, height: 140, locked: false, zIndex: z,
    });
  mkArea('area-mgmt', 'Management Network', v.mgmtVlan, 'management', 1500, 60, 220, half, '#3b82f6', 1);
  mkArea('area-compute', 'Compute Network', v.computeVlan, 'compute', 1500, 60 + half + 20, 220, half, '#ec4899', 2);
  const storageCount = switchless && config.nodeCount >= 3 ? 3 : 2;
  const sw = (areaW - 20 * (storageCount - 1)) / storageCount;
  for (let i = 0; i < storageCount; i++) {
    mkArea(`area-storage-${i + 1}`, `Storage ${i + 1} (SMB Direct)`, storageVlans[i], 'storage', config.vlanProfile.mtu, 60 + i * (sw + 20), 380, sw, '#a855f7', 3 + i);
  }

  // --- hosts, cables ---
  const serverY = 580;
  const nextTorPort = new Map<string, number>();
  const torPortId = (sw: NodeEntity): string | undefined => {
    const profile = getHardwareProfile(sw.hardwareProfileId);
    const idx = nextTorPort.get(sw.id) ?? 0;
    nextTorPort.set(sw.id, idx + 1);
    return portIdAt(profile, idx);
  };
  const pushCable = (c: Partial<ConnectorEntity> & Pick<ConnectorEntity, 'id' | 'sourceId' | 'targetId' | 'label'>) =>
    doc.connectors.push({
      type: 'connector', sourceAnchor: 'top-1', targetAnchor: 'bottom-1', color: '#3b82f6', style: 'solid', cableType, waypoints: [], zIndex: 5, ...c,
    } as ConnectorEntity);

  const hostIds: string[] = [];
  const hostByIndex: NodeEntity[] = [];
  for (let i = 0; i < config.nodeCount; i++) {
    const z = rackAware ? Math.floor(i / hostsPerZone) : 0;
    const within = rackAware ? i % hostsPerZone : i;
    const host: NodeEntity = {
      id: `node-server-${i + 1}`,
      type: 'node',
      shape: 'serverNode',
      title: `Node-${i + 1} (${config.serverModel})`,
      subtitle: `Dell PowerEdge ${config.serverModel}`,
      x: zoneX(z) + 30 + within * NODE_SPACING,
      y: serverY,
      width: NODE_W,
      height: 110,
      fill: '#1e293b',
      glowColor: '#00e5ff',
      hardwareProfileId: hostProfileId,
      intents: plan.intents.map((it) => ({ ...it, portIds: [...it.portIds] })),
      setTeams: plan.intents
        .filter((it) => it.traffic.some((t) => t !== 'storage') && it.portIds.length >= 2)
        .map((it) => ({ id: `set-${it.id}`, name: `SET-${it.name}`, portIds: [...it.portIds] })),
      zoneId: rackAware ? zoneIds[z] : undefined,
      zIndex: 20 + i,
    };
    doc.nodes.push(host);
    hostIds.push(host.id);
    hostByIndex.push(host);

    const torPair = tors[z];
    const anchor = (n: number) => `bottom-${Math.min(n, 4)}` as const;

    // Switch-connected intents.
    for (const intent of plan.intents) {
      const storageOnly = intent.traffic.length === 1 && intent.traffic[0] === 'storage';
      if (storageOnly && switchless) continue; // node-to-node, wired below
      intent.portIds.forEach((portId, p) => {
        const sw = torPair[p % 2];
        const vlan = storageOnly ? storageVlans[p % 2] : intent.traffic.includes('management') ? v.mgmtVlan : v.computeVlan;
        pushCable({
          id: `conn-${intent.id}-${p + 1}-${i + 1}`,
          sourceId: host.id, sourcePortId: portId, sourceAnchor: `top-${Math.min(p, 4)}` as ConnectorEntity['sourceAnchor'],
          targetId: sw.id, targetPortId: torPortId(sw), targetAnchor: anchor(i % 5) as ConnectorEntity['targetAnchor'],
          label: `${intent.name}: ${portId} -> ${sw.title.match(/\(([^)]+)\)/)?.[1] ?? 'ToR'} (${config.cableMedia})`,
          color: storageOnly ? '#a855f7' : '#3b82f6',
          vlanId: vlan,
        });
      });
    }

    // iDRAC / console to OOB.
    const oobPort = oobPortIds[i];
    pushCable({
      id: `conn-oob-${i + 1}`,
      sourceId: host.id, sourcePortId: oobIsConsole && oobProfile === 'opengear-cm8148-2-dac' ? undefined : 'iDRAC1', sourceAnchor: 'top-4',
      targetId: oob.id, targetPortId: oobPort, targetAnchor: anchor(i % 5) as ConnectorEntity['targetAnchor'],
      label: oobIsConsole && oobProfile === 'opengear-cm8148-2-dac' ? 'Serial console -> Opengear (RS-232)' : 'iDRAC -> OOB (Cat6A)',
      color: '#00e5ff', style: 'dashed',
      cableType: oobIsConsole && oobProfile === 'opengear-cm8148-2-dac' ? 'rs232' : 'cat6a',
      vlanId: v.mgmtVlan,
    });
  }

  // Switchless: full mesh of node-to-node storage cables.
  if (switchless) {
    const storageIntent = plan.intents.find((it) => it.traffic.includes('storage'))!;
    const used = hostByIndex.map(() => 0);
    let linkNo = 0;
    for (let a = 0; a < hostByIndex.length; a++) {
      for (let b = a + 1; b < hostByIndex.length; b++) {
        // A two-node cluster has two links between the same pair; larger meshes have one per pair.
        const links = hostByIndex.length === 2 ? 2 : 1;
        for (let l = 0; l < links; l++) {
          const pa = storageIntent.portIds[used[a]++];
          const pb = storageIntent.portIds[used[b]++];
          if (!pa || !pb) continue;
          const vlan = storageVlans[hostByIndex.length === 2 ? l : linkNo];
          pushCable({
            id: `conn-mesh-${a + 1}-${b + 1}-${l + 1}`,
            sourceId: hostByIndex[a].id, sourcePortId: pa, sourceAnchor: 'right-1',
            targetId: hostByIndex[b].id, targetPortId: pb, targetAnchor: 'left-1',
            label: `Storage ${a + 1}-${b + 1}: ${pa} <-> ${pb} (${config.cableMedia})`,
            color: '#a855f7', vlanId: vlan,
          });
        }
        linkNo++;
      }
    }
  }

  // MLAG peer links and room-to-room storage links.
  zoneIds.forEach((_, z) =>
    pushCable({
      id: `conn-mlag-${z + 1}`, sourceId: tors[z][0].id, targetId: tors[z][1].id, sourceAnchor: 'right-1', targetAnchor: 'left-1',
      label: 'MLAG peer link', color: '#94a3b8', cableType: 'dac', vlanId: undefined,
    }),
  );
  if (rackAware) {
    [0, 1].forEach((k) =>
      pushCable({
        id: `conn-room-${k + 1}`, sourceId: tors[0][k].id, targetId: tors[1][k].id, sourceAnchor: 'right-2', targetAnchor: 'left-2',
        label: `Room-to-room storage ${k + 1} (VLAN ${storageVlans[k]})`, color: '#a855f7', cableType: 'smf', vlanId: storageVlans[k],
      }),
    );
  }

  return doc;
}
