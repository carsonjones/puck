import type { StandingListItem } from '@/data/api/client';
import { formatStandingRecord, formatStandingStreak } from '@web/helpers';

type StandingsDetailPaneProps = {
  team: StandingListItem | null;
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
    <div className="flex gap-2">
      <span className="w-[8ch] shrink-0 text-dim">{label}</span>
      <span className="w-[3ch] text-right shrink-0">{gp}</span>
      <span className="w-[10ch] pl-[2ch] shrink-0">{formatStandingRecord({ wins, losses, otLosses })}</span>
      <span className="w-[4ch] text-right shrink-0">{points}p</span>
    </div>
  );
}

export function StandingsDetailPane({ team }: StandingsDetailPaneProps) {
  return (
    <section className="bg-surface min-h-[34rem] grid grid-rows-[auto_minmax(0,1fr)] border-2 border-light py-1 max-[960px]:min-h-0">
      <div className="flex justify-between gap-4 px-3 py-[0.3rem] min-h-7 whitespace-nowrap overflow-hidden text-dim max-[960px]:hidden">
        <span className="overflow-hidden text-ellipsis">{team ? team.teamName : 'team detail'}</span>
        <span>{team ? team.teamAbbrev : ''}</span>
      </div>
      <div className="min-h-0 overflow-auto flex flex-col gap-3 p-3">
        {!team ? <p className="text-dim m-0">Select a team to view standings detail.</p> : null}

        {team ? (
          <>
            <section className="flex flex-col gap-[0.35rem]">
              <span>{team.teamName}</span>
              <span className="text-dim">{team.conferenceName} • {team.divisionName}</span>
              <span className="text-dim">rank {team.rank} • {team.points}p • {formatStandingStreak(team)}</span>
            </section>

            <section className="flex flex-col gap-[0.15rem] tabular-nums">
              <div className="flex gap-2 text-dim">
                <span className="w-[8ch] shrink-0" />
                <span className="w-[3ch] text-right shrink-0">gp</span>
                <span className="w-[10ch] pl-[2ch] shrink-0">record</span>
                <span className="w-[4ch] text-right shrink-0">pts</span>
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
          </>
        ) : null}
      </div>
    </section>
  );
}
