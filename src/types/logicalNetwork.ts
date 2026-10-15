import type { AreaPurpose } from './topology';

export type ViewMode = 'physical' | 'logical' | 'hybrid';

export interface VlanSubnetSpec {
  vlanId: number;
  name: string;
  cidr: string;
  purpose: 'management' | 'storage1' | 'storage2' | 'storage3' | 'compute' | 'vm-public';
  /** Matching area purpose for the auditor. */
  areaPurpose: AreaPurpose;
  colorHex: string;
  mtu: 1500 | 9000;
  description: string;
}

/**
 * Default logical networks. Storage VLANs follow the Network ATC defaults (adapter 1 = 711, adapter 2 = 712,
 * adapter 3 = 713; 10.71.x.0/24 subnets). Management and compute VLANs are example values: Network ATC does
 * not set them, and the rack-aware reference architecture uses 7 and 8 in its examples. Use your own IDs.
 * https://learn.microsoft.com/azure/azure-local/deploy/network-atc#default-network-atc-values
 */
export const DEFAULT_HCI_VLANS: Record<number, VlanSubnetSpec> = {
  7: {
    vlanId: 7,
    name: 'VLAN 7 (Management)',
    cidr: '192.168.7.0/24',
    purpose: 'management',
    areaPurpose: 'management',
    colorHex: '#00d2ff',
    mtu: 1500,
    description: 'Host management, Windows Admin Center, Azure Arc agents (example VLAN)'
  },
  8: {
    vlanId: 8,
    name: 'VLAN 8 (Compute / Tenant VMs)',
    cidr: '10.0.8.0/24',
    purpose: 'compute',
    areaPurpose: 'compute',
    colorHex: '#ff006e',
    mtu: 1500,
    description: 'Virtual networks and tenant VM traffic (example VLAN)'
  },
  711: {
    vlanId: 711,
    name: 'VLAN 711 (Storage 1 / SMB Direct)',
    cidr: '10.71.1.0/24',
    purpose: 'storage1',
    areaPurpose: 'storage',
    colorHex: '#00f5d4',
    mtu: 9000,
    description: 'SMB Direct storage network for adapter 1 (Network ATC default)'
  },
  712: {
    vlanId: 712,
    name: 'VLAN 712 (Storage 2 / SMB Direct)',
    cidr: '10.71.2.0/24',
    purpose: 'storage2',
    areaPurpose: 'storage',
    colorHex: '#3a86ff',
    mtu: 9000,
    description: 'SMB Direct storage network for adapter 2 (Network ATC default)'
  },
  713: {
    vlanId: 713,
    name: 'VLAN 713 (Storage 3 / SMB Direct)',
    cidr: '10.71.3.0/24',
    purpose: 'storage3',
    areaPurpose: 'storage',
    colorHex: '#8338ec',
    mtu: 9000,
    description: 'SMB Direct storage network for adapter 3 (Network ATC default; switchless 3-node)'
  }
};

export function getVlanSpec(vlanId?: number): VlanSubnetSpec | undefined {
  if (!vlanId) return undefined;
  return DEFAULT_HCI_VLANS[vlanId];
}
