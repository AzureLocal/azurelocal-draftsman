import type { DiagramDocument } from '@/types/document';
import { getHardwareProfile } from '@/types/hardwareProfiles';
import { downloadText, exportFileStem } from './download';

/**
 * Builds the switch port provisioning schedule: one block per switch or console server listing each port, the
 * device on the other end and the VLAN tag. Pure; pass `generatedAt` for a reproducible header.
 */
export function buildSwitchPortMap(doc: DiagramDocument, generatedAt: Date = new Date()): string {
  const switches = doc.nodes.filter((n) => n.shape === 'vendorSwitch' || n.shape === 'oobSwitch' || n.shape === 'opengearConsole');
  const lines: string[] = [];
  const rule = '='.repeat(80);
  const thin = '-'.repeat(80);
  lines.push(rule, 'SWITCH PORT PROVISIONING & CABLING SCHEDULE', `Diagram: ${doc.name}`, `Generated: ${generatedAt.toISOString()}`, `${rule}\n`);

  if (switches.length === 0) {
    lines.push('No network switches or console managers found in diagram.\n');
  } else {
    for (const sw of switches) {
      const profile = getHardwareProfile(sw.hardwareProfileId);
      lines.push(thin, `SWITCH: ${sw.title}`, `Model : ${profile?.model || 'Generic Switch'} (${profile?.formFactorU || 1}U)`, `Role  : ${sw.subtitle || profile?.defaultRole || 'Switch Node'}`);
      if (sw.zoneId) lines.push(`Zone  : ${sw.zoneId}`);
      if (sw.trunkVlans && sw.trunkVlans.length > 0) lines.push(`Trunk VLANs: ${sw.trunkVlans.join(', ')}`);
      lines.push(thin);

      const connectors = doc.connectors.filter((c) => c.sourceId === sw.id || c.targetId === sw.id);
      if (connectors.length === 0) {
        lines.push('  [No active port connections]\n');
        continue;
      }
      for (const c of connectors) {
        const isSource = c.sourceId === sw.id;
        const localPort = (isSource ? c.sourcePortId : c.targetPortId) || 'Front Port';
        const remote = doc.nodes.find((n) => n.id === (isSource ? c.targetId : c.sourceId));
        const remotePort = (isSource ? c.targetPortId : c.sourcePortId) || 'Front Port';
        const vlan = c.vlanId ? `VLAN ${c.vlanId}` : 'Trunk/Native';
        lines.push(`  * Port [ ${localPort.padEnd(10)} ] -> Connected to ${remote?.title || 'Unknown Device'} [ ${remotePort} ] (${vlan})`);
      }
      lines.push('');
    }
  }
  return lines.join('\n');
}

export function exportSwitchPortMap(doc: DiagramDocument): void {
  downloadText(`${exportFileStem(doc.name)}_switch_port_map.txt`, buildSwitchPortMap(doc), 'text/plain;charset=utf-8;');
}
