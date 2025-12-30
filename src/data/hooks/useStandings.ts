import { useCallback } from "react";
import { getStandings } from "../api/client.js";
import { queryKeys } from "../query/keys.js";
import { useQuery } from "../query/useQuery.js";

export const useStandings = () => {
  const key = queryKeys.standings();
  const fetcher = useCallback(() => getStandings(), []);
  return useQuery(key, fetcher, { staleTimeMs: 60_000 });
};
