import type { ClusterPattern, StoragePattern } from '@/types/topology';
import type { WizardTopologyConfig } from './buildTopology';

export interface TopologyPreset {
  id: string;
  nodeCount: WizardTopologyConfig['nodeCount'];
  pattern: ClusterPattern;
  storage: StoragePattern;
  title: string;
  desc: string;
}

/** The cluster shapes the guided setup builds. The wizard lists them; the infrastructure.yml reader picks one. */
export const TOPOLOGY_PRESETS: TopologyPreset[] = [
  { id: 'switchless-2', nodeCount: 2, pattern: 'single-rack', storage: 'switchless', title: '2-Node Switchless Cluster', desc: 'Direct node-to-node storage links, two ToR switches for management and compute. Remote office and edge.' },
  { id: 'switchless-3', nodeCount: 3, pattern: 'single-rack', storage: 'switchless', title: '3-Node Switchless Cluster', desc: 'Full storage mesh between three nodes. No Network ATC automatic storage IPs: plan addressing.' },
  { id: 'switched-4', nodeCount: 4, pattern: 'single-rack', storage: 'switched', title: '4-Node Dual-ToR HA Cluster', desc: 'One MLAG ToR pair carries management, compute and storage. The standard single-rack design.' },
  { id: 'switched-8', nodeCount: 8, pattern: 'single-rack', storage: 'switched', title: '8-Node High-Density Cluster', desc: 'Single rack, one MLAG ToR pair for all traffic, dedicated OOB console.' },
  { id: 'rack-aware-4', nodeCount: 4, pattern: 'rack-aware', storage: 'switched', title: 'Rack-Aware Cluster (2 zones, 4 nodes)', desc: 'Two rooms, two ToR per room, dedicated storage links between rooms (VLAN 711 and 712).' },
  { id: 'rack-aware-8', nodeCount: 8, pattern: 'rack-aware', storage: 'switched', title: 'Rack-Aware Cluster (2 zones, 8 nodes)', desc: 'Two rooms with four nodes each, management and compute grouped, dedicated storage intent.' },
];
