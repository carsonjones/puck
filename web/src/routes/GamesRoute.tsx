import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { fetchGameDetail, fetchGames } from '@web/api';
import { GameDetailPane } from '@web/components/GameDetailPane';
import { GamesListPane } from '@web/components/GamesListPane';
import { Head } from '@web/components/Head';
import { Layout } from '@web/components/Layout';
import { useDebouncedValue } from '@web/hooks/useDebouncedValue';
import { useGameHotkeys } from '@web/hooks/useGameHotkeys';
import { type DetailTab, formatDate, shiftDate, updateUrlState } from '@web/helpers';
import { useWebAppStore } from '@web/state/useWebAppStore';

type GamesPaneState = {
  status: 'loading' | 'success' | 'error';
  data: Awaited<ReturnType<typeof fetchGames>>['items'];
  nextCursor: string | null;
  error: string | null;
};

type GameDetailState = {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: Awaited<ReturnType<typeof fetchGameDetail>> | null;
  error: string | null;
};

const normalizeDetailTab = (tab?: string): DetailTab =>
  tab === 'plays' || tab === 'players' ? tab : 'stats';

export function GamesRoute() {
  const gamesReloadKey = useWebAppStore((s) => s.gamesReloadKey);
  const detailReloadKey = useWebAppStore((s) => s.detailReloadKey);
  const refreshGames = useWebAppStore((s) => s.refreshGames);
  const refreshSelectedGame = useWebAppStore((s) => s.refreshSelectedGame);

  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const cursor = searchParams.get('date');
  const selectedGameId = params.gameId ?? null;
  const detailTab = normalizeDetailTab(params.tab);
  const debouncedSelectedGameId = useDebouncedValue(selectedGameId, 120);

  const setSelectedGameId = (gameId: string | null) => {
    const nextSearch = cursor ? `?date=${cursor}` : '';
    const nextPath = gameId ? `/games/${gameId}/${detailTab}${nextSearch}` : `/games${nextSearch}`;
    navigate(nextPath);
  };

  const setDetailTab = (tab: DetailTab) => {
    const nextSearch = cursor ? `?date=${cursor}` : '';
    const nextPath = selectedGameId ? `/games/${selectedGameId}/${tab}${nextSearch}` : `/games${nextSearch}`;
    navigate(nextPath);
  };

  const goToDay = (nextCursor: string | null) => {
    const nextSearch = nextCursor ? `?date=${nextCursor}` : '';
    const nextPath = selectedGameId
      ? `/games/${selectedGameId}/${detailTab}${nextSearch}`
      : `/games${nextSearch}`;
    navigate(nextPath);
  };

  const goToNextDay = () => goToDay(shiftDate(cursor, 1));
  const goToPreviousDay = () => goToDay(shiftDate(cursor, -1));
  const goToToday = () => goToDay(null);

  const gamesQuery = useQuery({
    queryKey: ['games', cursor, gamesReloadKey],
    queryFn: () => fetchGames(cursor),
    staleTime: 60_000,
    refetchInterval: ({ state }) => {
      const hasLiveGame = state.data?.items.some((g) => g.status === 'in_progress');
      return hasLiveGame ? 30_000 : 300_000;
    },
    refetchIntervalInBackground: false,
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
    refetchInterval: ({ state }) => {
      if (!state.data) return false;
      if (state.data.status === 'in_progress') return 5_000;
      return 30_000;
    },
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
        gamesQuery.error instanceof Error
          ? gamesQuery.error.message
          : gamesQuery.error
            ? String(gamesQuery.error)
            : null,
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

    if (
      selectedGameId &&
      gamesQuery.data.items.some((game) => game.id === selectedGameId)
    ) {
      return;
    }

    const firstGameId = gamesQuery.data.items[0]?.id;
    if (!firstGameId) {
      return;
    }

    const nextSearch = cursor ? `?date=${cursor}` : '';
    navigate(`/games/${firstGameId}/${detailTab}${nextSearch}`, { replace: true });
  }, [cursor, detailTab, gamesQuery.data, navigate, selectedGameId]);

  useEffect(() => {
    if (!gamesQuery.data) {
      return;
    }

    updateUrlState(cursor);
  }, [cursor, gamesQuery.data]);

  const currentGame = useMemo(
    () => gamesData.data.find((game) => game.id === selectedGameId) ?? null,
    [gamesData.data, selectedGameId],
  );
  const displayedDate =
    cursor ?? currentGame?.date ?? gamesData.data[0]?.date ?? formatDate(new Date());

  useGameHotkeys({
    games: gamesData.data,
    selectedGameId,
    setSelectedGameId,
    setDetailTab,
    goToToday,
    goToNextDay,
    goToPreviousDay,
    refreshGames,
    refreshSelectedGame,
    navigateToStandings: () => navigate('/standings'),
    navigateToPlayers: () => navigate('/players'),
  });

  return (
    <>
      <Head />
      <Layout
        header={<span>Games</span>}
        footer={
          <>
            <span>● puck</span>
            <span className="max-[960px]:hidden">[h/l] day [j/k] select [1/2/3] tabs [s] standings [P] players [t] today [r] refresh</span>
            <span className="hidden max-[960px]:flex max-[960px]:gap-2 max-[960px]:items-center">
              <button className="border-0 bg-transparent text-light px-2 py-1 cursor-pointer" onClick={goToPreviousDay}>❮</button>
              <button className="border-0 bg-transparent text-light px-2 py-1 cursor-pointer" onClick={goToNextDay}>❯</button>
            </span>
          </>
        }
      >
        <section className="grid grid-cols-[minmax(18rem,26rem)_minmax(0,1fr)] gap-3 min-h-0 max-[960px]:grid-cols-1 max-[960px]:grid-rows-[auto_minmax(0,1fr)] max-[960px]:h-full">
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
      </Layout>
    </>
  );
}
