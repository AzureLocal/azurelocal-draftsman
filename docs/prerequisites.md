# Prerequisites

Draftsman is a browser app. It needs no Azure subscription, no PowerShell, no credentials and no access to nodes, switches or Active Directory. Designs stay in the browser (the working document is kept in browser local storage) and are exported to files you save yourself.

| Area | Requirement |
|---|---|
| To use the app | A current desktop browser with JavaScript enabled. The hosted site loads the Inter and Rajdhani fonts from Google Fonts, so a locked-down network needs `fonts.googleapis.com` and `fonts.gstatic.com` or accepts the fallback fonts |
| To build or develop | Node.js 22 LTS (CI uses 22; ESLint 10 needs 20.19 or later, Vite 6 and Vitest 3 need 18 or later) and npm. Git to clone |
| Install | `npm ci` (the repo sets `legacy-peer-deps=true` in `.npmrc`) |
| Dev server | Port 8125 on localhost (`npm run dev`) |
| Docs site build | `npm run build:site` also builds the VitePress docs in `docs/` (installed separately: `npm --prefix docs ci`) |
| Operating system | Any OS that runs Node 22 and a modern browser |
| Network (build) | HTTPS to the npm registry (`registry.npmjs.org`) for `npm ci` |
