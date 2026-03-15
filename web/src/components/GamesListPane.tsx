import { useEffect, useState } from 'react';
import type { GameListItem } from '@/data/api/client';
import { gameTitleWithWinner, statusLabel } from '@web/helpers';

type GamesListPaneProps = {
  displayedDate: string;
  gamesData: {
    status: 'loading' | 'success' | 'error';
    data: GameListItem[];
    nextCursor: string | null;
    error: string | null;
  };
  selectedGameId: string | null;
  setSelectedGameId: (gameId: string | null) => void;
};

export function GamesListPane({
  displayedDate,
  gamesData,
  selectedGameId,
  setSelectedGameId,
}: GamesListPaneProps) {
  const { status } = gamesData;
  const isLoading = status === 'loading';
  const isError = status === 'error';
  const isSuccess = status === 'success';

  const [isExpanded, setIsExpanded] = useState(false);
  const isCollapsed = !isExpanded && Boolean(selectedGameId);

  useEffect(() => {
    setIsExpanded(false);
  }, [selectedGameId]);

  const handleGameClick = (gameId: string) => {
    if (gameId === selectedGameId) {
      setIsExpanded((v) => !v);
    } else {
      setSelectedGameId(gameId);
      setIsExpanded(false);
    }
  };

  return (
    <aside className={`pane pane-list${isCollapsed ? ' list-collapsed' : ''}`}>
      {isSuccess && gamesData.data.length > 0 ? (
        <div className="pane-header">
          <span>{displayedDate}</span>
          <span>{gamesData.data.length} games</span>
        </div>
      ) : null}
      <div className="list-scroll">
        <div className="pane-wrapper">
          {isLoading ? <p className="empty-state">Loading...</p> : null}
          {isError ? <p className="empty-state">{gamesData.error}</p> : null}
          {isSuccess && gamesData.data.length === 0 ? (
            <p className="empty-state">No games found for this date.</p>
          ) : null}

        </div>
        {gamesData.data.map((game) => (
          <button
            key={game.id}
            className={game.id === selectedGameId ? 'game-row active' : 'game-row'}
            onClick={() => handleGameClick(game.id)}
          >
            <span className="game-row-title">{gameTitleWithWinner(game)}</span>
            <span className="game-row-meta">
              {statusLabel(game)}
              {game.id === selectedGameId && <span className="game-row-chevron">{isExpanded ? ' ▲' : ' ▼'}</span>}
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}
