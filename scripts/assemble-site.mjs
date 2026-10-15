// Assembles the GitHub Pages artifact: the app build (dist/) with the VitePress docs under dist/docs/.
// Run after `npm run build` and `npm run docs:build`.
import { cpSync, existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const appDir = resolve(root, 'dist');
const docsDist = resolve(root, 'docs/.vitepress/dist');
const target = resolve(appDir, 'docs');

if (!existsSync(resolve(appDir, 'index.html'))) throw new Error('dist/index.html missing: run npm run build first');
if (!existsSync(resolve(docsDist, 'index.html'))) throw new Error('docs build missing: run npm run docs:build first');

rmSync(target, { recursive: true, force: true });
cpSync(docsDist, target, { recursive: true });
console.log(`Site assembled: ${appDir} (app at /, docs at /docs/)`);
