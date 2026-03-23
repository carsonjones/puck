import { useQuery } from '@tanstack/react-query';
import type { GoalieWithStats, PlayerWithStats } from '@/data/api/client';
import { fetchTeamRoster } from '@web/api';

function SkaterHeader() {
  return (
    <div className="flex gap-2 text-dim border-b border-light py-[0.3rem] pb-2 mb-1">
      <span className="w-[2ch] text-right shrink-0">#</span>
      <span className="w-[16ch] shrink-0 pl-2">name</span>
      <span className="w-[3ch] shrink-0 ml-1">pos</span>
      <span className="w-[3ch] text-right shrink-0 ml-2">gp</span>
      <span className="w-[2ch] text-right shrink-0 ml-2">g</span>
      <span className="w-[2ch] text-right shrink-0 ml-2">a</span>
      <span className="w-[3ch] text-right shrink-0 ml-2">pts</span>
      <span className="w-[3ch] text-right shrink-0 ml-2">+/-</span>
    </div>
  );
}

function SkaterRow({ p }: { p: PlayerWithStats }) {
  const pm = p.plusMinus >= 0 ? `+${p.plusMinus}` : String(p.plusMinus);
  return (
    <div className="flex gap-2">
      <span className="w-[2ch] text-right shrink-0 text-dim">{p.sweaterNumber}</span>
      <span className="w-[16ch] shrink-0 truncate pl-2">
        {p.firstName.charAt(0)}. {p.lastName}
      </span>
      <span className="w-[3ch] shrink-0 text-dim ml-1">{p.positionCode}</span>
      <span className="w-[3ch] text-right shrink-0 ml-2">{p.gamesPlayed}</span>
      <span className="w-[2ch] text-right shrink-0 ml-2">{p.goals}</span>
      <span className="w-[2ch] text-right shrink-0 ml-2">{p.assists}</span>
      <span className="w-[3ch] text-right shrink-0 ml-2">{p.points}</span>
      <span className="w-[3ch] text-right shrink-0 ml-2 text-dim">{pm}</span>
    </div>
  );
}

function GoalieHeader() {
  return (
    <div className="flex gap-2 text-dim border-b border-light py-[0.3rem] pb-2 mb-1 mt-4">
      <span className="w-[2ch] text-right shrink-0">#</span>
      <span className="w-[16ch] shrink-0 pl-2">name</span>
      <span className="w-[3ch] text-right shrink-0 ml-2">gp</span>
      <span className="w-[2ch] text-right shrink-0 ml-2">w</span>
      <span className="w-[2ch] text-right shrink-0 ml-2">l</span>
      <span className="w-[3ch] text-right shrink-0 ml-2">otl</span>
      <span className="w-[4ch] text-right shrink-0 ml-2">gaa</span>
      <span className="w-[5ch] text-right shrink-0 ml-2">sv%</span>
      <span className="w-[2ch] text-right shrink-0 ml-2">so</span>
    </div>
  );
}

function GoalieRow({ p }: { p: GoalieWithStats }) {
  return (
    <div className="flex gap-2">
      <span className="w-[2ch] text-right shrink-0 text-dim">{p.sweaterNumber}</span>
      <span className="w-[16ch] shrink-0 truncate pl-2">
        {p.firstName.charAt(0)}. {p.lastName}
      </span>
      <span className="w-[3ch] text-right shrink-0 ml-2">{p.gamesPlayed}</span>
      <span className="w-[2ch] text-right shrink-0 ml-2">{p.wins}</span>
      <span className="w-[2ch] text-right shrink-0 ml-2">{p.losses}</span>
      <span className="w-[3ch] text-right shrink-0 ml-2">{p.otLosses}</span>
      <span className="w-[4ch] text-right shrink-0 ml-2">{p.goalsAgainstAverage.toFixed(2)}</span>
      <span className="w-[5ch] text-right shrink-0 ml-2">
        {p.savePct > 0 ? p.savePct.toFixed(3) : '.000'}
      </span>
      <span className="w-[2ch] text-right shrink-0 ml-2">{p.shutouts}</span>
    </div>
  );
}

export function StandingsRosterTab({ teamAbbrev }: { teamAbbrev: string }) {
  const { data, status } = useQuery({
    queryKey: ['team-roster', teamAbbrev],
    queryFn: () => fetchTeamRoster(teamAbbrev),
    staleTime: 300_000,
  });

  if (status === 'pending') return <p className="text-dim m-0">Loading roster…</p>;
  if (status === 'error') return <p className="text-dim m-0">Failed to load roster.</p>;

  return (
    <div className="flex flex-col tabular-nums gap-[0.15rem]">
      <SkaterHeader />
      {data.players.map((p) => <SkaterRow key={p.id} p={p} />)}
      <GoalieHeader />
      {data.goalies.map((p) => <GoalieRow key={p.id} p={p} />)}
    </div>
  );
}
