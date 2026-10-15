# Cable schedule and switch port map exporters

Draftsman exports production-ready installation manifests directly from the diagram. The exporters are pure functions (`buildCableScheduleCsv`, `buildSwitchPortMap`, `buildDrawio`) covered by content tests.

## 1. Cable schedule (CSV)

One row per cable, in diagram order, for the technicians wiring the racks. UTF-8, RFC 4180 quoting; a cell that starts with `=`, `+`, `-`, `@`, tab or CR gets a leading apostrophe so a spreadsheet does not run it as a formula.

| Column | Example |
|---|---|
| `Cable_Tag` | `CBL-001` (or the cable tag label) |
| `Source_Device` | `Node-1 (AX-760)` |
| `Source_Port` | `OCP-P1` (`Front Face` when no port is set) |
| `Target_Device` | `Arista 7050SX3 (ToR-A)` |
| `Target_Port` | `Eth1` |
| `Cable_Medium` | `DAC (Direct Attach Copper)` |
| `Speed_Gbps` | `25G / 100G` |
| `VLAN_ID` | `VLAN 7` or `Untagged` |
| `Intent` | Network ATC intent of the host port, e.g. `Management_Compute` |
| `Notes` | free text |

## 2. Switch port map (TXT)

One block per switch or console server: model, role, zone and trunk VLANs (when set), then each port with the device and port on the other end and the VLAN tag (`Trunk/Native` when untagged). Use it to prepare the switch CLI trunk profiles.

## 3. draw.io

`Export > Cabling Topology (draw.io)` writes an uncompressed `.drawio` file. See [draw.io export](drawio-export.md).
