import { useEffect, useMemo, useState } from 'react';
import type { GameDetail, GameListItem } from '@/data/api/client.js';
import { fetchGameDetail, fetchGames } from './api.js';
import GameDetailPane from './components/GameDetailPane.js';
import GamesListPane from './components/GamesListPane.js';
import { useGameHotkeys } from './hooks/useGameHotkeys.js';
import { updateUrlState } from './helpers.js';
import { useWebAppStore } from './state/useWebAppStore.js';

export default function App() {
  const cursor = useWebAppStore((s) => s.cursor);
  const selectedGameId = useWebAppStore((s) => s.selectedGameId);
  const detailTab = useWebAppStore((s) => s.detailTab);
  const gamesReloadKey = useWebAppStore((s) => s.gamesReloadKey);
  const detailReloadKey = useWebAppStore((s) => s.detailReloadKey);
  const setSelectedGameId = useWebAppStore((s) => s.setSelectedGameId);
  const setDetailTab = useWebAppStore((s) => s.setDetailTab);
  const hydrateFromUrl = useWebAppStore((s) => s.hydrateFromUrl);

  const [gamesData, setGamesData] = useState<{
    status: 'loading' | 'success' | 'error';
    data: GameListItem[];
    nextCursor: string | null;
    error: string | null;
  }>({
    status: 'loading',
    data: [],
    nextCursor: null,
    error: null,
  });
  const [gameDetail, setGameDetail] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    data: GameDetail | null;
    error: string | null;
  }>({
    status: 'idle',
    data: null,
    error: null,
  });

  useEffect(() => {
    const onPopState = () => hydrateFromUrl();
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, [hydrateFromUrl]);

  useEffect(() => {
    let cancelled = false;

    setGamesData((current) => ({
      ...current,
      status: 'loading',
      error: null,
    }));

    fetchGames(cursor)
      .then((result) => {
        if (cancelled) return;

        setGamesData({
          status: 'success',
          data: result.items,
          nextCursor: result.nextCursor,
          error: null,
        });

        const currentSelectedGameId = useWebAppStore.getState().selectedGameId;
        if (
          currentSelectedGameId &&
          result.items.some((game) => game.id === currentSelectedGameId)
        ) {
          setSelectedGameId(currentSelectedGameId);
        } else {
          setSelectedGameId(result.items[0]?.id ?? null);
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        setGamesData({
          status: 'error',
          data: [],
          nextCursor: null,
          error: error instanceof Error ? error.message : String(error),
        });
      });

    return () => {
      cancelled = true;
    };
  }, [cursor, gamesReloadKey, setSelectedGameId]);

  useEffect(() => {
    if (gamesData.status !== 'success') {
      return;
    }

    updateUrlState(cursor, selectedGameId);
  }, [cursor, gamesData.status, selectedGameId]);

  useEffect(() => {
    if (!selectedGameId) {
      setGameDetail({
        status: 'idle',
        data: null,
        error: null,
      });
      return;
    }

    let cancelled = false;

    setGameDetail((current) => ({
      ...current,
      status: 'loading',
      error: null,
    }));

    fetchGameDetail(selectedGameId)
      .then((result) => {
        if (cancelled) return;

        setGameDetail({
          status: 'success',
          data: result,
          error: null,
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        setGameDetail({
          status: 'error',
          data: null,
          error: error instanceof Error ? error.message : String(error),
        });
      });

    return () => {
      cancelled = true;
    };
  }, [selectedGameId, detailReloadKey]);

  useEffect(() => {
    if (!selectedGameId || gameDetail.data?.status !== 'in_progress') {
      return;
    }

    const timer = window.setInterval(() => {
      fetchGameDetail(selectedGameId)
        .then((result) => {
          setGameDetail({
            status: 'success',
            data: result,
            error: null,
          });
        })
        .catch((error: unknown) => {
          setGameDetail((current) => ({
            ...current,
            status: 'error',
            error: error instanceof Error ? error.message : String(error),
          }));
        });
    }, 30_000);

    return () => {
      window.clearInterval(timer);
    };
  }, [selectedGameId, gameDetail.data?.status]);

  const currentGame = useMemo(
    () => gamesData.data.find((game) => game.id === selectedGameId) ?? null,
    [gamesData.data, selectedGameId],
  );
  const displayedDate = cursor ?? currentGame?.date ?? gamesData.data[0]?.date ?? 'today';

  useGameHotkeys(gamesData.data);

  return (
    <main className="app-shell">
      <header className="topbar">
        <span>Games {displayedDate !== 'today' ? `• ${displayedDate}` : ''}</span>
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
        <span>{gamesData.status === 'success' ? `${gamesData.data.length} loaded` : gamesData.status}</span>
        <span>[h/l] day [j/k] select [1/2/3] tabs [t] today [r] refresh</span>
      </footer>
    </main>
  );
}
