import { useEffect } from 'react';
import type { StandingListItem } from '@/data/api/client';
import { formatStandingRecord, formatStandingStreak, teamDisplayName } from '@web/helpers';
import { StandingsRosterTab } from './StandingsRosterTab';
import { StandingsScheduleTab } from './StandingsScheduleTab';

export type StandingsDetailTab = 'info' | 'roster' | 'schedule';

type StandingsDetailPaneProps = {
  team: StandingListItem | null;
  detailTab: StandingsDetailTab;
  setDetailTab: (tab: StandingsDetailTab) => void;
};

type SplitRowProps = {
  label: string;
  gp: number;
  wins: number;
  losses: number;
  otLosses: number;
  points: number;
};

function SplitRow({ label, gp, wins, losses, otLosses, points }: SplitRowProps) {
  return (
    <div className="flex gap-2 py-[0.3rem]">
      <span className="w-[8ch] shrink-0 text-dim">{label}</span>
      <span className="w-[3ch] text-right shrink-0">{gp}</span>
      <span className="w-[10ch] pl-[2ch] shrink-0">{formatStandingRecord({ wins, losses, otLosses })}</span>
      <span className="w-[4ch] pl-[2ch] text-right shrink-0">{points}p</span>
    </div>
  );
}

export function StandingsDetailPane({ team, detailTab, setDetailTab }: StandingsDetailPaneProps) {
  useEffect(() => {
    setDetailTab('info');
  }, [team?.teamAbbrev]);

  return (
    <section className="bg-surface min-h-[34rem] grid grid-rows-[auto_minmax(0,1fr)] border-2 border-light max-[960px]:min-h-0 max-[960px]:overflow-auto">
      <section className="flex items-center whitespace-nowrap border-b-2 border-light shrink-0" aria-label="detail tabs">
        {(['info', 'roster', 'schedule'] as StandingsDetailTab[]).map((t) => (
          <button
            key={t}
            className={
              detailTab === t
                ? 'border-0 bg-light text-surface px-3 py-[0.4rem] cursor-pointer'
                : 'border-0 bg-transparent text-dim px-3 py-[0.4rem] cursor-pointer disabled:cursor-default disabled:opacity-65'
            }
            onClick={() => setDetailTab(t)}
            disabled={!team}
          >
            {t}
          </button>
        ))}
      </section>

      <div className="min-h-0 overflow-auto flex flex-col gap-3 p-3">
        {!team ? <p className="text-dim m-0">Select a team to view standings detail.</p> : null}

        {team ? (
          <>
            <section className="flex flex-col gap-[0.35rem] pb-3">
              <span>{teamDisplayName(team.teamName)}</span>
              <span className="text-dim">{team.conferenceName} • {team.divisionName}</span>
              <span className="text-dim">rank {team.rank} • {team.points}p • {formatStandingStreak(team)}</span>
            </section>

            {detailTab === 'info' && (
              <section className="flex flex-col tabular-nums border-b border-light pb-3">
                <div className="flex gap-2 text-dim border-b border-light py-[0.3rem] pb-4 mb-2">
                  <span className="w-[8ch] shrink-0" />
                  <span className="w-[3ch] text-right shrink-0">gp</span>
                  <span className="w-[10ch] pl-[2ch] shrink-0">record</span>
                  <span className="w-[4ch] pl-[2ch] text-right shrink-0">pts</span>
                </div>
                <SplitRow
                  label="overall"
                  gp={team.gamesPlayed}
                  wins={team.wins}
                  losses={team.losses}
                  otLosses={team.otLosses}
                  points={team.points}
                />
                <SplitRow
                  label="home"
                  gp={team.homeGamesPlayed}
                  wins={team.homeWins}
                  losses={team.homeLosses}
                  otLosses={team.homeOtLosses}
                  points={team.homePoints}
                />
                <SplitRow
                  label="road"
                  gp={team.roadGamesPlayed}
                  wins={team.roadWins}
                  losses={team.roadLosses}
                  otLosses={team.roadOtLosses}
                  points={team.roadPoints}
                />
              </section>
            )}

            {detailTab === 'roster' && <StandingsRosterTab teamAbbrev={team.teamAbbrev} />}

            {detailTab === 'schedule' && (
              <StandingsScheduleTab teamAbbrev={team.teamAbbrev} isActive={detailTab === 'schedule'} />
            )}
          </>
        ) : null}
      </div>
    </section>
  );
}
