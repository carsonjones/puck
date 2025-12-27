import { useCallback } from "react";
import { getGame } from "../api/client.js";
import { queryKeys } from "../query/keys.js";
import { useQuery } from "../query/useQuery.js";

export const useGame = (id: string | null) => {
  const enabled = Boolean(id);
  const key = id ? queryKeys.gameDetail(id) : "games:detail:empty";
  const fetcher = useCallback(() => getGame({ id: id ?? "" }), [id]);
  return useQuery(key, fetcher, { enabled, staleTimeMs: 30_000 });
};
