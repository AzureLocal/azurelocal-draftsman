# Phase 3 Deep-Dive Specification: Multi-Layer Toggling (Physical vs. Logical Views)

## Executive Overview

Phase 3 introduces **Multi-Layer View Modes** to the Enterprise Infrastructure & Network Flow Architect. Solution architects and network engineers require the ability to switch seamlessly between **Physical View** (racks, switches, NIC ports, physical cables) and **Logical View** (VLAN IDs, Subnets/CIDRs, Virtual Switches, RDMA storage channels).

This specification details:
1. Multi-Layer Mode Definitions (Physical, Logical, Hybrid)
2. Logical Subnets, VLANs & vSwitch Data Model (`LogicalNetworkEntity`)
3. Canvas Layer Filter & Renderer Integration
4. Granular Phase 3 Sub-Milestone Execution Breakdown (Phases 3.1 through 3.4)

---

## 1. Multi-Layer View Mode Definitions

Users can toggle viewport layer modes using single-click controls in the top canvas toolbar:

```
[ 🔌 Physical View ]   │   [ 🌐 Logical View ]   │   [ 🔀 Hybrid View ]
```

| Layer View Mode | Visible Canvas Elements | Hidden Elements | Primary Target Use Case |
|---|---|---|---|
| **Physical View (`physical`)** | Hardware chassis (Switches, Servers, Opengear), Physical Cables (DAC, MMF, Cat6A), Rack Units, Physical Port Pins. | Virtual Switches, Subnet CIDRs, Logical IP Paths. | Datacenter racking, physical cabling runs, cable schedule validation. |
| **Logical View (`logical`)** | Virtual Switches (vSwitches), VLAN Boundaries (example 7 and 8, storage 711, 712, 713), Subnet CIDRs, Logical IP Traffic Paths. | Physical Cable Runs, Hardware Port Pins, OOB Serial lines. | Network architecture review, VLAN tagging, IP assignment planning. |
| **Hybrid View (`hybrid`)** | All physical hardware and cables + semi-transparent overlaid Logical VLAN boundaries and CIDR badges. | None. | Comprehensive cross-layer solution presentation. |

---

## 2. Logical Subnets, VLANs & vSwitch Data Model

Logical networks define virtual segmentation overlaid on physical infrastructure:

```typescript
export interface VlanSubnetSpec {
  vlanId: number;                  // e.g. 7, 8, 711, 712, 713
  name: string;                    // e.g. 'Storage1-SMB-Direct'
  cidr: string;                    // e.g. '192.168.11.0/24'
  purpose: 'management' | 'storage1' | 'storage2' | 'storage3' | 'compute' | 'vm-public';
  colorHex: string;                // Visual boundary fill/border color
  mtu: 1500 | 9000;                // 9000 Jumbo Frames for Storage/RDMA
}
```

### Standard Azure Local & Hyper-V HCI VLAN Schedule
(Updated in 0.2.0 to the Network ATC defaults: storage 711, 712, 713; management and compute are example values.)
- **VLAN 7 (Management, example):** `192.168.7.0/24` (MTU 1500) - Host Management, WAC, Azure Arc
- **VLAN 8 (Compute / Tenant VMs, example):** `10.0.8.0/24` (MTU 1500) - Virtual Network / VM traffic
- **VLAN 711 (Storage 1 / SMB Direct):** `10.71.1.0/24` (MTU 9000) - SMB Direct RDMA
- **VLAN 712 (Storage 2 / SMB Direct):** `10.71.2.0/24` (MTU 9000) - SMB Direct RDMA
- **VLAN 713 (Storage 3 / SMB Direct):** `10.71.3.0/24` (MTU 9000) - third adapter, 3-node switchless

---

## 3. Canvas Layer Filter & Renderer Integration

When `activeViewMode` changes in the Zustand editor store (`useEditorStore.ts`):
- **In `physical` mode:** Connectors with `cableType` render as physical hardware cables; vSwitch boundaries are hidden.
- **In `logical` mode:** Physical cable runs fade out or hide; logical VLAN zone areas (`renderArea.ts`) illuminate with CIDR badges and VLAN tags.
- **In `hybrid` mode:** Full dual-layer rendering.

---

## 4. Phase 3 Granular Sub-Milestone Execution Breakdown

Phase 3 is executed in four sequential sub-phases:

```
Phase 3.1: View Mode Store State & Canvas Layer Switcher UI
    │
    ├── Phase 3.2: VLAN & Subnet Schema Extensions
    │       │
    │       ├── Phase 3.3: Logical VLAN Zone & CIDR Badge Renderers
    │       │       │
    │       │       └── Phase 3.4: Layer Filter Inspector & Preset Logical Overlays
```

### Phase 3.1: View Mode Store State & Canvas Layer Switcher UI
- Add `viewMode: 'physical' | 'logical' | 'hybrid'` to `useEditorStore.ts`.
- Create `ViewModeToolbar.tsx` floating HUD control in `src/features/canvas`.

### Phase 3.2: VLAN & Subnet Schema Extensions
- Create `src/types/logicalNetwork.ts` containing standard HCI VLAN definitions (`DEFAULT_HCI_VLANS`).
- Extend `AreaEntity` and `ConnectorEntity` to hold `vlanId` and `cidr` attributes.

### Phase 3.3: Logical VLAN Zone & CIDR Badge Renderers
- Update `renderArea.ts` to draw isometric VLAN boundary glow zones, MTU badges (e.g. `MTU 9000`), and CIDR tags in Logical/Hybrid modes.

### Phase 3.4: Layer Filter Inspector & Preset Logical Overlays
- Update `InspectorPanel.tsx` with VLAN ID assignment dropdowns and Subnet CIDR fields.
- Add "Apply Azure Local HCI VLAN Profile" template preset button.
