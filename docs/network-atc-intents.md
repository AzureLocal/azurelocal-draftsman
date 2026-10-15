# Network ATC intents and cluster patterns

Draftsman models the host networking decisions that Network ATC applies, so the cabling you draw and the intents you plan stay consistent. Everything below follows Microsoft Learn (checked against Azure Local 12.2609, latest).

## Cluster patterns

| Pattern | Draftsman setting | Rules |
|---|---|---|
| **Single rack, switched storage** | `single-rack` + `switched` | One MLAG ToR pair carries management, compute and storage. A separate storage-only switch pair is discouraged. |
| **Single rack, switchless storage** | `single-rack` + `switchless` | Node-to-node storage cables in a full mesh, 1 to 4 nodes. Storage adapters are single-purpose; a switch is still needed for management and compute. A 3-node mesh has no automatic Network ATC storage IPs. |
| **Rack-aware** | `rack-aware` + `switched` | Even node count up to 8 over two zones (rooms), a ToR in each zone, a dedicated storage intent, a room-to-room storage path (ToR1 to ToR3, ToR2 to ToR4) or every node cabled to both rooms. Two ToR per room are recommended; one per room is allowed. |

A stretched cluster is not modelled: it is no longer offered for new deployments. Use rack-aware instead.

Set the pattern in the audit drawer (**Design**). Without an explicit setting the auditor infers it: a cable between two hosts means switchless, nodes in two zones mean rack-aware.

Sources: [network patterns overview](https://learn.microsoft.com/azure/azure-local/plan/network-patterns-overview), [cloud deployment network considerations](https://learn.microsoft.com/azure/azure-local/plan/cloud-deployment-network-considerations), [rack-aware reference architecture](https://learn.microsoft.com/azure/azure-local/concepts/rack-aware-cluster-reference-architecture).

## Intents

An intent assigns host ports to management, compute and/or storage traffic. Draftsman stores intents per host node (`intents`) and offers three layouts, which you can edit in the node inspector (up to three intents are accepted without a warning):

| Layout | Intents | Ports (AX-760 example) | Valid for |
|---|---|---|---|
| **Management + Compute, Storage** | `Management_Compute`, `Storage` | OCP-P1/P2, Slot1-P1/P2 | all patterns; the only layout for switchless and rack-aware |
| **Group all** | `Compute_Management_Storage` | OCP-P1/P2 | switched single-rack |
| **Disaggregated** | `Management`, `Compute`, `Storage` | OCP, Slot1, Slot2 | switched single-rack with six data ports |

Rules applied to intents: all three traffic types are carried, a port belongs to one intent, every node has the same intents and port counts, adapters inside an intent are symmetric (speed and media), storage ports are RDMA-capable, a storage intent has at least two ports (a single-node cluster is exempt). See [compliance-auditor](compliance-auditor.md).

Source: [Deploy host networking with Network ATC](https://learn.microsoft.com/azure/azure-local/deploy/network-atc), [host network requirements](https://learn.microsoft.com/azure/azure-local/concepts/host-network-requirements).

## VLAN defaults

Network ATC assigns these VLANs to storage adapters unless you pass `StorageVlans`:

| Storage adapter | VLAN | Automatic subnet |
|---|---|---|
| 1 | 711 | 10.71.1.0/24 |
| 2 | 712 | 10.71.2.0/24 |
| 3 | 713 | 10.71.3.0/24 |
| 4 to 8 | 714 to 718 | not used by Draftsman |
| future use | 719 | reserved |

The management VLAN is whatever you configure; Network ATC does not change it. Draftsman's example values are 7 (management) and 8 (compute). A management, compute or other non-storage network on 711 to 719 is **allowed** but raises the non-blocking warning `RULE-VLAN-ATC-COLLISION`, because a storage intent that keeps the defaults would reuse the same VLAN.

## Saved diagrams

Diagram files with `version` 1 (before cluster design, intents and zones) load unchanged: every new field is optional and the auditor infers the pattern from the cabling. Saving writes `version` 2.

## Limits of the model

The diagram cannot express NIC make/model/driver, adapter names, DCB/QoS settings, round-trip latency or an external SAN, so those Learn requirements are reminders (`RULE-RDMA-QOS`) or out of scope. RDMA capability is a heuristic (SFP-type ports at 10 Gbps or faster); a hardware profile port group can override it with `rdmaCapable`.
