import { useCallback } from "react";
import { getPlayersLeaderboard } from "@/data/api/client.js";
import { queryKeys } from "@/data/query/keys.js";
import { useQuery } from "@/data/query/useQuery.js";

export const usePlayersLeaderboard = () => {
  const key = queryKeys.playersLeaderboard();
  const fetcher = useCallback(() => getPlayersLeaderboard(), []);
  return useQuery(key, fetcher, { staleTimeMs: 300_000 });
};
