# AGENTS.md

Reference for agents and LLMs working in this codebase.

## Project Overview

`puck` is an NHL CLI/TUI written in TypeScript using Bun. It provides real-time scores, standings, play-by-play, and highlight media URLs via the NHL public API.

Entry point: `src/index.tsx`
Run locally: `bun src/index.tsx <command> [args]`

---

## Command Routing (`src/index.tsx`)

```
puck [command] [args]
```

| Command | Handler | Description |
|---------|---------|-------------|
| _(none)_ or `tui` | `src/app.tsx` | Launch interactive TUI |
| `date` | `src/cli/dateCommand.ts` | Games for a date |
| `game` | `src/cli/gameCommand.ts` | Game details + plays |
| `lookup` | `src/cli/lookupCommand.ts` | Find player/game IDs |
| `standings` | `src/cli/standingsCommand.ts` | League standings + movement |
| `highlights` | `src/cli/highlightsCommand.ts` | Goal clips with direct media URLs |
| `help [topic]` | inline | Show help |
| `commands` | inline | List all commands (supports `--format=json`) |

**Global flags:** `--skip-version-check`, `-h/--help`, `-v/--version`

---

## Commands

### `date`
Get games scheduled for a date.

```
puck date [--date <selector>] [--team <abbrev|name>] [--format json|ndjson|table] [--sort asc|desc]
```

- `--date` — `today` (default), `yesterday`, `tomorrow`, `+N`, `-N`, or `YYYY-MM-DD`
- `--team` — filter by team abbreviation or name (e.g. `DAL`, `stars`)
- `--format` — default `json`
- `--sort` — default `asc`

Output: `{ date, games: [{ id, state, startTimeUTC, startTimeLocal, away, home, period, clock }] }`

---

### `game`
Get full game details including plays, stats, and three stars.

```
puck game --id <gameId> [--format json|ndjson|table] [--sort asc|desc] [--plays-only]
```

- `--id` — game ID (required)
- `--plays-only` — emit only plays array (best with `--format ndjson`)

Output: `{ game, threeStars, scoringLeaders, assistLeaders, goalieStats, plays }`

Each play includes: `eventId, period, timeInPeriod, timeRemaining, type, zone, shotType, scorer, assists, shooter, goalie, penalty, faceoff, hit, block`

Data fetched in parallel: game details, play-by-play, boxscore, game story.

---

### `lookup`
Find player or game IDs for piping into other commands.

**Player:**
```
puck lookup player --query "<name>" [--limit 10] [--format json|ndjson|table] [--ids-only]
```

**Game:**
```
puck lookup game [--date <selector>] [--team <abbrev|name>] [--limit 25] [--sort asc|desc] [--format json|ndjson|table] [--ids-only]
```

- `--ids-only` — output one ID per line (pipe-friendly)

Player lookup uses fuzzy matching on a cached player list. Falls back to roster search if cache is empty.

---

### `standings`
League standings with day-over-day rank movement.

```
puck standings [--date <selector>] [--team <abbrev|name>] [--format json|ndjson|table]
```

Output: `{ date, previousDate, standings: [{ teamAbbrev, teamName, conference, division, gamesPlayed, wins, losses, otLosses, points, pointsPct, leagueRank, conferenceRank, divisionRank, wildcardRank, movement }] }`

`movement` = previous rank − current rank (positive = improved). Fetches current and previous date standings in parallel.

---

### `highlights`
Resolve goal highlights to direct MP4/HLS media URLs via Brightcove.

```
puck highlights [--game-id <id>] [--date <selector>] [--team <abbrev>] [--limit 3] [--format json|table]
```

- `--game-id` — pull from one specific game; otherwise fetches all games for `--date`
- `--date` — default `yesterday`

Output: `{ date, count, highlights: [{ gameId, gameDate, away, home, teamAbbrev, playerName, timeInPeriod, shotType, strength, highlightClipId, shareUrl, mp4Url, hlsUrl }] }`

Data flow:
1. Get game IDs for date (or use `--game-id`)
2. Fetch game story → extract goal clip IDs and share URLs
3. For each clip: fetch Brightcove config → get policy key → query Brightcove playback API → extract MP4/HLS sources
4. Return up to `--limit` results; `mp4Url`/`hlsUrl` are `null` if resolution fails

---

## Data Layer (`src/data/nhl/`)

### `NhlClient` (`client.ts`)
Main HTTP client. Base URL: `https://api-web.nhle.com/v1`

Key methods:
- `getScheduleByDate(date, sortOrder)`
- `getGameDetails(gameId)` — landing page
- `getGameBoxscore(gameId)`
- `getGamePlayByPlay(gameId)` — all events + roster map
- `getGameStory(gameId)` — goal summaries, three stars
- `getStandings()` / `getStandingsByDate(date)`
- `searchPlayer(name)` — fuzzy match on cache, fallback to roster search
- `getTeams()` / `getTeamByIdentifier(id|abbrev|name)`

### Player Cache (`playerCache.ts`)
Singleton. Stores all NHL players for fast fuzzy lookup. Stale after 15 minutes.

`playerCacheWorker.ts` refreshes the cache every 15 minutes and is started automatically in TUI mode. CLI commands lazy-load the cache on first use.

---

## Output Formats

All commands support:
- `json` (default) — nested object
- `ndjson` — one JSON object per line, good for streaming/piping
- `table` — human-readable ASCII table

Lookup commands also support `--ids-only` (one ID per line).

---

## Date Selectors

Used by `date`, `standings`, `highlights`, `lookup game`:

| Input | Meaning |
|-------|---------|
| `today` | Current date |
| `yesterday` | Yesterday |
| `tomorrow` | Tomorrow |
| `+N` | N days from today |
| `-N` | N days ago |
| `YYYY-MM-DD` | Absolute date |

---

## Arg Parsing

No third-party CLI library. Each command exports:
- `parse<X>CommandArgs(args: string[])` — returns parsed options or exits with help
- `run<X>Command(options)` — fetches data and writes to stdout
- `print<X>CommandHelp()` — prints usage

---

## Project Structure

```
src/
├── index.tsx                  # Entry point, routing
├── app.tsx                    # TUI React/ink app
├── cli/
│   ├── dateCommand.ts
│   ├── gameCommand.ts
│   ├── lookupCommand.ts
│   ├── standingsCommand.ts
│   └── highlightsCommand.ts
├── data/
│   └── nhl/
│       ├── client.ts          # NhlClient
│       ├── models.ts          # TypeScript types
│       ├── constants.ts       # API base URL, enums
│       ├── formatters.ts      # Data transformers
│       ├── playerCache.ts     # Player cache singleton
│       └── playerCacheWorker.ts
├── utils/
│   ├── dateUtils.ts
│   ├── fuzzyMatchPlayers.ts
│   ├── fuzzyMatch.ts
│   ├── nhlUtils.ts
│   └── versionCheck.ts
├── ui/                        # TUI components
├── hooks/                     # React hooks
└── state/                     # Zustand state
```

---

## Adding a New Command

1. Create `src/cli/<name>Command.ts` exporting `parse<Name>CommandArgs`, `run<Name>Command`, `print<Name>CommandHelp`
2. Add a case in `src/index.tsx` to route to it
3. Follow the existing arg parsing pattern (manual flag parsing, exit on bad args)
4. Support `--format json|ndjson|table` if outputting structured data
