# Logical networks and VLAN profiles

Azure Local traffic is separated into logical networks so storage bandwidth does not contend with virtual machine or host management traffic. Draftsman draws each as an area with a VLAN, a subnet and an MTU.

## Default schedule

| Network | VLAN | Subnet (example) | MTU | RDMA | Notes |
|---|:---:|---|:---:|:---:|---|
| **Management** | 7 (example) | `192.168.7.0/24` | 1500 | No | Host management, Arc agent, WAC, AD. Network ATC does not set this VLAN. |
| **Compute / tenant** | 8 (example) | `10.0.8.0/24` | 1500 | No | Virtual machine traffic. |
| **Storage 1** | **711** | `10.71.1.0/24` | 9000 | Yes | Network ATC default for storage adapter 1. |
| **Storage 2** | **712** | `10.71.2.0/24` | 9000 | Yes | Network ATC default for storage adapter 2. |
| **Storage 3** | **713** | `10.71.3.0/24` | 9000 | Yes | Third adapter; used by a 3-node switchless mesh. |

Management and compute IDs are example values (the rack-aware reference architecture uses 7 and 8 in its examples). Replace them with your own.

## Custom VLANs and the Network ATC defaults

Network ATC gives storage adapters VLANs 711, 712, 713 and so on up to 718 (719 reserved) unless you pass `StorageVlans`. You can use any VLAN for any network in Draftsman. When a **non-storage** network uses 711 to 719 the auditor raises `RULE-VLAN-ATC-COLLISION` as a warning, never an error: the design stays valid, but a storage intent that keeps the defaults would reuse that VLAN.

## Jumbo frames

MTU 9000 on storage is common practice and recommended for SMB Direct. It is **not** required for RoCEv2; Learn requires jumbo frames only for iWARP when the hosts use them (switch MTU 9216). Draftsman reports a standard MTU on a storage network as a recommendation (info) for RoCEv2 and as a warning when the design is set to iWARP. If you use jumbo frames, configure them end to end: adapters, vSwitch, and every switch port that carries the VLAN. A mismatch causes silent drops.

Sources: [Network ATC default values](https://learn.microsoft.com/azure/azure-local/deploy/network-atc#default-network-atc-values), [rack-aware reference architecture](https://learn.microsoft.com/azure/azure-local/concepts/rack-aware-cluster-reference-architecture).
