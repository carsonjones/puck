import type { GameDetail } from '@/data/api/client';
import { detailTabs, gameSubtitle, gameTitleWithWinner } from '@web/helpers';
import type { DetailTab } from '@web/helpers';
import { GameStatsTab } from './GameStatsTab';
import { GamePlaysTab } from './GamePlaysTab';
import { GamePlayersTab } from './GamePlayersTab';

type GameDetailPaneProps = {
  gameDetail: {
    status: 'idle' | 'loading' | 'success' | 'error';
    data: GameDetail | null;
    error: string | null;
  };
  selectedGameId: string | null;
  detailTab: DetailTab;
  setDetailTab: (tab: DetailTab) => void;
};

export function GameDetailPane({
  gameDetail,
  selectedGameId,
  detailTab,
  setDetailTab,
}: GameDetailPaneProps) {
  return (
    <section className="bg-surface min-h-[34rem] flex flex-col border-2 border-light max-[960px]:min-h-0">
      <section className="flex items-center whitespace-nowrap border-b-2 border-light shrink-0" aria-label="detail tabs">
        {detailTabs.map((tab) => (
          <button
            key={tab}
            className={
              detailTab === tab
                ? 'border-0 bg-light text-surface px-3 py-[0.4rem] cursor-pointer'
                : 'border-0 bg-transparent text-dim px-3 py-[0.4rem] cursor-pointer disabled:cursor-default disabled:opacity-65'
            }
            onClick={() => setDetailTab(tab)}
            disabled={!gameDetail.data}
          >
            {tab}
          </button>
        ))}
      </section>
      <div className="flex-1 min-h-0 overflow-auto flex flex-col gap-3 p-3">
        {!selectedGameId ? <p className="text-dim m-0">Select a game to view details.</p> : null}
        {selectedGameId && gameDetail.status === 'loading' ? (
          <p className="text-dim m-0">Loading game details…</p>
        ) : null}
        {selectedGameId && gameDetail.status === 'error' ? (
          <p className="text-dim m-0">{gameDetail.error}</p>
        ) : null}
        {gameDetail.data ? (
          <>
            <section className="flex flex-col gap-[0.35rem] border-b-2 border-dim pb-3">
              <span>{gameTitleWithWinner(gameDetail.data)}</span>
              <span className="text-dim">{gameSubtitle(gameDetail.data)}</span>
              {gameDetail.data.status !== 'scheduled' && (
                <span className="text-dim">
                  {gameDetail.data.date} • {gameDetail.data.startTime} • {gameDetail.data.venue}
                </span>
              )}
              {gameDetail.data.broadcasts.length > 0 ? (
                <span className="text-dim">Broadcasts: {gameDetail.data.broadcasts.join(', ')}</span>
              ) : null}
            </section>

            {detailTab === 'stats' && <GameStatsTab data={gameDetail.data} />}
            {detailTab === 'plays' && <GamePlaysTab data={gameDetail.data} />}
            {detailTab === 'players' && <GamePlayersTab data={gameDetail.data} />}
          </>
        ) : null}
      </div>
    </section>
  );
}
