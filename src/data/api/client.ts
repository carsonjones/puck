import { NhlClient } from '@/data/nhl/client.js';
import type {
	BoxscoreResponse,
	Game as NhlGame,
	GameDetails as NhlGameDetails,
	PlayByPlayResponse,
	PlayerInfo,
	PlayerStats,
	RosterSpot,
} from '@/data/nhl/models.js';
import { addDays, formatDate, formatLocalTime } from '@/utils/dateUtils.js';

export type GameListItem = {
	id: string;
	date: string;
	homeTeam: string;
	awayTeam: string;
	homeTeamAbbrev: string;
	awayTeamAbbrev: string;
	startTime: string;
	status: 'scheduled' | 'in_progress' | 'final';
	homeScore: number;
	awayScore: number;
	period: number;
	periodType: string;
	clock: string;
};

export type GameDetail = GameListItem & {
	venue: string;
	homeScore: number;
	awayScore: number;
	period: number;
	clock: string;
	broadcasts: string[];
	gameType: number;
	leaders: {
		home: string[];
		away: string[];
	};
	threeStars: string[];
	stats: {
		shots: { home: number; away: number };
		hits: { home: number; away: number };
		faceoffPct: { home: number; away: number };
	};
	plays: Play[];
	boxscore: BoxscoreResponse | null;
	homeTeamAbbrev: string;
	awayTeamAbbrev: string;
};

export type Play = {
	time: string;
	description: string;
	playType: string;
};

export type GamesPage = {
	items: GameListItem[];
	nextCursor: string | null;
};

export type StandingListItem = {
	teamName: string;
	teamAbbrev: string;
	wins: number;
	losses: number;
	otLosses: number;
	points: number;
	gamesPlayed: number;
	divisionName: string;
	conferenceName: string;
	rank: number;
	streakCode: string;
	streakCount: number;
	homeWins: number;
	homeLosses: number;
	homeOtLosses: number;
	homePoints: number;
	homeGamesPlayed: number;
	roadWins: number;
	roadLosses: number;
	roadOtLosses: number;
	roadPoints: number;
	roadGamesPlayed: number;
};

export type StandingsData = {
	league: StandingListItem[];
	eastern: StandingListItem[];
	western: StandingListItem[];
	divisions: {
		atlantic: StandingListItem[];
		metropolitan: StandingListItem[];
		central: StandingListItem[];
		pacific: StandingListItem[];
	};
};

const nhlClient = new NhlClient();

const mapGameStatus = (gameState: string): GameListItem['status'] => {
	const normalized = gameState.toLowerCase();
	if (normalized.includes('final') || normalized === 'off') return 'final';
	if (normalized.includes('live') || normalized.includes('inprogress') || normalized === 'crit')
		return 'in_progress';
	return 'scheduled';
};

const mapGameListItem = (game: NhlGame): GameListItem => ({
	id: String(game.id),
	date: game.gameDate.slice(0, 10),
	homeTeam: game.homeTeam.commonName?.default ?? game.homeTeam.name.default,
	awayTeam: game.awayTeam.commonName?.default ?? game.awayTeam.name.default,
	homeTeamAbbrev: game.homeTeam.abbrev,
	awayTeamAbbrev: game.awayTeam.abbrev,
	startTime: formatLocalTime(game.startTimeUTC),
	status: mapGameStatus(game.gameState),
	homeScore: game.homeTeam.score,
	awayScore: game.awayTeam.score,
	period: game.period,
	periodType: game.periodDescriptor?.periodType ?? 'REG',
	clock: game.clock?.timeRemaining ?? '',
});

const sumHits = (players: PlayerStats[]) =>
	players.reduce((total, player) => total + (player.hits ?? 0), 0);

const calcFaceoffPct = (players: PlayerStats[]) => {
	const pct = players.reduce((sum, p) => sum + (p.faceoffWinningPctg ?? 0), 0);
	const count = players.filter((p) => (p.faceoffWinningPctg ?? 0) > 0).length;
	return count > 0 ? Math.round((pct / count) * 100) : 0;
};

const topScorers = (players: PlayerStats[], count: number) => {
	const sorted = [...players].sort((a, b) => b.points - a.points || b.goals - a.goals);
	return sorted
		.slice(0, count)
		.map(
			(player) => `${player.name.default} • ${player.goals}G ${player.assists}A ${player.points}P`,
		);
};

type RosterPlayer = {
	firstName: string;
	lastName: string;
	number: number;
	position: string;
};

const formatPlayerName = (player: RosterPlayer) => {
	const initial = player.firstName.charAt(0);
	return `${initial}. ${player.lastName} (${player.number})`;
};

const rosterMapFromPlayByPlay = (plays: PlayByPlayResponse | null) => {
	const map = new Map<number, RosterPlayer>();
	if (!plays) return map;
	plays.rosterSpots.forEach((spot: RosterSpot) => {
		map.set(spot.playerId, {
			firstName: spot.firstName.default,
			lastName: spot.lastName.default,
			number: spot.sweaterNumber,
			position: spot.positionCode,
		});
	});
	return map;
};

/**
 * Formats a descKey from the API into a human-readable string.
 * Handles various formats: lowercase, hyphens, underscores, camelCase, etc.
 * Examples:
 *   "high-sticking" -> "High Sticking"
 *   "holding" -> "Holding"
 *   "too-many-men" -> "Too Many Men"
 *   "delayOfGame" -> "Delay Of Game"
 */
const formatDescKey = (descKey: string): string => {
	// Special case mappings for descKeys and stoppage reasons
	const specialCases: Record<string, string> = {
		// Penalties
		boarding: 'Boarding',
		'cross-checking': 'Cross Checking',
		'delaying-game-puck-over-glass': 'Delay of Game - Puck Over Glass',
		'delaying-game-unsuccessful-challenge': 'Delay of Game - Unsuccessful Challenge',
		fighting: 'Fighting',
		'game-misconduct': 'Game Misconduct',
		'high-sticking': 'High Sticking',
		'high-sticking-double-minor': 'High Sticking (Double Minor)',
		holding: 'Holding',
		'holding-the-stick': 'Holding the Stick',
		hooking: 'Hooking',
		interference: 'Interference',
		'interference-goalkeeper': 'Goaltender Interference',
		misconduct: 'Misconduct',
		'ps-slash-on-breakaway': 'Penalty Shot - Slash on Breakaway',
		roughing: 'Roughing',
		slashing: 'Slashing',
		'too-many-men-on-the-ice': 'Too Many Men',
		tripping: 'Tripping',

		// Stoppage reasons
		'goalie-stopped-after-sog': 'Goalie Stops After Shot',
		'goalie-puck-frozen-played-from-beyond-center': 'Puck Played From Beyond Center',
		'hand-pass': 'Hand Pass',
		'high-stick': 'High Stick',
		icing: 'Icing',
		offside: 'Offside',
		'puck-frozen': 'Puck Frozen',
		'puck-in-benches': 'Puck in Bench',
		'puck-in-crowd': 'Puck in Crowd',
		'puck-in-netting': 'Puck Out of Play',
		'puck-in-penalty-benches': 'Puck in Penalty Box',
		'referee-or-linesman': 'Referee or Linesman',
		'net-dislodged-defensive-skater': 'Net Dislodged by Defensive Player',
		'net-dislodged-offensive-skater': 'Net Dislodged by Offensive Player',
		'objects-on-ice': 'Objects on Ice',
		'player-equipment': 'Player Equipment',
		'player-injury': 'Player Injury',
		'rink-repair': 'Rink Repair',
		'video-review': 'Video Review',

		// Timeouts and challenges
		'tv-timeout': 'TV Timeout',
		'home-timeout': 'Home Timeout',
		'visitor-timeout': 'Visitor Timeout',
		'chlg-hm-goal-interference': 'Challenge - Goaltender Interference',
		'chlg-hm-missed-stoppage': 'Challenge - Missed Stoppage',
		'chlg-hm-off-side': 'Challenge - Offside',
		'chlg-vis-off-side': 'Challenge - Offside',

		// Play types
		'period-start': 'Period Start',
		'period-end': 'Period End',
		'game-end': 'Game End',
		stoppage: 'Stoppage',
		giveaway: 'Giveaway',
		takeaway: 'Takeaway',
		faceoff: 'Faceoff',
		'shot-on-goal': 'Shot on Goal',
		'missed-shot': 'Missed Shot',
		'blocked-shot': 'Blocked Shot',
		'failed-shot-attempt': 'Failed Shot Attempt',
		'shootout-complete': 'Shootout Complete',
	};

	// Check for special cases first
	if (specialCases[descKey]) {
		return specialCases[descKey];
	}

	// Default formatting for other cases
	return (
		descKey
			// Replace hyphens and underscores with spaces
			.replace(/[-_]/g, ' ')
			// Add space before capital letters (for camelCase)
			.replace(/([a-z])([A-Z])/g, '$1 $2')
			// Split into words and capitalize each
			.split(' ')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join(' ')
	);
};

const describePlay = (
	play: PlayByPlayResponse['plays'][number],
	rosterMap: Map<number, RosterPlayer>,
) => {
	const details = play.details;
	const getPlayer = (id?: number) => (id ? rosterMap.get(id) : undefined);
	const fmt = (player?: RosterPlayer) => (player ? formatPlayerName(player) : undefined);

	const scorer = fmt(getPlayer(details?.scoringPlayerId));
	const assist1 = fmt(getPlayer(details?.assist1PlayerId));
	const assist2 = fmt(getPlayer(details?.assist2PlayerId));
	const shooter = fmt(getPlayer(details?.shootingPlayerId));
	const committer = fmt(getPlayer(details?.committedByPlayerId));
	const drawnBy = fmt(getPlayer(details?.drawnByPlayerId));
	const hitter = fmt(getPlayer(details?.hittingPlayerId));
	const hittee = fmt(getPlayer(details?.hitteePlayerId));
	const faceoffWinner = fmt(getPlayer(details?.winningPlayerId));
	const blocker = fmt(getPlayer(details?.blockingPlayerId));

	// Goal with assists
	if (scorer) {
		const assists = [assist1, assist2].filter(Boolean).join(', ');
		return assists ? `Goal - ${scorer} (${assists})` : `Goal - ${scorer}`;
	}

	// Blocked shot
	if (blocker && shooter) return `Blocked Shot - ${blocker} blocks ${shooter}`;

	// Hit
	if (hitter && hittee) return `Hit - ${hitter} on ${hittee}`;
	if (hitter) return `Hit - ${hitter}`;

	// Shot
	if (shooter) return `Shot - ${shooter} (${details?.shotType ?? 'shot'})`;

	// Faceoff
	if (faceoffWinner) return `Faceoff won by ${faceoffWinner}`;

	// Penalty
	if (committer) {
		const penalty = details?.descKey ? formatDescKey(details.descKey) : 'Penalty';
		return drawnBy
			? `${penalty} - ${committer} (drawn by ${drawnBy})`
			: `${penalty} - ${committer}`;
	}

	// Stoppage with reason
	if (play.typeDescKey === 'stoppage' && details?.reason) {
		return formatDescKey(details.reason);
	}

	// Fallback
	if (details?.descKey) return formatDescKey(details.descKey);
	return formatDescKey(play.typeDescKey);
};

const resolvePeriod = (plays: PlayByPlayResponse | null) => {
	if (!plays || plays.plays.length === 0) return 0;
	return plays.plays.reduce((max, play) => Math.max(max, play.periodDescriptor.number), 0);
};

const mapGameDetail = (
	game: NhlGameDetails,
	plays: PlayByPlayResponse | null,
	boxscore: BoxscoreResponse | null,
	gameStory: import('@/data/nhl/models.js').GameStoryResponse | null,
): GameDetail => {
	const homePlayers = boxscore?.playerByGameStats?.homeTeam
		? [
				...boxscore.playerByGameStats.homeTeam.forwards,
				...boxscore.playerByGameStats.homeTeam.defense,
			]
		: [];
	const awayPlayers = boxscore?.playerByGameStats?.awayTeam
		? [
				...boxscore.playerByGameStats.awayTeam.forwards,
				...boxscore.playerByGameStats.awayTeam.defense,
			]
		: [];

	const rosterMap = rosterMapFromPlayByPlay(plays);
	const playsPeriod = resolvePeriod(plays);
	const actualPeriod = gameStory?.periodDescriptor?.number ?? 0;
	const period = Math.max(playsPeriod, actualPeriod);
	const clock = game.clock?.timeRemaining ?? '';

	let status = mapGameStatus(game.gameState);
	if (
		status === 'scheduled' &&
		(game.homeTeam.score > 0 || game.awayTeam.score > 0) &&
		period > 0 &&
		(clock === '00:00' || clock === '')
	) {
		status = 'final';
	}

	return {
		id: String(game.id),
		date: game.gameDate.slice(0, 10),
		homeTeam: game.homeTeam.commonName.default,
		awayTeam: game.awayTeam.commonName.default,
		startTime: formatLocalTime(game.startTimeUTC),
		status,
		venue: game.venue.default,
		homeScore: game.homeTeam.score,
		awayScore: game.awayTeam.score,
		period,
		clock,
		gameType: game.gameType,
		broadcasts:
			game.tvBroadcasts
				?.map((cast) => cast.network)
				.filter((network): network is string => Boolean(network)) ?? [],
		leaders: {
			home: topScorers(homePlayers, 3),
			away: topScorers(awayPlayers, 3),
		},
		threeStars: game.threeStars?.map((star) => `${star.name.default} (${star.teamAbbrev})`) ?? [],
		stats: {
			shots: { home: game.homeTeam.sog, away: game.awayTeam.sog },
			hits: { home: sumHits(homePlayers), away: sumHits(awayPlayers) },
			faceoffPct: { home: calcFaceoffPct(homePlayers), away: calcFaceoffPct(awayPlayers) },
		},
		plays:
			plays?.plays?.map((play) => ({
				time: `P${play.periodDescriptor.number} ${play.timeInPeriod}`,
				description: describePlay(play, rosterMap),
				playType: play.typeDescKey,
			})) ?? [],
		boxscore,
		homeTeamAbbrev: game.homeTeam.abbrev,
		awayTeamAbbrev: game.awayTeam.abbrev,
		periodType: '',
	};
};

export const listGames = async ({ cursor, limit }: { cursor: string | null; limit?: number }): Promise<GamesPage> => {
	let target: Date;
	if (cursor) {
		// Parse YYYY-MM-DD in local timezone (not UTC)
		const parts = cursor.split('-').map(Number);
		if (parts.length !== 3 || parts.some((p) => p === undefined)) {
			throw new Error(`Invalid cursor date format: ${cursor}`);
		}
		const [y, m, d] = parts as [number, number, number];
		target = new Date(y, m - 1, d);
	} else {
		target = new Date();
	}
	if (Number.isNaN(target.getTime())) {
		throw new Error(`Invalid cursor date: ${cursor}`);
	}

	const schedule = await nhlClient.getScheduleByDate(formatDate(target), 'asc');
	const items = schedule.games.map(mapGameListItem);
	const nextDate = addDays(target, 1);

	return {
		items,
		nextCursor: formatDate(nextDate),
	};
};

export const getGame = async ({ id }: { id: string }): Promise<GameDetail> => {
	const numericId = Number(id);
	if (Number.isNaN(numericId)) {
		throw new Error(`Invalid game ID: ${id}`);
	}

	const [details, playByPlay, boxscore, gameStory] = await Promise.all([
		nhlClient.getGameDetails(numericId),
		nhlClient.getGamePlayByPlay(numericId).catch(() => null),
		nhlClient.getGameBoxscore(numericId).catch(() => null),
		nhlClient.getGameStory(numericId).catch(() => null),
	]);

	return mapGameDetail(details, playByPlay, boxscore, gameStory);
};

export const getStandings = async (): Promise<StandingsData> => {
	const response = await nhlClient.getStandings();

	const mapped: StandingListItem[] = response.standings.map((team) => ({
		teamName: team.teamName.default,
		teamAbbrev: team.teamAbbrev.default,
		wins: team.wins,
		losses: team.losses,
		otLosses: team.otLosses,
		points: team.points,
		gamesPlayed: team.gamesPlayed,
		divisionName: team.divisionName,
		conferenceName: team.conferenceName,
		rank: team.leagueSequence,
		streakCode: team.streakCode,
		streakCount: team.streakCount,
		homeWins: team.homeWins,
		homeLosses: team.homeLosses,
		homeOtLosses: team.homeOtLosses,
		homePoints: team.homePoints,
		homeGamesPlayed: team.homeGamesPlayed,
		roadWins: team.wins - team.homeWins,
		roadLosses: team.losses - team.homeLosses,
		roadOtLosses: team.otLosses - team.homeOtLosses,
		roadPoints: team.points - team.homePoints,
		roadGamesPlayed: team.gamesPlayed - team.homeGamesPlayed,
	}));

	const sortByStandings = (a: StandingListItem, b: StandingListItem) =>
		b.points - a.points || b.wins - a.wins || a.gamesPlayed - b.gamesPlayed;

	const assignRanks = (teams: StandingListItem[]) => {
		const sorted = [...teams].sort(sortByStandings);
		let rank = 1;
		return sorted.map((team, idx) => {
			if (idx > 0) {
				const prev = sorted[idx - 1];
				if (prev && (team.points !== prev.points || team.wins !== prev.wins)) {
					rank = idx + 1;
				}
			}
			return { ...team, rank };
		});
	};

	const league = assignRanks(mapped);
	const eastern = assignRanks(mapped.filter((t) => t.conferenceName === 'Eastern'));
	const western = assignRanks(mapped.filter((t) => t.conferenceName === 'Western'));

	const divisions = {
		atlantic: assignRanks(mapped.filter((t) => t.divisionName === 'Atlantic')),
		metropolitan: assignRanks(mapped.filter((t) => t.divisionName === 'Metropolitan')),
		central: assignRanks(mapped.filter((t) => t.divisionName === 'Central')),
		pacific: assignRanks(mapped.filter((t) => t.divisionName === 'Pacific')),
	};

	return { league, eastern, western, divisions };
};

export type PlayerLeaderboardItem = {
	id: number;
	firstName: string;
	lastName: string;
	sweaterNumber: number;
	headshot: string;
	teamAbbrev: string;
	teamName: string;
	position: string;
	points: number;
};

export type PlayerDetailData = {
	id: number;
	firstName: string;
	lastName: string;
	sweaterNumber: number;
	position: string;
	teamAbbrev: string;
	headshot: string;
	birthDate: string;
	birthCity: string;
	birthCountry: string;
	birthStateProvince: string | null;
	heightInInches: number;
	weightInPounds: number;
	shootsCatches: string;
	seasonStats: {
		gamesPlayed: number;
		goals: number;
		assists: number;
		points: number;
		plusMinus: number;
		pim: number;
		shots: number;
		shootingPctg: number;
		ppGoals: number;
		shGoals: number;
		gwGoals: number;
		avgToi: string;
	} | null;
};

export type PlayerGameLog = {
	gameId: number;
	date: string;
	opponent: string;
	homeAway: 'home' | 'away';
	goals: number;
	assists: number;
	points: number;
	plusMinus: number;
	pim: number;
	shots: number;
	toi: string;
};

const getCurrentSeasonId = () => {
	const now = new Date();
	const year = now.getFullYear();
	const month = now.getMonth();
	const startYear = month < 8 ? year - 1 : year;
	return Number(`${startYear}${startYear + 1}`);
};

export const getPlayersLeaderboard = async (): Promise<PlayerLeaderboardItem[]> => {
	const currentSeason = getCurrentSeasonId();
	const response = await nhlClient.getStatsLeaders(currentSeason);

	// Merge ALL stat categories to get ~30-40 unique players (much faster than fetching all rosters)
	const allPlayers = new Map<number, PlayerLeaderboardItem>();

	// Helper to add players from a category
	const addPlayersFromCategory = (players: typeof response.points) => {
		players.forEach((player) => {
			if (!allPlayers.has(player.id)) {
				allPlayers.set(player.id, {
					id: player.id,
					firstName: player.firstName.default,
					lastName: player.lastName.default,
					sweaterNumber: player.sweaterNumber,
					headshot: player.headshot,
					teamAbbrev: player.teamAbbrev,
					teamName: player.teamName.default,
					position: player.position,
					points: 0, // Will be filled in
				});
			}
		});
	};

	// Add players from ALL stat categories (9 categories × 5 players = up to 45, likely ~30-35 unique)
	addPlayersFromCategory(response.points);
	addPlayersFromCategory(response.goals);
	addPlayersFromCategory(response.assists);
	addPlayersFromCategory(response.plusMinus);
	addPlayersFromCategory(response.goalsSh);
	addPlayersFromCategory(response.goalsPp);
	addPlayersFromCategory(response.penaltyMins);
	addPlayersFromCategory(response.faceoffLeaders);
	addPlayersFromCategory(response.toi);

	// Fetch actual points for all players
	const playerIds = Array.from(allPlayers.keys());
	const pointsPromises = playerIds.map(async (playerId) => {
		try {
			const stats = await nhlClient.getPlayerSeasonStats(playerId);
			const seasonStats = stats.seasonTotals?.find(
				(s) => s.season === currentSeason && s.gameTypeId === 2,
			);
			return { id: playerId, points: seasonStats?.points || 0 };
		} catch {
			return { id: playerId, points: 0 };
		}
	});

	const pointsResults = await Promise.all(pointsPromises);
	pointsResults.forEach(({ id, points }) => {
		const player = allPlayers.get(id);
		if (player) player.points = points;
	});

	// Sort by points and return
	return Array.from(allPlayers.values()).sort((a, b) => b.points - a.points);
};

const findPlayerInRosters = async (
	playerId: number,
): Promise<{ playerInfo: PlayerInfo; teamAbbrev: string } | null> => {
	const teams = await nhlClient.getTeams();

	for (const team of teams.teams) {
		try {
			const roster = await nhlClient.getTeamRoster(team.abbreviation);
			const allPlayers = [...roster.forwards, ...roster.defensemen, ...roster.goalies];
			const player = allPlayers.find((p) => p.id === playerId);

			if (player) {
				return { playerInfo: player, teamAbbrev: team.abbreviation };
			}
		} catch {}
	}

	return null;
};

export const getPlayerDetail = async (
	playerId: number,
	teamAbbrev?: string,
): Promise<PlayerDetailData> => {
	const landing = await nhlClient.getPlayerSeasonStats(playerId);

	const currentSeason = getCurrentSeasonId();
	const seasonStats = landing.seasonTotals?.find(
		(s) => s.season === currentSeason && s.gameTypeId === 2,
	);

	// If teamAbbrev provided, fetch roster directly; otherwise search all rosters
	let rosters: { playerInfo: PlayerInfo; teamAbbrev: string } | null | undefined;
	if (teamAbbrev) {
		try {
			const roster = await nhlClient.getTeamRoster(teamAbbrev);
			const allPlayers = [...roster.forwards, ...roster.defensemen, ...roster.goalies];
			const player = allPlayers.find((p) => p.id === playerId);
			if (player) {
				rosters = { playerInfo: player, teamAbbrev };
			}
		} catch {
			rosters = null;
		}
	}

	if (!rosters) {
		rosters = await findPlayerInRosters(playerId);
	}

	if (!rosters?.playerInfo) {
		throw new Error(`Player ${playerId} not found in rosters`);
	}

	const player = rosters.playerInfo;

	return {
		id: player.id,
		firstName: player.firstName.default,
		lastName: player.lastName.default,
		sweaterNumber: player.sweaterNumber,
		position: player.positionCode,
		teamAbbrev: rosters.teamAbbrev,
		headshot: player.headshot,
		birthDate: player.birthDate,
		birthCity: player.birthCity.default,
		birthCountry: player.birthCountry,
		birthStateProvince: player.birthStateProvince?.default || null,
		heightInInches: player.heightInInches,
		weightInPounds: player.weightInPounds,
		shootsCatches: player.shootsCatches,
		seasonStats: seasonStats
			? {
					gamesPlayed: seasonStats.gamesPlayed,
					goals: seasonStats.goals || 0,
					assists: seasonStats.assists || 0,
					points: seasonStats.points || 0,
					plusMinus: seasonStats.plusMinus || 0,
					pim: seasonStats.pim || 0,
					shots: seasonStats.shots || 0,
					shootingPctg: seasonStats.shootingPctg || 0,
					ppGoals: seasonStats.powerPlayGoals || 0,
					shGoals: seasonStats.shorthandedGoals || 0,
					gwGoals: seasonStats.gameWinningGoals || 0,
					avgToi: seasonStats.avgToi || '0:00',
				}
			: null,
	};
};

export const getPlayerGameLog = async (
	playerId: number,
	limit: number = 20,
): Promise<PlayerGameLog[]> => {
	const playerDetail = await getPlayerDetail(playerId);

	const teams = await nhlClient.getTeams();
	const team = teams.teams.find((t) => t.abbreviation === playerDetail.teamAbbrev);
	if (!team) return [];

	const currentSeason = getCurrentSeasonId();
	const schedule = await nhlClient.getTeamSchedule(team, currentSeason);

	const completedGames = schedule.games
		.filter((g) => g.gameState === 'OFF' || g.gameState.includes('FINAL'))
		.sort((a, b) => new Date(b.gameDate).getTime() - new Date(a.gameDate).getTime())
		.slice(0, limit);

	const gameLogPromises = completedGames.map(async (game) => {
		try {
			const boxscore = await nhlClient.getGameBoxscore(game.id);
			const isHome = game.homeTeam.id === team.id;
			const teamStats = isHome
				? boxscore.playerByGameStats.homeTeam
				: boxscore.playerByGameStats.awayTeam;

			const allPlayers = [
				...(teamStats.forwards || []),
				...(teamStats.defense || []),
				...(teamStats.goalies || []),
			];

			const playerStats = allPlayers.find((p) => p.playerId === playerId);
			if (!playerStats) return null;

			const opponent = isHome ? game.awayTeam.abbrev : game.homeTeam.abbrev;

			// Type guard for skater stats
			const isSkater = 'goals' in playerStats;

			return {
				gameId: game.id,
				date: game.gameDate.slice(0, 10),
				opponent,
				homeAway: isHome ? ('home' as const) : ('away' as const),
				goals: isSkater ? playerStats.goals || 0 : 0,
				assists: isSkater ? playerStats.assists || 0 : 0,
				points: isSkater ? playerStats.points || 0 : 0,
				plusMinus: isSkater ? playerStats.plusMinus || 0 : 0,
				pim: playerStats.pim || 0,
				shots: isSkater ? playerStats.sog || 0 : 0,
				toi: playerStats.toi || '0:00',
			};
		} catch {
			return null;
		}
	});

	const results = await Promise.all(gameLogPromises);
	return results.filter((log): log is PlayerGameLog => log !== null);
};
