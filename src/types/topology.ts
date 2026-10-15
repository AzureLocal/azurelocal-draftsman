/**
 * Cluster topology and Network ATC intent model.
 *
 * Sources (Microsoft Learn, Azure Local):
 *  - https://learn.microsoft.com/azure/azure-local/plan/network-patterns-overview
 *  - https://learn.microsoft.com/azure/azure-local/concepts/host-network-requirements
 *  - https://learn.microsoft.com/azure/azure-local/deploy/network-atc
 *  - https://learn.microsoft.com/azure/azure-local/plan/cloud-deployment-network-considerations
 *  - https://learn.microsoft.com/azure/azure-local/concepts/rack-aware-cluster-reference-architecture
 */

/** single-rack: one rack, one ToR pair. rack-aware: two rooms (availability zones). */
export type ClusterPattern = 'single-rack' | 'rack-aware';

/** switched: storage traffic crosses ToR switches. switchless: node-to-node storage links (1 to 4 nodes). */
export type StoragePattern = 'switched' | 'switchless';

export type TrafficType = 'management' | 'compute' | 'storage';

export type RdmaProtocol = 'roce' | 'iwarp';

/**
 * How host adapters are grouped into Network ATC intents.
 *  - group-all: one intent carries management, compute and storage (fully converged)
 *  - mgmt-compute-storage: management+compute intent plus a dedicated storage intent
 *  - disaggregated: management, compute and storage on separate adapters
 *  - custom: intents edited by hand (the auditor accepts up to three)
 */
export type IntentModel = 'group-all' | 'mgmt-compute-storage' | 'disaggregated' | 'custom';

export interface NetworkIntent {
  id: string;
  name: string;
  traffic: TrafficType[];
  /** Host port ids (hardware profile labels such as OCP-P1) that belong to this intent. */
  portIds: string[];
}

export interface ClusterDesign {
  pattern: ClusterPattern;
  storage: StoragePattern;
  intentModel?: IntentModel;
  /** RoCE needs PFC and ETS; jumbo frames are required only for iWARP when hosts use them. Default: roce. */
  rdma?: RdmaProtocol;
  /** Rack-aware only: ToR switches per room. 1 is allowed by Learn (option 3 and 4) but has no in-room redundancy. */
  torPerZone?: 1 | 2;
}

export type AreaPurpose = 'management' | 'compute' | 'storage' | 'other';

export const CLUSTER_LIMITS = {
  /** Storage switchless deployments in Azure Local only support 1, 2, 3 or 4 nodes. */
  switchlessMaxNodes: 4,
  /** Rack-aware clusters: an even number of nodes split across two zones, up to 8 nodes. */
  rackAwareMaxNodes: 8,
  /** Documented Network ATC examples never use more than three intents per host. */
  maxIntentsPerHost: 3,
} as const;

/** Network ATC storage VLAN defaults: adapter 1 = 711 ... adapter 8 = 718, 719 reserved (Learn: Default VLANs). */
export const ATC_STORAGE_VLAN_FIRST = 711;
export const ATC_STORAGE_VLAN_LAST = 719;

/** Network ATC automatic storage IP defaults (Learn: Automatic storage IP addressing). */
export const ATC_STORAGE_SUBNETS: Record<number, string> = {
  711: '10.71.1.0/24',
  712: '10.71.2.0/24',
  713: '10.71.3.0/24',
};

export function isAtcDefaultStorageVlan(vlanId: number | undefined): boolean {
  return typeof vlanId === 'number' && vlanId >= ATC_STORAGE_VLAN_FIRST && vlanId <= ATC_STORAGE_VLAN_LAST;
}
