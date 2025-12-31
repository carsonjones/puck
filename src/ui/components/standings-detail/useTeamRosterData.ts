import { useEffect, useState } from 'react';
import { NhlClient } from '@/data/nhl/client.js';
import type { PlayerInfo, SeasonTotal } from '@/data/nhl/models.js';

export type PlayerWithStats = {
	id: number;
	sweaterNumber: number;
	firstName: string;
	lastName: string;
	positionCode: string;
	gamesPlayed: number;
	goals: number;
	assists: number;
	points: number;
	plusMinus: number;
	shots: number;
	shootingPctg: number;
};

export type GoalieWithStats = {
	id: number;
	sweaterNumber: number;
	firstName: string;
	lastName: string;
	gamesPlayed: number;
	wins: number;
	losses: number;
	otLosses: number;
	goalsAgainstAverage: number;
	savePct: number;
	shutouts: number;
};

export type TeamRosterData = {
	players: PlayerWithStats[];
	goalies: GoalieWithStats[];
	loading: boolean;
	error: unknown;
};

const getCurrentSeasonId = () => {
	const now = new Date();
	const year = now.getFullYear();
	const month = now.getMonth();
	const startYear = month < 8 ? year - 1 : year;
	return Number(`${startYear}${startYear + 1}`);
};

export const useTeamRosterData = (teamAbbrev: string | null): TeamRosterData => {
	const [players, setPlayers] = useState<PlayerWithStats[]>([]);
	const [goalies, setGoalies] = useState<GoalieWithStats[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<unknown>(null);

	useEffect(() => {
		if (!teamAbbrev) {
			setPlayers([]);
			setGoalies([]);
			setLoading(false);
			return;
		}

		const fetchRosterData = async () => {
			setLoading(true);
			setError(null);

			try {
				const nhlClient = new NhlClient();
				const currentSeason = getCurrentSeasonId();
				const roster = await nhlClient.getTeamRoster(teamAbbrev);

				const skaters: PlayerInfo[] = [...roster.forwards, ...roster.defensemen];

				const skatersStatsPromises = skaters.map(async (player) => {
					try {
						const landing = await nhlClient.getPlayerSeasonStats(player.id);
						return { player, landing };
					} catch {
						return { player, landing: null };
					}
				});

				const skatersResults = await Promise.all(skatersStatsPromises);

				const playersWithStats: PlayerWithStats[] = skatersResults.map(({ player, landing }) => {
					const seasonStats = landing?.seasonTotals?.find(
						(s: SeasonTotal) => s.season === currentSeason && s.gameTypeId === 2,
					);

					return {
						id: player.id,
						sweaterNumber: player.sweaterNumber,
						firstName: player.firstName.default,
						lastName: player.lastName.default,
						positionCode: player.positionCode,
						gamesPlayed: seasonStats?.gamesPlayed || 0,
						goals: seasonStats?.goals || 0,
						assists: seasonStats?.assists || 0,
						points: seasonStats?.points || 0,
						plusMinus: seasonStats?.plusMinus || 0,
						shots: seasonStats?.shots || 0,
						shootingPctg: seasonStats?.shootingPctg || 0,
					};
				});

				playersWithStats.sort((a, b) => b.points - a.points);
				setPlayers(playersWithStats);

				const goaliesStatsPromises = roster.goalies.map(async (goalie) => {
					try {
						const landing = await nhlClient.getPlayerSeasonStats(goalie.id);
						return { player: goalie, landing };
					} catch {
						return { player: goalie, landing: null };
					}
				});

				const goaliesResults = await Promise.all(goaliesStatsPromises);

				const goaliesWithStats: GoalieWithStats[] = goaliesResults.map(({ player, landing }) => {
					const seasonStats = landing?.seasonTotals?.find(
						(s: SeasonTotal) => s.season === currentSeason && s.gameTypeId === 2,
					);

					return {
						id: player.id,
						sweaterNumber: player.sweaterNumber,
						firstName: player.firstName.default,
						lastName: player.lastName.default,
						gamesPlayed: seasonStats?.gamesPlayed || 0,
						wins: seasonStats?.wins || 0,
						losses: seasonStats?.losses || 0,
						otLosses: seasonStats?.otLosses || 0,
						goalsAgainstAverage: seasonStats?.goalsAgainstAverage || 0,
						savePct: seasonStats?.savePctg || 0,
						shutouts: seasonStats?.shutouts || 0,
					};
				});

				goaliesWithStats.sort((a, b) => b.wins - a.wins);
				setGoalies(goaliesWithStats);
			} catch (err) {
				setError(err);
			} finally {
				setLoading(false);
			}
		};

		const timeoutId = setTimeout(() => {
			fetchRosterData();
		}, 200);

		return () => clearTimeout(timeoutId);
	}, [teamAbbrev]);

	return { players, goalies, loading, error };
};
