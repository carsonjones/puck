import { NhlClient } from '@/data/nhl/client.js';
import type { Game, SortOrder } from '@/data/nhl/index.js';
import { addDays, formatDate, formatLocalTime } from '@/utils/dateUtils.js';

type DateOutputFormat = 'json' | 'ndjson' | 'table';

type DateCommandOptions = {
	date: string;
	team: string | null;
	format: DateOutputFormat;
	sort: SortOrder;
};

type NormalizedGame = {
	id: number;
	state: 'SCHEDULED' | 'LIVE' | 'FINAL';
	startTimeUTC: string;
	startTimeLocal: string;
	away: { abbrev: string; name: string; score: number };
	home: { abbrev: string; name: string; score: number };
	period: number;
	clock: string;
};

const nhlClient = new NhlClient();

export function printDateCommandHelp() {
	console.log(`Usage: puck date [options]

Options:
  --date <value>     Date selector: YYYY-MM-DD | today | yesterday | tomorrow | +N | -N
  --team <value>     Filter games by team abbreviation or name (e.g. DAL, stars)
  --format <value>   Output format: json | ndjson | table (default: json)
  --sort <value>     Sort order: asc | desc (default: asc)
  -h, --help         Show help`);
}

export function parseDateCommandArgs(args: string[]): DateCommandOptions {
	let dateInput = 'today';
	let team: string | null = null;
	let format: DateOutputFormat = 'json';
	let sort: SortOrder = 'asc';

	let i = 0;
	while (i < args.length) {
		const arg = args[i];
		if (!arg) break;

		if (arg === '-h' || arg === '--help') {
			printDateCommandHelp();
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
		if (arg.startsWith('--format=')) {
			const value = arg.slice('--format='.length) as DateOutputFormat;
			if (value !== 'json' && value !== 'ndjson' && value !== 'table') {
				throw new Error(`Invalid --format value: ${value}`);
			}
			format = value;
			i += 1;
			continue;
		}
		if (arg.startsWith('--sort=')) {
			const value = arg.slice('--sort='.length) as SortOrder;
			if (value !== 'asc' && value !== 'desc') {
				throw new Error(`Invalid --sort value: ${value}`);
			}
			sort = value;
			i += 1;
			continue;
		}

		if (arg === '--date') {
			const value = args[i + 1];
			if (!value) throw new Error('Missing value for --date');
			dateInput = value;
			i += 2;
			continue;
		}
		if (arg === '--team') {
			const value = args[i + 1];
			if (!value) throw new Error('Missing value for --team');
			team = value.trim() || null;
			i += 2;
			continue;
		}
		if (arg === '--format') {
			const value = args[i + 1] as DateOutputFormat | undefined;
			if (!value) throw new Error('Missing value for --format');
			if (value !== 'json' && value !== 'ndjson' && value !== 'table') {
				throw new Error(`Invalid --format value: ${value}`);
			}
			format = value;
			i += 2;
			continue;
		}
		if (arg === '--sort') {
			const value = args[i + 1] as SortOrder | undefined;
			if (!value) throw new Error('Missing value for --sort');
			if (value !== 'asc' && value !== 'desc') {
				throw new Error(`Invalid --sort value: ${value}`);
			}
			sort = value;
			i += 2;
			continue;
		}

		throw new Error(`Unknown option for date command: ${arg}`);
	}

	return {
		date: resolveDateInput(dateInput),
		team,
		format,
		sort,
	};
}

export async function runDateCommand(options: DateCommandOptions) {
	const response = await nhlClient.getScheduleByDate(options.date, options.sort);
	const filteredGames = filterGamesByTeam(response.games, options.team);
	const normalizedGames = filteredGames.map(normalizeGame);

	if (options.format === 'ndjson') {
		for (const game of normalizedGames) {
			console.log(JSON.stringify({ date: options.date, ...game }));
		}
		return;
	}

	if (options.format === 'table') {
		console.log(renderTable(options.date, normalizedGames));
		return;
	}

	console.log(
		JSON.stringify(
			{
				date: options.date,
				games: normalizedGames,
			},
			null,
			2,
		),
	);
}

export function resolveDateInput(input: string): string {
	const normalized = input.trim().toLowerCase();
	if (!normalized || normalized === 'today') return formatDate(new Date());
	if (normalized === 'yesterday') return formatDate(addDays(new Date(), -1));
	if (normalized === 'tomorrow') return formatDate(addDays(new Date(), 1));

	if (/^[+-]\d+$/.test(normalized)) {
		return formatDate(addDays(new Date(), Number(normalized)));
	}

	if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
		const parsed = new Date(`${normalized}T00:00:00`);
		if (Number.isNaN(parsed.getTime())) {
			throw new Error(`Invalid date: ${input}`);
		}
		if (formatDate(parsed) !== normalized) {
			throw new Error(`Invalid date: ${input}`);
		}
		return normalized;
	}

	throw new Error(
		`Invalid --date value: ${input}. Use YYYY-MM-DD, today, yesterday, tomorrow, +N, or -N.`,
	);
}

function normalizeGame(game: Game): NormalizedGame {
	return {
		id: game.id,
		state: mapGameState(game.gameState),
		startTimeUTC: game.startTimeUTC,
		startTimeLocal: formatLocalTime(game.startTimeUTC),
		away: {
			abbrev: game.awayTeam.abbrev,
			name: game.awayTeam.commonName?.default ?? game.awayTeam.name.default,
			score: game.awayTeam.score,
		},
		home: {
			abbrev: game.homeTeam.abbrev,
			name: game.homeTeam.commonName?.default ?? game.homeTeam.name.default,
			score: game.homeTeam.score,
		},
		period: game.period,
		clock: game.clock?.timeRemaining ?? '',
	};
}

function mapGameState(gameState: string): NormalizedGame['state'] {
	const normalized = gameState.toLowerCase();
	if (normalized.includes('final') || normalized === 'off') return 'FINAL';
	if (normalized.includes('live') || normalized.includes('inprogress') || normalized === 'crit')
		return 'LIVE';
	return 'SCHEDULED';
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

function renderTable(date: string, games: NormalizedGame[]): string {
	if (games.length === 0) {
		return `Games for ${date}\n(no games)`;
	}

	const rows = games.map((game) => {
		const matchup = `${game.away.abbrev} @ ${game.home.abbrev}`;
		const score = game.state === 'SCHEDULED' ? '-' : `${game.away.score}-${game.home.score}`;
		const state =
			game.state === 'LIVE' ? `LIVE P${game.period} ${game.clock || ''}`.trim() : game.state;
		return [String(game.id), matchup, game.startTimeLocal, state, score];
	});

	const headers = ['ID', 'MATCHUP', 'LOCAL TIME', 'STATE', 'SCORE'];
	const widths = headers.map((header, col) =>
		Math.max(header.length, ...rows.map((row) => row[col]?.length ?? 0)),
	);

	const formatRow = (row: string[]) =>
		row.map((cell, col) => cell.padEnd(widths[col] ?? 0)).join('  ');
	const separator = widths.map((w) => '-'.repeat(w)).join('  ');

	return [`Games for ${date}`, formatRow(headers), separator, ...rows.map(formatRow)].join('\n');
}
