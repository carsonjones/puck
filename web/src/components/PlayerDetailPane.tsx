import type { PlayerDetailData } from '@/data/api/client';

type PlayerDetailPaneProps = {
  status: 'idle' | 'loading' | 'success' | 'error';
  player: PlayerDetailData | null;
  error: string | null;
};

function heightDisplay(inches: number) {
  const ft = Math.floor(inches / 12);
  const i = inches % 12;
  return `${ft}'${i}"`;
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex gap-2">
      <span className="w-[8ch] shrink-0 text-right text-dim">{label}</span>
      <span className="w-[6ch] text-right shrink-0">{value}</span>
    </div>
  );
}

export function PlayerDetailPane({ status, player, error }: PlayerDetailPaneProps) {
  return (
    <section className="bg-surface min-h-[34rem] grid grid-rows-[auto_minmax(0,1fr)] border-2 border-light py-1 max-[960px]:min-h-0">
      <div className="flex justify-between gap-4 px-3 py-[0.3rem] min-h-7 whitespace-nowrap overflow-hidden text-dim max-[960px]:hidden">
        <span className="overflow-hidden text-ellipsis">
          {player ? `${player.firstName} ${player.lastName}` : 'player detail'}
        </span>
        <span>{player ? player.teamAbbrev : ''}</span>
      </div>

      <div className="min-h-0 overflow-auto flex flex-col gap-3 p-3">
        {status === 'idle' ? (
          <p className="text-dim m-0">Select a player to view detail.</p>
        ) : null}
        {status === 'loading' ? <p className="text-dim m-0">Loading…</p> : null}
        {status === 'error' ? <p className="text-dim m-0">{error}</p> : null}

        {status === 'success' && player ? (
          <>
            <section className="flex flex-col gap-[0.35rem]">
              <span>{player.firstName} {player.lastName}</span>
              <span className="text-dim">#{player.sweaterNumber} · {player.position} · {player.teamAbbrev}</span>
              {player.birthDate ? (
                <span className="text-dim">
                  {player.birthCity}{player.birthStateProvince ? `, ${player.birthStateProvince}` : ''}{player.birthCountry ? `, ${player.birthCountry}` : ''}
                </span>
              ) : null}
              {player.heightInInches ? (
                <span className="text-dim">
                  {heightDisplay(player.heightInInches)} · {player.weightInPounds} lbs · {player.shootsCatches}
                </span>
              ) : null}
            </section>

            {player.seasonStats ? (
              <section className="flex flex-col gap-[0.15rem] tabular-nums">
                <div className="flex gap-2 text-dim">
                  <span className="w-[8ch] shrink-0 text-right">season</span>
                  <span className="w-[6ch] text-right shrink-0">val</span>
                </div>
                <StatRow label="gp" value={player.seasonStats.gamesPlayed} />
                <StatRow label="goals" value={player.seasonStats.goals} />
                <StatRow label="assists" value={player.seasonStats.assists} />
                <StatRow label="points" value={player.seasonStats.points} />
                <StatRow label="+/-" value={player.seasonStats.plusMinus > 0 ? `+${player.seasonStats.plusMinus}` : player.seasonStats.plusMinus} />
                <StatRow label="pim" value={player.seasonStats.pim} />
                <StatRow label="shots" value={player.seasonStats.shots} />
                <StatRow label="s%" value={`${(player.seasonStats.shootingPctg * 100).toFixed(1)}%`} />
                <StatRow label="ppg" value={player.seasonStats.ppGoals} />
                <StatRow label="shg" value={player.seasonStats.shGoals} />
                <StatRow label="gwg" value={player.seasonStats.gwGoals} />
                <StatRow label="toi" value={player.seasonStats.avgToi} />
              </section>
            ) : (
              <p className="text-dim m-0">No season stats available.</p>
            )}
          </>
        ) : null}
      </div>
    </section>
  );
}
