# Guided 5-step setup wizard

The wizard builds a complete, fully cabled diagram for a chosen pattern. The result is audit-clean by construction: a test generates every preset and runs the auditor over it.

## Steps

1. **Topology target.** Pick a pattern preset:
   - 2-node switchless cluster (node-to-node storage, two ToR for management and compute)
   - 3-node switchless cluster (full storage mesh, VLANs 711, 712, 713)
   - 4-node dual-ToR HA cluster (one MLAG ToR pair for all traffic)
   - **8-node high-density cluster** (single rack, one MLAG ToR pair)
   - rack-aware cluster with 4 or 8 nodes over two zones (two ToR per room, dedicated storage links between rooms)
2. **Server hardware.** Dell AX-760, AX-660, AX-770 or AX-670 (reference port layouts: iDRAC, OCP 3.0 and PCIe ports).
3. **Network and OOB stack.** ToR switch model (Arista 7050SX3, Cisco Nexus 93180YC, Dell S5248F or S5224F, Nvidia Spectrum SN2100) and OOB device (Opengear OM2248 or CM8148, Dell N3248TE or S3148P).
4. **Network ATC intents, VLANs and MTU.** Choose the intent layout (management plus compute with storage, group all, or disaggregated), the VLAN IDs and the storage MTU. Defaults: management 7, compute 8, storage 711 and 712 (Network ATC defaults). Choices a pattern cannot use are replaced with the nearest valid layout and the wizard tells you. A management or compute VLAN on 711 to 719 shows a non-blocking collision warning.
5. **Cabling media and review.** DAC 25G or MMF 100G, then review and generate.

## Start from your infrastructure.yml

Step 1 has a **Start from your infrastructure.yml** box. Choose the environment's `infrastructure.yml` (the azurelocal-toolkit file, schema 5, the same file Trailwright, ZTP, the toolkit scripts, Sonar and Ranger use) and the wizard fills its answers from it, so the diagram and the deployment share one design. The file is read in the browser and never uploaded.

| Wizard answer | Read from |
| --- | --- |
| Topology preset | `nodes[]` (the node count), `scenario.topology` (`standard` or `rack_aware`), `scenario.storage_connectivity` (`switched` or `switchless`) |
| Intent layout | `networking.intents[].traffic`: one intent with all three traffic types is *group all*; a management and compute intent plus a storage-only intent is *management plus compute with storage*; three single-traffic intents are *disaggregated*. Any other layout is left for you to edit on the canvas |
| Management VLAN | `networking.management.vlan_id`, else the `networking.vlans[]` entry with `purpose: management` |
| Compute VLAN | the `networking.vlans[]` entry with `purpose: compute`, else the logical network with `purpose: compute` |
| Storage VLANs | `networking.storage.networks[].vlan_id` in adapter order, else the `networking.vlans[]` entries with `purpose: storage` (or a name starting `storage`) |
| Storage MTU | `networking.intents[].overrides.adapter.jumbo_packet` of the intent that carries storage (4088 or more is 9000, 1514 is 1500) |
| Server model | `hardware.model` (AX-760, AX-660, AX-770 or AX-670) |
| ToR switch | the `network_devices[]` entries of type `switch`, when the model is one of the five Draftsman has a profile for |

Anything the file does not say, or that Draftsman has no preset or profile for, is listed under the box and the wizard keeps its own value for it: nothing is guessed. The file is a starting point; the next steps still let you change every answer. Draftsman only reads the file; it never writes one.

## What is generated

- ToR switches (A and B, or two per zone) with MLAG peer links, and room-to-room storage links for rack-aware.
- Each host with Network ATC intents, SET teams for management and compute intents, its zone, and pin-level cables (`OCP-P1` to a ToR port, storage ports to the ToR or node to node, iDRAC to the OOB device).
- Logical network areas with VLAN, CIDR (Network ATC defaults 10.71.x.0/24 for storage) and MTU.
- The cluster design (`pattern`, `storage`, `intentModel`) that the auditor reads.

The wizard supports switchless clusters of 2 and 3 nodes. Azure Local supports 1 to 4 nodes; draw a 4-node mesh by hand and the auditor checks it.
