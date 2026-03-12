import { NhlClient } from '@/data/nhl/client.js';
import { type SortOrder } from '@/data/nhl/constants.js';
import type { Game } from '@/data/nhl/models.js';
import { resolveDateInput } from '@/cli/dateCommand.js';
import { formatLocalTime } from '@/utils/dateUtils.js';

type LookupOutputFormat = 'json' | 'ndjson' | 'table';

type PlayerLookupOptions = {
  type: 'player';
  query: string;
  limit: number;
  format: LookupOutputFormat;
  idsOnly: boolean;
};

type GameLookupOptions = {
  type: 'game';
  date: string;
  team: string | null;
  limit: number;
  format: LookupOutputFormat;
  idsOnly: boolean;
  sort: SortOrder;
};

type LookupCommandOptions = PlayerLookupOptions | GameLookupOptions;

const nhlClient = new NhlClient();

export function printLookupCommandHelp() {
  console.log(`Usage: puck lookup <type> [options]

Types:
  player            Find player IDs by name
  game              Find game IDs by date/team

Examples:
  puck lookup player --query "connor mcdavid"
  puck lookup player --query "jack hughes" --ids-only
  puck lookup game --date today --team DAL --ids-only
  puck lookup game --date 2026-03-02 --format table`);
}

export function parseLookupCommandArgs(args: string[]): LookupCommandOptions {
  const type = args[0];
  if (!type || type === '-h' || type === '--help') {
    printLookupCommandHelp();
    process.exit(0);
  }

  if (type === 'player') return parsePlayerLookupArgs(args.slice(1));
  if (type === 'game') return parseGameLookupArgs(args.slice(1));

  throw new Error(`Unknown lookup type: ${type}. Use 'player' or 'game'.`);
}

export async function runLookupCommand(options: LookupCommandOptions) {
  if (options.type === 'player') {
    await runPlayerLookup(options);
    return;
  }
  await runGameLookup(options);
}

function parsePlayerLookupArgs(args: string[]): PlayerLookupOptions {
  let query = '';
  let limit = 10;
  let format: LookupOutputFormat = 'json';
  let idsOnly = false;

  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (!arg) break;

    if (arg === '--ids-only') {
      idsOnly = true;
      i += 1;
      continue;
    }
    if (arg === '-h' || arg === '--help') {
      printLookupCommandHelp();
      process.exit(0);
    }
    if (arg.startsWith('--query=')) {
      query = arg.slice('--query='.length);
      i += 1;
      continue;
    }
    if (arg.startsWith('--limit=')) {
      limit = Number(arg.slice('--limit='.length));
      i += 1;
      continue;
    }
    if (arg.startsWith('--format=')) {
      format = parseLookupFormat(arg.slice('--format='.length));
      i += 1;
      continue;
    }
    if (arg === '--query') {
      query = args[i + 1] ?? '';
      i += 2;
      continue;
    }
    if (arg === '--limit') {
      limit = Number(args[i + 1]);
      i += 2;
      continue;
    }
    if (arg === '--format') {
      format = parseLookupFormat(args[i + 1] ?? '');
      i += 2;
      continue;
    }

    throw new Error(`Unknown option for lookup player: ${arg}`);
  }

  if (!query.trim()) throw new Error('Missing --query for lookup player');
  if (Number.isNaN(limit) || limit <= 0) throw new Error('Invalid --limit value');

  return { type: 'player', query: query.trim(), limit, format, idsOnly };
}

function parseGameLookupArgs(args: string[]): GameLookupOptions {
  let dateInput = 'today';
  let team: string | null = null;
  let limit = 25;
  let format: LookupOutputFormat = 'json';
  let idsOnly = false;
  let sort: SortOrder = 'asc';

  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (!arg) break;

    if (arg === '--ids-only') {
      idsOnly = true;
      i += 1;
      continue;
    }
    if (arg === '-h' || arg === '--help') {
      printLookupCommandHelp();
      process.exit(0);
    }
    if (arg.startsWith('--date=')) {
      dateInput = arg.slice('--date='.length);
      i += 1;
      continue;
    }
    if (arg.startsWith('--team=')) {
      team = arg.slice('--team='.length).trim() || null;
      i += 1;
      continue;
    }
    if (arg.startsWith('--limit=')) {
      limit = Number(arg.slice('--limit='.length));
      i += 1;
      continue;
    }
    if (arg.startsWith('--sort=')) {
      const value = arg.slice('--sort='.length) as SortOrder;
      if (value !== 'asc' && value !== 'desc') throw new Error(`Invalid --sort value: ${value}`);
      sort = value;
      i += 1;
      continue;
    }
    if (arg.startsWith('--format=')) {
      format = parseLookupFormat(arg.slice('--format='.length));
      i += 1;
      continue;
    }
    if (arg === '--date') {
      dateInput = args[i + 1] ?? '';
      i += 2;
      continue;
    }
    if (arg === '--team') {
      team = args[i + 1]?.trim() || null;
      i += 2;
      continue;
    }
    if (arg === '--limit') {
      limit = Number(args[i + 1]);
      i += 2;
      continue;
    }
    if (arg === '--sort') {
      const value = args[i + 1] as SortOrder | undefined;
      if (!value || (value !== 'asc' && value !== 'desc')) {
        throw new Error(`Invalid --sort value: ${value}`);
      }
      sort = value;
      i += 2;
      continue;
    }
    if (arg === '--format') {
      format = parseLookupFormat(args[i + 1] ?? '');
      i += 2;
      continue;
    }

    throw new Error(`Unknown option for lookup game: ${arg}`);
  }

  if (Number.isNaN(limit) || limit <= 0) throw new Error('Invalid --limit value');

  return {
    type: 'game',
    date: resolveDateInput(dateInput),
    team,
    limit,
    format,
    idsOnly,
    sort,
  };
}

function parseLookupFormat(value: string): LookupOutputFormat {
  if (value === 'json' || value === 'ndjson' || value === 'table') return value;
  throw new Error(`Invalid --format value: ${value}`);
}

async function runPlayerLookup(options: PlayerLookupOptions) {
  const results = (await nhlClient.searchPlayer(options.query))
    .slice(0, options.limit)
    .map((player) => ({
      playerId: player.playerId,
      fullName: `${player.firstName.default} ${player.lastName.default}`,
      teamAbbrev: player.teamAbbrev,
      position: player.position,
      jerseyNumber: player.jerseyNumber,
    }));

  if (options.idsOnly) {
    for (const player of results) {
      console.log(String(player.playerId));
    }
    return;
  }

  if (options.format === 'ndjson') {
    for (const player of results) {
      console.log(JSON.stringify(player));
    }
    return;
  }

  if (options.format === 'table') {
    const rows = results.map((p) => [
      String(p.playerId),
      p.fullName,
      p.teamAbbrev,
      p.position,
      String(p.jerseyNumber),
    ]);
    console.log(renderSimpleTable(['PLAYER ID', 'NAME', 'TEAM', 'POS', '#'], rows));
    return;
  }

  console.log(JSON.stringify({ query: options.query, results }, null, 2));
}

async function runGameLookup(options: GameLookupOptions) {
  const response = await nhlClient.getScheduleByDate(options.date, options.sort);
  const filtered = filterGamesByTeam(response.games, options.team).slice(0, options.limit);
  const results = filtered.map((game) => ({
    gameId: game.id,
    date: options.date,
    state: game.gameState,
    startTimeUTC: game.startTimeUTC,
    startTimeLocal: formatLocalTime(game.startTimeUTC),
    away: game.awayTeam.abbrev,
    home: game.homeTeam.abbrev,
    matchup: `${game.awayTeam.abbrev}@${game.homeTeam.abbrev}`,
  }));

  if (options.idsOnly) {
    for (const game of results) {
      console.log(String(game.gameId));
    }
    return;
  }

  if (options.format === 'ndjson') {
    for (const game of results) {
      console.log(JSON.stringify(game));
    }
    return;
  }

  if (options.format === 'table') {
    const rows = results.map((g) => [
      String(g.gameId),
      g.matchup,
      g.startTimeLocal,
      g.state,
      g.date,
    ]);
    console.log(renderSimpleTable(['GAME ID', 'MATCHUP', 'LOCAL TIME', 'STATE', 'DATE'], rows));
    return;
  }

  console.log(JSON.stringify({ date: options.date, results }, null, 2));
}

function filterGamesByTeam(games: Game[], teamFilter: string | null): Game[] {
  if (!teamFilter) return games;
  const needle = teamFilter.toLowerCase();

  return games.filter((game) => {
    const homeName = game.homeTeam.commonName?.default ?? game.homeTeam.name.default;
    const awayName = game.awayTeam.commonName?.default ?? game.awayTeam.name.default;
    return (
      game.homeTeam.abbrev.toLowerCase() === needle ||
      game.awayTeam.abbrev.toLowerCase() === needle ||
      homeName.toLowerCase().includes(needle) ||
      awayName.toLowerCase().includes(needle)
    );
  });
}

function renderSimpleTable(headers: string[], rows: string[][]): string {
  if (rows.length === 0) return '(no results)';
  const widths = headers.map((header, col) =>
    Math.max(header.length, ...rows.map((row) => row[col]?.length ?? 0)),
  );
  const formatRow = (row: string[]) =>
    row.map((cell, col) => cell.padEnd(widths[col] ?? 0)).join('  ');
  const separator = widths.map((w) => '-'.repeat(w)).join('  ');
  return [formatRow(headers), separator, ...rows.map(formatRow)].join('\n');
}
