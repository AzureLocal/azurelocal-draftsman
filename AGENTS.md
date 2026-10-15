# azurelocal-draftsman — Agent instructions

<!--
  AGENTS.md is the canonical, cross-tool instruction file for this repo.
  Codex CLI, Cursor, and VS Code Copilot read it natively; Claude Code
  imports it via CLAUDE.md; Gemini reads it via contextFileName.
  Keep it THIN — it is a bootstrap and an offline fallback, not a full
  standards library. The authoritative source is the HCS Governance MCP.
-->

## What this repo is

Azure Local Draftsman: a browser-based (React, TypeScript, Vite, Vitest) cabling and compliance diagramming tool for Azure Local network architectures. Servers, ToR and OOB switches, pin-level cables, VLANs and Network ATC intents are drawn on a 2.5D canvas; a pure-function auditor checks them against the Microsoft Learn network patterns (single-rack switched, switchless, rack-aware); exporters produce the cable schedule CSV, switch port map and draw.io. Forked from AzLoFlows by Cristian Edwards Sabathe: keep the upstream credit and the LICENSE as they are. It is not a deployment tool and makes no Azure calls.

### Repo conventions

- Learn wins: every auditor rule cites a Microsoft Learn page (`COMPLIANCE_RULES` in `src/types/validation.ts`). Public wording says Azure Local 12.2609 (latest). Examples use example values only, never customer, lab or vendor-internal names.
- Network ATC storage VLAN defaults are 711, 712, 713; never reuse them as management defaults. Custom VLANs stay allowed (warning only).
- Auditor, wizard builder and exporters are pure functions; keep them free of the store and the DOM and cover them with tests under `__tests__/`.
- Checks before a commit: `npm run lint`, `npm test`, `npm run build` (and `npm run build:site` when docs change). Deploy is the `ci-pages` workflow on `main`; releases come from release-please.
- Documentation: Markdown in `docs/` (VitePress, base `/azurelocal-draftsman/docs/`). Diagrams in docs are draw.io.

---

## Start here — connect to the HCS Governance MCP

This repo is governed by the **HCS Governance MCP server** (connection details in
[`.ai/mcp/mcp-servers.md`](.ai/mcp/mcp-servers.md)). It is the source of truth for
standards, hard rules, and orchestration guidance.

**At session start, call:**

```
bootstrap(repo="azurelocal-draftsman", client="<your client: claude-code | codex | gemini | cursor | vscode>")
```

It returns this repo's scope, the applicable hard rules, the index of applicable
standards, the `.ai/` session protocol, and orchestration guidance shaped for your
client's capability tier. **Prefer a live MCP answer over anything written in this file** —
this file is the offline fallback.

---

## Offline fallback (when the MCP server is unreachable)

**Standards scope:** `azurelocal` <!-- hcs | tierpoint-prodtech | azurelocal -->

**Hard rules digest:**

- No secrets, tokens, passwords, subscription/tenant/client IDs, or connection strings in any committed file.
- All scripts: PowerShell 7+ — `#Requires -Version 7.0`, `Set-StrictMode -Version Latest`, `$ErrorActionPreference = 'Stop'`. Never PS 5.1, never Bash.
- All documentation is Markdown only. Diagrams are draw.io only — commit the `.drawio` XML alongside any exported `.png`.
- Commit format: `type(scope): short description` — types `feat`, `fix`, `docs`, `chore`, `refactor`, `test` — with an `AB#<id>` work-item reference.

**Standards reference (public site — no auth required):**

- Governance — <https://platform.hybridsolutions.cloud/standards/governance/>
- Scripting — <https://platform.hybridsolutions.cloud/standards/scripting/>
- Automation — <https://platform.hybridsolutions.cloud/standards/automation/>
- Documentation — <https://platform.hybridsolutions.cloud/standards/documentation/>
- Agents (multi-model) — <https://platform.hybridsolutions.cloud/standards/agents/>
- AI workspace — <https://platform.hybridsolutions.cloud/standards/ai-workspace/>
- Full index — <https://platform.hybridsolutions.cloud/standards/>

---

## Session protocol

1. **Read `.ai/state/` first** — `CURRENT_TASK.md`, then `HANDOFF.md`, then `OPEN_QUESTIONS.md`.
2. Then read `.ai/memory/` for durable context (`PROJECT_CONTEXT.md`, `DECISIONS.md`, `COMMANDS.md`, `GOTCHAS.md`).
3. Summarise your believed state back to the operator before making changes.
4. **Before ending the session, update `.ai/state/HANDOFF.md`** — what changed, files touched, commands run and results, branch, blockers, next steps.

Full contract: the [AI workspace standard](https://platform.hybridsolutions.cloud/standards/ai-workspace/).

---

## Key facts

| Fact | Value |
|---|---|
| ADO org | <https://dev.azure.com/hybridcloudsolutions> |
| ADO project | N/A - see registry.yaml `ado_project` or ask the HCS Governance MCP `get_repo` for this repo's work-item tracking project |
| Area path | N/A - see registry.yaml or ask the HCS Governance MCP |
| Key Vault | kv-hcs-vault-01 |
| Work item format | `AB#<id>` in commits and PRs |
