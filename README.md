# Puck ⚫︎

An NHL TUI
- explore calendar of games, see game details and scores
- view team standings, rosters, and leaders
- see player stats and bios

### Install

```sh
npm install -g puck
```

### Dev
```sh
bun run dev
```

### Headless CLI

```sh
# Discover commands for agents
puck commands --format=json
puck help lookup

# Games by date (agent-friendly JSON)
puck date --date today --format json

# Filter by team
puck date --date 2026-03-02 --team DAL --format table

# Parsed game payload: plays, scorers, assists, stars, goalie stats
puck game --id 2025020956 --format json

# Stream parsed plays as NDJSON
puck game --id 2025020956 --plays-only --format ndjson

# Standings snapshot with day-over-day movement deltas
puck standings --date yesterday --format json
puck standings --date yesterday --team DAL --format table

# Lookup IDs for piping
puck lookup player --query "connor mcdavid" --ids-only
puck lookup game --date today --team DAL --ids-only
```

### Agent Notes

- `--format json` emits one JSON document.
- `--format ndjson` emits one JSON object per line.
- `--ids-only` emits bare IDs, one per line (ideal for piping).
