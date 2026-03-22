import { useEffect, useRef } from 'react';
import type { PlayerListItem } from '@/data/api/client';

type PlayersListPaneProps = {
  status: 'loading' | 'success' | 'error';
  error: string | null;
  items: PlayerListItem[];
  query: string;
  onQueryChange: (q: string) => void;
  selectedPlayerId: number | null;
  onSelectPlayer: (id: number) => void;
  onNavigateUp: () => void;
  onNavigateDown: () => void;
};

export function PlayersListPane({ status, error, items, query, onQueryChange, selectedPlayerId, onSelectPlayer, onNavigateUp, onNavigateDown }: PlayersListPaneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'nearest' });
  }, [selectedPlayerId]);

  return (
    <aside className="bg-surface min-h-[34rem] flex flex-col border-2 border-light pb-3 max-[960px]:min-h-0">
      <div className="border-b-2 border-light px-3 py-2">
        <input
          ref={inputRef}
          type="text"
          placeholder="search players…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); onNavigateDown(); }
            if (e.key === 'ArrowUp') { e.preventDefault(); onNavigateUp(); }
          }}
          className="w-full bg-transparent border-0 outline-0 text-light placeholder:text-dim"
          autoFocus
        />
      </div>

      {status === 'loading' ? <p className="text-dim m-3">Loading players…</p> : null}
      {status === 'error' ? <p className="text-dim m-3">{error}</p> : null}
      {status === 'success' ? (
        <div className="grid mt-1 overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-dim m-3">No players found.</p>
          ) : (
            items.map((player) => {
              const isActive = player.id === selectedPlayerId;
              return (
                <button
                  key={player.id}
                  ref={isActive ? selectedRef : undefined}
                  className={[
                    'w-full border-0 flex items-center gap-2 px-3 py-[0.4rem] text-left cursor-pointer',
                    'focus:outline focus:outline-1 focus:outline-light focus:[outline-offset:-1px]',
                    isActive ? 'bg-light text-surface' : 'bg-transparent',
                  ].join(' ')}
                  onClick={() => onSelectPlayer(player.id)}
                >
                  <span className={`w-[3ch] text-right shrink-0 ${isActive ? '' : 'text-dim'}`}>
                    #{player.sweaterNumber}
                  </span>
                  <span className="flex-1 min-w-0 truncate">
                    {player.firstName} {player.lastName}
                  </span>
                  <span className={`w-[3ch] text-right shrink-0 ${isActive ? '' : 'text-dim'}`}>
                    {player.position}
                  </span>
                  <span className={`w-[4ch] text-right shrink-0 ${isActive ? '' : 'text-dim'}`}>
                    {player.teamAbbrev}
                  </span>
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </aside>
  );
}
