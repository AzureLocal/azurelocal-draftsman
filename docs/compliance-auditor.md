# Compliance auditor

The auditor inspects the diagram continuously and reports findings as badges on the canvas and as a list in the **Pre-Flight Audit** drawer. It is a pure function of the diagram document (`auditDiagramDocument`), so the same diagram always gives the same result. Each rule links to the Microsoft Learn page it is based on (checked against Azure Local 12.2609, latest).

## How rules read the design

- **Pattern** (`cluster`): single-rack or rack-aware, switched or switchless storage, RoCE or iWARP, one or two ToR per room. Set it in the drawer; when absent it is inferred (a host-to-host cable means switchless, nodes in two zones mean rack-aware).
- **Intents**: per-host Network ATC intents decide what each cable carries. Without intents a cable to a ToR is "unknown traffic" and counts for redundancy but not for storage rules.
- **Severity**: error (design is wrong), warning (discouraged or risky), info (reminder or recommendation). Warnings and info never block anything.

## Rule catalog

| Rule | Severity | What it checks | Learn |
|---|:---:|---|---|
| `RULE-TOR-REDUNDANCY` | error (warning for one ToR per room) | Each host reaches two distinct ToR switches for management and compute, and for storage in switched designs. Node-to-node switchless storage links are never counted or flagged. | [Decision 3: cluster topology](https://learn.microsoft.com/azure/azure-local/plan/cloud-deployment-network-considerations#decision-3-determine-cluster-topology) |
| `RULE-MTU-JUMBO` | info (warning for iWARP) | Storage networks use MTU 9000. Jumbo frames are recommended for SMB Direct; required only for iWARP when hosts use them, not for RoCEv2. | [Rack-aware reference architecture](https://learn.microsoft.com/azure/azure-local/concepts/rack-aware-cluster-reference-architecture#tor-switch-architecture) |
| `RULE-SET-PORT-BALANCE` | warning | Members of a SET team are cabled to different switches (switch-independent teaming). | [Host network requirements: SET](https://learn.microsoft.com/azure/azure-local/concepts/host-network-requirements#switch-embedded-teaming-set) |
| `RULE-OOB-MANAGEMENT` | info | Each host has an iDRAC or serial cable to an OOB switch or console server. A Cat6A cable to a ToR does not count. | [Decision 3](https://learn.microsoft.com/azure/azure-local/plan/cloud-deployment-network-considerations#decision-3-determine-cluster-topology) |
| `RULE-VLAN-ALIGNMENT` | error (warning for shared storage VLAN) | A tagged VLAN is allowed on the switch trunk (when the switch lists trunk VLANs); management and compute VLANs match on both ToR paths and across the ports of one SET intent; two storage adapters on one VLAN in a switched design is flagged. | [Storage traffic models](https://learn.microsoft.com/azure/azure-local/concepts/host-network-requirements#storage-traffic-models) |
| `RULE-VLAN-ATC-COLLISION` | warning | A custom non-storage VLAN on 711 to 719 collides with the Network ATC storage defaults. Non-blocking. | [Network ATC default VLANs](https://learn.microsoft.com/azure/azure-local/deploy/network-atc#default-vlans) |
| `RULE-SWITCHLESS-SCALE` | error / info | Switchless storage supports 1 to 4 nodes; a 3-node switchless cluster needs a manual storage IP plan. | [Switchless considerations](https://learn.microsoft.com/azure/azure-local/plan/network-patterns-overview#storage-switchless-connectivity-considerations) |
| `RULE-SWITCHLESS-MESH` | error | Every node pair has a direct storage cable and each node has at least two storage links. | [Switchless considerations](https://learn.microsoft.com/azure/azure-local/plan/network-patterns-overview#storage-switchless-connectivity-considerations) |
| `RULE-STORAGE-SWITCH-ISOLATION` | warning | In a single-rack switched design all host traffic uses one MLAG ToR pair; a storage-only switch pair is discouraged. | [Decision 3](https://learn.microsoft.com/azure/azure-local/plan/cloud-deployment-network-considerations#decision-3-determine-cluster-topology) |
| `RULE-MLAG-PEER-LINK` | warning | In a single-rack design the two ToR switches serving a host are joined by a peer link. | [Decision 3](https://learn.microsoft.com/azure/azure-local/plan/cloud-deployment-network-considerations#decision-3-determine-cluster-topology) |
| `RULE-RACK-AWARE` | error / warning | Switched storage, even node count up to 8, two balanced zones, a ToR in each zone (one per room warns), and a room-to-room storage path or every node cabled to both rooms. | [Decision 3](https://learn.microsoft.com/azure/azure-local/plan/cloud-deployment-network-considerations#decision-3-determine-cluster-topology), [reference architecture](https://learn.microsoft.com/azure/azure-local/concepts/rack-aware-cluster-reference-architecture) |
| `RULE-RDMA-QOS` | info | One reminder per cluster: RoCE needs PFC, ETS and DCB on every RDMA port, switches and room links included. | [RDMA traffic considerations](https://learn.microsoft.com/azure/azure-local/concepts/host-network-requirements#rdma-traffic-considerations) |
| `RULE-INTENT-COVERAGE` | error | Management, compute and storage are all carried by an intent (storage not required on a single node); a port is in one intent; ports exist on the hardware profile. | [Network ATC example intents](https://learn.microsoft.com/azure/azure-local/deploy/network-atc#example-intents) |
| `RULE-INTENT-SYMMETRY` | error | Every node has the same intents and port counts; adapters of one intent have the same speed and media. | [Network ATC prerequisites](https://learn.microsoft.com/azure/azure-local/deploy/network-atc#prerequisites) |
| `RULE-INTENT-STORAGE-RDMA` | error | Ports of an intent that carries storage are RDMA-capable (SFP-type at 10 Gbps or faster, or an explicit override). | [RDMA](https://learn.microsoft.com/azure/azure-local/concepts/host-network-requirements#rdma) |
| `RULE-INTENT-LAYOUT` | error / warning | A storage intent has two ports; switchless and rack-aware keep storage on a dedicated intent; more than three intents warns. | [Network ATC example intents](https://learn.microsoft.com/azure/azure-local/deploy/network-atc#example-intents) |

The catalog also lives in code (`COMPLIANCE_RULES` in `src/types/validation.ts`), and a test asserts every reported rule id exists in it.

## Known limits

The auditor works from what the diagram can express. It does not see adapter make and model, adapter names across nodes, driver state, DCB settings on real switches, round-trip latency between rooms (1 ms or less for rack-aware) or an external SAN (not supported with rack-aware). Those Learn requirements stay in your deployment checklist.

## Canvas badges and the drawer

- Badges pulse on non-compliant nodes, networks and cables.
- Click an entry in the drawer to select the affected entity; click the rule id to open its Learn page.
- The **Design** row at the top sets pattern, storage, RDMA protocol and ToR count per room; **Auto** returns to inference.
