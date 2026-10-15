# Physical Node-to-Switch Cabling Architecture

This document defines physical wiring standards and cabling geometry for **Azure Local** HCI cluster nodes connected to Top-of-Rack (ToR) Ethernet switches and Out-of-Band (OOB) management equipment.

---

## 1. Dual-ToR Cross-Connect Architecture

To prevent single points of failure (SPOF) and support zero-downtime switch firmware maintenance, host nodes must cross-connect across redundant physical switches (ToR-A and ToR-B).

```
+-------------------------------------------------------------------+
|                        Top-of-Rack Switch A                       |
+-------------------------------------------------------------------+
       ^                                            ^
       | (pNIC1 - DAC/MMF)                          | (pNIC1 - DAC/MMF)
+------------------------+                +------------------------+
|   Server Host Node 1   |                |   Server Host Node 2   |
+------------------------+                +------------------------+
       | (pNIC2 - DAC/MMF)                          | (pNIC2 - DAC/MMF)
       v                                            v
+-------------------------------------------------------------------+
|                        Top-of-Rack Switch B                       |
+-------------------------------------------------------------------+
```

- **pNIC1**: Connects to an SFP28/QSFP28 port on **ToR Switch A**.
- **pNIC2**: Connects to an SFP28/QSFP28 port on **ToR Switch B**.

The two ToR switches form one MLAG pair joined by a peer link. In a single-rack switched design this one pair carries management, compute and storage; a separate storage-only switch pair is discouraged. Draw the peer link: `RULE-MLAG-PEER-LINK` checks for it.

Storage ports follow the same rule with one VLAN per adapter: storage port 1 on ToR A (VLAN 711), storage port 2 on ToR B (VLAN 712), so each path stays on one switch.

### Switchless storage (1 to 4 nodes)

Storage ports are cabled node to node in a full mesh: two cables between the nodes of a 2-node cluster, one cable from each node to each of the other two in a 3-node cluster. Management and compute still use the ToR pair (north-south traffic needs a switch), and the storage ports cannot carry anything else. The auditor does not require a ToR link for the storage cables.

### Rack-aware (two zones)

Two rooms, each with its own ToR switches and half of the nodes (even count, up to 8). The reference option with dedicated storage links uses two ToR per room: management and compute use an MLAG pair inside the room, storage VLAN 711 runs ToR1 to ToR3 and VLAN 712 runs ToR2 to ToR4 between rooms. One ToR per room, or cabling every node to both rooms, are the other documented options. See the [rack-aware reference architecture](https://learn.microsoft.com/azure/azure-local/concepts/rack-aware-cluster-reference-architecture).

---

## 2. Supported Cable Media Specifications

| Cable Media Type | Connector Type | Speed | Max Recommended Length | Typical Deployment Use |
|---|---|---|---|---|
| **DAC (Direct Attach Copper)** | SFP28 / QSFP28 | 25Gbps / 100Gbps | 3 meters | Intra-rack host-to-ToR switch connections |
| **MMF (Multi-Mode Fiber)** | LC Duplex | 25Gbps / 100Gbps | 100 meters | Inter-rack or end-of-row switch links |
| **SMF (Single-Mode Fiber)** | LC Duplex | 100Gbps | 10 kilometers | Datacenter-to-datacenter optical trunks |
| **Cat6A RJ45** | RJ45 | 1Gbps / 10Gbps | 100 meters | Dedicated iDRAC / iLO management ports |
| **RS-232 Serial** | RJ45 / DB9 | 115.2 Kbps | 15 meters | Opengear serial console management |

---

## 3. Switch Embedded Teaming (SET)

Azure Local utilizes **Switch Embedded Teaming (SET)** at the Hyper-V vSwitch layer instead of traditional LACP / LAG port channeling.

- **Load Balancing Algorithm**: Dynamic or Hyper-V Port mode.
- **Port Isolation**: Physical ports bound to the SET team are overlaid on the Draftsman isometric canvas with a glowing cyan boundary line.
- **Symmetry**: adapters in a team must be identical (make, model, speed, configuration). `RULE-INTENT-SYMMETRY` checks speed and media.
- **Out-of-band**: iDRAC or iLO ports use Cat6A to a 1G OOB switch; serial console uses RS-232 to a console server (`RULE-OOB-MANAGEMENT`).
