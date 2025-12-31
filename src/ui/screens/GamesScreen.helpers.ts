import { formatDate, type GameDetail, type StandingListItem, type StandingsData } from '@/data/api/client.js';

export function getRefreshInterval(
	selectedGameId: string | null,
	displayGame: GameDetail | null,
): number {
	if (!selectedGameId || !displayGame) return 0;
	const gameStatus = displayGame.status;
	if (gameStatus === 'in_progress') return 5_000; // 5s for live games
	if (gameStatus === 'final') return 30_000; // 30s for completed games
	return 30_000; // 30s for scheduled games
}

export function getPlaysCount(
	detailTab: 'stats' | 'plays' | 'players',
	displayGame: GameDetail | null,
): number {
	if (detailTab === 'plays' && displayGame?.plays) {
		return displayGame.plays.length;
	}
	if (detailTab === 'players' && displayGame?.boxscore) {
		return [
			...(displayGame?.boxscore?.playerByGameStats?.awayTeam?.forwards || []),
			...(displayGame?.boxscore?.playerByGameStats?.awayTeam?.defense || []),
			...(displayGame?.boxscore?.playerByGameStats?.awayTeam?.goalies || []),
			...(displayGame?.boxscore?.playerByGameStats?.homeTeam?.forwards || []),
			...(displayGame?.boxscore?.playerByGameStats?.homeTeam?.defense || []),
			...(displayGame?.boxscore?.playerByGameStats?.homeTeam?.goalies || []),
		].length + 3;
	}
	return 0;
}

export function getGamesHeader(
	status: 'idle' | 'loading' | 'success' | 'error',
	gamesCount: number,
	pageCursor: string | null,
	gameTeamFilter: string | null,
): string {
	if (status === 'loading') return 'Loading games';
	if (status === 'error') return 'Games';
	const dateStr = pageCursor || formatDate(new Date());
	const filterSuffix = gameTeamFilter ? ` (Filtered: ${gameTeamFilter})` : '';
	return `Games for ${dateStr} (${gamesCount})${filterSuffix}`;
}

export function getTeamStandings(
	displayGame: GameDetail | null,
	standingsData: StandingsData | undefined,
): { home: StandingListItem | null; away: StandingListItem | null } | null {
	if (!displayGame || !standingsData) return null;

	const allStandings = standingsData.league;
	const homeTeam = allStandings.find((t) => t.teamAbbrev === displayGame.homeTeamAbbrev);
	const awayTeam = allStandings.find((t) => t.teamAbbrev === displayGame.awayTeamAbbrev);

	return { home: homeTeam ?? null, away: awayTeam ?? null };
}
