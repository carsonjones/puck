import { useEffect, useState } from "react";
import { NhlClient } from "@/data/nhl/client.js";
import { queryKeys } from "@/data/query/keys.js";
import { queryClient } from "@/data/query/queryClient.js";
import type { PlayerInfo, SeasonTotal } from "@/data/nhl/models.js";

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

export type TeamRosterData = {
  players: PlayerWithStats[];
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!teamAbbrev) {
      setPlayers([]);
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

        const allPlayers: PlayerInfo[] = [
          ...roster.forwards,
          ...roster.defensemen,
          ...roster.goalies,
        ];

        const statsPromises = allPlayers.map(async (player) => {
          try {
            const landing = await nhlClient.getPlayerSeasonStats(player.id);
            return { player, landing };
          } catch {
            return { player, landing: null };
          }
        });

        const results = await Promise.all(statsPromises);

        const playersWithStats: PlayerWithStats[] = results.map(({ player, landing }) => {
          const seasonStats = landing?.seasonTotals?.find(
            (s: SeasonTotal) => s.season === currentSeason && s.gameTypeId === 2
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
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRosterData();
  }, [teamAbbrev]);

  return { players, loading, error };
};
