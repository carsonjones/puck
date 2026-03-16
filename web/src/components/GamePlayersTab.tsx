import type { GameDetail } from '@/data/api/client';

type Skater = {
  sweaterNumber: number;
  name: { default: string };
  position: string;
  goals: number;
  assists: number;
  sog: number;
  hits: number;
};

type Goalie = {
  sweaterNumber: number;
  name: { default: string };
  position: string;
  saves: number;
  savePctg: number;
};

function SkaterHeader({ teamName }: { teamName: string }) {
  return (
    <div className="flex gap-2 text-dim">
      <span className="w-[20ch] shrink-0">{teamName}</span>
      <span className="w-[2ch] shrink-0" />
      <span className="w-[2ch] shrink-0 ml-3">pos</span>
      <span className="w-[2ch] text-right shrink-0 ml-3">g</span>
      <span className="w-[2ch] text-right shrink-0 ml-3">a</span>
      <span className="w-[2ch] text-right shrink-0 ml-3">p</span>
      <span className="w-[3ch] text-right shrink-0 ml-3">sog</span>
      <span className="w-[3ch] text-right shrink-0 ml-3">hit</span>
    </div>
  );
}

function GoalieHeader() {
  return (
    <div className="flex gap-2 text-dim mt-1">
      <span className="w-[20ch] shrink-0">goalies</span>
      <span className="w-[2ch] shrink-0" />
      <span className="w-[2ch] shrink-0 ml-3">pos</span>
      <span className="w-[3ch] text-right shrink-0 ml-3">sv</span>
      <span className="w-[6ch] text-right shrink-0 ml-3">sv%</span>
    </div>
  );
}

function SkaterRow({ p }: { p: Skater }) {
  return (
    <div className="flex gap-2">
      <span className="w-[2ch] text-right shrink-0">{p.sweaterNumber}</span>
      <span className="w-[20ch] shrink-0 truncate pl-5">{p.name.default}</span>
      <span className="w-[2ch] shrink-0 text-dim ml-3">{p.position}</span>
      <span className="w-[2ch] text-right shrink-0 ml-3">{p.goals}</span>
      <span className="w-[2ch] text-right shrink-0 ml-3">{p.assists}</span>
      <span className="w-[2ch] text-right shrink-0 ml-3">{p.goals + p.assists}</span>
      <span className="w-[3ch] text-right shrink-0 ml-3">{p.sog}</span>
      <span className="w-[3ch] text-right shrink-0 ml-3">{p.hits}</span>
    </div>
  );
}

function GoalieRow({ p }: { p: Goalie }) {
  return (
    <div className="flex gap-2">
      <span className="w-[2ch] text-right shrink-0">{p.sweaterNumber}</span>
      <span className="w-[20ch] shrink-0 truncate pl-5">{p.name.default}</span>
      <span className="w-[2ch] shrink-0 text-dim ml-3">{p.position}</span>
      <span className="w-[3ch] text-right shrink-0 ml-3">{p.saves}</span>
      <span className="w-[6ch] text-right shrink-0 ml-3">{(p.savePctg * 100).toFixed(1)}%</span>
    </div>
  );
}

function TeamSection({ teamName, skaters, goalies, className }: { teamName: string; skaters: Skater[]; goalies: Goalie[]; className?: string }) {
  return (
    <section className={["flex flex-col gap-[0.15rem] tabular-nums", className].join(' ')}>
      <SkaterHeader teamName={teamName} />
      {skaters.map((p) => <SkaterRow key={p.sweaterNumber} p={p} />)}
      {goalies.length > 0 && <>
        <GoalieHeader />
        {goalies.map((p) => <GoalieRow key={p.sweaterNumber} p={p} />)}
      </>}
    </section>
  );
}

export function GamePlayersTab({ data }: { data: GameDetail }) {
  const bs = data.boxscore?.playerByGameStats;
  if (!bs) return <p className="text-dim m-0">No player stats available.</p>;

  return (
    <>
      <TeamSection
        teamName={data.awayTeam}
        skaters={[...(bs.awayTeam?.forwards ?? []), ...(bs.awayTeam?.defense ?? [])] as Skater[]}
        goalies={(bs.awayTeam?.goalies ?? []) as Goalie[]}
        className="border-b-2 border-dim mb-3 pb-6"
      />
      <TeamSection
        teamName={data.homeTeam}
        skaters={[...(bs.homeTeam?.forwards ?? []), ...(bs.homeTeam?.defense ?? [])] as Skater[]}
        goalies={(bs.homeTeam?.goalies ?? []) as Goalie[]}
      />
    </>
  );
}
