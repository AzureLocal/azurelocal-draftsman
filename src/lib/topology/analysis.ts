import type { AreaEntity, ConnectorEntity, DiagramDocument, NodeEntity } from '@/types/document';
import { getHardwareProfile } from '@/types/hardwareProfiles';
import type { AreaPurpose, ClusterDesign, NetworkIntent, TrafficType } from '@/types/topology';
import { isAtcDefaultStorageVlan } from '@/types/topology';

/** Derived view of a diagram used by the compliance rules. Pure: no store, no DOM. */

export type LinkKind = 'tor' | 'host' | 'oob' | 'other';

export interface HostLink {
  connector: ConnectorEntity;
  host: NodeEntity;
  /** Port id on the host end (if set). */
  hostPortId?: string;
  other: NodeEntity | undefined;
  otherPortId?: string;
  kind: LinkKind;
}

export function isHostNode(n: NodeEntity): boolean {
  return n.shape === 'serverNode' || n.shape === 'serverRack' || getHardwareProfile(n.hardwareProfileId)?.category === 'serverNode';
}

export function isTorSwitch(n: NodeEntity | undefined): boolean {
  if (!n) return false;
  return n.shape === 'vendorSwitch' || getHardwareProfile(n.hardwareProfileId)?.category === 'torSwitch';
}

export function isOobDevice(n: NodeEntity | undefined): boolean {
  if (!n) return false;
  if (n.shape === 'oobSwitch' || n.shape === 'opengearConsole') return true;
  const category = getHardwareProfile(n.hardwareProfileId)?.category;
  return category === 'oobSwitch' || category === 'opengearConsole';
}

export function linkKind(other: NodeEntity | undefined): LinkKind {
  if (!other) return 'other';
  if (isHostNode(other)) return 'host';
  if (isOobDevice(other)) return 'oob';
  if (isTorSwitch(other)) return 'tor';
  return 'other';
}

export function hostsOf(doc: DiagramDocument): NodeEntity[] {
  return doc.nodes.filter(isHostNode);
}

export function linksOfHost(doc: DiagramDocument, host: NodeEntity): HostLink[] {
  const byId = new Map(doc.nodes.map((n) => [n.id, n]));
  const links: HostLink[] = [];
  for (const c of doc.connectors) {
    if (c.sourceId !== host.id && c.targetId !== host.id) continue;
    const hostIsSource = c.sourceId === host.id;
    const other = byId.get(hostIsSource ? c.targetId : c.sourceId);
    links.push({
      connector: c,
      host,
      hostPortId: hostIsSource ? c.sourcePortId : c.targetPortId,
      other,
      otherPortId: hostIsSource ? c.targetPortId : c.sourcePortId,
      kind: linkKind(other),
    });
  }
  return links;
}

/** The intent a host port belongs to (matching is case-insensitive). */
export function intentOfPort(host: NodeEntity, portId: string | undefined): NetworkIntent | undefined {
  if (!portId || !host.intents) return undefined;
  const wanted = portId.toLowerCase();
  return host.intents.find((i) => i.portIds.some((p) => p.toLowerCase() === wanted));
}

/**
 * Traffic carried by a host link. Intent membership wins; otherwise a host-to-host link is storage
 * (switchless); a link tagged with a Network ATC default storage VLAN on a host port with no intent is
 * treated as unknown (the VLAN may be a custom choice, see RULE-VLAN-ATC-COLLISION).
 */
export function trafficOfLink(link: HostLink): TrafficType[] | 'unknown' | 'oob' {
  if (link.kind === 'oob') return 'oob';
  if (link.kind === 'host') return ['storage'];
  const intent = intentOfPort(link.host, link.hostPortId);
  if (intent) return intent.traffic;
  return 'unknown';
}

export function carriesStorage(link: HostLink): boolean {
  const t = trafficOfLink(link);
  return Array.isArray(t) && t.includes('storage');
}

export function carriesNonStorage(link: HostLink): boolean {
  const t = trafficOfLink(link);
  return Array.isArray(t) && t.some((x) => x !== 'storage');
}

/** Cluster design, explicit or inferred from the cabling and zones for diagrams that predate it. */
export function resolveCluster(doc: DiagramDocument): ClusterDesign {
  if (doc.cluster) return doc.cluster;
  const hosts = hostsOf(doc);
  const hostIds = new Set(hosts.map((h) => h.id));
  const hostToHost = doc.connectors.some((c) => hostIds.has(c.sourceId) && hostIds.has(c.targetId));
  const zones = new Set(hosts.map((h) => h.zoneId).filter(Boolean));
  return {
    pattern: zones.size >= 2 ? 'rack-aware' : 'single-rack',
    storage: hostToHost ? 'switchless' : 'switched',
  };
}

/** Purpose of a logical network area: explicit, else inferred from its label. */
export function areaPurpose(area: AreaEntity): AreaPurpose | undefined {
  if (area.purpose) return area.purpose;
  const label = area.label.toLowerCase();
  if (/storage|smb|rdma|s2d/.test(label)) return 'storage';
  if (/manag|mgmt/.test(label)) return 'management';
  if (/compute|tenant|\bvm\b|virtual machine/.test(label)) return 'compute';
  return undefined;
}

/** Storage area: explicit/inferred purpose, or an unlabelled area on a Network ATC default storage VLAN. */
export function isStorageArea(area: AreaEntity): boolean {
  const purpose = areaPurpose(area);
  if (purpose === 'storage') return true;
  if (purpose === undefined || purpose === 'other') return isAtcDefaultStorageVlan(area.vlanId);
  return false;
}

export function torSwitchesOf(doc: DiagramDocument): NodeEntity[] {
  return doc.nodes.filter(isTorSwitch);
}
