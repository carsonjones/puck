# nhl-tui

Mac-first terminal UI for NHL scores built with Ink + TypeScript.

## Setup

```bash
bun install
```

## Run

```bash
NHL_TOKEN=dev bun dev
```

## Keybindings

- `j` / `k` or arrows: move cursor
- `enter`: select game
- `tab`: toggle focus between list/detail
- `left` / `right`: previous/next page
- `1` / `2`: switch detail tab (stats/plays)
- `r`: refetch current page + detail
- `q`: quit

## Notes on data/auth

- Mock data lives in `src/data/api/client.ts`.
- The NHL API wrapper lives in `src/data/nhl/client.ts` with parity models in `src/data/nhl/models.ts`.
- To wire a real Graph client, replace `listGames` and `getGame` with Graph calls and keep the return types.
- `src/auth/token.ts` currently reads `NHL_TOKEN` from the environment; later this will move to macOS Keychain.
