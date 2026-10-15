export type HardwareVendor = 'dell' | 'arista' | 'cisco' | 'nvidia' | 'opengear' | 'hpe' | 'generic';
export type HardwareCategory = 'torSwitch' | 'oobSwitch' | 'opengearConsole' | 'serverNode' | 'storageEnclosure';

export type PortMediaType = '1G-RJ45' | '10G-RJ45' | '10G-SFP+' | '25G-SFP28' | '100G-QSFP28' | '100G-QSFPDD' | 'RS232-RJ45';

export interface PortGroupSpec {
  name: string;
  count: number;
  mediaType: PortMediaType;
  speedGbps: number;
  labelPrefix?: string;
  startIndex?: number;
  /** Set to override the RDMA heuristic (SFP-type ports at 10G or faster are assumed RDMA-capable). */
  rdmaCapable?: boolean;
}

export interface HardwareProfile {
  id: string;
  vendor: HardwareVendor;
  model: string;
  category: HardwareCategory;
  formFactorU: number;              // 1, 2, 4
  halfWidth?: boolean;              // e.g. SN2100 (half-width 1U)
  description: string;
  primaryColor: string;             // Base faceplate chassis color
  accentColor: string;              // Brand accent highlight color
  ledColor: string;                 // Indicator LED glow color
  portGroups: PortGroupSpec[];
  defaultRole?: string;
  icon?: string;
}

export const HARDWARE_PROFILES: HardwareProfile[] = [
  // --- DELL TOP-OF-RACK SWITCHES ---
  {
    id: 'dell-s5248f-on',
    vendor: 'dell',
    model: 'Dell PowerSwitch S5248F-ON',
    category: 'torSwitch',
    formFactorU: 1,
    description: '48x 25GbE SFP28 + 4x 100GbE QSFP28 + 2x 100GbE QSFPDD ToR HCI Switch',
    primaryColor: '#1e2530',
    accentColor: '#007db8',
    ledColor: '#00d2ff',
    portGroups: [
      { name: 'SFP28 Ports', count: 48, mediaType: '25G-SFP28', speedGbps: 25, labelPrefix: 'P', startIndex: 1 },
      { name: 'QSFP28 Ports', count: 4, mediaType: '100G-QSFP28', speedGbps: 100, labelPrefix: 'Q', startIndex: 49 },
      { name: 'QSFPDD Ports', count: 2, mediaType: '100G-QSFPDD', speedGbps: 100, labelPrefix: 'DD', startIndex: 53 }
    ],
    defaultRole: 'ToR HCI Cluster Switch'
  },
  {
    id: 'dell-s5224f-on',
    vendor: 'dell',
    model: 'Dell PowerSwitch S5224F-ON',
    category: 'torSwitch',
    formFactorU: 1,
    description: '24x 25GbE SFP28 + 4x 100GbE QSFP28 Small-Scale ToR Switch',
    primaryColor: '#1e2530',
    accentColor: '#007db8',
    ledColor: '#00d2ff',
    portGroups: [
      { name: 'SFP28 Ports', count: 24, mediaType: '25G-SFP28', speedGbps: 25, labelPrefix: 'P', startIndex: 1 },
      { name: 'QSFP28 Ports', count: 4, mediaType: '100G-QSFP28', speedGbps: 100, labelPrefix: 'Q', startIndex: 25 }
    ],
    defaultRole: 'ToR Switch'
  },
  {
    id: 'dell-n3248te-on',
    vendor: 'dell',
    model: 'Dell PowerSwitch N3248TE-ON',
    category: 'oobSwitch',
    formFactorU: 1,
    description: '48x 1GbE RJ45 + 4x 10GbE SFP+ Out-of-Band Management Switch',
    primaryColor: '#161c24',
    accentColor: '#007db8',
    ledColor: '#ffc107',
    portGroups: [
      { name: 'RJ45 OOB Ports', count: 48, mediaType: '1G-RJ45', speedGbps: 1, labelPrefix: 'Mgmt', startIndex: 1 },
      { name: 'SFP+ Uplinks', count: 4, mediaType: '10G-SFP+', speedGbps: 10, labelPrefix: 'Up', startIndex: 49 }
    ],
    defaultRole: '1G OOB Management'
  },

  {
    id: 'dell-s3148p-on',
    vendor: 'dell',
    model: 'Dell PowerSwitch S3148P-ON',
    category: 'oobSwitch',
    formFactorU: 1,
    description: '48x 1GbE RJ45 + 2x 10GbE SFP+ Out-of-Band Management Switch',
    primaryColor: '#161c24',
    accentColor: '#007db8',
    ledColor: '#ffc107',
    portGroups: [
      { name: 'RJ45 OOB Ports', count: 48, mediaType: '1G-RJ45', speedGbps: 1, labelPrefix: 'Mgmt', startIndex: 1 },
      { name: 'SFP+ Uplinks', count: 2, mediaType: '10G-SFP+', speedGbps: 10, labelPrefix: 'Up', startIndex: 49 }
    ],
    defaultRole: '1G OOB Management'
  },

  // --- ARISTA NETWORKS ---
  {
    id: 'arista-7050sx3-48yc8',
    vendor: 'arista',
    model: 'Arista DCS-7050SX3-48YC8',
    category: 'torSwitch',
    formFactorU: 1,
    description: '48x 25GbE SFP28 + 8x 100GbE QSFP28 High-Density ToR Switch',
    primaryColor: '#1c222c',
    accentColor: '#4f81bd',
    ledColor: '#00e5ff',
    portGroups: [
      { name: 'SFP28 Ports', count: 48, mediaType: '25G-SFP28', speedGbps: 25, labelPrefix: 'Eth', startIndex: 1 },
      { name: 'QSFP28 Ports', count: 8, mediaType: '100G-QSFP28', speedGbps: 100, labelPrefix: 'Uplink', startIndex: 49 }
    ],
    defaultRole: 'ToR Switch'
  },
  {
    id: 'arista-7020tr-48',
    vendor: 'arista',
    model: 'Arista DCS-7020TR-48',
    category: 'oobSwitch',
    formFactorU: 1,
    description: '48x 1GbE RJ45 + 6x 10GbE SFP+ OOB Management Switch',
    primaryColor: '#192028',
    accentColor: '#4f81bd',
    ledColor: '#ffb300',
    portGroups: [
      { name: 'RJ45 Ports', count: 48, mediaType: '1G-RJ45', speedGbps: 1, labelPrefix: 'Mgmt', startIndex: 1 },
      { name: 'SFP+ Uplinks', count: 6, mediaType: '10G-SFP+', speedGbps: 10, labelPrefix: 'Up', startIndex: 49 }
    ],
    defaultRole: 'OOB Management Switch'
  },

  // --- CISCO SYSTEMS ---
  {
    id: 'cisco-nexus-93180yc-fx3',
    vendor: 'cisco',
    model: 'Cisco Nexus N9K-C93180YC-FX3',
    category: 'torSwitch',
    formFactorU: 1,
    description: '48x 10G/25G SFP28 + 6x 40G/100G QSFP28 Nexus ToR Switch',
    primaryColor: '#1b222a',
    accentColor: '#049fd9',
    ledColor: '#00e676',
    portGroups: [
      { name: 'SFP28 Ports', count: 48, mediaType: '25G-SFP28', speedGbps: 25, labelPrefix: 'E1/', startIndex: 1 },
      { name: 'QSFP28 Ports', count: 6, mediaType: '100G-QSFP28', speedGbps: 100, labelPrefix: 'E1/', startIndex: 49 }
    ],
    defaultRole: 'Nexus ToR Switch'
  },
  {
    id: 'cisco-catalyst-9300-48t',
    vendor: 'cisco',
    model: 'Cisco Catalyst C9300-48T',
    category: 'oobSwitch',
    formFactorU: 1,
    description: '48x 1GbE RJ45 OOB Management Switch',
    primaryColor: '#171e26',
    accentColor: '#049fd9',
    ledColor: '#ffca28',
    portGroups: [
      { name: 'RJ45 Ports', count: 48, mediaType: '1G-RJ45', speedGbps: 1, labelPrefix: 'Gi1/0/', startIndex: 1 }
    ],
    defaultRole: 'Catalyst OOB Switch'
  },

  // --- NVIDIA / MELLANOX SPECTRUM ---
  {
    id: 'nvidia-spectrum-sn2100',
    vendor: 'nvidia',
    model: 'Nvidia Spectrum SN2100',
    category: 'torSwitch',
    formFactorU: 1,
    halfWidth: true,
    description: '16x 100GbE QSFP28 Half-Width High-Performance Storage Switch (RoCEv2)',
    primaryColor: '#11161d',
    accentColor: '#76b900',
    ledColor: '#76b900',
    portGroups: [
      { name: 'QSFP28 Storage Ports', count: 16, mediaType: '100G-QSFP28', speedGbps: 100, labelPrefix: 'SwP', startIndex: 1 }
    ],
    defaultRole: 'Dedicated Storage / RDMA Switch'
  },

  // --- OPENGEAR SERIAL CONSOLE MANAGERS ---
  {
    id: 'opengear-cm8148-2-dac',
    vendor: 'opengear',
    model: 'Opengear CM8148-2-DAC',
    category: 'opengearConsole',
    formFactorU: 1,
    description: '48-Port RJ45 RS-232 Serial Console Server with Dual AC & Cellular',
    primaryColor: '#151921',
    accentColor: '#9c27b0',
    ledColor: '#e040fb',
    portGroups: [
      { name: 'Serial Console Ports', count: 48, mediaType: 'RS232-RJ45', speedGbps: 0.1, labelPrefix: 'Serial', startIndex: 1 }
    ],
    defaultRole: 'Serial Console Terminal Server'
  },
  {
    id: 'opengear-om2248-l',
    vendor: 'opengear',
    model: 'Opengear OM2248-L NetOps',
    category: 'opengearConsole',
    formFactorU: 1,
    description: '48 Serial Ports + 8x 1G Ethernet Switch Ports NetOps Console Server',
    primaryColor: '#151921',
    accentColor: '#9c27b0',
    ledColor: '#e040fb',
    portGroups: [
      { name: 'Serial Ports', count: 48, mediaType: 'RS232-RJ45', speedGbps: 0.1, labelPrefix: 'S', startIndex: 1 },
      { name: 'Ethernet Ports', count: 8, mediaType: '1G-RJ45', speedGbps: 1, labelPrefix: 'Eth', startIndex: 49 }
    ],
    defaultRole: 'NetOps Console Server'
  },

  // --- AZURE LOCAL HCI & DELL POWEREDGE SERVERS ---
  {
    id: 'dell-ax-760',
    vendor: 'dell',
    model: 'Dell AX-760 Azure Local HCI Node',
    category: 'serverNode',
    formFactorU: 2,
    description: '2U Azure Local HCI Node with iDRAC9, OCP 3.0 (Dual 25G), and Dual PCIe 25G/100G NICs',
    primaryColor: '#1a222d',
    accentColor: '#007db8',
    ledColor: '#00e5ff',
    portGroups: [
      { name: 'iDRAC9 Management', count: 1, mediaType: '1G-RJ45', speedGbps: 1, labelPrefix: 'iDRAC', startIndex: 1 },
      { name: 'OCP 3.0 Slot', count: 2, mediaType: '25G-SFP28', speedGbps: 25, labelPrefix: 'OCP-P', startIndex: 1 },
      { name: 'PCIe Slot 1', count: 2, mediaType: '25G-SFP28', speedGbps: 25, labelPrefix: 'Slot1-P', startIndex: 1 },
      { name: 'PCIe Slot 2', count: 2, mediaType: '25G-SFP28', speedGbps: 25, labelPrefix: 'Slot2-P', startIndex: 1 }
    ],
    defaultRole: 'Azure Local HCI Compute & Storage Node'
  },
  {
    id: 'dell-ax-660',
    vendor: 'dell',
    model: 'Dell AX-660 Azure Local HCI Node',
    category: 'serverNode',
    formFactorU: 1,
    description: '1U High-Density Azure Local HCI Node with iDRAC9 and Dual 25G SFP28 Ports',
    primaryColor: '#1a222d',
    accentColor: '#007db8',
    ledColor: '#00e5ff',
    portGroups: [
      { name: 'iDRAC9 Management', count: 1, mediaType: '1G-RJ45', speedGbps: 1, labelPrefix: 'iDRAC', startIndex: 1 },
      { name: 'OCP 3.0 Slot', count: 2, mediaType: '25G-SFP28', speedGbps: 25, labelPrefix: 'OCP-P', startIndex: 1 },
      { name: 'PCIe Slot 1', count: 2, mediaType: '25G-SFP28', speedGbps: 25, labelPrefix: 'Slot1-P', startIndex: 1 }
    ],
    defaultRole: 'Azure Local 1U HCI Node'
  },
  {
    id: 'dell-ax-770',
    vendor: 'dell',
    model: 'Dell AX-770 Azure Local HCI Node',
    category: 'serverNode',
    formFactorU: 2,
    description: '2U Azure Local HCI Node with iDRAC9, OCP 3.0 (Dual 25G) and a dual-port PCIe 25G NIC (reference port layout)',
    primaryColor: '#1a222d',
    accentColor: '#007db8',
    ledColor: '#00e5ff',
    portGroups: [
      { name: 'iDRAC9 Management', count: 1, mediaType: '1G-RJ45', speedGbps: 1, labelPrefix: 'iDRAC', startIndex: 1 },
      { name: 'OCP 3.0 Slot', count: 2, mediaType: '25G-SFP28', speedGbps: 25, labelPrefix: 'OCP-P', startIndex: 1 },
      { name: 'PCIe Slot 1', count: 2, mediaType: '25G-SFP28', speedGbps: 25, labelPrefix: 'Slot1-P', startIndex: 1 }
    ],
    defaultRole: 'Azure Local HCI Compute & Storage Node'
  },
  {
    id: 'dell-ax-670',
    vendor: 'dell',
    model: 'Dell AX-670 Azure Local HCI Node',
    category: 'serverNode',
    formFactorU: 1,
    description: '1U Azure Local HCI Node with iDRAC9, OCP 3.0 (Dual 25G) and a dual-port PCIe 25G NIC (reference port layout)',
    primaryColor: '#1a222d',
    accentColor: '#007db8',
    ledColor: '#00e5ff',
    portGroups: [
      { name: 'iDRAC9 Management', count: 1, mediaType: '1G-RJ45', speedGbps: 1, labelPrefix: 'iDRAC', startIndex: 1 },
      { name: 'OCP 3.0 Slot', count: 2, mediaType: '25G-SFP28', speedGbps: 25, labelPrefix: 'OCP-P', startIndex: 1 },
      { name: 'PCIe Slot 1', count: 2, mediaType: '25G-SFP28', speedGbps: 25, labelPrefix: 'Slot1-P', startIndex: 1 }
    ],
    defaultRole: 'Azure Local 1U HCI Node'
  },
  {
    id: 'dell-poweredge-r770',
    vendor: 'dell',
    model: 'Dell PowerEdge R770 (17th Gen)',
    category: 'serverNode',
    formFactorU: 2,
    description: '2U Enterprise Rack Server (Intel Xeon 6, PCIe Gen5, iDRAC9)',
    primaryColor: '#18202b',
    accentColor: '#007db8',
    ledColor: '#00d2ff',
    portGroups: [
      { name: 'iDRAC9', count: 1, mediaType: '1G-RJ45', speedGbps: 1, labelPrefix: 'iDRAC', startIndex: 1 },
      { name: 'OCP 3.0', count: 2, mediaType: '25G-SFP28', speedGbps: 25, labelPrefix: 'OCP', startIndex: 1 },
      { name: 'PCIe Gen5', count: 2, mediaType: '100G-QSFP28', speedGbps: 100, labelPrefix: 'Gen5-P', startIndex: 1 }
    ],
    defaultRole: 'Hyper-V Host Node (17th Gen)'
  },
  {
    id: 'dell-poweredge-r670',
    vendor: 'dell',
    model: 'Dell PowerEdge R670 (17th Gen)',
    category: 'serverNode',
    formFactorU: 1,
    description: '1U Enterprise Rack Server (Intel Xeon 6, PCIe Gen5, iDRAC9)',
    primaryColor: '#18202b',
    accentColor: '#007db8',
    ledColor: '#00d2ff',
    portGroups: [
      { name: 'iDRAC9', count: 1, mediaType: '1G-RJ45', speedGbps: 1, labelPrefix: 'iDRAC', startIndex: 1 },
      { name: 'OCP 3.0', count: 2, mediaType: '25G-SFP28', speedGbps: 25, labelPrefix: 'OCP', startIndex: 1 }
    ],
    defaultRole: 'Compute Node (17th Gen)'
  },
  {
    id: 'dell-poweredge-r760',
    vendor: 'dell',
    model: 'Dell PowerEdge R760 (16th Gen)',
    category: 'serverNode',
    formFactorU: 2,
    description: '2U Enterprise Rack Server (iDRAC9, OCP 3.0, PCIe Slot 1/2)',
    primaryColor: '#18202b',
    accentColor: '#007db8',
    ledColor: '#00d2ff',
    portGroups: [
      { name: 'iDRAC9', count: 1, mediaType: '1G-RJ45', speedGbps: 1, labelPrefix: 'iDRAC', startIndex: 1 },
      { name: 'OCP 3.0', count: 2, mediaType: '25G-SFP28', speedGbps: 25, labelPrefix: 'OCP', startIndex: 1 },
      { name: 'PCIe Slot 1', count: 2, mediaType: '25G-SFP28', speedGbps: 25, labelPrefix: 'P1-', startIndex: 1 }
    ],
    defaultRole: 'Hyper-V Host Node'
  },
  {
    id: 'dell-powervault-me5024',
    vendor: 'dell',
    model: 'Dell PowerVault ME5024 Storage Array',
    category: 'storageEnclosure',
    formFactorU: 2,
    description: '2U 24-Bay SAN/iSCSI Storage Array with Dual Redundant Controllers',
    primaryColor: '#141a22',
    accentColor: '#007db8',
    ledColor: '#00e5ff',
    portGroups: [
      { name: 'Mgmt Controller A', count: 1, mediaType: '1G-RJ45', speedGbps: 1, labelPrefix: 'CtrlA-Mgmt', startIndex: 1 },
      { name: 'Mgmt Controller B', count: 1, mediaType: '1G-RJ45', speedGbps: 1, labelPrefix: 'CtrlB-Mgmt', startIndex: 1 },
      { name: 'iSCSI/FC Host Ports A', count: 4, mediaType: '25G-SFP28', speedGbps: 25, labelPrefix: 'CtrlA-Host', startIndex: 1 },
      { name: 'iSCSI/FC Host Ports B', count: 4, mediaType: '25G-SFP28', speedGbps: 25, labelPrefix: 'CtrlB-Host', startIndex: 1 }
    ],
    defaultRole: 'SAN / iSCSI Storage Array'
  }
];

export function getHardwareProfile(profileId?: string): HardwareProfile | undefined {
  if (!profileId) return undefined;
  return HARDWARE_PROFILES.find((p) => p.id === profileId);
}

/** Port ids of a profile in the same label scheme the canvas uses (prefix + start index + n). */
export function listProfilePorts(profile: HardwareProfile): { id: string; group: PortGroupSpec }[] {
  const ports: { id: string; group: PortGroupSpec }[] = [];
  for (const group of profile.portGroups) {
    const start = group.startIndex ?? 1;
    for (let i = 0; i < group.count; i++) {
      ports.push({ id: `${group.labelPrefix || 'P'}${start + i}`, group });
    }
  }
  return ports;
}

/** Whether a profile port can carry RDMA (storage intent). A heuristic unless the group sets rdmaCapable. */
export function isRdmaCapable(group: PortGroupSpec): boolean {
  if (typeof group.rdmaCapable === 'boolean') return group.rdmaCapable;
  return group.speedGbps >= 10 && (group.mediaType === '10G-SFP+' || group.mediaType === '25G-SFP28' || group.mediaType.startsWith('100G'));
}

/** Server data ports: everything that is not the BMC/iDRAC port. */
export function listHostDataPorts(profile: HardwareProfile): { id: string; group: PortGroupSpec }[] {
  return listProfilePorts(profile).filter((p) => !/idrac|ilo|bmc/i.test(p.group.name) && !/idrac|ilo|bmc/i.test(p.id));
}
