import type { GameDetail } from '@/data/api/client.js';
import { buildPlayerRows, detailTabs, formatPlayRow, gameSubtitle, gameTitle } from '../helpers.js';
import type { DetailTab } from '../helpers.js';

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

export default function GameDetailPane({
  gameDetail,
  selectedGameId,
  detailTab,
  setDetailTab,
}: GameDetailPaneProps) {
  const playerRows = buildPlayerRows(gameDetail.data);

  return (
    <section className="pane pane-detail">
      <div className="pane-header">
        <span>{gameDetail.data ? gameTitle(gameDetail.data) : 'game detail'}</span>
        <span>{gameDetail.data?.status ?? 'idle'}</span>
      </div>
      <div className="detail-scroll">
        <section className="detail-tabs" aria-label="detail tabs">
          {detailTabs.map((tab) => (
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
                <p className="detail-line">Broadcasts: {gameDetail.data.broadcasts.join(', ')}</p>
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
                    Faceoffs: {gameDetail.data.awayTeamAbbrev}{' '}
                    {gameDetail.data.stats.faceoffPct.away}% -{' '}
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
  );
}
