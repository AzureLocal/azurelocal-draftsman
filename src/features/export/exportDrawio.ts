import type { ConnectorEntity, DiagramDocument, NodeEntity } from '@/types/document';
import { getCableSpec } from '@/types/cabling';
import { getHardwareProfile } from '@/types/hardwareProfiles';
import { isHostNode, isOobDevice, linksOfHost, trafficOfLink } from '@/lib/topology/analysis';
import { downloadText, exportFileStem } from './download';

/**
 * Uncompressed draw.io (.drawio) export of the cabling topology: switches, hosts with their intents, OOB
 * devices, logical networks and one edge per cable with port and VLAN labels.
 *
 * Shared conventions with Trailwright's topologyDrawio.ts (read only, no shared code), see docs/drawio-export.md:
 * same file skeleton (mxfile > diagram "topology" > mxGraphModel), same attribute escaping, same fills and
 * colours (management #1a73e8, storage #e8710a), shape ids `sw-N` and `node-N`, node-to-node storage edges
 * `sl-A-B-L` drawn dashed. Differences: Draftsman keeps the author's layout, adds OOB devices (`oob-N`) and
 * logical network areas (`net-N`), and connects edges to shapes by source/target id.
 */

/** Attribute-safe text: markup characters and quotes are escaped so a label can never become markup. */
export function attr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\r?\n/g, '&#xa;');
}

export const DRAWIO_COLORS = { management: '#1a73e8', storage: '#e8710a', oob: '#5f6368' } as const;

const STYLE = {
  switch: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#e8f0fe;strokeColor=#5f6368;verticalAlign=top;',
  node: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#f8f9fa;strokeColor=#5f6368;verticalAlign=top;align=left;spacingLeft=6;',
  oob: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#f1f3f4;strokeColor=#5f6368;verticalAlign=top;',
  network: 'rounded=0;whiteSpace=wrap;html=1;fillColor=#e6f4ea;strokeColor=#188038;dashed=1;opacity=40;verticalAlign=top;align=left;spacingLeft=6;',
} as const;

interface Cell {
  id: string;
  xml: string;
}

function nodeLines(n: NodeEntity): string[] {
  const lines: string[] = [];
  if (n.subtitle) lines.push(n.subtitle);
  const profile = getHardwareProfile(n.hardwareProfileId);
  if (profile) lines.push(profile.model);
  if (n.zoneId) lines.push(`zone: ${n.zoneId}`);
  for (const intent of n.intents ?? []) lines.push(`intent ${intent.name} [${intent.traffic.join('+')}]: ${intent.portIds.join(', ')}`);
  if (n.trunkVlans && n.trunkVlans.length > 0) lines.push(`trunk VLANs: ${n.trunkVlans.join(', ')}`);
  return lines;
}

/** Colour by what the cable carries: storage-only is orange, OOB grey, everything else management blue. */
function edgeColor(doc: DiagramDocument, c: ConnectorEntity, nodeById: Map<string, NodeEntity>): { color: string; dashed: boolean } {
  const s = nodeById.get(c.sourceId);
  const t = nodeById.get(c.targetId);
  if (isOobDevice(s) || isOobDevice(t) || c.cableType === 'cat6a' || c.cableType === 'rs232') return { color: DRAWIO_COLORS.oob, dashed: true };
  const host = s && isHostNode(s) ? s : t && isHostNode(t) ? t : undefined;
  if (host) {
    const link = linksOfHost(doc, host).find((l) => l.connector.id === c.id);
    const traffic = link ? trafficOfLink(link) : 'unknown';
    if (s && t && isHostNode(s) && isHostNode(t)) return { color: DRAWIO_COLORS.storage, dashed: true };
    if (Array.isArray(traffic) && traffic.length === 1 && traffic[0] === 'storage') return { color: DRAWIO_COLORS.storage, dashed: false };
  }
  return { color: DRAWIO_COLORS.management, dashed: false };
}

export function buildDrawio(doc: DiagramDocument): string {
  const xs = [...doc.nodes.map((n) => n.x), ...doc.areas.map((a) => a.x)];
  const ys = [...doc.nodes.map((n) => n.y), ...doc.areas.map((a) => a.y)];
  const minX = xs.length ? Math.min(...xs) : 0;
  const minY = ys.length ? Math.min(...ys) : 0;
  const px = (x: number) => Math.round(x - minX + 40);
  const py = (y: number) => Math.round(y - minY + 40);

  const cells: Cell[] = [];
  const idOf = new Map<string, string>();
  let sw = 0;
  let node = 0;
  let oob = 0;

  // Logical networks first so they sit behind the devices.
  doc.areas.forEach((a, i) => {
    const label = [a.label, a.vlanId ? `VLAN ${a.vlanId}` : '', a.cidr ?? '', a.mtu ? `MTU ${a.mtu}` : ''].filter(Boolean).join('\n');
    cells.push({
      id: `net-${i}`,
      xml: `        <mxCell id="net-${i}" value="${attr(label)}" style="${STYLE.network}" vertex="1" parent="1">\n          <mxGeometry x="${px(a.x)}" y="${py(a.y)}" width="${Math.round(a.width)}" height="${Math.round(a.height)}" as="geometry" />\n        </mxCell>`,
    });
  });

  for (const n of doc.nodes) {
    const kind: keyof typeof STYLE = isHostNode(n) ? 'node' : isOobDevice(n) ? 'oob' : 'switch';
    const id = kind === 'node' ? `node-${node++}` : kind === 'oob' ? `oob-${oob++}` : `sw-${sw++}`;
    idOf.set(n.id, id);
    const label = [n.title, ...nodeLines(n)].join('\n');
    cells.push({
      id,
      xml: `        <mxCell id="${id}" value="${attr(label)}" style="${STYLE[kind]}" vertex="1" parent="1">\n          <mxGeometry x="${px(n.x)}" y="${py(n.y)}" width="${Math.round(n.width)}" height="${Math.round(Math.max(n.height, 24 + 14 * (nodeLines(n).length + 1)))}" as="geometry" />\n        </mxCell>`,
    });
  }

  const nodeById = new Map(doc.nodes.map((n) => [n.id, n]));
  const hostIndex = new Map(doc.nodes.filter(isHostNode).map((n, i) => [n.id, i]));
  const meshCount = new Map<string, number>();
  doc.connectors.forEach((c, i) => {
    const source = idOf.get(c.sourceId);
    const target = idOf.get(c.targetId);
    if (!source || !target) return; // dangling cable: nothing to attach to
    const s = nodeById.get(c.sourceId)!;
    const t = nodeById.get(c.targetId)!;
    let id = `e-${i}`;
    if (isHostNode(s) && isHostNode(t)) {
      const a = Math.min(hostIndex.get(s.id)!, hostIndex.get(t.id)!);
      const b = Math.max(hostIndex.get(s.id)!, hostIndex.get(t.id)!);
      const key = `${a}-${b}`;
      const l = meshCount.get(key) ?? 0;
      meshCount.set(key, l + 1);
      id = `sl-${a}-${b}-${l}`;
    }
    const { color, dashed } = edgeColor(doc, c, nodeById);
    const ports = [c.sourcePortId, c.targetPortId].filter(Boolean).join(' - ');
    const label = [ports, c.vlanId ? `VLAN ${c.vlanId}` : '', getCableSpec(c.cableType).id.toUpperCase()].filter(Boolean).join('  ');
    cells.push({
      id,
      xml: `        <mxCell id="${id}" value="${attr(label)}" style="endArrow=none;html=1;strokeColor=${color};fontColor=${color};fontSize=10;${dashed ? 'dashed=1;' : ''}" edge="1" parent="1" source="${source}" target="${target}">\n          <mxGeometry relative="1" as="geometry" />\n        </mxCell>`,
    });
  });

  const width = Math.max(850, ...doc.nodes.map((n) => px(n.x) + n.width + 80), ...doc.areas.map((a) => px(a.x) + a.width + 80));
  const height = Math.max(1100, ...doc.nodes.map((n) => py(n.y) + n.height + 80), ...doc.areas.map((a) => py(a.y) + a.height + 80));

  return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="draftsman" version="1.0">
  <diagram name="topology" id="${attr(exportFileStem(doc.name))}">
    <mxGraphModel dx="800" dy="600" grid="1" gridSize="10" page="1" pageWidth="${Math.round(width)}" pageHeight="${Math.round(height)}">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <mxCell id="title" value="${attr(`Cluster: ${doc.name}`)}" style="text;html=1;align=left;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="20" y="0" width="400" height="20" as="geometry" />
        </mxCell>
${cells.map((c) => c.xml).join('\n')}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
`;
}

export function exportDrawio(doc: DiagramDocument): void {
  downloadText(`${exportFileStem(doc.name)}.drawio`, buildDrawio(doc), 'application/vnd.jgraph.mxfile');
}
