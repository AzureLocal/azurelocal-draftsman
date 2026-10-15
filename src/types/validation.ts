export type RuleSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  id: string;
  ruleId: string;
  severity: RuleSeverity;
  title: string;
  message: string;
  targetNodeId?: string;
  targetConnectorId?: string;
  targetAreaId?: string;
  suggestedFix?: string;
}

export interface ComplianceRule {
  id: string;
  name: string;
  /** Highest severity the rule reports. */
  severity: RuleSeverity;
  description: string;
  /** Microsoft Learn page the rule is based on. */
  learnUrl: string;
}

const L = 'https://learn.microsoft.com/azure/azure-local';

export const COMPLIANCE_RULES: ComplianceRule[] = [
  {
    id: 'RULE-TOR-REDUNDANCY',
    name: 'ToR Redundancy (pattern-aware)',
    severity: 'error',
    description: 'Management and compute (and storage in switched designs) reach two distinct ToR switches. Switchless node-to-node storage links are not counted. Rack-aware with one ToR per room is a warning.',
    learnUrl: `${L}/plan/cloud-deployment-network-considerations#decision-3-determine-cluster-topology`,
  },
  {
    id: 'RULE-MTU-JUMBO',
    name: 'Storage MTU',
    severity: 'warning',
    description: 'Storage networks use MTU 9000. Warning for iWARP (jumbo frames needed), recommendation for RoCEv2 (not required).',
    learnUrl: `${L}/concepts/rack-aware-cluster-reference-architecture#tor-switch-architecture`,
  },
  {
    id: 'RULE-SET-PORT-BALANCE',
    name: 'SET Team Port Balance',
    severity: 'warning',
    description: 'Member ports of a SET team are cabled to different switches.',
    learnUrl: `${L}/concepts/host-network-requirements#switch-embedded-teaming-set`,
  },
  {
    id: 'RULE-OOB-MANAGEMENT',
    name: 'OOB Management Connectivity',
    severity: 'info',
    description: 'Every host has an iDRAC/iLO or serial cable to an OOB switch or console server.',
    learnUrl: `${L}/plan/cloud-deployment-network-considerations#decision-3-determine-cluster-topology`,
  },
  {
    id: 'RULE-VLAN-ALIGNMENT',
    name: 'VLAN Alignment',
    severity: 'error',
    description: 'Tagged VLANs are allowed on the switch trunk, identical on both ToR paths, consistent inside a SET intent, and storage adapters use separate VLANs.',
    learnUrl: `${L}/concepts/host-network-requirements#storage-traffic-models`,
  },
  {
    id: 'RULE-VLAN-ATC-COLLISION',
    name: 'Network ATC VLAN Collision',
    severity: 'warning',
    description: 'A custom non-storage VLAN on 711 to 719 collides with the Network ATC storage defaults (non-blocking).',
    learnUrl: `${L}/deploy/network-atc#default-vlans`,
  },
  {
    id: 'RULE-SWITCHLESS-SCALE',
    name: 'Switchless Node Count',
    severity: 'error',
    description: 'Switchless storage supports 1 to 4 nodes; 3-node switchless needs a manual storage IP plan.',
    learnUrl: `${L}/plan/network-patterns-overview#storage-switchless-connectivity-considerations`,
  },
  {
    id: 'RULE-SWITCHLESS-MESH',
    name: 'Switchless Storage Mesh',
    severity: 'error',
    description: 'Every node pair has a direct storage cable and each node has at least two storage links.',
    learnUrl: `${L}/plan/network-patterns-overview#storage-switchless-connectivity-considerations`,
  },
  {
    id: 'RULE-STORAGE-SWITCH-ISOLATION',
    name: 'Storage-Only Switch Pair',
    severity: 'warning',
    description: 'Single-rack switched designs use one MLAG ToR pair for all host traffic, not a storage-only pair.',
    learnUrl: `${L}/plan/cloud-deployment-network-considerations#decision-3-determine-cluster-topology`,
  },
  {
    id: 'RULE-RACK-AWARE',
    name: 'Rack-Aware Requirements',
    severity: 'error',
    description: 'Switched storage, an even node count up to 8, two balanced zones, a ToR in each zone and a room-to-room storage path.',
    learnUrl: `${L}/plan/cloud-deployment-network-considerations#decision-3-determine-cluster-topology`,
  },
  {
    id: 'RULE-MLAG-PEER-LINK',
    name: 'MLAG Peer Link',
    severity: 'warning',
    description: 'In a single-rack design the two ToR switches that serve a host are joined by a peer link (MLAG pair).',
    learnUrl: `${L}/plan/cloud-deployment-network-considerations#decision-3-determine-cluster-topology`,
  },
  {
    id: 'RULE-RDMA-QOS',
    name: 'RoCE QoS Reminder',
    severity: 'info',
    description: 'RoCE storage needs PFC, ETS and DCB on every RDMA port, switches and room-to-room links included (one reminder per cluster).',
    learnUrl: `${L}/concepts/host-network-requirements#rdma-traffic-considerations`,
  },
  {
    id: 'RULE-INTENT-COVERAGE',
    name: 'Intent Coverage',
    severity: 'error',
    description: 'Management, compute and storage are all carried by an intent and each port belongs to one intent.',
    learnUrl: `${L}/deploy/network-atc#example-intents`,
  },
  {
    id: 'RULE-INTENT-SYMMETRY',
    name: 'Intent and Adapter Symmetry',
    severity: 'error',
    description: 'Every node has the same intents and port counts; adapters of one intent have the same speed and media.',
    learnUrl: `${L}/deploy/network-atc#prerequisites`,
  },
  {
    id: 'RULE-INTENT-STORAGE-RDMA',
    name: 'Storage Intent RDMA Ports',
    severity: 'error',
    description: 'Ports in a storage intent are RDMA-capable (SFP-type, 10G or faster).',
    learnUrl: `${L}/concepts/host-network-requirements#rdma`,
  },
  {
    id: 'RULE-INTENT-LAYOUT',
    name: 'Intent Layout',
    severity: 'error',
    description: 'Storage intent has two ports; switchless and rack-aware keep storage on a dedicated intent; at most three intents.',
    learnUrl: `${L}/deploy/network-atc#example-intents`,
  },
];
