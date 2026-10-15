import type { ConnectorEntity, DiagramDocument, NodeEntity } from '@/types/document';
import { DOCUMENT_VERSION } from '@/types/document';
import type { NetworkIntent } from '@/types/topology';
import type { ValidationIssue } from '@/types/validation';

/** Small builders for compliance and serialization tests. Example values only. */

export function emptyDoc(overrides: Partial<DiagramDocument> = {}): DiagramDocument {
  return { version: DOCUMENT_VERSION, id: 'doc-1', name: 'Test Diagram', areas: [], nodes: [], connectors: [], texts: [], pipes: [], ...overrides };
}

export function host(id: string, overrides: Partial<NodeEntity> = {}): NodeEntity {
  return {
    id, type: 'node', shape: 'serverNode', x: 0, y: 0, width: 250, height: 110, title: id, subtitle: '', fill: '#1e293b', glowColor: '#00e5ff',
    zIndex: 1, hardwareProfileId: 'dell-ax-760', ...overrides,
  };
}

export function tor(id: string, overrides: Partial<NodeEntity> = {}): NodeEntity {
  return {
    id, type: 'node', shape: 'vendorSwitch', x: 0, y: 0, width: 300, height: 95, title: id, subtitle: '', fill: '#1e293b', glowColor: '#3b82f6',
    zIndex: 1, hardwareProfileId: 'dell-s5248f-on', ...overrides,
  };
}

export function oob(id: string, overrides: Partial<NodeEntity> = {}): NodeEntity {
  return tor(id, { shape: 'oobSwitch', hardwareProfileId: 'dell-n3248te-on', ...overrides });
}

export function cable(id: string, from: string, to: string, overrides: Partial<ConnectorEntity> = {}): ConnectorEntity {
  return {
    id, type: 'connector', sourceId: from, targetId: to, sourceAnchor: 'top-1', targetAnchor: 'bottom-1', color: '#3b82f6', label: id,
    style: 'solid', waypoints: [], zIndex: 1, cableType: 'dac', ...overrides,
  };
}

export const MGMT_COMPUTE: NetworkIntent = { id: 'i-mc', name: 'Management_Compute', traffic: ['management', 'compute'], portIds: ['OCP-P1', 'OCP-P2'] };
export const STORAGE: NetworkIntent = { id: 'i-s', name: 'Storage', traffic: ['storage'], portIds: ['Slot1-P1', 'Slot1-P2'] };
export const GROUP_ALL: NetworkIntent = { id: 'i-all', name: 'All', traffic: ['management', 'compute', 'storage'], portIds: ['OCP-P1', 'OCP-P2'] };

/** Dual-homed host: OCP-P1 to torA, OCP-P2 to torB, iDRAC to oob1. */
export function wiredHost(id: string, overrides: Partial<NodeEntity> = {}): { nodes: NodeEntity[]; cables: ConnectorEntity[] } {
  return {
    nodes: [host(id, overrides)],
    cables: [
      cable(`${id}-a`, id, 'torA', { sourcePortId: 'OCP-P1', vlanId: 7 }),
      cable(`${id}-b`, id, 'torB', { sourcePortId: 'OCP-P2', vlanId: 7 }),
      cable(`${id}-o`, id, 'oob1', { sourcePortId: 'iDRAC1', cableType: 'cat6a' }),
    ],
  };
}

export function switchedDoc(hostCount = 2, hostOverrides: Partial<NodeEntity> = {}): DiagramDocument {
  const nodes: NodeEntity[] = [tor('torA'), tor('torB'), oob('oob1')];
  const connectors: ConnectorEntity[] = [];
  for (let i = 1; i <= hostCount; i++) {
    const w = wiredHost(`h${i}`, hostOverrides);
    nodes.push(...w.nodes);
    connectors.push(...w.cables);
  }
  return emptyDoc({ nodes, connectors });
}

export function ids(issues: ValidationIssue[], ruleId?: string): string[] {
  return issues.filter((i) => !ruleId || i.ruleId === ruleId).map((i) => i.id);
}

export function ofRule(issues: ValidationIssue[], ruleId: string): ValidationIssue[] {
  return issues.filter((i) => i.ruleId === ruleId);
}
