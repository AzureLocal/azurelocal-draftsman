# Changelog

All notable changes to Azure Local Draftsman will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this
project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.2.0] - 2026-10-15

Draftsman is now the cabling and compliance tool for Azure Local. Versions before 0.2.0 carry the history inherited from AzLoFlows (upstream, Cristian Edwards Sabathe).

### Added
- Pattern-aware compliance auditor with 16 rules, each linked to its Microsoft Learn source: switchless (1 to 4 nodes, full mesh), rack-aware (two zones, even node count up to 8), MLAG peer link, storage-only switch pair, RoCE QoS reminder, Network ATC VLAN collision (non-blocking), and four Network ATC intent rules.
- `RULE-VLAN-ALIGNMENT` implemented (it was documented but missing): trunk allow-list, matching VLANs on both ToR paths, consistent VLANs inside a SET intent, one VLAN per storage adapter.
- Document model version 2: cluster design (pattern, storage, RDMA, ToR per zone), per-host Network ATC intents, zones, switch trunk VLANs. Version 1 files load unchanged.
- Node inspector: zone, Network ATC intent editor, trunk VLANs. Area inspector: network purpose and custom VLAN with collision hint. Audit drawer: cluster design selectors and Learn links.
- Guided wizard: switchless (2 and 3 nodes), switched (4 and 8 nodes) and rack-aware (4 and 8 nodes) presets, intent layout choice, MLAG peer links, per-ToR trunk VLANs.
- draw.io export of the cabling topology; documentation comparing it with Trailwright's export.
- Dell AX-770, AX-670 and S3148P hardware profiles (reference port layouts).
- GitHub Pages workflow (`ci-pages`): lint, test, audit, build, deploy to https://azurelocal.cloud/azurelocal-draftsman/ with the VitePress docs under `/docs/`.
- release-please configuration.
- 160+ unit tests: one file per rule group, serialization round trip and migration, CSV and port map content, wizard output audited.

### Changed
- Storage VLAN defaults follow Network ATC: 711, 712, third adapter 713 (10.71.x.0/24). Management and compute defaults are example values 7 and 8. The old 711 management, 712 compute, 713/714 storage defaults collided with Network ATC and produced wrong designs.
- `RULE-TOR-REDUNDANCY` no longer flags node-to-node switchless storage links; dual ToR applies to management and compute and to switched storage.
- `RULE-MTU-JUMBO` follows Learn: jumbo frames are required only for iWARP; a standard MTU on RoCEv2 storage is a recommendation.
- Cable schedule CSV gains an `Intent` column, RFC 4180 quoting and formula-injection protection; exporters are pure functions.
- README and docs describe the cabling and compliance tool; AzLoFlows is credited as the upstream origin. Version 0.2.0, package metadata and roadmap updated to reality.
- Vite base is `/azurelocal-draftsman/`; VitePress base `/azurelocal-draftsman/docs/` (was `/azurelocal-azloflows/`).

### Fixed
- Wizard referenced hardware profile ids that do not exist, so generated diagrams had no ports; ids corrected and tested.
- Wizard anchors beyond the valid range for 8-node clusters.
- Saved diagrams lost hardware profile, SET teams and hardware role on reload.
- `RULE-OOB-MANAGEMENT` accepted any Cat6A cable (for example to a ToR) as out-of-band.
- Stale local paths and the old repository name in the pipeline header, hooks and handoff notes.

### Removed
- The AzLoFlows live portal links and dead workflow badges from the README; the "stretched cluster" wording (rack-aware replaces it).

### Added
- ESLint flat config with TypeScript and React Hooks rules
- ARIA accessibility labels for all color swatches and inspector inputs
- `-webkit-backdrop-filter` prefixes for Safari compatibility
- CodeQL security scanning workflow
- CHANGELOG, CODE_OF_CONDUCT

### Fixed
- Dead code in `renderCloud.ts` (buggy `p()` function removed)
- `dangerouslySetInnerHTML` wrapper marked `aria-hidden` in ShapePalette

### Changed
- Moved spec documents to `docs/` folder
- Updated `package.json` with public metadata (homepage, repository, keywords)
- Added Open Graph and Twitter meta tags to `index.html`

### Removed
- 17 stale root-level scripts (patch, rebuild, migrate helpers)
- Legacy `azure-local-public-path-dark-flows-v7.html`

## [1.3.0] — 2025-06-10

### Added
- Predefined scenario picker with manifest-driven loading
- Comprehensive README with feature tables, architecture tree, and keyboard shortcuts
- CI validation pipeline (ESLint, TypeScript, Vite Build, Unit Tests)
- GitHub issue templates and contribution docs (CONTRIBUTING, SECURITY)
- Branch protection rules on `main`

### Fixed
- Empty document now starts with no picker definitions (scenarios, flowSources, flowTypes)
- Scenario/flow pickers reset correctly when creating a new diagram
- Pipe rendering no longer clipped by nodes with lower zIndex
- Standing node hover detection for elevated anchors

### Removed
- Pipe risers and connector elevation features (reverted)

## [1.2.0] — 2025-05-28

### Added
- Context menu max-height dynamically adjusts to viewport
- Full inspector controls in context menu (removed standalone sidebar panel)

### Fixed
- SVG export: server rack renders stacked blades, gaps, and LEDs
- SVG export: face colors match canvas `darkenHex` gradients
- SVG export: standing panels render with correct upward orientation
- SVG export: text/icon position and size for card and standing nodes
- SVG export: connector stubs for standing panels match canvas direction
- Context menu clamped to all viewport edges

### Removed
- NIC (Network Adapter) shape (added then removed in same cycle)
- Standalone Components panel from sidebar

## [1.1.0] — 2025-05-15

### Added
- App version display in toolbar brand block
- Standing panels have anchors on all 4 edges
- Per-waypoint connector elevation

### Fixed
- Card text position persistence and icon size/overlap
- Card text and icon stack clamped within shape boundaries
- Standing node light mode uses `node.fill` instead of darkened deep tone
- Palette panel shape icons mirror to match canvas orientation
- Cache-bust predefined scenario fetches

### Changed
- Renamed `database` shape to `storage` across entire codebase

## [1.0.0] — 2025-05-01

### Added
- Interactive isometric canvas with pan, zoom, and grid snapping
- Shape palette: node, card, area, cloud, diamond, hexagon, cylinder, pipe, connector, text, monitor, laptop, browser, dashboard, chart panel, analytics panel, gauge, server rack
- Multi-select, copy/paste, undo/redo with keyboard shortcuts
- Right-click context menu with color swatches and entity actions
- Layer management panel with drag-to-reorder and visibility toggles
- SVG and PNG export with high-fidelity rendering
- Dark and light mode toggle
- Local storage persistence with version history
- Minimap for large diagrams
- Search dialog for finding entities by label
- GitHub Pages deployment workflow
- Predefined scenario loading from JSON manifests
