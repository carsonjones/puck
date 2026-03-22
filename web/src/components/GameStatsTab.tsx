import type { GameDetail } from '@/data/api/client';
import { teamDisplayName } from '@web/helpers';

type StatRowProps = { label: string; away: string | number; home: string | number };

function StatRow({ label, away, home }: StatRowProps) {
  return (
    <div className="flex gap-2">
      <span className="w-[10ch] shrink-0 text-dim">{label}</span>
      <span className="w-[6ch] shrink-0">{away}</span>
      <span className="w-[6ch] shrink-0">{home}</span>
    </div>
  );
}

export function GameStatsTab({ data }: { data: GameDetail }) {
  if (data.status === 'scheduled') {
    return <p className="text-dim m-0">Game hasn't started yet.</p>;
  }

  return (
    <>
      <section className="flex flex-col gap-[0.15rem] tabular-nums">
        <div className="flex gap-2 text-dim">
          <span className="w-[10ch] shrink-0" />
          <span className="w-[6ch] shrink-0">{data.awayTeamAbbrev}</span>
          <span className="w-[6ch] shrink-0">{data.homeTeamAbbrev}</span>
        </div>
        <StatRow label="shots" away={data.stats.shots.away} home={data.stats.shots.home} />
        <StatRow label="hits" away={data.stats.hits.away} home={data.stats.hits.home} />
        <StatRow label="faceoffs" away={`${data.stats.faceoffPct.away}%`} home={`${data.stats.faceoffPct.home}%`} />
      </section>

      {data.threeStars.length > 0 ? (
        <section className="flex flex-col gap-[0.15rem]">
          <span className="text-dim">three stars</span>
          {data.threeStars.map((star, i) => (
            <span key={star} className="text-dim">{i + 1}. {star}</span>
          ))}
        </section>
      ) : null}

      <section className="flex flex-col gap-[0.15rem] tabular-nums">
        <div className="flex gap-2 text-dim">
          <span className="w-[15ch] shrink-0">{teamDisplayName(data.awayTeam)}</span>
          <span className="w-[2ch] text-right shrink-0">g</span>
          <span className="w-[2ch] text-right shrink-0 ml-2">a</span>
          <span className="w-[2ch] text-right shrink-0 ml-2">p</span>
        </div>
        {data.leaders.away.map((l) => (
          <div key={l.name} className="flex gap-2">
            <span className="w-[15ch] shrink-0 truncate">{l.name}</span>
            <span className="w-[2ch] text-right shrink-0">{l.goals}</span>
            <span className="w-[2ch] text-right shrink-0 ml-2">{l.assists}</span>
            <span className="w-[2ch] text-right shrink-0 ml-2">{l.points}</span>
          </div>
        ))}
      </section>
      <section className="flex flex-col gap-[0.15rem] tabular-nums">
        <div className="flex gap-2 text-dim">
          <span className="w-[15ch] shrink-0">{teamDisplayName(data.homeTeam)}</span>
          <span className="w-[2ch] text-right shrink-0">g</span>
          <span className="w-[2ch] text-right shrink-0 ml-2">a</span>
          <span className="w-[2ch] text-right shrink-0 ml-2">p</span>
        </div>
        {data.leaders.home.map((l) => (
          <div key={l.name} className="flex gap-2">
            <span className="w-[15ch] shrink-0 truncate">{l.name}</span>
            <span className="w-[2ch] text-right shrink-0">{l.goals}</span>
            <span className="w-[2ch] text-right shrink-0 ml-2">{l.assists}</span>
            <span className="w-[2ch] text-right shrink-0 ml-2">{l.points}</span>
          </div>
        ))}
      </section>
    </>
  );
}
