import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import type { GameDetail, GameListItem } from '@/data/api/client.js';
import { fetchGameDetail, fetchGames } from './api.js';
import GameDetailPane from './components/GameDetailPane.js';
import GamesListPane from './components/GamesListPane.js';
import { useDebouncedValue } from './hooks/useDebouncedValue.js';
import { useGameHotkeys } from './hooks/useGameHotkeys.js';
import { updateUrlState } from './helpers.js';
import { useWebAppStore } from './state/useWebAppStore.js';

type GamesPaneState = {
  status: 'loading' | 'success' | 'error';
  data: GameListItem[];
  nextCursor: string | null;
  error: string | null;
};

type GameDetailState = {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: GameDetail | null;
  error: string | null;
};

export default function App() {
  const cursor = useWebAppStore((s) => s.cursor);
  const selectedGameId = useWebAppStore((s) => s.selectedGameId);
  const detailTab = useWebAppStore((s) => s.detailTab);
  const gamesReloadKey = useWebAppStore((s) => s.gamesReloadKey);
  const detailReloadKey = useWebAppStore((s) => s.detailReloadKey);
  const setSelectedGameId = useWebAppStore((s) => s.setSelectedGameId);
  const setDetailTab = useWebAppStore((s) => s.setDetailTab);
  const hydrateFromUrl = useWebAppStore((s) => s.hydrateFromUrl);
  const debouncedSelectedGameId = useDebouncedValue(selectedGameId, 120);

  useEffect(() => {
    const onPopState = () => hydrateFromUrl();
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, [hydrateFromUrl]);

  const gamesQuery = useQuery({
    queryKey: ['games', cursor, gamesReloadKey],
    queryFn: () => fetchGames(cursor),
    staleTime: 60_000,
  });

  const gameDetailQuery = useQuery({
    queryKey: ['game-detail', debouncedSelectedGameId, detailReloadKey],
    queryFn: async () => {
      if (!debouncedSelectedGameId) {
        throw new Error('Missing game id');
      }
      return fetchGameDetail(debouncedSelectedGameId);
    },
    enabled: Boolean(debouncedSelectedGameId),
    staleTime: 30_000,
    refetchInterval: ({ state }) =>
      state.data?.status === 'in_progress' ? 30_000 : false,
    refetchIntervalInBackground: false,
  });

  const gamesData = useMemo<GamesPaneState>(
    () => ({
      status:
        gamesQuery.status === 'pending'
          ? 'loading'
          : gamesQuery.status === 'error'
            ? 'error'
            : 'success',
      data: gamesQuery.data?.items ?? [],
      nextCursor: gamesQuery.data?.nextCursor ?? null,
      error:
        gamesQuery.error instanceof Error ? gamesQuery.error.message : gamesQuery.error ? String(gamesQuery.error) : null,
    }),
    [gamesQuery.data, gamesQuery.error, gamesQuery.status],
  );

  const gameDetail = useMemo<GameDetailState>(
    () => ({
      status:
        !debouncedSelectedGameId
          ? 'idle'
          : gameDetailQuery.status === 'pending'
            ? 'loading'
            : gameDetailQuery.status === 'error'
              ? 'error'
              : 'success',
      data: gameDetailQuery.data ?? null,
      error:
        gameDetailQuery.error instanceof Error
          ? gameDetailQuery.error.message.includes('Unexpected status 429')
            ? 'Rate limited by NHL API. Pause briefly and try again.'
            : gameDetailQuery.error.message
          : gameDetailQuery.error
            ? String(gameDetailQuery.error)
            : null,
    }),
    [debouncedSelectedGameId, gameDetailQuery.data, gameDetailQuery.error, gameDetailQuery.status],
  );

  useEffect(() => {
    if (!gamesQuery.data) {
      return;
    }

    const currentSelectedGameId = useWebAppStore.getState().selectedGameId;
    if (
      currentSelectedGameId &&
      gamesQuery.data.items.some((game) => game.id === currentSelectedGameId)
    ) {
      setSelectedGameId(currentSelectedGameId);
    } else {
      setSelectedGameId(gamesQuery.data.items[0]?.id ?? null);
    }
  }, [gamesQuery.data, setSelectedGameId]);

  useEffect(() => {
    if (!gamesQuery.data) {
      return;
    }

    updateUrlState(cursor, selectedGameId);
  }, [cursor, gamesQuery.data, selectedGameId]);

  const currentGame = useMemo(
    () => gamesData.data.find((game) => game.id === selectedGameId) ?? null,
    [gamesData.data, selectedGameId],
  );
  const displayedDate = cursor ?? currentGame?.date ?? gamesData.data[0]?.date ?? 'today';

  useGameHotkeys(gamesData.data);

  return (
    <main className="app-shell">
      <header className="topbar">
        <span>Games</span>
      </header>

      <section className="pane-grid">
        <GamesListPane
          displayedDate={displayedDate}
          gamesData={gamesData}
          selectedGameId={selectedGameId}
          setSelectedGameId={setSelectedGameId}
        />
        <GameDetailPane
          gameDetail={gameDetail}
          selectedGameId={selectedGameId}
          detailTab={detailTab}
          setDetailTab={setDetailTab}
        />
      </section>

      <footer className="statusbar">
        <span>⚫︎ puck</span>
        <span>[h/l] day [j/k] select [1/2/3] tabs [t] today [r] refresh</span>
      </footer>
    </main>
  );
}
