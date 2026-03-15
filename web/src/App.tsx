import { useEffect, useMemo, useState } from 'react';
import type { GameDetail, GameListItem } from '@/data/api/client.js';
import { fetchGameDetail, fetchGames } from './api.js';

const formatPeriod = (period: number, gameType: number): string => {
  if (period <= 0) return 'n/a';
  if (period <= 3) {
    const suffix = period === 1 ? 'st' : period === 2 ? 'nd' : 'rd';
    return `${period}${suffix}`;
  }

  const isPlayoffs = gameType === 3;

  if (period === 4) return 'OT';
  if (period === 5 && !isPlayoffs) return 'SO';

  const overtimeNumber = period - 3;
  const suffix = overtimeNumber === 2 ? 'nd' : overtimeNumber === 3 ? 'rd' : 'th';
  return `${overtimeNumber}${suffix} OT`;
};

const statusLabel = (game: GameListItem) => {
  if (game.status === 'final') {
    const extra = game.periodType === 'OT' ? ' OT' : game.periodType === 'SO' ? ' SO' : '';
    return `${game.awayScore}-${game.homeScore}${extra}`;
  }

  if (game.status === 'in_progress') {
    const period = game.periodType === 'OT' ? 'OT' : game.periodType === 'SO' ? 'SO' : `P${game.period}`;
    return `${game.awayScore}-${game.homeScore} ${period}${game.clock ? ` ${game.clock}` : ''}`;
  }

  return game.startTime;
};

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const shiftDate = (cursor: string | null, delta: number) => {
  const base = cursor ? new Date(`${cursor}T12:00:00`) : new Date();
  const next = new Date(base);
  next.setDate(next.getDate() + delta);
  return formatDate(next);
};

const gameTitle = (game: Pick<GameListItem, 'awayTeam' | 'homeTeam'>) =>
  `${game.awayTeam} @ ${game.homeTeam}`;

const padCell = (value: string, width: number) => value.padEnd(width, ' ');

const formatPlayRow = (time: string, description: string) =>
  `${padCell(time, 8)} ${description}`;

const getSearchParamsState = () => {
  const params = new URLSearchParams(window.location.search);
  const date = params.get('date');
  const game = params.get('game');

  return {
    cursor: date,
    selectedGameId: game,
  };
};

const updateUrlState = (cursor: string | null, selectedGameId: string | null) => {
  const params = new URLSearchParams(window.location.search);

  if (cursor) {
    params.set('date', cursor);
  } else {
    params.delete('date');
  }

  if (selectedGameId) {
    params.set('game', selectedGameId);
  } else {
    params.delete('game');
  }

  const nextSearch = params.toString();
  const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}`;
  window.history.replaceState(null, '', nextUrl);
};

const gameSubtitle = (game: GameDetail) => {
  if (game.status === 'scheduled') {
    return `${game.date} • ${game.startTime} • ${game.venue}`;
  }

  const parts = [`${game.awayScore}-${game.homeScore}`];

  if (game.status === 'final') {
    parts.push('FINAL');
    if (game.period > 3 && game.gameType) {
      parts.push(formatPeriod(game.period, game.gameType));
    }
  } else {
    parts.push(formatPeriod(game.period, game.gameType));
    if (game.clock) {
      parts.push(game.clock);
    }
  }

  return parts.join(' • ');
};

export default function App() {
  const initialUrlState = getSearchParamsState();
  const [cursor, setCursor] = useState<string | null>(initialUrlState.cursor);
  const [gamesReloadKey, setGamesReloadKey] = useState(0);
  const [detailReloadKey, setDetailReloadKey] = useState(0);
  const [detailTab, setDetailTab] = useState<'stats' | 'plays' | 'players'>('stats');
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
  const [selectedGameId, setSelectedGameId] = useState<string | null>(initialUrlState.selectedGameId);
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
    const onPopState = () => {
      const nextState = getSearchParamsState();
      setCursor(nextState.cursor);
      setSelectedGameId(nextState.selectedGameId);
    };

    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

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

        setSelectedGameId((current) => {
          if (current && result.items.some((game) => game.id === current)) {
            return current;
          }
          return result.items[0]?.id ?? null;
        });
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
  }, [cursor, gamesReloadKey]);

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
  const playerRows = useMemo(() => {
    const boxscore = gameDetail.data?.boxscore?.playerByGameStats;
    if (!gameDetail.data || !boxscore) {
      return [];
    }

    const skaterRows = (
      teamName: string,
      players: Array<{
        sweaterNumber: number;
        name: { default: string };
        position: string;
        goals: number;
        assists: number;
        sog: number;
        hits: number;
      }>,
    ) => [
      teamName,
      ...players.map(
        (player) =>
          `${String(player.sweaterNumber).padStart(2, ' ')} ${player.name.default} ${player.position} ${player.goals}-${player.assists}-${player.goals + player.assists} ${player.sog} SOG ${player.hits} HIT`,
      ),
    ];

    const goalieRows = (
      players: Array<{
        sweaterNumber: number;
        name: { default: string };
        position: string;
        saves: number;
        savePctg: number;
      }>,
    ) =>
      players.map(
        (player) =>
          `${String(player.sweaterNumber).padStart(2, ' ')} ${player.name.default} ${player.position} ${player.saves} SV ${(player.savePctg * 100).toFixed(1)}%`,
      );

    return [
      ...skaterRows(gameDetail.data.awayTeam, [
        ...(boxscore.awayTeam?.forwards ?? []),
        ...(boxscore.awayTeam?.defense ?? []),
      ]),
      ...goalieRows(boxscore.awayTeam?.goalies ?? []),
      '',
      ...skaterRows(gameDetail.data.homeTeam, [
        ...(boxscore.homeTeam?.forwards ?? []),
        ...(boxscore.homeTeam?.defense ?? []),
      ]),
      ...goalieRows(boxscore.homeTeam?.goalies ?? []),
    ];
  }, [gameDetail.data]);

  const displayedDate = cursor ?? currentGame?.date ?? gamesData.data[0]?.date ?? 'today';

  const refreshGames = () => {
    setGamesData((current) => ({
      ...current,
      status: 'loading',
      error: null,
    }));
    setGamesReloadKey((current) => current + 1);
  };

  const refreshSelectedGame = () => {
    if (!selectedGameId) {
      return;
    }

    setGameDetail((current) => ({
      ...current,
      status: 'loading',
      error: null,
    }));
    setDetailReloadKey((current) => current + 1);
  };

  const goToDay = (nextCursor: string) => {
    setCursor(nextCursor);
    setSelectedGameId(null);
    window.history.pushState(null, '', `${window.location.pathname}?date=${nextCursor}`);
  };

  const goToNextDay = () => {
    goToDay(shiftDate(cursor, 1));
  };

  const goToPreviousDay = () => {
    goToDay(shiftDate(cursor, -1));
  };

  const goToToday = () => {
    setCursor(null);
    setSelectedGameId(null);
    window.history.pushState(null, '', window.location.pathname);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }

      if (event.key === 'j' || event.key === 'ArrowDown') {
        event.preventDefault();
        const currentIndex = gamesData.data.findIndex((game) => game.id === selectedGameId);
        const nextIndex = currentIndex < 0 ? 0 : Math.min(currentIndex + 1, gamesData.data.length - 1);
        const nextGame = gamesData.data[nextIndex];
        if (nextGame) {
          setSelectedGameId(nextGame.id);
        }
        return;
      }

      if (event.key === 'k' || event.key === 'ArrowUp') {
        event.preventDefault();
        const currentIndex = gamesData.data.findIndex((game) => game.id === selectedGameId);
        const nextIndex = currentIndex < 0 ? 0 : Math.max(currentIndex - 1, 0);
        const nextGame = gamesData.data[nextIndex];
        if (nextGame) {
          setSelectedGameId(nextGame.id);
        }
        return;
      }

      if (event.key === 't') {
        event.preventDefault();
        goToToday();
        return;
      }

      if (event.key === 'l' || event.key === 'ArrowRight' || event.key === 'n') {
        event.preventDefault();
        goToNextDay();
        return;
      }

      if (event.key === 'h' || event.key === 'ArrowLeft' || event.key === 'p') {
        event.preventDefault();
        goToPreviousDay();
        return;
      }

      if (event.key === 'r') {
        event.preventDefault();
        refreshGames();
        refreshSelectedGame();
        return;
      }

      if (event.key === '1') {
        event.preventDefault();
        setDetailTab('stats');
        return;
      }

      if (event.key === '2') {
        event.preventDefault();
        setDetailTab('plays');
        return;
      }

      if (event.key === '3') {
        event.preventDefault();
        setDetailTab('players');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [gamesData.data, selectedGameId, cursor]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <span>Games {displayedDate !== 'today' ? `• ${displayedDate}` : ''}</span>
      </header>

      <section className="pane-grid">
        <aside className="pane pane-list">
          <div className="pane-header">
            <span>{displayedDate}</span>
            <span>{gamesData.data.length} games</span>
          </div>
          <div className="list-scroll">
            {gamesData.status === 'loading' ? <p className="empty-state">Loading games…</p> : null}
            {gamesData.status === 'error' ? <p className="empty-state">{gamesData.error}</p> : null}
            {gamesData.status === 'success' && gamesData.data.length === 0 ? (
              <p className="empty-state">No games found for this date.</p>
            ) : null}
            {gamesData.data.map((game) => (
              <button
                key={game.id}
                className={game.id === selectedGameId ? 'game-row active' : 'game-row'}
                onClick={() => setSelectedGameId(game.id)}
              >
                <span className="game-row-title">{gameTitle(game)}</span>
                <span className="game-row-meta">{statusLabel(game)}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="pane pane-detail">
          <div className="pane-header">
            <span>{gameDetail.data ? gameTitle(gameDetail.data) : 'game detail'}</span>
            <span>{gameDetail.data?.status ?? 'idle'}</span>
          </div>
          <div className="detail-scroll">
            <section className="detail-tabs" aria-label="detail tabs">
              {(['stats', 'plays', 'players'] as const).map((tab) => (
                <button
                  key={tab}
                  className={detailTab === tab ? 'detail-tab active' : 'detail-tab'}
                  onClick={() => setDetailTab(tab)}
                  disabled={!gameDetail.data}
                >
                  {tab}
                </button>
              ))}
            </section>

            {!selectedGameId ? <p className="empty-state">Select a game to view details.</p> : null}
            {selectedGameId && gameDetail.status === 'loading' ? (
              <p className="empty-state">Loading game details…</p>
            ) : null}
            {selectedGameId && gameDetail.status === 'error' ? (
              <p className="empty-state">{gameDetail.error}</p>
            ) : null}
            {gameDetail.data ? (
              <>
                <section className="detail-section">
                  <p className="detail-line">{gameTitle(gameDetail.data)}</p>
                  <p className="detail-line">{gameSubtitle(gameDetail.data)}</p>
                  <p className="detail-line">
                    {gameDetail.data.date} • {gameDetail.data.startTime} • {gameDetail.data.venue}
                  </p>
                  {gameDetail.data.broadcasts.length > 0 ? (
                    <p className="detail-line">
                      Broadcasts: {gameDetail.data.broadcasts.join(', ')}
                    </p>
                  ) : null}
                </section>

                {detailTab === 'stats' ? (
                  <>
                    <section className="detail-section">
                      <p className="detail-line">
                        Shots: {gameDetail.data.awayTeamAbbrev} {gameDetail.data.stats.shots.away} -{' '}
                        {gameDetail.data.stats.shots.home} {gameDetail.data.homeTeamAbbrev}
                      </p>
                      <p className="detail-line">
                        Hits: {gameDetail.data.awayTeamAbbrev} {gameDetail.data.stats.hits.away} -{' '}
                        {gameDetail.data.stats.hits.home} {gameDetail.data.homeTeamAbbrev}
                      </p>
                      <p className="detail-line">
                        Faceoffs: {gameDetail.data.awayTeamAbbrev} {gameDetail.data.stats.faceoffPct.away}% -{' '}
                        {gameDetail.data.stats.faceoffPct.home}% {gameDetail.data.homeTeamAbbrev}
                      </p>
                      {gameDetail.data.threeStars.length > 0 ? (
                        <p className="detail-line">
                          Three Stars: {gameDetail.data.threeStars.join(', ')}
                        </p>
                      ) : null}
                    </section>

                    <section className="detail-section">
                      <p className="detail-line">{gameDetail.data.awayTeam}</p>
                      <ul className="detail-list">
                        {gameDetail.data.leaders.away.map((leader) => (
                          <li key={leader}>{leader}</li>
                        ))}
                      </ul>
                      <p className="detail-line">{gameDetail.data.homeTeam}</p>
                      <ul className="detail-list">
                        {gameDetail.data.leaders.home.map((leader) => (
                          <li key={leader}>{leader}</li>
                        ))}
                      </ul>
                    </section>
                  </>
                ) : null}

                {detailTab === 'plays' ? (
                  <section className="detail-section">
                    <ul className="play-list">
                      {gameDetail.data.plays.slice(-20).reverse().map((play) => (
                        <li key={`${play.time}-${play.description}`}>
                          {formatPlayRow(play.time, play.description)}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {detailTab === 'players' ? (
                  <section className="detail-section">
                    {playerRows.length > 0 ? (
                      <ul className="player-list">
                        {playerRows.map((row, index) => (
                          <li
                            key={`${index}-${row}`}
                            className={row === '' ? 'player-row spacer' : 'player-row'}
                          >
                            {row}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="empty-state">No player stats available.</p>
                    )}
                  </section>
                ) : null}
              </>
            ) : null}
          </div>
        </section>
      </section>

      <footer className="statusbar">
        <span>{gamesData.status === 'success' ? `${gamesData.data.length} loaded` : gamesData.status}</span>
        <span>[h/l] day [j/k] select [1/2/3] tabs [t] today [r] refresh</span>
      </footer>
    </main>
  );
}
