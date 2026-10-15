# draw.io export and comparison with Trailwright

`Export > Cabling Topology (draw.io)` writes an uncompressed `.drawio` file (mxfile XML) that opens in draw.io, diagrams.net and the VS Code draw.io extension. It is built by `buildDrawio` in `src/features/export/exportDrawio.ts`, a pure function of the diagram document.

## Content

| draw.io cell | Source in the diagram | id |
|---|---|---|
| Title text | diagram name | `title` |
| Rounded box, light blue | ToR / other switch: title, subtitle, model, zone, trunk VLANs | `sw-N` |
| Rounded box, light grey, left aligned | Host node: title, model, zone, one line per Network ATC intent with traffic and ports | `node-N` |
| Rounded box, grey | OOB switch or console server | `oob-N` |
| Dashed green rectangle (40 % opacity) | Logical network area: name, VLAN, CIDR, MTU | `net-N` |
| Edge | One per cable, `source` and `target` set to the shapes, label `portA - portB  VLAN n  MEDIA` | `e-N` |
| Dashed orange edge | Node-to-node switchless storage cable | `sl-A-B-L` |

Edge colours follow what the cable carries: management and compute `#1a73e8`, storage `#e8710a`, OOB and console grey `#5f6368` (dashed). Cables whose end no longer exists in the diagram are skipped. All text is attribute-escaped, so a device name cannot inject markup.

## Comparison with Trailwright

Trailwright (the AzureLocal deployment planner) produces its own draw.io export (`apps/trailwright/src/exports/topologyDrawio.ts`) from a deployment project (cluster facts, intents, networking), not from a drawn diagram. The two files are meant to be read side by side and to look alike. No code is shared between the repositories.

| Aspect | Trailwright | Draftsman |
|---|---|---|
| Input | Project model (nodes, intents, storage pattern, SAN) | Drawn diagram (positions chosen by the author) |
| File skeleton | `mxfile host="trailwright"` > `diagram name="topology"` > `mxGraphModel` > `root` with cells `0` and `1` | Same, with `host="draftsman"` |
| Text escaping | `&`, `"`, `<`, `>`, newline as `&#xa;` | Identical |
| Shape ids | `sw-N`, `node-N`, `san`, `fc-N` | `sw-N`, `node-N`, `oob-N`, `net-N` |
| Edge ids | `e-<node>-<port>`, `sl-A-B-L` (direct storage), `san-sw-N` | `e-N`, `sl-A-B-L` (direct storage) |
| Fills and colours | switch `#e8f0fe`, node `#f8f9fa`, management `#1a73e8`, storage `#e8710a` | Identical |
| Layout | Computed (switch row, node row, edge routing points) | Author's layout, translated so the top-left is at (40, 40) |
| Edge attachment | Free `sourcePoint`/`targetPoint` | `source`/`target` shape ids, so edges follow when shapes move |
| Extras | SAN, Fibre Channel, cluster and iSCSI networks | OOB devices, logical network areas, zones, intents, trunk VLANs |
| Port labels | OS adapter names | Hardware profile port ids (`OCP-P1`, `Eth12`) |

Where the two overlap (switch and node shapes, direct storage links, colours, ids), a diagram exported from either tool can be merged or restyled in draw.io without renaming cells. Differences in edge ids are deliberate: Draftsman edges are numbered by cable order because a cable has no node/port coordinates until the author draws it.

Compatibility notes for maintainers: keep the file uncompressed (Trailwright's tests and draw.io diffs rely on readable XML), keep `host` as the tool name, and if Trailwright changes its style strings update `STYLE` and `DRAWIO_COLORS` in `exportDrawio.ts` and the table above.
