# Contributing to Azure Local Draftsman

Thank you for your interest in contributing to Azure Local Draftsman! This document provides
guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Install dependencies: `npm ci` (and `npm --prefix docs ci` for the docs)
4. Start the dev server: `npm run dev` (http://localhost:8125/)

## Development Workflow

### Branching

- Create a feature branch from `main` (`feature/<topic>`, `fix/<topic>`)
- Open a pull request targeting `main` when ready
- Do not commit directly to `main`
- Keep branches short-lived to minimise merge conflicts

### Before Submitting a PR

1. **Lint**: `npm run lint` (0 errors; the warning count is capped at the current baseline of 70, mostly unused locals in the upstream shape renderers and a few `any` casts: fix what you touch, do not add new ones)
2. **Test**: `npm test`
3. **Build** (type check + Vite): `npm run build`; for the docs too: `npm run build:site`
4. Ensure the `ci-pages` workflow passes (lint, test, audit, build)
5. Commit messages follow Conventional Commits (`feat(auditor): ...`); release-please builds the changelog from them

### Pull Request Guidelines

- Include a clear description of the changes and the reason for them
- Reference any related issues (e.g. "Fixes #42")
- Keep PRs focused — one feature or fix per PR

## Project Structure

| Folder | Purpose |
|---|---|
| `src/app/` | App shell and layout |
| `src/components/` | Shared UI components |
| `src/features/` | Feature modules (canvas, export, inspector, validation, wizard, etc.) |
| `src/features/validation/rules/` | One module per compliance rule group, with tests in `__tests__/` |
| `src/lib/` | Geometry, rendering, serialisation, topology analysis utilities |
| `src/state/` | Zustand store and history |
| `src/types/` | TypeScript type definitions |
| `public/` | Static assets and predefined scenarios |

## Adding or changing a compliance rule

1. Base it on a Microsoft Learn page and put the URL in `COMPLIANCE_RULES` (`src/types/validation.ts`) and in `docs/compliance-auditor.md`.
2. Implement it as a pure function of the audit context in `src/features/validation/rules/` and register it in `diagramAuditor.ts`.
3. Add tests for pass, fail and at least one edge case (`src/test/fixtures.ts` has builders). Use example values only.
4. A rule that cannot be sure should warn or inform, not error.

## Code Style

- TypeScript strict mode
- Functional React components with hooks
- Zustand for state management
- No direct DOM manipulation — use canvas rendering pipeline

## Reporting Issues

- Use GitHub [Issues](../../issues) with the provided templates
- Include browser version, OS, and screenshots where possible
- Provide steps to reproduce the problem

## License

By contributing, you agree that your contributions will be licensed under the
[MIT License](LICENSE).
