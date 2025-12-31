import { useCallback } from "react";
import { getPlayerDetail } from "@/data/api/client.js";
import { queryKeys } from "@/data/query/keys.js";
import { useQuery } from "@/data/query/useQuery.js";

export const usePlayerDetail = (playerId: number | null, teamAbbrev?: string) => {
  const key = playerId !== null ? queryKeys.playerDetail(playerId) : null;
  const fetcher = useCallback(() => {
    if (playerId === null) throw new Error("No player ID");
    return getPlayerDetail(playerId, teamAbbrev);
  }, [playerId, teamAbbrev]);

  return useQuery(key ?? "", fetcher, { staleTimeMs: 300_000 });
};
