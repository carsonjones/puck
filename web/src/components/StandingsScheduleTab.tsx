import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import type { TeamScheduleItem } from '@/data/api/client';
import { fetchTeamSchedule } from '@web/api';

const formatDisplayDate = (date: string) => {
  const [, m, d] = date.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[(m ?? 1) - 1]} ${String(d).padStart(2, ' ')}`;
};

const getResult = (game: TeamScheduleItem, teamAbbrev: string) => {
  if (game.gameState === 'scheduled') return game.startTime;
  if (game.gameState === 'in_progress') return 'live';
  const isHome = game.homeTeamAbbrev === teamAbbrev;
  const teamScore = isHome ? game.homeScore : game.awayScore;
  const oppScore = isHome ? game.awayScore : game.homeScore;
  const outcome = teamScore > oppScore ? 'W' : teamScore < oppScore ? 'L' : '–';
  return `${outcome} ${teamScore}-${oppScore}`;
};

function GameRow({
  game,
  teamAbbrev,
  isSelected,
  flatIndex,
  onHover,
  onNavigate,
}: {
  game: TeamScheduleItem;
  teamAbbrev: string;
  isSelected: boolean;
  flatIndex: number;
  onHover: (i: number) => void;
  onNavigate: (game: TeamScheduleItem) => void;
}) {
  const isHome = game.homeTeamAbbrev === teamAbbrev;
  const opponent = isHome ? game.awayTeamAbbrev : game.homeTeamAbbrev;
  const venue = isHome ? 'vs' : '@';
  const result = getResult(game, teamAbbrev);
  const isPast = game.gameState === 'final';

  return (
    <div
      className={['flex gap-3 px-1 py-[0.15rem] cursor-pointer', isSelected ? 'bg-light text-surface' : ''].join(' ')}
      onClick={() => onNavigate(game)}
      onMouseEnter={() => onHover(flatIndex)}
    >
      <span className="w-[6ch] shrink-0 text-dim">{formatDisplayDate(game.date)}</span>
      <span className="w-[2ch] shrink-0 text-dim">{venue}</span>
      <span className="w-[3ch] shrink-0">{opponent}</span>
      <span className={['w-[12ch] shrink-0', !isSelected && !isPast ? 'text-dim' : ''].join(' ')}>
        {result}
      </span>
    </div>
  );
}

type Props = {
  teamAbbrev: string;
  isActive: boolean;
};

export function StandingsScheduleTab({ teamAbbrev, isActive }: Props) {
  const navigate = useNavigate();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { data: games, status } = useQuery({
    queryKey: ['team-schedule', teamAbbrev],
    queryFn: () => fetchTeamSchedule(teamAbbrev),
    staleTime: 60_000,
  });

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!games) return;
    const idx = games.findIndex((g) => g.gameState !== 'final' || g.date >= today);
    setSelectedIndex(idx >= 0 ? idx : games.length - 1);
  }, [games, teamAbbrev]);

  useEffect(() => {
    if (!isActive || !games) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) return;

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopImmediatePropagation();
        setSelectedIndex((i) => Math.min(i + 1, games.length - 1));
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopImmediatePropagation();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const game = games[selectedIndex];
        if (game) navigate(`/games/${game.id}?date=${game.date}`);
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [isActive, games, selectedIndex, navigate]);

  if (status === 'pending') return <p className="text-dim m-0">Loading schedule…</p>;
  if (status === 'error') return <p className="text-dim m-0">Failed to load schedule.</p>;

  const past = games.filter((g) => g.gameState === 'final');
  const upcoming = games.filter((g) => g.gameState !== 'final');

  const handleNavigate = (game: TeamScheduleItem) => navigate(`/games/${game.id}?date=${game.date}`);

  return (
    <div className="flex flex-wrap tabular-nums">
      <div className="min-w-[50%] flex-1 flex flex-col gap-[0.1rem]">
        <div className="text-dim border-b border-light pb-1 mb-1">last 10</div>
        {past.map((game, i) => (
          <GameRow
            key={game.id}
            game={game}
            teamAbbrev={teamAbbrev}
            isSelected={selectedIndex === i}
            flatIndex={i}
            onHover={setSelectedIndex}
            onNavigate={handleNavigate}
          />
        ))}
      </div>

      <div className="min-w-[50%] flex-1 flex flex-col gap-[0.1rem]">
        <div className="text-dim border-b border-light pb-1 mb-1">next 10</div>
        {upcoming.map((game, i) => (
          <GameRow
            key={game.id}
            game={game}
            teamAbbrev={teamAbbrev}
            isSelected={selectedIndex === past.length + i}
            flatIndex={past.length + i}
            onHover={setSelectedIndex}
            onNavigate={handleNavigate}
          />
        ))}
      </div>
    </div>
  );
}
