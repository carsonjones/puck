import { NhlClient } from './client';
import type { PlayerSearchResult } from './models';
import { playerCache } from './playerCache';

/**
 * Fetch all player rosters and update the cache
 */
export async function refreshPlayerCache(): Promise<void> {
	try {
		playerCache.setLoading(true);

		const nhlClient = new NhlClient();
		const teamsResponse = await nhlClient.getTeams();
		const allPlayers: PlayerSearchResult[] = [];

		// Fetch all team rosters in parallel
		const rosterPromises = teamsResponse.teams.map(async (team) => {
			try {
				const roster = await nhlClient.getTeamRoster(team.abbreviation);
				const teamPlayers: PlayerSearchResult[] = [];

				// Process forwards
				for (const player of roster.forwards) {
					teamPlayers.push({
						firstName: player.firstName,
						lastName: player.lastName,
						playerId: player.id,
						position: player.positionCode,
						jerseyNumber: player.sweaterNumber,
						teamId: team.id,
						teamAbbrev: team.abbreviation,
					});
				}

				// Process defensemen
				for (const player of roster.defensemen) {
					teamPlayers.push({
						firstName: player.firstName,
						lastName: player.lastName,
						playerId: player.id,
						position: player.positionCode,
						jerseyNumber: player.sweaterNumber,
						teamId: team.id,
						teamAbbrev: team.abbreviation,
					});
				}

				// Process goalies
				for (const player of roster.goalies) {
					teamPlayers.push({
						firstName: player.firstName,
						lastName: player.lastName,
						playerId: player.id,
						position: player.positionCode,
						jerseyNumber: player.sweaterNumber,
						teamId: team.id,
						teamAbbrev: team.abbreviation,
					});
				}

				return teamPlayers;
			} catch (error) {
				// Log error but continue with other teams
				console.error(`Failed to fetch roster for ${team.abbreviation}:`, error);
				return [];
			}
		});

		// Wait for all rosters to be fetched
		const rosterArrays = await Promise.all(rosterPromises);

		// Flatten into single array
		for (const roster of rosterArrays) {
			allPlayers.push(...roster);
		}

		// Update cache
		playerCache.setPlayers(allPlayers);

		console.log(`Player cache updated: ${allPlayers.length} players loaded`);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		playerCache.setError(errorMessage);
		console.error('Failed to refresh player cache:', error);
	}
}

/**
 * Start the background cache refresh worker
 * @param intervalMs - Refresh interval in milliseconds (default: 15 minutes)
 */
export function startPlayerCacheWorker(intervalMs: number = 15 * 60 * 1000): () => void {
	// Initial fetch
	refreshPlayerCache();

	// Set up periodic refresh
	const intervalId = setInterval(() => {
		refreshPlayerCache();
	}, intervalMs);

	// Return cleanup function
	return () => {
		clearInterval(intervalId);
	};
}
