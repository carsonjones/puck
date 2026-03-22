# puck web

Initial browser scaffold for the `puck` web migration.

## Intent

- Preserve the terminal-style information density of the TUI
- Reuse shared state and NHL data logic from the root `src/` tree
- Deploy as a Vite React app on Cloudflare Workers

## Current Status

- Vite React scaffold
- Cloudflare Worker entry for `/api/*`
- Shared app-state imports from `../src/shared/`
- Placeholder shell ready for the first real games view

## Planned Next Step

Port the games screen first, then wire it to a browser-safe data layer.
