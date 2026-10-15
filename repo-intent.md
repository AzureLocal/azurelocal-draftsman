# Repo intent — azurelocal-draftsman

**Interactive 2.5D Infrastructure & Compliance Studio — free, open-source, browser-based isometric diagram builder for Azure Local network architectures.**

## What this repo is

A browser-based 2.5D visual architecture editor and pre-flight compliance auditor
for Azure Local and Hyper-V network infrastructure deployments. Renders physical
hardware — Dell PowerEdge servers, Arista/Cisco ToR switches, Opengear console
servers, logical HCI VLAN boundaries — as isometric shapes on a dark-themed
canvas, connected by pin-level port cables. Helps architects/engineers/techs
design, validate, and export production cabling manifests. **No sign-up, no
server — runs entirely in the browser.**

## Shape

- Vite + TypeScript SPA (`src/`, `public/`, `Icons/`)
- Live at azurelocal.cloud/azurelocal-draftsman/ (docs under /docs/), deployed by the `ci-pages` workflow

## How it relates to other repos

- Mentioned in the AzureLocal registry (`platform/mcp-server/_content/registry.yaml`)
  as "isometric diagram builder (React + Vite)". It is a fork of AzLoFlows by
  Cristian Edwards Sabathe (MIT); keep the upstream credit and licence.
- Exports a `.drawio` topology that follows the conventions of Trailwright's
  draw.io export (see `docs/drawio-export.md`); no code is shared.

## Status

Active, open-source (MIT).
