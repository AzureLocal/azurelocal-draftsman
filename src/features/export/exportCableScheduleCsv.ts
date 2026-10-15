import type { DiagramDocument } from '@/types/document';
import { getCableSpec } from '@/types/cabling';
import { intentOfPort } from '@/lib/topology/analysis';
import { downloadText, exportFileStem } from './download';

export const CABLE_SCHEDULE_HEADERS = [
  'Cable_Tag',
  'Source_Device',
  'Source_Port',
  'Target_Device',
  'Target_Port',
  'Cable_Medium',
  'Speed_Gbps',
  'VLAN_ID',
  'Intent',
  'Notes',
] as const;

/** RFC 4180 quoting, plus a leading apostrophe on cells a spreadsheet would run as a formula. */
export function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** Builds the cable schedule: one row per cable, in diagram order. Pure, no DOM. */
export function buildCableScheduleCsv(doc: DiagramDocument): string {
  const byId = new Map(doc.nodes.map((n) => [n.id, n]));
  const rows = doc.connectors.map((c, index) => {
    const source = byId.get(c.sourceId);
    const target = byId.get(c.targetId);
    const spec = getCableSpec(c.cableType);
    const intent =
      (source && intentOfPort(source, c.sourcePortId)?.name) || (target && intentOfPort(target, c.targetPortId)?.name) || '';
    return [
      c.cableTagLabel || `CBL-${String(index + 1).padStart(3, '0')}`,
      source ? source.title : 'Unknown Device',
      c.sourcePortId || 'Front Face',
      target ? target.title : 'Unknown Device',
      c.targetPortId || 'Front Face',
      spec.name,
      spec.speedLabel,
      c.vlanId ? `VLAN ${c.vlanId}` : 'Untagged',
      intent,
      c.notes || '',
    ]
      .map(csvCell)
      .join(',');
  });
  return [CABLE_SCHEDULE_HEADERS.join(','), ...rows].join('\n');
}

export function exportCableScheduleCsv(doc: DiagramDocument): void {
  downloadText(`${exportFileStem(doc.name)}_cable_schedule.csv`, buildCableScheduleCsv(doc), 'text/csv;charset=utf-8;');
}
