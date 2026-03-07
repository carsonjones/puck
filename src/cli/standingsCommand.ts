import { NhlClient } from '@/data/nhl/client.js';
import type { StandingsTeam } from '@/data/nhl/models.js';
import { addDays, formatDate } from '@/utils/dateUtils.js';

type StandingsOutputFormat = 'json' | 'ndjson' | 'table';

type StandingsCommandOptions = {
	date: string;
	team: string | null;
	format: StandingsOutputFormat;
};

type NormalizedStanding = {
	teamAbbrev: string;
	teamName: string;
	conference: string;
	division: string;
	gamesPlayed: number;
	wins: number;
	losses: number;
	otLosses: number;
	points: number;
	pointsPct: number;
	leagueRank: number;
	conferenceRank: number;
	divisionRank: number;
	wildcardRank: number;
	movement: {
		league: number | null;
		conference: number | null;
		division: number | null;
		wildcard: number | null;
	};
};

const nhlClient = new NhlClient();

export function printStandingsCommandHelp() {
	console.log(`Usage: puck standings [options]

Options:
  --date <value>     Date selector: YYYY-MM-DD | today | yesterday | tomorrow | +N | -N (default: today)
  --team <value>     Filter standings by team abbreviation or name (e.g. DAL, stars)
  --format <value>   Output format: json | ndjson | table (default: json)
  -h, --help         Show help`);
}

export function parseStandingsCommandArgs(args: string[]): StandingsCommandOptions {
	let dateInput = 'today';
	let team: string | null = null;
	let format: StandingsOutputFormat = 'json';

	let i = 0;
	while (i < args.length) {
		const arg = args[i];
		if (!arg) break;

		if (arg === '-h' || arg === '--help') {
			printStandingsCommandHelp();
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
			const value = arg.slice('--format='.length) as StandingsOutputFormat;
			if (value !== 'json' && value !== 'ndjson' && value !== 'table') {
				throw new Error(`Invalid --format value: ${value}`);
			}
			format = value;
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
			const value = args[i + 1] as StandingsOutputFormat | undefined;
			if (!value) throw new Error('Missing value for --format');
			if (value !== 'json' && value !== 'ndjson' && value !== 'table') {
				throw new Error(`Invalid --format value: ${value}`);
			}
			format = value;
			i += 2;
			continue;
		}

		throw new Error(`Unknown option for standings command: ${arg}`);
	}

	return {
		date: resolveDateInput(dateInput),
		team,
		format,
	};
}

export async function runStandingsCommand(options: StandingsCommandOptions) {
	const previousDate = formatDate(addDays(new Date(`${options.date}T12:00:00Z`), -1));

	const [current, previous] = await Promise.all([
		nhlClient.getStandingsByDate(options.date),
		nhlClient.getStandingsByDate(previousDate).catch(() => null),
	]);

	const previousByTeam = new Map<string, StandingsTeam>();
	if (previous?.standings?.length) {
		for (const team of previous.standings) {
			previousByTeam.set(team.teamAbbrev.default, team);
		}
	}

	const normalized = current.standings
		.map((team) => normalizeStanding(team, previousByTeam.get(team.teamAbbrev.default) ?? null))
		.filter((team) => includeTeam(team, options.team))
		.sort((a, b) => a.leagueRank - b.leagueRank);

	if (options.format === 'ndjson') {
		for (const team of normalized) {
			console.log(JSON.stringify({ date: options.date, previousDate, ...team }));
		}
		return;
	}

	if (options.format === 'table') {
		console.log(renderTable(options.date, previousDate, normalized));
		return;
	}

	console.log(
		JSON.stringify(
			{
				date: options.date,
				previousDate,
				standings: normalized,
			},
			null,
			2,
		),
	);
}

function normalizeStanding(team: StandingsTeam, previous: StandingsTeam | null): NormalizedStanding {
	return {
		teamAbbrev: team.teamAbbrev.default,
		teamName: team.teamName.default,
		conference: team.conferenceName,
		division: team.divisionName,
		gamesPlayed: team.gamesPlayed,
		wins: team.wins,
		losses: team.losses,
		otLosses: team.otLosses,
		points: team.points,
		pointsPct: team.pointsPercentage,
		leagueRank: team.leagueSequence,
		conferenceRank: team.conferenceSequence,
		divisionRank: team.divisionSequence,
		wildcardRank: team.wildcardSequence,
		movement: {
			league: previous ? previous.leagueSequence - team.leagueSequence : null,
			conference: previous ? previous.conferenceSequence - team.conferenceSequence : null,
			division: previous ? previous.divisionSequence - team.divisionSequence : null,
			wildcard: previous ? previous.wildcardSequence - team.wildcardSequence : null,
		},
	};
}

function includeTeam(team: NormalizedStanding, teamFilter: string | null): boolean {
	if (!teamFilter) return true;
	const needle = teamFilter.toLowerCase();
	return (
		team.teamAbbrev.toLowerCase() === needle ||
		team.teamName.toLowerCase().includes(needle) ||
		team.conference.toLowerCase().includes(needle) ||
		team.division.toLowerCase().includes(needle)
	);
}

function movementLabel(delta: number | null): string {
	if (delta === null) return '-';
	if (delta > 0) return `↑${delta}`;
	if (delta < 0) return `↓${Math.abs(delta)}`;
	return '→0';
}

function renderTable(date: string, previousDate: string, standings: NormalizedStanding[]): string {
	if (standings.length === 0) {
		return `Standings for ${date} vs ${previousDate}\n(no teams)`;
	}

	const rows = standings.map((team) => [
		String(team.leagueRank),
		team.teamAbbrev,
		`${team.wins}-${team.losses}-${team.otLosses}`,
		String(team.points),
		movementLabel(team.movement.league),
		movementLabel(team.movement.conference),
		movementLabel(team.movement.division),
	]);

	const headers = ['L', 'TEAM', 'REC', 'PTS', 'ΔL', 'ΔC', 'ΔD'];
	const widths = headers.map((header, col) =>
		Math.max(header.length, ...rows.map((row) => row[col]?.length ?? 0)),
	);

	const formatRow = (row: string[]) => row.map((cell, col) => cell.padEnd(widths[col] ?? 0)).join('  ');
	const separator = widths.map((w) => '-'.repeat(w)).join('  ');

	return [
		`Standings for ${date} vs ${previousDate} (movement = rank gain/loss from previous day)`,
		formatRow(headers),
		separator,
		...rows.map(formatRow),
	].join('\n');
}

function resolveDateInput(input: string): string {
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
