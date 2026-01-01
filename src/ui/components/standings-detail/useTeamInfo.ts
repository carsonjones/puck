import { useEffect, useState } from 'react';
import { NhlClient } from '@/data/nhl/client.js';

const getCurrentSeasonId = () => {
	const now = new Date();
	const year = now.getFullYear();
	const month = now.getMonth();
	const startYear = month < 8 ? year - 1 : year;
	return Number(`${startYear}${startYear + 1}`);
};

export type TeamInfo = {
	arena: string | null;
	loading: boolean;
	error: unknown;
};

export const useTeamInfo = (teamAbbrev: string | null): TeamInfo => {
	const [arena, setArena] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<unknown>(null);

	useEffect(() => {
		if (!teamAbbrev) {
			setArena(null);
			setLoading(false);
			return;
		}

		const fetchTeamInfo = async () => {
			setLoading(true);
			setError(null);

			try {
				const nhlClient = new NhlClient();
				const currentSeason = getCurrentSeasonId();
				const team = await nhlClient.getTeamByIdentifier(teamAbbrev);
				const schedule = await nhlClient.getTeamSchedule(team, currentSeason);

				// Find first home game with venue info
				const homeGame = schedule.games.find(
					(game) => game.homeTeam.id === team.id && game.venue
				);

				setArena(homeGame?.venue?.default || null);
			} catch (err) {
				setError(err);
			} finally {
				setLoading(false);
			}
		};

		const timeoutId = setTimeout(() => {
			fetchTeamInfo();
		}, 200);

		return () => clearTimeout(timeoutId);
	}, [teamAbbrev]);

	return { arena, loading, error };
};
