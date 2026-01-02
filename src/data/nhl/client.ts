import { BaseURLWeb, SortOrder } from '@/data/nhl/constants.js';
import { getCurrentSeasonId } from '@/data/nhl/formatters.js';
import type {
	BoxscoreResponse,
	FilteredScoreboardResponse,
	GameDetails,
	GameStoryResponse,
	GoalieStatsResponse,
	LanguageNames,
	PlayByPlayResponse,
	PlayerLandingResponse,
	PlayerSearchResult,
	RosterResponse,
	ScoreboardResponse,
	SeasonTotal,
	SkaterStatsResponse,
	StandingsResponse,
	StatsFilter,
	StatsLeadersResponse,
	TeamInfo,
	TeamScheduleResponse,
	TeamsResponse,
} from '@/data/nhl/models.js';
import { formatDate } from '@/utils/dateUtils.js';
import { playerCache } from './playerCache.js';
import { fuzzyMatchPlayers } from '@/utils/fuzzyMatchPlayers.js';

type HttpResponse = {
	ok: boolean;
	status: number;
	json: () => Promise<unknown>;
};

export type HttpClient = (
	input: string,
	init?: {
		method?: string;
		headers?: Record<string, string>;
	},
) => Promise<HttpResponse>;

export class NhlClient {
	private baseUrl: string;
	private httpClient: HttpClient;
	private teamsCache: TeamsResponse | null = null;

	constructor(options?: { baseUrl?: string; httpClient?: HttpClient }) {
		this.baseUrl = options?.baseUrl ?? BaseURLWeb;
		this.httpClient =
			options?.httpClient ?? ((input, init) => fetch(input, init) as Promise<HttpResponse>);
	}

	private async get<T>(path: string): Promise<T> {
		const response = await this.httpClient(`${this.baseUrl}${path}`, {
			method: 'GET',
			headers: {
				Accept: 'application/json',
			},
		});

		if (!response.ok) {
			throw new Error(`Unexpected status ${response.status} for ${path}`);
		}

		return (await response.json()) as T;
	}

	async getCurrentSchedule(): Promise<FilteredScoreboardResponse> {
		const today = formatDate(new Date());
		return this.getScheduleByDate(today, 'asc');
	}

	async getScheduleByDate(date: string, sortOrder: SortOrder): Promise<FilteredScoreboardResponse> {
		const path = sortOrder === 'desc' ? `/score/${date}?sort=desc` : `/score/${date}`;
		const response = await this.get<FilteredScoreboardResponse>(path);
		return { ...response, date };
	}

	async getTeamSchedule(team: TeamInfo, seasonId: number): Promise<TeamScheduleResponse> {
		if (!team) throw new Error('team cannot be nil');
		if (seasonId <= 0) throw new Error(`invalid season ID: ${seasonId}`);
		const path = `/club-schedule-season/${team.abbreviation}/${seasonId}`;
		return this.get<TeamScheduleResponse>(path);
	}

	async getGameDetails(gameId: number): Promise<GameDetails> {
		return this.get<GameDetails>(`/gamecenter/${gameId}/landing`);
	}

	async getGameBoxscore(gameId: number): Promise<BoxscoreResponse> {
		return this.get<BoxscoreResponse>(`/gamecenter/${gameId}/boxscore`);
	}

	async getGamePlayByPlay(gameId: number): Promise<PlayByPlayResponse> {
		return this.get<PlayByPlayResponse>(`/gamecenter/${gameId}/play-by-play`);
	}

	async getGameStory(gameId: number): Promise<GameStoryResponse> {
		return this.get<GameStoryResponse>(`/wsc/game-story/${gameId}`);
	}

	async getLiveGameUpdates(): Promise<ScoreboardResponse> {
		return this.get<ScoreboardResponse>(`/scoreboard/now`);
	}

	async getStandings(): Promise<StandingsResponse> {
		return this.get<StandingsResponse>(`/standings/now`);
	}

	async getStandingsByDate(date: string): Promise<StandingsResponse> {
		return this.get<StandingsResponse>(`/standings/${date}`);
	}

	async getStatsLeaders(seasonId: number): Promise<StatsLeadersResponse> {
		const useSeason = seasonId === 0 ? getCurrentSeasonId() : seasonId;
		return this.get<StatsLeadersResponse>(`/skater-stats-leaders/${useSeason}/2`);
	}

	async getTeams(): Promise<TeamsResponse> {
		if (this.teamsCache) return this.teamsCache;

		const teamData: Array<{ id: number; abbr: string; name: string; city: string }> = [
			{ id: 1, abbr: 'NJD', name: 'New Jersey Devils', city: 'New Jersey' },
			{ id: 2, abbr: 'NYI', name: 'New York Islanders', city: 'New York' },
			{ id: 3, abbr: 'NYR', name: 'New York Rangers', city: 'New York' },
			{ id: 4, abbr: 'PHI', name: 'Philadelphia Flyers', city: 'Philadelphia' },
			{ id: 5, abbr: 'PIT', name: 'Pittsburgh Penguins', city: 'Pittsburgh' },
			{ id: 6, abbr: 'BOS', name: 'Boston Bruins', city: 'Boston' },
			{ id: 7, abbr: 'BUF', name: 'Buffalo Sabres', city: 'Buffalo' },
			{ id: 8, abbr: 'MTL', name: 'Montreal Canadiens', city: 'Montreal' },
			{ id: 9, abbr: 'OTT', name: 'Ottawa Senators', city: 'Ottawa' },
			{ id: 10, abbr: 'TOR', name: 'Toronto Maple Leafs', city: 'Toronto' },
			{ id: 12, abbr: 'CAR', name: 'Carolina Hurricanes', city: 'Carolina' },
			{ id: 13, abbr: 'FLA', name: 'Florida Panthers', city: 'Florida' },
			{ id: 14, abbr: 'TBL', name: 'Tampa Bay Lightning', city: 'Tampa Bay' },
			{ id: 15, abbr: 'WSH', name: 'Washington Capitals', city: 'Washington' },
			{ id: 16, abbr: 'CHI', name: 'Chicago Blackhawks', city: 'Chicago' },
			{ id: 17, abbr: 'DET', name: 'Detroit Red Wings', city: 'Detroit' },
			{ id: 18, abbr: 'NSH', name: 'Nashville Predators', city: 'Nashville' },
			{ id: 19, abbr: 'STL', name: 'St. Louis Blues', city: 'St. Louis' },
			{ id: 20, abbr: 'CGY', name: 'Calgary Flames', city: 'Calgary' },
			{ id: 21, abbr: 'COL', name: 'Colorado Avalanche', city: 'Colorado' },
			{ id: 22, abbr: 'EDM', name: 'Edmonton Oilers', city: 'Edmonton' },
			{ id: 23, abbr: 'VAN', name: 'Vancouver Canucks', city: 'Vancouver' },
			{ id: 24, abbr: 'ANA', name: 'Anaheim Ducks', city: 'Anaheim' },
			{ id: 25, abbr: 'DAL', name: 'Dallas Stars', city: 'Dallas' },
			{ id: 26, abbr: 'LAK', name: 'Los Angeles Kings', city: 'Los Angeles' },
			{ id: 28, abbr: 'SJS', name: 'San Jose Sharks', city: 'San Jose' },
			{ id: 29, abbr: 'CBJ', name: 'Columbus Blue Jackets', city: 'Columbus' },
			{ id: 30, abbr: 'MIN', name: 'Minnesota Wild', city: 'Minnesota' },
			{ id: 52, abbr: 'WPG', name: 'Winnipeg Jets', city: 'Winnipeg' },
			{ id: 53, abbr: 'ARI', name: 'Arizona Coyotes', city: 'Arizona' },
			{ id: 54, abbr: 'VGK', name: 'Vegas Golden Knights', city: 'Vegas' },
			{ id: 55, abbr: 'SEA', name: 'Seattle Kraken', city: 'Seattle' },
		];

		const teams: TeamsResponse = {
			teams: teamData.map((team) => ({
				id: team.id,
				abbreviation: team.abbr,
				triCode: team.abbr,
				name: { default: team.name },
				city: { default: team.city },
				franchiseId: 0,
				active: true,
			})),
		};

		this.teamsCache = teams;
		return teams;
	}

	async getTeamByIdentifier(identifier: string): Promise<TeamInfo> {
		const teams = await this.getTeams();
		const numericId = Number(identifier);
		if (!Number.isNaN(numericId)) {
			const byId = teams.teams.find((team) => team.id === numericId);
			if (byId) return byId;
		}

		const lowered = identifier.toLowerCase();
		const byName = teams.teams.find(
			(team) =>
				team.abbreviation.toLowerCase() === lowered || team.name.default.toLowerCase() === lowered,
		);
		if (!byName) throw new Error(`team not found: ${identifier}`);
		return byName;
	}

	async getTeamRoster(identifier: string): Promise<RosterResponse> {
		const team = await this.getTeamByIdentifier(identifier);
		return this.get<RosterResponse>(`/roster/${team.abbreviation}/current`);
	}

	async searchPlayer(name: string): Promise<PlayerSearchResult[]> {
		if (!name) throw new Error('name cannot be empty');

		// Get cached players
		const cachedPlayers = playerCache.getPlayers();

		// If cache is empty, fall back to the old implementation
		if (cachedPlayers.length === 0) {
			console.warn('Player cache is empty, falling back to API search');
			return this.searchPlayerLegacy(name);
		}

		// Use fuzzy matching on cached players
		const matches = fuzzyMatchPlayers(name, cachedPlayers);

		// Return just the players (without scores)
		return matches.map((m) => m.player);
	}

	/**
	 * Legacy player search implementation (fallback when cache is empty)
	 * Fetches all team rosters and searches through them
	 */
	private async searchPlayerLegacy(name: string): Promise<PlayerSearchResult[]> {
		const teams = await this.getTeams();
		const lowered = name.toLowerCase();
		const results: PlayerSearchResult[] = [];

		const matches = (player: { firstName: LanguageNames; lastName: LanguageNames }) => {
			const full = `${player.firstName.default} ${player.lastName.default}`.toLowerCase();
			return (
				player.firstName.default.toLowerCase().includes(lowered) ||
				player.lastName.default.toLowerCase().includes(lowered) ||
				full.includes(lowered)
			);
		};

		for (const team of teams.teams) {
			let roster: RosterResponse | null = null;
			try {
				roster = await this.getTeamRoster(team.abbreviation);
			} catch {
				roster = null;
			}
			if (!roster) continue;

			const consume = (player: RosterResponse['forwards'][number]) => {
				results.push({
					firstName: player.firstName,
					lastName: player.lastName,
					position: player.positionCode,
					jerseyNumber: player.sweaterNumber,
					teamId: team.id,
					teamAbbrev: team.abbreviation,
					playerId: player.id,
				});
			};

			roster.forwards.filter(matches).forEach(consume);
			roster.defensemen.filter(matches).forEach(consume);
			roster.goalies.filter(matches).forEach(consume);
		}

		return results;
	}

	async getPlayerStats(
		playerId: number,
		isGoalie: boolean,
		reportType: string,
		filter?: StatsFilter,
	): Promise<GoalieStatsResponse | SkaterStatsResponse> {
		if (playerId <= 0) throw new Error(`invalid player ID: ${playerId}`);

		const validReports = new Set(['regularSeason', 'playoffs']);
		if (!validReports.has(reportType)) throw new Error(`invalid report type: ${reportType}`);

		let path = `/player/${playerId}/landing`;
		if (filter?.seasonId && filter.seasonId > 0) {
			path = `/player/${playerId}/stats/${filter.seasonId}`;
		}
		if (filter?.gameType && filter.gameType !== 0) {
			path = `${path}?cayenneExp=gameTypeId=${filter.gameType}`;
		}

		if (isGoalie) {
			return this.get<GoalieStatsResponse>(path);
		}

		return this.get<SkaterStatsResponse>(path);
	}

	async getPlayerSeasonStats(playerId: number): Promise<PlayerLandingResponse> {
		if (playerId <= 0) throw new Error(`invalid player ID: ${playerId}`);
		return this.get<PlayerLandingResponse>(`/player/${playerId}/landing`);
	}

	async getFilteredPlayerStats(playerId: number, filter?: StatsFilter): Promise<SeasonTotal[]> {
		if (playerId <= 0) throw new Error(`invalid player ID: ${playerId}`);
		const landing = await this.getPlayerSeasonStats(playerId);

		const filtered = landing.seasonTotals.filter((season) => {
			if (season.leagueAbbrev !== 'NHL') return false;
			if (filter?.gameType && season.gameTypeId !== filter.gameType) return false;
			if (filter?.seasonId && season.season !== filter.seasonId) return false;
			return true;
		});

		const sorted = [...filtered].sort((a, b) => b.season - a.season);
		return sorted;
	}
}
