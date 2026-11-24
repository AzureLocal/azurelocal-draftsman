import { parse } from 'yaml';
import type { ClusterPattern, IntentModel, StoragePattern } from '@/types/topology';
import { SERVER_PROFILE_IDS, validateWizardChoice } from './buildTopology';
import { TOPOLOGY_PRESETS } from './presets';

/**
 * Reads the network design of an Azure Local infrastructure.yml (azurelocal-toolkit, schema 5) into the answers of the
 * guided setup: the topology (nodes, rack-aware, switchless), the Network ATC intents (networking.intents), the VLANs
 * (networking.vlans, networking.management, networking.storage.networks) and the models it names. Pure: no store, no DOM.
 * The file is the one every Azure Local tool reads; Draftsman keeps no second copy of the design.
 *
 * Keys read: _metadata.schema_version, scenario.topology, scenario.storage_connectivity, nodes[], networking.intents[]
 * (name, traffic, overrides.adapter.jumbo_packet), networking.vlans[] (name, id, purpose), networking.management.vlan_id,
 * networking.storage.networks[].vlan_id, networking.logical_networks[] (purpose, vlan_id), hardware.model,
 * network_devices[] (type, vendor, model).
 */

export class InfrastructureImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InfrastructureImportError';
  }
}

export interface InfrastructureIntentSummary {
  name: string;
  traffic: string[];
}

export interface InfrastructureDesign {
  schemaVersion: string;
  nodeCount: number;
  pattern: ClusterPattern;
  storage: StoragePattern;
  /** The topology preset that matches the node count, pattern and storage; undefined when the wizard has none. */
  presetId?: string;
  intentModel?: IntentModel;
  intents: InfrastructureIntentSummary[];
  mgmtVlan?: number;
  computeVlan?: number;
  /** In adapter order: storage 1, storage 2, storage 3. */
  storageVlans: number[];
  mtu?: 1500 | 9000;
  /** A wizard server model (AX-760 ...), when hardware.model names one. */
  serverModel?: string;
  /** A wizard switch name, when a network_devices[] switch names a model Draftsman has a profile for. */
  switchModel?: string;
  /** What could not be read or mapped, one sentence each. The wizard shows them; nothing is guessed. */
  notes: string[];
}

type Dict = Record<string, unknown>;

const isDict = (v: unknown): v is Dict => typeof v === 'object' && v !== null && !Array.isArray(v);
const asList = (v: unknown): Dict[] => (Array.isArray(v) ? v.filter(isDict) : []);
const asVlanId = (v: unknown): number | undefined => (typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 4094 ? v : undefined);
const text = (v: unknown): string => (typeof v === 'string' ? v : '');

const SWITCH_CHOICES: Array<{ match: RegExp; name: string }> = [
  { match: /7050\s*SX3/i, name: 'Arista 7050SX3' },
  { match: /93180/i, name: 'Cisco Nexus 93180YC' },
  { match: /S5248F/i, name: 'Dell PowerSwitch S5248F-ON' },
  { match: /S5224F/i, name: 'Dell PowerSwitch S5224F-ON' },
  { match: /SN2100/i, name: 'Nvidia Spectrum SN2100' },
];

function intentModelOf(intents: InfrastructureIntentSummary[]): IntentModel {
  const carries = (i: InfrastructureIntentSummary, t: string) => i.traffic.includes(t);
  if (intents.length === 1 && ['management', 'compute', 'storage'].every((t) => carries(intents[0], t))) return 'group-all';
  if (intents.length === 3 && intents.every((i) => i.traffic.length === 1) && new Set(intents.map((i) => i.traffic[0])).size === 3) return 'disaggregated';
  if (intents.length === 2) {
    const storage = intents.find((i) => i.traffic.length === 1 && carries(i, 'storage'));
    const other = intents.find((i) => i !== storage);
    if (storage && other && carries(other, 'management') && carries(other, 'compute') && !carries(other, 'storage')) return 'mgmt-compute-storage';
  }
  return 'custom';
}

export function readInfrastructureDesign(source: string): InfrastructureDesign {
  let doc: unknown;
  try {
    doc = parse(source);
  } catch (error) {
    throw new InfrastructureImportError(`The file is not valid YAML: ${error instanceof Error ? error.message.split('\n')[0] : String(error)}`);
  }
  if (!isDict(doc)) throw new InfrastructureImportError('The file is not an infrastructure.yml: the top level is not a mapping.');

  const meta = isDict(doc._metadata) ? doc._metadata : {};
  const schemaVersion = typeof meta.schema_version === 'string' ? meta.schema_version : String(meta.schema_version ?? '');
  if (!/^5(\.|$)/.test(schemaVersion)) {
    throw new InfrastructureImportError(`The file is not an infrastructure.yml of schema 5 (_metadata.schema_version is '${schemaVersion}').`);
  }

  const notes: string[] = [];
  const networking = isDict(doc.networking) ? doc.networking : {};
  const scenario = isDict(doc.scenario) ? doc.scenario : {};

  const intentsRaw = asList(networking.intents);
  if (intentsRaw.length === 0) throw new InfrastructureImportError('The file has no networking.intents: Draftsman needs the Network ATC intents to draw the hosts.');
  const intents: InfrastructureIntentSummary[] = intentsRaw.map((i) => ({
    name: text(i.name),
    traffic: Array.isArray(i.traffic) ? i.traffic.filter((t): t is string => typeof t === 'string') : [],
  }));
  const intentModel = intentModelOf(intents);
  if (intentModel === 'custom') notes.push(`networking.intents (${intents.map((i) => `${i.name}: ${i.traffic.join('+')}`).join('; ')}) match none of the wizard's three layouts; the wizard keeps its default layout and you can edit the intents on the canvas.`);

  const nodeCount = asList(doc.nodes).length;
  const pattern: ClusterPattern = scenario.topology === 'rack_aware' ? 'rack-aware' : 'single-rack';
  const storage: StoragePattern = scenario.storage_connectivity === 'switchless' ? 'switchless' : 'switched';
  const preset = TOPOLOGY_PRESETS.find((p) => p.nodeCount === nodeCount && p.pattern === pattern && p.storage === storage);
  if (!preset) {
    const why = validateWizardChoice({ nodeCount: nodeCount as 2 | 3 | 4 | 6 | 8, pattern, storage });
    notes.push(`The wizard has no preset for ${nodeCount} node${nodeCount === 1 ? '' : 's'}, ${pattern}, ${storage} storage${why ? ` (${why})` : ''}. Pick the closest topology in step 1.`);
  }

  // VLANs. The file names a VLAN by purpose; the wizard wants one number each for management, compute and storage 1 to 3.
  const vlans = asList(networking.vlans).map((v) => ({ name: text(v.name), id: asVlanId(v.id), purpose: text(v.purpose).toLowerCase() }));
  const byPurpose = (purpose: string, nameHint: RegExp) =>
    vlans.find((v) => v.id !== undefined && v.purpose === purpose)?.id ?? vlans.find((v) => v.id !== undefined && v.purpose === '' && nameHint.test(v.name))?.id;
  const management = isDict(networking.management) ? networking.management : {};
  const mgmtVlan = asVlanId(management.vlan_id) ?? byPurpose('management', /mgmt|management/i);
  const logicalCompute = asList(networking.logical_networks).find((n) => text(n.purpose).toLowerCase() === 'compute');
  const computeVlan = byPurpose('compute', /compute|workload/i) ?? asVlanId(logicalCompute?.vlan_id);
  const storageNetworks = isDict(networking.storage) ? asList(networking.storage.networks) : [];
  let storageVlans = storageNetworks.map((n) => asVlanId(n.vlan_id)).filter((v): v is number => v !== undefined);
  if (storageVlans.length === 0) {
    storageVlans = vlans.filter((v) => v.id !== undefined && (v.purpose === 'storage' || (v.purpose === '' && /^storage/i.test(v.name)))).map((v) => v.id as number).sort((a, b) => a - b);
  }
  if (mgmtVlan === undefined) notes.push('No management VLAN in the file (networking.management.vlan_id or a networking.vlans entry with purpose management); the wizard keeps its value.');
  if (computeVlan === undefined) notes.push('No compute VLAN in the file (a networking.vlans entry with purpose compute, or a logical network with purpose compute); the wizard keeps its value.');
  if (storageVlans.length < 2) notes.push('Fewer than two storage VLANs in the file (networking.storage.networks[].vlan_id or networking.vlans with purpose storage); the wizard keeps its storage VLANs.');

  // The storage MTU: the jumbo frame size an intent that carries storage sets.
  let mtu: 1500 | 9000 | undefined;
  for (const raw of intentsRaw) {
    const traffic = Array.isArray(raw.traffic) ? raw.traffic : [];
    const overrides = isDict(raw.overrides) ? raw.overrides : {};
    const adapter = isDict(overrides.adapter) ? overrides.adapter : {};
    if (traffic.includes('storage') && typeof adapter.jumbo_packet === 'number') mtu = adapter.jumbo_packet >= 4088 ? 9000 : 1500;
  }

  const hardware = isDict(doc.hardware) ? doc.hardware : {};
  const model = text(hardware.model);
  const serverModel = Object.keys(SERVER_PROFILE_IDS).find((k) => model.includes(k));
  if (model && !serverModel) notes.push(`hardware.model '${model}' has no Draftsman hardware profile (AX-760, AX-660, AX-770, AX-670); the wizard keeps its server model.`);

  const switches = asList(doc.network_devices).filter((d) => text(d.type).toLowerCase() === 'switch');
  const switchModels = switches.map((d) => `${text(d.vendor)} ${text(d.model)}`.trim());
  const switchChoice = SWITCH_CHOICES.find((c) => switchModels.some((m) => c.match.test(m)));
  if (switches.length > 0 && !switchChoice) notes.push(`network_devices switch '${switchModels[0]}' has no Draftsman hardware profile; the wizard keeps its ToR switch.`);

  return {
    schemaVersion,
    nodeCount,
    pattern,
    storage,
    presetId: preset?.id,
    intentModel: intentModel === 'custom' ? undefined : intentModel,
    intents,
    mgmtVlan,
    computeVlan,
    storageVlans,
    mtu,
    serverModel,
    switchModel: switchChoice?.name,
    notes,
  };
}
