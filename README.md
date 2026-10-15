# Azure Local Draftsman

[![CI and Pages](https://github.com/AzureLocal/azurelocal-draftsman/actions/workflows/ci-pages.yml/badge.svg)](https://github.com/AzureLocal/azurelocal-draftsman/actions/workflows/ci-pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Azure Local Draftsman is a free, browser-based cabling and compliance diagramming tool for Azure Local network architectures.** Draw the servers, top-of-rack (ToR) and out-of-band (OOB) switches, pin-level cables, VLANs and Network ATC intents of a cluster on a 2.5D isometric canvas, let the auditor check the design against the Microsoft Learn network patterns, and export the cable schedule and the switch port map your technicians and network engineers work from.

> No sign-up. No server. Everything runs in your browser; diagrams stay in your browser storage until you export them.

**Open it: <https://azurelocal.cloud/azurelocal-draftsman/>** (documentation: <https://azurelocal.cloud/azurelocal-draftsman/docs/>)

The Learn references were checked against Azure Local 12.2609 (latest).

![Draftsman canvas](docs/screenshot-public-path-proxy-arc.png)

## What it does

| Area | Capability |
|------|------------|
| **Design** | Dell, Arista, Cisco, Nvidia and Opengear hardware profiles with real port groups; pin-level cables (DAC, MMF, SMF, Cat6A, RS-232) with VLAN tags; SET teams; logical networks (VLAN, CIDR, MTU). |
| **Patterns** | Switched storage on one MLAG ToR pair, switchless storage (1 to 4 nodes), and rack-aware clusters (two zones). |
| **Network ATC** | Per-host intents: group-all, management plus compute with a dedicated storage intent, or disaggregated (three intents). |
| **Wizard** | Generates a fully cabled, audit-clean design for 2 and 3 node switchless, 4 and 8 node switched, and 4 and 8 node rack-aware clusters. |
| **Auditor** | 16 pattern-aware rules, each linked to its Microsoft Learn source, shown live as canvas badges and in the audit drawer. See [compliance-auditor](docs/compliance-auditor.md). |
| **Exports** | Cable schedule CSV, switch port map TXT, draw.io (`.drawio`), PNG, SVG, PDF, interactive HTML and JSON. |

### Network ATC defaults the tool follows

Network ATC assigns storage VLANs 711, 712, 713 and up by default (10.71.1.0/24, 10.71.2.0/24, 10.71.3.0/24). Draftsman uses those for storage, so a diagram matches what Network ATC will configure. Management and compute VLANs are not set by Network ATC; the tool ships example values (7 and 8) and warns, without blocking, when you put a non-storage network on 711 to 719. See [Network ATC intents](docs/network-atc-intents.md).

## Run it locally

```bash
git clone https://github.com/AzureLocal/azurelocal-draftsman.git
cd azurelocal-draftsman
npm ci
npm run dev          # http://localhost:8125/
```

```bash
npm run lint         # ESLint
npm test             # Vitest
npm run build        # type check + Vite build into dist/ (base /azurelocal-draftsman/)
npm run build:site   # app + VitePress docs assembled for GitHub Pages (docs under /docs/)
```

Pushes to `main` run the `ci-pages` workflow (lint, test, audit, build) and deploy the assembled site to GitHub Pages.

## Architecture

```
src/
├── app/                  # Shell layout (top toolbar, status bar)
├── features/
│   ├── canvas/           # Viewport, overlays, renderers (switch, server, OOB, connector, area)
│   ├── export/           # Cable schedule CSV, switch port map, draw.io, PNG/SVG/PDF/HTML/JSON
│   ├── inspector/        # Property editor, Network ATC intent editor
│   ├── palette/          # Hardware palette and preset stacks
│   ├── validation/       # Auditor (rules/ = one module per rule group) and audit drawer
│   ├── wizard/           # Guided setup and the pure topology builder
│   └── ...               # layers, templates, landing page, traffic-flow scenarios (upstream)
├── lib/
│   ├── geometry/         # Isometric projection, anchors, routing
│   ├── serialization/    # Document storage, normalization and migration
│   └── topology/         # Pure analysis helpers shared by the rules
├── state/                # Zustand store, undo/redo
└── types/                # Document model, hardware profiles, cabling, topology, validation
```

The document stores flat logical coordinates; isometric projection happens only when rendering. The auditor, wizard builder and exporters are pure functions of the document, which is what makes them unit-testable.

## Origin and licence

Draftsman started as a fork of **[AzLoFlows](https://github.com/CristianEdwards/AzLoFlows)** by Cristian Edwards Sabathe (MIT). The isometric canvas, projection helpers, visual tokens and the scenario-based traffic-flow diagrams (still available under Templates and Scenarios) come from that project. This repository narrows the product to cabling and compliance for Azure Local. The original copyright notice and the MIT licence are kept in [LICENSE](LICENSE).

## Contributing and security

See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md). Agent and tooling conventions are in [AGENTS.md](AGENTS.md).

## License

[MIT](LICENSE).
