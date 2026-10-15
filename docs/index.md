# Azure Local Draftsman documentation

Draftsman is a browser-based cabling and compliance diagramming tool for Azure Local network architectures. These guides cover designing, wiring, validating and exporting a cluster network. Open the app at <https://azurelocal.cloud/azurelocal-draftsman/>.

## Guides

1. **[Cabling standards](cabling-standards.md)**: dual-ToR cross-connect, switchless storage and rack-aware wiring, cable media, SET teams, OOB cabling.
2. **[Logical networks and VLANs](logical-hci-vlans.md)**: the default VLAN schedule, the Network ATC storage defaults (711, 712, 713) and custom VLANs.
3. **[Network ATC intents and cluster patterns](network-atc-intents.md)**: switched, switchless and rack-aware patterns; intent layouts; saved-diagram migration.
4. **[Compliance auditor](compliance-auditor.md)**: the 16 rules, each with its Microsoft Learn source.
5. **[Cable schedule and switch port map exporters](schedule-exporters.md)**: CSV and TXT formats.
6. **[draw.io export](drawio-export.md)**: the `.drawio` export and how it compares with Trailwright's.
7. **[Guided setup wizard](guided-setup-wizard.md)**: generate an audit-clean topology in five steps.

## Origin

Draftsman is forked from [AzLoFlows](https://github.com/CristianEdwards/AzLoFlows) by Cristian Edwards Sabathe (MIT licence, kept in the repository). The Azure Local traffic-flow scenarios of the upstream project remain available in the app under Scenarios and Templates.
