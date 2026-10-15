import { isValidAnchorId } from '@/lib/geometry/anchors';
import type { AnchorId, DiagramDocument, FlowSourceRules, NodeEntity, NodeShape } from '@/types/document';
import type { ClusterDesign, NetworkIntent, TrafficType } from '@/types/topology';
import { DOCUMENT_VERSION } from '@/types/document';

const STORAGE_KEY = 'draftsman.diagram.document';
const LEGACY_STORAGE_KEYS = ['isoflows.diagram.document', 'azloflows.diagram.document'];

const RECENT_KEY = 'draftsman.recent';
const LEGACY_RECENT_KEYS = ['isoflows.recent', 'azloflows.recent'];
const MAX_RECENT = 10;

function isRecordOfStringArrays(v: unknown): v is Record<string, string[]> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
  return Object.values(v as Record<string, unknown>).every((arr) => Array.isArray(arr) && arr.every((s) => typeof s === 'string'));
}

function isFlowSourceRules(v: unknown): v is FlowSourceRules {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
  const obj = v as Record<string, unknown>;
  if (obj.mutualExclusionGroups !== undefined && !Array.isArray(obj.mutualExclusionGroups)) return false;
  if (obj.dependencies !== undefined && !Array.isArray(obj.dependencies)) return false;
  return true;
}

export interface RecentEntry {
  id: string;
  name: string;
  savedAt: number;
}

export function saveDocument(document: DiagramDocument): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(document));
  trackRecent(document);
}

function trackRecent(document: DiagramDocument): void {
  const list = loadRecent();
  const entry: RecentEntry = { id: document.id, name: document.name, savedAt: Date.now() };
  const updated = [entry, ...list.filter((e) => e.id !== document.id)].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
}

export function loadRecent(): RecentEntry[] {
  try {
    let raw = localStorage.getItem(RECENT_KEY);
    if (!raw) {
      for (const legacyKey of LEGACY_RECENT_KEYS) {
        raw = localStorage.getItem(legacyKey);
        if (raw) break;
      }
    }
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function loadDocument(): DiagramDocument | null {
  let raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    for (const legacyKey of LEGACY_STORAGE_KEYS) {
      raw = localStorage.getItem(legacyKey);
      if (raw) break;
    }
  }
  if (!raw) {
    return null;
  }

  try {
    return normalizeDocument(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function normalizeDocument(input: unknown): DiagramDocument {
  const value = input as Partial<DiagramDocument> | null;
  const areas = Array.isArray(value?.areas) ? value!.areas : [];
  const nodes = Array.isArray(value?.nodes) ? value!.nodes.map(normalizeNode) : [];
  const connectors = Array.isArray(value?.connectors)
    ? value!.connectors.map((connector) => ({
        ...connector,
        type: 'connector' as const,
        sourceAnchor: normalizeAnchor((connector as { sourceAnchor?: unknown }).sourceAnchor, 'bottom-1'),
        targetAnchor: normalizeAnchor((connector as { targetAnchor?: unknown }).targetAnchor, 'bottom-2'),
        waypoints: Array.isArray((connector as { waypoints?: unknown[] }).waypoints)
          ? ((connector as { waypoints?: Array<{ x?: number; y?: number }> }).waypoints ?? []).map((point) => ({ x: Number(point.x ?? 0), y: Number(point.y ?? 0) }))
          : [],
      }))
    : [];
  const texts = Array.isArray((value as { texts?: unknown })?.texts) ? (value as { texts: unknown[] }).texts : [];
  const pipes = Array.isArray((value as { pipes?: unknown })?.pipes) ? (value as { pipes: unknown[] }).pipes : [];

  return {
    // Version 1 files (before cluster design and intents) load unchanged: every new field is optional.
    version: DOCUMENT_VERSION,
    id: typeof value?.id === 'string' ? value.id : crypto.randomUUID(),
    name: typeof value?.name === 'string' ? value.name : 'Recovered Diagram',
    areas: areas as DiagramDocument['areas'],
    nodes,
    connectors: connectors as DiagramDocument['connectors'],
    texts: texts as DiagramDocument['texts'],
    pipes: pipes as DiagramDocument['pipes'],
    cluster: normalizeCluster(value?.cluster),
    scenarios: Array.isArray(value?.scenarios) ? value!.scenarios : undefined,
    flowSources: Array.isArray(value?.flowSources) ? value!.flowSources : undefined,
    flowTypes: Array.isArray(value?.flowTypes) ? value!.flowTypes : undefined,
    scenarioFlowTypeExclusions: isRecordOfStringArrays(value?.scenarioFlowTypeExclusions) ? value!.scenarioFlowTypeExclusions : undefined,
    sourceFlowTypeExclusions: isRecordOfStringArrays(value?.sourceFlowTypeExclusions) ? value!.sourceFlowTypeExclusions : undefined,
    flowSourceRules: isFlowSourceRules(value?.flowSourceRules) ? value!.flowSourceRules : undefined,
  };
}

function normalizeNode(node: unknown): NodeEntity {
  const value = node as Partial<NodeEntity>;
  return {
    id: typeof value.id === 'string' ? value.id : crypto.randomUUID(),
    type: 'node',
    x: Number(value.x ?? 0),
    y: Number(value.y ?? 0),
    width: Number(value.width ?? 140),
    height: Number(value.height ?? 96),
    title: typeof value.title === 'string' ? value.title : 'Node',
    subtitle: typeof value.subtitle === 'string' ? value.subtitle : '',
    fill: typeof value.fill === 'string' ? value.fill : '#1f3f77',
    glowColor: typeof value.glowColor === 'string' ? value.glowColor : '#4d8dff',
    shape: typeof value.shape === 'string' ? value.shape as NodeShape : undefined,
    parentAreaId: typeof value.parentAreaId === 'string' ? value.parentAreaId : undefined,
    parentLayout:
      value.parentLayout && typeof value.parentLayout.xRatio === 'number' && typeof value.parentLayout.yRatio === 'number'
        ? { xRatio: value.parentLayout.xRatio, yRatio: value.parentLayout.yRatio }
        : undefined,
    textRotated: value.textRotated === true ? true : undefined,
    textPosition: typeof value.textPosition === 'string' ? value.textPosition : undefined,
    fontSize: typeof value.fontSize === 'number' ? value.fontSize : undefined,
    icon: typeof value.icon === 'string' ? value.icon : undefined,
    zIndex: Number(value.zIndex ?? 1),
    tags: Array.isArray(value.tags) ? value.tags.filter((t): t is string => typeof t === 'string') : undefined,
    notes: typeof value.notes === 'string' ? value.notes : undefined,
    hardwareProfileId: typeof value.hardwareProfileId === 'string' ? value.hardwareProfileId : undefined,
    hardwareRole: typeof value.hardwareRole === 'string' ? value.hardwareRole : undefined,
    setTeams: Array.isArray(value.setTeams)
      ? value.setTeams
          .filter((t) => t && typeof t.id === 'string' && Array.isArray(t.portIds))
          .map((t) => ({ id: t.id, name: typeof t.name === 'string' ? t.name : t.id, portIds: t.portIds.filter((p): p is string => typeof p === 'string') }))
      : undefined,
    intents: normalizeIntents(value.intents),
    zoneId: typeof value.zoneId === 'string' && value.zoneId ? value.zoneId : undefined,
    trunkVlans: Array.isArray(value.trunkVlans) ? value.trunkVlans.filter((v): v is number => typeof v === 'number' && Number.isFinite(v)) : undefined,
  };
}

const TRAFFIC_TYPES: TrafficType[] = ['management', 'compute', 'storage'];

function normalizeIntents(input: unknown): NetworkIntent[] | undefined {
  if (!Array.isArray(input)) return undefined;
  const intents = input
    .filter((i): i is Record<string, unknown> => !!i && typeof i === 'object')
    .map((i, index) => ({
      id: typeof i.id === 'string' ? i.id : `intent-${index + 1}`,
      name: typeof i.name === 'string' ? i.name : `Intent${index + 1}`,
      traffic: Array.isArray(i.traffic) ? i.traffic.filter((t): t is TrafficType => TRAFFIC_TYPES.includes(t as TrafficType)) : [],
      portIds: Array.isArray(i.portIds) ? i.portIds.filter((p): p is string => typeof p === 'string') : [],
    }));
  return intents.length > 0 ? intents : undefined;
}

function normalizeCluster(input: unknown): ClusterDesign | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const c = input as Record<string, unknown>;
  const pattern = c.pattern === 'rack-aware' ? 'rack-aware' : c.pattern === 'single-rack' ? 'single-rack' : undefined;
  const storage = c.storage === 'switchless' ? 'switchless' : c.storage === 'switched' ? 'switched' : undefined;
  if (!pattern || !storage) return undefined;
  const intentModels = ['group-all', 'mgmt-compute-storage', 'disaggregated', 'custom'];
  return {
    pattern,
    storage,
    intentModel: intentModels.includes(c.intentModel as string) ? (c.intentModel as ClusterDesign['intentModel']) : undefined,
    rdma: c.rdma === 'iwarp' ? 'iwarp' : c.rdma === 'roce' ? 'roce' : undefined,
    torPerZone: c.torPerZone === 1 ? 1 : c.torPerZone === 2 ? 2 : undefined,
  };
}

function normalizeAnchor(value: unknown, fallback: AnchorId): AnchorId {
  if (typeof value === 'string' && isValidAnchorId(value)) {
    return value as AnchorId;
  }
  if (typeof value === 'number') {
    const numericMap: Record<number, AnchorId> = {
      0: 'bottom-0',
      1: 'bottom-1',
      2: 'bottom-2',
      3: 'bottom-3',
      4: 'bottom-4',
    };
    return numericMap[value] ?? fallback;
  }
  if (typeof value === 'string') {
    const legacyMap: Record<string, AnchorId> = {
      'top-0': 'top-1',
      'top-1': 'top-3',
      'right-0': 'right-0',
      'right-1': 'right-1',
      'right-2': 'right-2',
      'right-3': 'right-3',
      'right-4': 'right-4',
      'left-0': 'left-0',
      'left-1': 'left-1',
      'left-2': 'left-2',
      'left-3': 'left-3',
      'left-4': 'left-4',
    };
    return legacyMap[value] ?? fallback;
  }
  return fallback;
}