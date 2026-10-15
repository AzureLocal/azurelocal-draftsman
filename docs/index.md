# Azure Local Draftsman Public Technical Documentation Hub

Welcome to the **Azure Local Draftsman** public documentation library. This documentation set provides technical reference guides for designing, wiring, isolating, and validating enterprise **Azure Local** and Hyper-V cluster network architectures.

---

## 📚 Documentation Index

1. **[Physical Node-to-Switch Cabling Architecture](cabling-standards.md)**
   - Dual-ToR cross-connect requirements for high availability.
   - SFP28 (25GbE) and QSFP28 (100GbE) port anchor geometry.
   - Out-of-Band (OOB) iDRAC / iLO Cat6A wiring & RS-232 serial console connection to Opengear.
   - Switch Embedded Teaming (SET) port overlays.

2. **[Logical Network Isolation & HCI VLAN Profiles](logical-hci-vlans.md)**
   - Management Network (VLAN 711, MTU 1500).
   - Compute / Tenant VM Network (VLAN 712, MTU 1500 / 9000).
   - Storage Spaces Direct (S2D) RoCEv2 Fabric 1 (VLAN 713, MTU 9000 Jumbo Frames).
   - Storage Spaces Direct (S2D) RoCEv2 Fabric 2 (VLAN 714, MTU 9000 Jumbo Frames).

3. **[Pre-Flight Compliance Auditor Engine](compliance-auditor.md)**
   - Real-time diagram evaluation rules (`RULE-TOR-REDUNDANCY`, `RULE-MTU-JUMBO`, `RULE-SET-PORT-BALANCE`, `RULE-VLAN-ALIGNMENT`, `RULE-OOB-MANAGEMENT`).
   - Canvas alert badges and fix workflows.

4. **[Cabling Schedule & Switch Port Map Exporters](schedule-exporters.md)**
   - Technician Cabling Schedule CSV exporter format specification.
   - Network Engineer Switch Port Provisioning Map TXT format specification.

5. **[Guided 5-Step Architecture Setup Wizard Guide](guided-setup-wizard.md)**
   - 5-step wizard walkthrough for generating 2, 4, or 8-node Dell PowerEdge HCI clusters pre-wired to Arista/Cisco ToR switches.
