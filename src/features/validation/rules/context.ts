import type { DiagramDocument, NodeEntity } from '@/types/document';
import type { ValidationIssue } from '@/types/validation';
import type { ClusterDesign } from '@/types/topology';
import { hostsOf, resolveCluster } from '@/lib/topology/analysis';

export interface AuditContext {
  doc: DiagramDocument;
  cluster: ClusterDesign;
  hosts: NodeEntity[];
  nodeById: Map<string, NodeEntity>;
}

export type Rule = (ctx: AuditContext) => ValidationIssue[];

export function createContext(doc: DiagramDocument): AuditContext {
  return {
    doc,
    cluster: resolveCluster(doc),
    hosts: hostsOf(doc),
    nodeById: new Map(doc.nodes.map((n) => [n.id, n])),
  };
}
