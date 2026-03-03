import { NhlClient } from '@/data/nhl/client.js';
import { type SortOrder } from '@/data/nhl/constants.js';
import type { BoxscoreResponse, PlayByPlayResponse } from '@/data/nhl/models.js';
import { formatLocalTime } from '@/utils/dateUtils.js';

type GameOutputFormat = 'json' | 'ndjson' | 'table';

type GameCommandOptions = {
	id: number;
	format: GameOutputFormat;
	sort: SortOrder;
	playsOnly: boolean;
};

type RosterPlayer = {
	playerId: number;
	fullName: string;
	teamId: number;
	position: string;
	sweaterNumber: number;
};

const nhlClient = new NhlClient();

export function printGameCommandHelp() {
	console.log(`Usage: puck game [options]

Options:
  --id <number>      Game ID (required)
  --format <value>   Output format: json | ndjson | table (default: json)
  --sort <value>     Plays sort order: asc | desc (default: asc)
  --plays-only       Emit only parsed plays (best with --format ndjson)
  -h, --help         Show help`);
}

export function parseGameCommandArgs(args: string[]): GameCommandOptions {
	let id: number | null = null;
	let format: GameOutputFormat = 'json';
	let sort: SortOrder = 'asc';
	let playsOnly = false;

	let i = 0;
	while (i < args.length) {
		const arg = args[i];
		if (!arg) break;

		if (arg === '-h' || arg === '--help') {
			printGameCommandHelp();
			process.exit(0);
		}

		if (arg.startsWith('--id=')) {
			id = Number(arg.slice('--id='.length));
			i += 1;
			continue;
		}
		if (arg.startsWith('--format=')) {
			const value = arg.slice('--format='.length) as GameOutputFormat;
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
		if (arg === '--plays-only') {
			playsOnly = true;
			i += 1;
			continue;
		}

		if (arg === '--id') {
			const value = args[i + 1];
			if (!value) throw new Error('Missing value for --id');
			id = Number(value);
			i += 2;
			continue;
		}
		if (arg === '--format') {
			const value = args[i + 1] as GameOutputFormat | undefined;
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

		throw new Error(`Unknown option for game command: ${arg}`);
	}

	if (id === null || Number.isNaN(id) || id <= 0) {
		throw new Error('Missing or invalid --id value');
	}

	return { id, format, sort, playsOnly };
}

export async function runGameCommand(options: GameCommandOptions) {
	const [details, playByPlay, boxscore, gameStory] = await Promise.all([
		nhlClient.getGameDetails(options.id),
		nhlClient.getGamePlayByPlay(options.id).catch(() => null),
		nhlClient.getGameBoxscore(options.id).catch(() => null),
		nhlClient.getGameStory(options.id).catch(() => null),
	]);

	const roster = createRosterMap(playByPlay);
	const parsedPlays = parsePlays(playByPlay, roster, options.sort);
	const payload = {
		game: {
			id: details.id,
			date: details.gameDate.slice(0, 10),
			state: details.gameState,
			startTimeUTC: details.startTimeUTC,
			startTimeLocal: formatLocalTime(details.startTimeUTC),
			venue: details.venue.default,
			away: {
				abbrev: details.awayTeam.abbrev,
				name: details.awayTeam.commonName.default,
				score: details.awayTeam.score,
			},
			home: {
				abbrev: details.homeTeam.abbrev,
				name: details.homeTeam.commonName.default,
				score: details.homeTeam.score,
			},
			period:
				gameStory?.periodDescriptor?.number ??
				Math.max(...details.summary.scoring.map((p) => p.periodDescriptor.number), 0),
			clock: gameStory?.clock?.timeRemaining ?? details.clock?.timeRemaining ?? '',
		},
		threeStars:
			details.threeStars?.map((star) => ({
				star: star.star,
				playerId: star.playerId,
				name: star.name.default,
				teamAbbrev: star.teamAbbrev,
				position: star.position,
				goals: star.goals ?? 0,
				assists: star.assists ?? 0,
				points: star.points ?? 0,
				savePctg: star.savePctg ?? null,
			})) ?? [],
		scoringLeaders: getSkaterLeaders(boxscore, 'goals'),
		assistLeaders: getSkaterLeaders(boxscore, 'assists'),
		goalieStats: getGoalieStats(boxscore),
		plays: parsedPlays,
	};

	if (options.format === 'ndjson') {
		if (options.playsOnly) {
			for (const play of payload.plays) {
				console.log(JSON.stringify(play));
			}
			return;
		}
		console.log(JSON.stringify(payload));
		return;
	}

	if (options.format === 'table') {
		console.log(renderGameTable(payload));
		return;
	}

	if (options.playsOnly) {
		console.log(JSON.stringify(payload.plays, null, 2));
		return;
	}

	console.log(JSON.stringify(payload, null, 2));
}

function createRosterMap(playByPlay: PlayByPlayResponse | null): Map<number, RosterPlayer> {
	const map = new Map<number, RosterPlayer>();
	if (!playByPlay) return map;

	for (const spot of playByPlay.rosterSpots) {
		map.set(spot.playerId, {
			playerId: spot.playerId,
			fullName: `${spot.firstName.default} ${spot.lastName.default}`,
			teamId: spot.teamId,
			position: spot.positionCode,
			sweaterNumber: spot.sweaterNumber,
		});
	}

	return map;
}

function parsePlays(
	playByPlay: PlayByPlayResponse | null,
	roster: Map<number, RosterPlayer>,
	sort: SortOrder,
) {
	if (!playByPlay) return [];

	const plays = [...playByPlay.plays];
	if (sort === 'desc') plays.reverse();

	return plays.map((play) => {
		const details = play.details ?? {};
		const scorer = getPlayerInfo(roster, details.scoringPlayerId);
		const assist1 = getPlayerInfo(roster, details.assist1PlayerId);
		const assist2 = getPlayerInfo(roster, details.assist2PlayerId);
		const shooter = getPlayerInfo(roster, details.shootingPlayerId);
		const goalie = getPlayerInfo(roster, details.goalieInNetId);
		const committedBy = getPlayerInfo(roster, details.committedByPlayerId);
		const drawnBy = getPlayerInfo(roster, details.drawnByPlayerId);
		const winningPlayer = getPlayerInfo(roster, details.winningPlayerId);
		const losingPlayer = getPlayerInfo(roster, details.losingPlayerId);
		const hittingPlayer = getPlayerInfo(roster, details.hittingPlayerId);
		const hitteePlayer = getPlayerInfo(roster, details.hitteePlayerId);
		const blockingPlayer = getPlayerInfo(roster, details.blockingPlayerId);

		return {
			eventId: play.eventId,
			period: play.periodDescriptor.number,
			timeInPeriod: play.timeInPeriod,
			timeRemaining: play.timeRemaining,
			type: play.typeDescKey,
			teamId: details.eventOwnerTeamId ?? null,
			zone: details.zoneCode ?? null,
			shotType: details.shotType ?? null,
			reason: details.reason ?? null,
			descKey: details.descKey ?? null,
			scorer: scorer
				? {
						...scorer,
						total: details.scoringPlayerTotal ?? null,
					}
				: null,
			assists: [assist1, assist2]
				.filter((a): a is NonNullable<typeof a> => a !== null)
				.map((assist, idx) => ({
					...assist,
					total:
						idx === 0 ? (details.assist1PlayerTotal ?? null) : (details.assist2PlayerTotal ?? null),
				})),
			shooter,
			goalie,
			penalty:
				committedBy || drawnBy || details.duration
					? {
							committedBy,
							drawnBy,
							duration: details.duration ?? null,
						}
					: null,
			faceoff:
				winningPlayer || losingPlayer
					? {
							winningPlayer,
							losingPlayer,
						}
					: null,
			hit:
				hittingPlayer || hitteePlayer
					? {
							hittingPlayer,
							hitteePlayer,
						}
					: null,
			block:
				blockingPlayer || shooter
					? {
							blockingPlayer,
							shooter,
						}
					: null,
		};
	});
}

function getPlayerInfo(roster: Map<number, RosterPlayer>, id?: number) {
	if (!id) return null;
	const player = roster.get(id);
	if (!player) return { playerId: id, fullName: `#${id}` };
	return {
		playerId: player.playerId,
		fullName: player.fullName,
		sweaterNumber: player.sweaterNumber,
		position: player.position,
		teamId: player.teamId,
	};
}

function getSkaterLeaders(boxscore: BoxscoreResponse | null, stat: 'goals' | 'assists') {
	if (!boxscore) return [];

	const awaySkaters = [
		...boxscore.playerByGameStats.awayTeam.forwards,
		...boxscore.playerByGameStats.awayTeam.defense,
	].map((player) => ({ ...player, teamAbbrev: boxscore.awayTeam.abbrev }));
	const homeSkaters = [
		...boxscore.playerByGameStats.homeTeam.forwards,
		...boxscore.playerByGameStats.homeTeam.defense,
	].map((player) => ({ ...player, teamAbbrev: boxscore.homeTeam.abbrev }));

	return [...awaySkaters, ...homeSkaters]
		.filter((player) => player[stat] > 0)
		.sort((a, b) => b[stat] - a[stat] || b.points - a.points || b.goals - a.goals)
		.map((player) => ({
			playerId: player.playerId,
			name: player.name.default,
			teamAbbrev: player.teamAbbrev,
			goals: player.goals,
			assists: player.assists,
			points: player.points,
		}));
}

function getGoalieStats(boxscore: BoxscoreResponse | null) {
	if (!boxscore) {
		return { away: [], home: [] };
	}

	const mapGoalie = (
		goalie: BoxscoreResponse['playerByGameStats']['awayTeam']['goalies'][number],
	) => ({
		playerId: goalie.playerId,
		name: goalie.name.default,
		sweaterNumber: goalie.sweaterNumber,
		starter: goalie.starter,
		decision: goalie.decision ?? null,
		saves: goalie.saves,
		shotsAgainst: goalie.shotsAgainst,
		goalsAgainst: goalie.goalsAgainst,
		savePctg: goalie.savePctg,
		toi: goalie.toi,
	});

	return {
		away: boxscore.playerByGameStats.awayTeam.goalies.map(mapGoalie),
		home: boxscore.playerByGameStats.homeTeam.goalies.map(mapGoalie),
	};
}

function renderGameTable(payload: {
	game: {
		id: number;
		date: string;
		away: { abbrev: string; score: number };
		home: { abbrev: string; score: number };
		state: string;
	};
	scoringLeaders: Array<{
		name: string;
		teamAbbrev: string;
		goals: number;
		assists: number;
		points: number;
	}>;
	goalieStats: {
		away: Array<{
			name: string;
			saves: number;
			shotsAgainst: number;
			goalsAgainst: number;
			savePctg: number;
		}>;
		home: Array<{
			name: string;
			saves: number;
			shotsAgainst: number;
			goalsAgainst: number;
			savePctg: number;
		}>;
	};
	threeStars: Array<{ star: number; name: string; teamAbbrev: string }>;
	plays: unknown[];
}) {
	const lines = [
		`Game ${payload.game.id} | ${payload.game.date} | ${payload.game.away.abbrev} ${payload.game.away.score} - ${payload.game.home.score} ${payload.game.home.abbrev} | ${payload.game.state}`,
		'',
		'Three Stars:',
		...(payload.threeStars.length
			? payload.threeStars.map((star) => `  ${star.star}. ${star.name} (${star.teamAbbrev})`)
			: ['  (none)']),
		'',
		'Top Scorers:',
		...(payload.scoringLeaders.length
			? payload.scoringLeaders
					.slice(0, 8)
					.map((p) => `  ${p.name} (${p.teamAbbrev}) - ${p.goals}G ${p.assists}A ${p.points}P`)
			: ['  (none)']),
		'',
		'Goalies:',
		...payload.goalieStats.away.map(
			(g) =>
				`  ${g.name} (${payload.game.away.abbrev}) - ${g.saves}/${g.shotsAgainst}, ${g.savePctg}%`,
		),
		...payload.goalieStats.home.map(
			(g) =>
				`  ${g.name} (${payload.game.home.abbrev}) - ${g.saves}/${g.shotsAgainst}, ${g.savePctg}%`,
		),
		'',
		`Parsed Plays: ${payload.plays.length}`,
	];
	return lines.join('\n');
}
