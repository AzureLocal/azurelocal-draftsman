# Product Roadmap: Azure Local Cabling and Compliance Draftsman

## Roadmap Overview

This roadmap defines the implementation sequence for building **Azure Local Draftsman** into the cabling and compliance tool for Azure Local network architectures. The plan is divided into **five tactical phases**, starting with core UI & component additions and culminating in automated verification engines and enterprise BOM reporting.

> Status at version 0.2.0 (15 Oct 2026): Phases 1 to 4 are built; Phase 5 has the cable schedule, switch port map and draw.io export; rack elevation and the flow player are not built. Network ATC intents and the rack-aware pattern (added in 0.2.0) are tracked under Phase 4.

---

## Phase 1: Real-World Hardware Palette & Out-of-Band (OOB) Infrastructure

**Goal:** Expand the isometric node palette to include real-world vendor hardware profiles (Dell, Arista, Cisco, Nvidia/Mellanox), 1G Out-of-Band (OOB) management switches, and Opengear serial console terminal servers.

*Detailed Specification:* See 📄 [**`pmo/PHASE_1_HARDWARE_SPECIFICATION.md`**](./PHASE_1_HARDWARE_SPECIFICATION.md)

### Detailed Sub-Phase Execution Breakdown

#### ✅ **Phase 1.1: Hardware Profile Engine & Schema Extensions**
- Create `HardwareProfile` manifest engine supporting vendor metadata, exact port counts, port groupings, and dimensions.
- Implement vendor hardware catalogs:
  - **Dell PowerSwitch:** S5248F-ON (48x 25G + 4x 100G + 2x 100G QSFPDD), S5224F-ON (24x 25G + 4x 100G), N3248TE-ON (48x 1G OOB).
  - **Arista Networks:** DCS-7050SX3-48YC8 (48x 25G + 8x 100G), DCS-7020TR-48 (48x 1G OOB).
  - **Cisco Nexus & Catalyst:** N9K-C93180YC-FX3 (48x 25G + 6x 100G), Catalyst C9300-48T (1G OOB).
  - **Nvidia / Mellanox Spectrum:** SN2100 (16x 100G half-width storage switch), SN3700.
  - **Opengear Serial Console:** CM8148-2-DAC (48-port RJ45 serial console), OM2248-L NetOps server, ACM7004 remote gateway.
  - **Azure Local & PowerEdge Server Nodes:** Dell AX-760 (2U HCI), Dell AX-660 (1U HCI), 17th Gen PowerEdge R770 / R670, and 16th Gen PowerEdge R760 / R660 (iDRAC9, OCP 3.0, Dual PCIe 25G/100G).

  - Status: built. Not in the catalog: Nvidia SN3700, Opengear ACM7004, PowerEdge R660 (profiles can be added in `src/types/hardwareProfiles.ts`). AX-770, AX-670 and the Dell S3148P were added in 0.2.0 with reference port layouts.
#### ✅ **Phase 1.2: Switch, OOB & Opengear Isometric Renderers**
- `renderVendorSwitch.ts`: Dynamic 1U/2U isometric switch renderer drawing exact port clusters (SFP28, QSFP28, RJ45) with activity LED indicators.
- `renderOobSwitch.ts`: Specialized 1G RJ45 Out-of-Band management switch renderer.
- `renderOpengearConsole.ts`: Specialized Opengear serial terminal server renderer displaying RJ45 serial console port banks and cellular antenna callouts.

#### ✅ **Phase 1.3: Server Node & Storage Enclosure Renderers**
- `renderServerNode.ts`: Enhanced 1U/2U rackmount server renderer displaying drive bays, status LEDs, iDRAC/iLO ports, OCP 3.0 slots, and PCIe card brackets.
- `renderStorageEnclosure.ts`: JBOD/SAN storage array renderer with dual controller module ports.

#### ✅ **Phase 1.4: Palette Categorization & Preset Hardware Library UI**
- Add brand filter tabs to sidebar palette (**All**, **Dell**, **Arista**, **Cisco**, **Opengear**, **Nvidia**, **Servers**).
- Provide "Drop Preset Architecture Stack" shortcuts:
  - *Azure Local ToR Stack:* Dual Dell S5248F + Opengear CM8148 + Dell N3248TE OOB Switch.
  - *Arista HCI ToR Stack:* Dual Arista 7050SX3 + Opengear OM2248 + Arista 7020TR OOB Switch.

---

## Phase 2: Port-Level Cabling & Interactive Interface Anchors

**Goal:** Enable precision port-to-port physical cabling with cable type metadata, cable media styling (DAC, MMF, SMF, Cat6A, RS-232 Serial), and Switch Embedded Teaming (SET) visualizers.

*Detailed Specification:* See 📄 [**`pmo/PHASE_2_CABLING_SPECIFICATION.md`**](./PHASE_2_CABLING_SPECIFICATION.md)

### Detailed Sub-Phase Execution Breakdown

#### ✅ **Phase 2.1: Port Anchor Schema & Hotspot Calculation**
- Extend `ConnectorEntity` to support `sourcePortId` and `targetPortId`.
- Implement port coordinate calculation engine (`src/lib/geometry/portAnchors.ts`) mapping hardware profile port slots to 2.5D screen coordinates.

#### ✅ **Phase 2.2: Port-to-Port Connector Engine & Routing**
- Update `renderConnector.ts` to render precision cable runs terminating directly at hardware port pins.
- Implement intelligent parallel cable offsets to prevent overlap between multi-cable ToR switch runs.

#### ✅ **Phase 2.3: Cable Media Styling System & Legend**
- Support 5 industry cable media types:
  - **DAC (Direct Attach Copper 25G/100G):** Thick Slate Blue line (`#00d2ff`) with metallic boots.
  - **MMF (Multi-Mode Fiber 25G/100G):** Glowing Aqua Green line (`#00f5d4`).
  - **SMF (Single-Mode Fiber 100G/400G):** Glowing Yellow line (`#ffea00`).
  - **Cat6A RJ45 Copper (1G OOB):** Solid Orange/Amber line (`#ff9100`).
  - **RS-232 Serial Rollover (Opengear Console):** Dashed Magenta/Purple line (`#e040fb`).
- Update `LegendPanel.tsx` to display an interactive Cabling Media Legend explaining colors and speeds.

#### ✅ **Phase 2.4: Switch Embedded Teaming (SET) & LACP Bond Inspector UI**
- Add `SetTeamInspector.tsx` property editor component in `src/features/inspector`.
- Allow engineers to select physical server ports and bind them into named SET Teams (e.g. `SET-Team-01`) or LACP bonds with visual glowing boundary overlays.

  - Status: built as the SET Teams editor in the node inspector with the overlay renderer. LACP bonds are not supported: Azure Local uses SET only.
---

## Phase 3: Multi-Layer Toggling (Physical vs. Logical Views)

**Goal:** Provide single-click view mode switching between Physical View (racks, switches, cables, ports), Logical View (VLANs, Subnets/CIDRs, vSwitches), and Hybrid View.

*Detailed Specification:* See 📄 [**`pmo/PHASE_3_MULTILAYER_SPECIFICATION.md`**](./PHASE_3_MULTILAYER_SPECIFICATION.md)

### Detailed Sub-Phase Execution Breakdown

#### ✅ **Phase 3.1: View Mode Store State & Canvas Layer Switcher UI**
- Add `viewMode: 'physical' | 'logical' | 'hybrid'` to Zustand editor store (`useEditorStore.ts`).
- Build `ViewModeToolbar.tsx` floating HUD control in `src/features/canvas`.

#### ✅ **Phase 3.2: VLAN & Subnet Schema Extensions**
- Create `src/types/logicalNetwork.ts` containing standard HCI VLAN definitions (Network ATC storage defaults 711, 712, 713; example management VLAN 7 and compute VLAN 8).
- Extend `AreaEntity` and `ConnectorEntity` to hold `vlanId`, `cidr`, and `mtu` metadata.

#### ✅ **Phase 3.3: Logical VLAN Zone & CIDR Badge Renderers**
- Update `renderArea.ts` to draw isometric VLAN boundary glow zones, MTU badges (e.g. `MTU 9000`), and CIDR tags in Logical/Hybrid modes.

#### ✅ **Phase 3.4: Layer Filter Inspector & Preset Logical Overlays**
- Update `InspectorPanel.tsx` with VLAN ID assignment dropdowns and Subnet CIDR input fields.
- Add "Apply Azure Local HCI VLAN Profile" template preset button.

  - Status: built as the Logical VLAN Profile dropdown, custom VLAN and purpose fields. There is no single "apply profile" button; the wizard applies a full profile.
---

## Phase 4: Network Validation & Pre-Flight Compliance Rules Engine

**Goal:** Provide an automated compliance auditor (`src/features/validation`) that inspects the architecture diagram for single points of failure, MTU mismatches, and SET team imbalances.

*Detailed Specification:* See 📄 [**`pmo/PHASE_4_VALIDATION_SPECIFICATION.md`**](./PHASE_4_VALIDATION_SPECIFICATION.md)

### Detailed Sub-Phase Execution Breakdown

#### ✅ **Phase 4.1: Compliance Rules Engine & Validation Types**
- Create `src/types/validation.ts` defining `ValidationIssue`, `RuleSeverity`, and `ComplianceRule` interfaces.

#### ✅ **Phase 4.2: Real-Time Diagram Auditor & Validator Module**
- Create `src/features/validation/diagramAuditor.ts` implementing `auditDiagramDocument(doc)` evaluating the compliance rules (5 at first, 16 now):
  - `RULE-TOR-REDUNDANCY` (Dual-ToR switch connectivity check)
  - `RULE-MTU-JUMBO` (Storage/RDMA MTU 9000 consistency check)
  - `RULE-SET-PORT-BALANCE` (SET team port cross-cabling check)
  - `RULE-VLAN-ALIGNMENT` (Host-to-switch VLAN ID tag check)
  - `RULE-OOB-MANAGEMENT` (iDRAC / OOB management connection check)

  - Status: built and extended in 0.2.0 to 16 pattern-aware rules (see `docs/compliance-auditor.md`): switchless, rack-aware, Network ATC intents, VLAN alignment, Network ATC VLAN collision.
#### ✅ **Phase 4.3: Canvas Alert Badge & Warning Overlays**
- Create `renderValidationBadges.ts` rendering pulsating 🔴 Error and 🟡 Warning badges over canvas nodes.

#### ✅ **Phase 4.4: Pre-Flight Audit Drawer & Fix Inspector UI**
- Build `CompliancePanel.tsx` in `src/features/validation` providing an interactive bottom audit drawer listing active warnings and resolution tips.
  - Real-time warning badge overlays on non-compliant nodes or cables with contextual fix suggestions.

---

## Phase 5: Enterprise Reporting, BOM Export & Interactive Flow Simulator

**Goal:** Generate client-ready Bill of Materials (BOM), cabling schedules, and step-by-step interactive flow demonstrations.

### Key Deliverables & Features
- ✅ **draw.io export** of the cabling topology (0.2.0), see `docs/drawio-export.md`.
- ✅ **Network ATC intents and rack-aware pattern** modelled in the wizard, the document and the auditor (0.2.0).
- ✅ **Cable Schedule CSV Export:**
  - Export structured cabling matrix (Source Device, Source Port, Target Device, Target Port, Cable Type, Intent, Notes). Cable length is not captured.
- ✅ **Switch Port Provisioning Sheet:**
  - Generate switch port mapping tables detailing untagged/tagged VLAN assignments for network technicians.
- 🔲 **Rack Elevation Diagram Generator** (not built):
  - Auto-layout 19-inch rack elevation diagrams from node rack coordinates (`U1-U42`).
- 🔲 **Interactive Traffic Flow Player** (not built; the upstream scenario filters exist):
  - Step-by-step playback controller (Play, Pause, Step Forward, Reverse) showing animated packet paths from source node through ToR switches to destination services.

---

## Milestone Execution Summary

| Phase | Core Objective | Status | Target Completion |
|---|---|---|---|
| **Phase 1** | Custom Physical Hardware Palette & Isometric Renderers | Done | Milestone 1 |
| **Phase 2** | Port-to-Port Wiring & Interface-Level Cabling | Done | Milestone 2 |
| **Phase 3** | Physical vs. Logical Multi-Layer View Toggling | Done | Milestone 3 |
| **Phase 4** | Pre-Flight Compliance & Network Rule Auditor | Done | Milestone 4 |
| **Phase 5** | Cable Schedule CSV, BOM Export & Flow Simulator | Partly (CSV, port map, draw.io done) | Milestone 5 |
