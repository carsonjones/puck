import { useEffect, useRef, useState } from 'react';
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
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setIsExpanded(false);
    selectedRef.current?.scrollIntoView({ block: 'nearest' });
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
    <aside className={[
      'bg-surface grid grid-rows-[auto_minmax(0,1fr)] border-2 border-light py-1',
      'min-h-[34rem] max-[960px]:min-h-0',
      isCollapsed
        ? 'max-[960px]:border-b-0 max-[960px]:pb-0'
        : 'max-[960px]:max-h-[40vh]',
    ].join(' ')}>
      {isSuccess && gamesData.data.length > 0 ? (
        <div className="flex justify-between gap-4 px-3 py-[0.3rem] min-h-7 whitespace-nowrap overflow-hidden text-dim [&>span]:overflow-hidden [&>span]:text-ellipsis">
          <span>{displayedDate}</span>
          <span>{gamesData.data.length} games</span>
        </div>
      ) : null}
      <div className={`min-h-0 overflow-auto${isCollapsed ? ' max-[960px]:overflow-hidden' : ''}`}>
        <div className="px-3 overflow-hidden [&>p]:my-2">
          {isLoading ? <p className="text-dim">Loading...</p> : null}
          {isError ? <p className="text-dim">{gamesData.error}</p> : null}
          {isSuccess && gamesData.data.length === 0 ? (
            <p className="text-dim">No games found for this date.</p>
          ) : null}
        </div>
        {gamesData.data.map((game) => {
          const isActive = game.id === selectedGameId;
          return (
            <button
              key={game.id}
              ref={isActive ? selectedRef : undefined}
              className={[
                'w-full border-0 flex justify-between gap-4 px-3 py-[0.4rem] text-left cursor-pointer',
                'focus:outline focus:outline-1 focus:outline-light focus:[outline-offset:-1px]',
                isActive ? 'bg-light text-surface' : 'bg-transparent',
                isCollapsed && !isActive ? 'max-[960px]:hidden' : '',
              ].join(' ')}
              onClick={() => handleGameClick(game.id)}
            >
              <span className={isActive ? '' : 'text-light'}>
                {gameTitleWithWinner(game)}
              </span>
              <span className={isActive ? '' : 'text-dim'}>
                {statusLabel(game)}
                {isActive && (
                  <span className="hidden max-[960px]:inline">
                    {isExpanded ? ' ▲' : ' ▼'}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
