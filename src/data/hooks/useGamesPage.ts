import { useCallback, useEffect } from "react";
import { listGames } from "../api/client.js";
import { queryClient } from "../query/queryClient.js";
import { queryKeys } from "../query/keys.js";
import { useQuery } from "../query/useQuery.js";

const DEFAULT_LIMIT = 10;

export const useGamesPage = ({
  cursor,
  limit = DEFAULT_LIMIT,
}: {
  cursor: string | null;
  limit?: number;
}) => {
  const key = queryKeys.gamesList(cursor, limit);
  const fetcher = useCallback(() => listGames({ cursor, limit }), [cursor, limit]);
  const state = useQuery(key, fetcher, { staleTimeMs: 20_000 });

  useEffect(() => {
    if (state.status !== "success" || !state.data?.nextCursor) return;
    const nextKey = queryKeys.gamesList(state.data.nextCursor, limit);
    queryClient.prefetchQuery(nextKey, () => listGames({ cursor: state.data!.nextCursor, limit }), {
      staleTimeMs: 20_000,
    });
  }, [state.status, state.data, limit]);

  return { ...state, limit };
};
