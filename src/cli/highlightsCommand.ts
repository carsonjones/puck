import { NhlClient } from '@/data/nhl/client.js';
import { formatDate } from '@/utils/dateUtils.js';

type OutputFormat = 'json' | 'table';

type HighlightsCommandOptions = {
	gameId: number | null;
	date: string;
	team: string | null;
	limit: number;
	format: OutputFormat;
};

type HighlightItem = {
	gameId: number;
	gameDate: string;
	away: string;
	home: string;
	teamAbbrev: string;
	playerName: string;
	timeInPeriod: string;
	shotType: string;
	strength: string;
	highlightClipId: number;
	shareUrl: string;
	mp4Url: string | null;
	hlsUrl: string | null;
};

const nhlClient = new NhlClient();

export function printHighlightsCommandHelp() {
	console.log(`Usage: puck highlights [options]

Options:
  --game-id <number>   Pull highlights from one game
  --date <value>       Date: today | yesterday | YYYY-MM-DD (default: yesterday)
  --team <abbr>        Filter goals to a team (e.g. DAL)
  --limit <number>     Max highlights to return (default: 3)
  --format <value>     Output format: json | table (default: json)
  -h, --help           Show help`);
}

export function parseHighlightsCommandArgs(args: string[]): HighlightsCommandOptions {
	let gameId: number | null = null;
	let date = 'yesterday';
	let team: string | null = null;
	let limit = 3;
	let format: OutputFormat = 'json';

	let i = 0;
	while (i < args.length) {
		const arg = args[i];
		if (!arg) break;

		if (arg === '-h' || arg === '--help') {
			printHighlightsCommandHelp();
			process.exit(0);
		}

		if (arg.startsWith('--game-id=')) {
			gameId = Number(arg.slice('--game-id='.length));
			i += 1;
			continue;
		}
		if (arg.startsWith('--date=')) {
			date = arg.slice('--date='.length);
			i += 1;
			continue;
		}
		if (arg.startsWith('--team=')) {
			team = arg.slice('--team='.length).toUpperCase();
			i += 1;
			continue;
		}
		if (arg.startsWith('--limit=')) {
			limit = Number(arg.slice('--limit='.length));
			i += 1;
			continue;
		}
		if (arg.startsWith('--format=')) {
			const value = arg.slice('--format='.length) as OutputFormat;
			if (value !== 'json' && value !== 'table') {
				throw new Error(`Invalid --format value: ${value}`);
			}
			format = value;
			i += 1;
			continue;
		}

		if (arg === '--game-id') {
			const value = args[i + 1];
			if (!value) throw new Error('Missing value for --game-id');
			gameId = Number(value);
			i += 2;
			continue;
		}
		if (arg === '--date') {
			const value = args[i + 1];
			if (!value) throw new Error('Missing value for --date');
			date = value;
			i += 2;
			continue;
		}
		if (arg === '--team') {
			const value = args[i + 1];
			if (!value) throw new Error('Missing value for --team');
			team = value.toUpperCase();
			i += 2;
			continue;
		}
		if (arg === '--limit') {
			const value = args[i + 1];
			if (!value) throw new Error('Missing value for --limit');
			limit = Number(value);
			i += 2;
			continue;
		}
		if (arg === '--format') {
			const value = args[i + 1] as OutputFormat | undefined;
			if (!value) throw new Error('Missing value for --format');
			if (value !== 'json' && value !== 'table') {
				throw new Error(`Invalid --format value: ${value}`);
			}
			format = value;
			i += 2;
			continue;
		}

		throw new Error(`Unknown option for highlights command: ${arg}`);
	}

	if (gameId !== null && (!Number.isFinite(gameId) || gameId <= 0)) {
		throw new Error('Invalid --game-id value');
	}
	if (!Number.isFinite(limit) || limit <= 0) {
		throw new Error('Invalid --limit value');
	}

	return { gameId, date, team, limit, format };
}

export async function runHighlightsCommand(options: HighlightsCommandOptions) {
	const gameIds =
		options.gameId !== null
			? [options.gameId]
			: await getGameIdsForDate(options.date, options.team ?? undefined);

	const all: HighlightItem[] = [];
	for (const id of gameIds) {
		const item = await getHighlightsForGame(id, options.team);
		all.push(...item);
		if (all.length >= options.limit) break;
	}

	const trimmed = all.slice(0, options.limit);

	if (options.format === 'table') {
		if (trimmed.length === 0) {
			console.log('No highlights found.');
			return;
		}
		for (const h of trimmed) {
			console.log(`${h.away} @ ${h.home} | ${h.playerName} (${h.teamAbbrev}) ${h.strength.toUpperCase()} ${h.timeInPeriod}`);
			console.log(`  share: ${h.shareUrl}`);
			if (h.mp4Url) console.log(`  mp4:   ${h.mp4Url}`);
			if (h.hlsUrl) console.log(`  hls:   ${h.hlsUrl}`);
		}
		return;
	}

	console.log(
		JSON.stringify(
			{
				date: resolveDate(options.date),
				count: trimmed.length,
				highlights: trimmed,
			},
			null,
			2,
		),
	);
}

async function getGameIdsForDate(dateInput: string, team?: string): Promise<number[]> {
	const target = resolveDate(dateInput);
	const schedule = await nhlClient.getScheduleByDate(target, 'asc');
	const games = schedule.games ?? [];
	return games
		.filter((g) => {
			if (!team) return true;
			return g.awayTeam?.abbrev === team || g.homeTeam?.abbrev === team;
		})
		.map((g) => g.id);
}

async function getHighlightsForGame(gameId: number, team: string | null): Promise<HighlightItem[]> {
	const [details, story] = await Promise.all([
		nhlClient.getGameDetails(gameId),
		nhlClient.getGameStory(gameId).catch(() => null),
	]);
	if (!story) return [];

	const out: HighlightItem[] = [];
	for (const period of story.summary?.scoring ?? []) {
		for (const goal of period.goals ?? []) {
			const clipId = goal.highlightClip;
			const shareUrl = goal.highlightClipSharingUrl;
			const teamAbbrev = goal.teamAbbrev?.default ?? '';
			if (!clipId || !shareUrl) continue;
			if (team && teamAbbrev !== team) continue;

			const sources = await getBrightcoveSources(String(clipId));
			out.push({
				gameId,
				gameDate: details.gameDate.slice(0, 10),
				away: details.awayTeam.abbrev,
				home: details.homeTeam.abbrev,
				teamAbbrev,
				playerName: goal.name?.default ?? 'Unknown',
				timeInPeriod: goal.timeInPeriod ?? '',
				shotType: goal.shotType ?? '',
				strength: goal.strength ?? '',
				highlightClipId: clipId,
				shareUrl,
				mp4Url: sources.mp4Url,
				hlsUrl: sources.hlsUrl,
			});
		}
	}

	return out;
}

async function getBrightcoveSources(clipId: string): Promise<{ mp4Url: string | null; hlsUrl: string | null }> {
	const configRes = await fetch('https://players.brightcove.net/6415718365001/default_default/config.json');
	if (!configRes.ok) return { mp4Url: null, hlsUrl: null };
	const config = (await configRes.json()) as Record<string, unknown>;
	const policyKey = findPolicyKey(config);
	if (!policyKey) return { mp4Url: null, hlsUrl: null };

	const playbackRes = await fetch(
		`https://edge.api.brightcove.com/playback/v1/accounts/6415718365001/videos/${clipId}`,
		{
			headers: {
				Accept: `application/json;pk=${policyKey}`,
			},
		},
	);
	if (!playbackRes.ok) return { mp4Url: null, hlsUrl: null };
	const payload = (await playbackRes.json()) as { sources?: Array<Record<string, unknown>> };
	const sources = payload.sources ?? [];
	const mp4 =
		sources.find(
			(s) =>
				(typeof s.src === 'string' && s.src.includes('.mp4')) ||
				(String(s.container ?? '').toUpperCase() === 'MP4' && typeof s.src === 'string'),
		)?.src ?? null;
	const hls =
		sources.find((s) => typeof s.src === 'string' && s.src.includes('.m3u8'))?.src ?? null;

	return {
		mp4Url: typeof mp4 === 'string' ? mp4 : null,
		hlsUrl: typeof hls === 'string' ? hls : null,
	};
}

function findPolicyKey(input: unknown): string | null {
	if (!input || typeof input !== 'object') return null;
	const stack: unknown[] = [input];
	while (stack.length > 0) {
		const node = stack.pop();
		if (!node || typeof node !== 'object') continue;
		if (Array.isArray(node)) {
			stack.push(...node);
			continue;
		}
		for (const [key, value] of Object.entries(node)) {
			if (key === 'policy_key' && typeof value === 'string') return value;
			if (value && typeof value === 'object') stack.push(value);
		}
	}
	return null;
}

function resolveDate(dateInput: string): string {
	if (dateInput === 'today') return formatDate(new Date());
	if (dateInput === 'yesterday') {
		const d = new Date();
		d.setDate(d.getDate() - 1);
		return formatDate(d);
	}
	return dateInput;
}
