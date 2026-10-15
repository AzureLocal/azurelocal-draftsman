# Vision and Strategy: Enterprise Infrastructure & Network Flow Architect

## Strategic Vision

The goal of this initiative is to transform **Azure Local Draftsman** from a specialized scenario viewer into an **Enterprise Infrastructure & Network Flow Architect (EINFA)**—the definitive tool for designing, documenting, verifying, and presenting complex physical and logical network architectures.

Solutions Engineers, Systems Architects, Datacenter Ops, and Network Consultants require a tool that bridges the gap between **high-level logical diagrams** (what connects to what conceptually) and **low-level physical execution** (which physical port plugs into which switch, with which VLAN, MTU, and team configuration).

---

## Core Target Use Cases

### 1. Azure Local & Hyper-V HCI Infrastructure
- **Node-to-Switch Cabling:** Modeling 2-node to 16-node Azure Local or Hyper-V clusters connected to dual Top-of-Rack (ToR A / ToR B) switches.
- **Switch Embedded Teaming (SET):** Visualizing physical NIC pairs bound into SET teams on Hyper-V hosts.
- **Network Traffic Isolation:** Distinct visual routing for:
  - **Management Network** (Host management, WAC, Azure Arc agents)
  - **Compute Network** (Tenant VMs, SDN Virtual Networks, NVGRE/VXLAN)
  - **Storage Networks (SMB Direct / RDMA):** Dual non-routable subnets with RoCEv2/iWARP configuration and PFC/PCL priority flow control.
  - **Cluster Shared Volume (CSV) & Live Migration** traffic paths.

### 2. Physical Datacenter Rack & Cabling Layouts
- **Rack Elevations & Port Mapping:** Detailed 1U/2U/4U server nodes, patch panels, PDU power paths, and 24/48-port switch rack layouts.
- **Cable Media Specifications:** Documenting cable types (Direct Attach Copper - DAC, Multi-Mode Fiber - MMF, Single-Mode Fiber - SMF, Cat6A) and speeds (1G, 10G, 25G, 100G, 400G).
- **Physical Redundancy Auditing:** Visualizing dual-homed connections, LACP trunks, and cross-chassis MLAG / vPC links.

### 3. Logical Network & Security Topologies
- **VLAN & Subnet Mapping:** Overlaying logical subnets, VLAN IDs (e.g. VLAN 7 Management, VLAN 8 Compute, Network ATC storage VLANs 711, 712, 713), and CIDR blocks over physical switches and hosts.
- **Firewall & Proxy Perimeter Flows:** Step-by-step traffic inspection showing HTTP/HTTPS egress, Arc Gateway allowed endpoints, proxy bypass paths, and private endpoint routing.
- **SD-WAN & Hybrid Cloud Connectivity:** ExpressRoute circuits, Site-to-Site VPN tunnels, Azure Arc Gateways, and multi-cloud interconnects.

---

## Target Personas & Value Proposition

| Persona | Key Pain Point | EINFA Solution & Value Proposition |
|---|---|---|
| **Solutions Architect** | Time-consuming creation of architecture diagrams in static tools (Visio/PowerPoint) that quickly become outdated. | Interactive 2.5D isometric diagrams with instant preset templates for Hyper-V, Azure Local, VMware, and Nutanix. |
| **Network / Systems Engineer** | Miscommunication between server team and network team regarding port assignments, VLAN tagging, and MTU settings. | Precise port-to-port mapping with built-in validation for VLAN mismatches, MTU 9000 requirements, and switch redundancy. |
| **Datacenter Ops Technician** | Inefficient cabling during physical server racking and maintenance. | Automated Cable Schedule CSV export detailing source device/port, target device/port, color coding, and cable medium. |
| **Enterprise Sales / Pre-Sales** | Static proposal diagrams fail to demonstrate dynamic traffic flows to technical stakeholders. | Interactive animated traffic flow simulations demonstrating failure scenarios, proxy routing, and security isolation. |

---

## Strategic Principles & Guiding Pillars

1. **Dual Perspective (Physical + Logical):** Users must be able to toggle seamlessly between **Physical View** (racks, NIC ports, cables, switch slots) and **Logical View** (VLANs, vSwitches, subnets, protocol flows).
2. **Interactive Simulation First:** Traffic shouldn't just be static lines—it should be an active flow that can be played, stepped through, filtered by scenario, and tested against simulated port/switch outages.
3. **Automated Validation:** The tool should act as a pre-flight checker, warning the engineer if a storage network lacks RDMA configuration, if a host has a single point of failure to a switch, or if VLAN IDs don't align.
4. **Zero-Lock-in Portability:** All architecture files remain lightweight, human-readable JSON documents with instant export to high-resolution vector/raster formats and CSV schedules.
