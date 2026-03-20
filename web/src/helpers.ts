import type { GameDetail, GameListItem, StandingListItem, StandingsData } from '@/data/api/client';
import {
  standingsConferences,
  standingsDivisions,
  standingsDivisionDisplayNames,
  standingsTabs,
  type StandingsConference,
  type StandingsDivision,
  type StandingsTab,
} from '@/shared/appState';

export const detailTabs = ['stats', 'plays', 'players'] as const;
export type DetailTab = (typeof detailTabs)[number];
export { standingsTabs, standingsConferences, standingsDivisions, standingsDivisionDisplayNames };
export type { StandingsConference, StandingsDivision, StandingsTab };

export const formatPeriod = (period: number, gameType: number): string => {
  if (period <= 0) return 'n/a';
  if (period <= 3) {
    const suffix = period === 1 ? 'st' : period === 2 ? 'nd' : 'rd';
    return `${period}${suffix}`;
  }

  const isPlayoffs = gameType === 3;

  if (period === 4) return 'OT';
  if (period === 5 && !isPlayoffs) return 'SO';

  const overtimeNumber = period - 3;
  const suffix = overtimeNumber === 2 ? 'nd' : overtimeNumber === 3 ? 'rd' : 'th';
  return `${overtimeNumber}${suffix} OT`;
};

export const statusLabel = (game: GameListItem) => {
  if (game.status === 'final') {
    const extra = game.periodType === 'OT' ? ' OT' : game.periodType === 'SO' ? ' SO' : '';
    return `${game.awayScore}-${game.homeScore}${extra}`;
  }

  if (game.status === 'in_progress') {
    const period =
      game.periodType === 'OT' ? 'OT' : game.periodType === 'SO' ? 'SO' : `P${game.period}`;
    return `${game.awayScore}-${game.homeScore} ${period}${game.clock ? ` ${game.clock}` : ''}`;
  }

  return game.startTime;
};

export const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const shiftDate = (cursor: string | null, delta: number) => {
  const base = cursor ? new Date(`${cursor}T12:00:00`) : new Date();
  const next = new Date(base);
  next.setDate(next.getDate() + delta);
  return formatDate(next);
};

const teamNicknames: Record<string, string> = {
  'Golden Knights': 'G. Knights',
};

export const teamDisplayName = (name: string): string => teamNicknames[name] ?? name;

export const gameTitle = (game: Pick<GameListItem, 'awayTeam' | 'homeTeam'>) =>
  `${teamDisplayName(game.awayTeam)} @ ${teamDisplayName(game.homeTeam)}`;

export const gameTitleWithWinner = (
  game: Pick<
    GameListItem,
    'awayTeam' | 'homeTeam' | 'status' | 'awayScore' | 'homeScore'
  >,
) => {
  const awayWins = game.status === 'final' && game.awayScore > game.homeScore;
  const homeWins = game.status === 'final' && game.homeScore > game.awayScore;

  return `${teamDisplayName(game.awayTeam)}${awayWins ? ' ✓' : ''} @ ${teamDisplayName(game.homeTeam)}${homeWins ? ' ✓' : ''}`;
};

const padCell = (value: string, width: number) => value.padEnd(width, ' ');

export const formatPlayRow = (time: string, description: string) =>
  `${padCell(time, 8)} ${description}`;

export const getSearchParamsState = () => {
  if (typeof window === 'undefined') {
    return {
      cursor: null,
    };
  }

  const params = new URLSearchParams(window.location.search);
  const date = params.get('date');

  return {
    cursor: date,
  };
};

export const updateUrlState = (cursor: string | null) => {
  if (typeof window === 'undefined') {
    return;
  }

  const params = new URLSearchParams(window.location.search);

  if (cursor) {
    params.set('date', cursor);
  } else {
    params.delete('date');
  }

  const nextSearch = params.toString();
  const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}`;
  window.history.replaceState(null, '', nextUrl);
};

export const gameSubtitle = (game: GameDetail) => {
  if (game.status === 'scheduled') {
    return `${game.date} • ${game.startTime} • ${game.venue}`;
  }

  const parts = [`${game.awayScore}-${game.homeScore}`];

  if (game.status === 'final') {
    parts.push('FINAL');
    if (game.period > 3 && game.gameType) {
      parts.push(formatPeriod(game.period, game.gameType));
    }
  } else {
    parts.push(formatPeriod(game.period, game.gameType));
    if (game.clock) {
      parts.push(game.clock);
    }
  }

  return parts.join(' • ');
};

export const buildPlayerRows = (gameDetail: GameDetail | null) => {
  const boxscore = gameDetail?.boxscore?.playerByGameStats;
  if (!gameDetail || !boxscore) {
    return [];
  }

  const skaterRows = (
    teamName: string,
    players: Array<{
      sweaterNumber: number;
      name: { default: string };
      position: string;
      goals: number;
      assists: number;
      sog: number;
      hits: number;
    }>,
  ) => [
      teamName,
      ...players.map(
        (player) =>
          `${String(player.sweaterNumber).padStart(2, ' ')} ${player.name.default} ${player.position} ${player.goals}-${player.assists}-${player.goals + player.assists} ${player.sog} SOG ${player.hits} HIT`,
      ),
    ];

  const goalieRows = (
    players: Array<{
      sweaterNumber: number;
      name: { default: string };
      position: string;
      saves: number;
      savePctg: number;
    }>,
  ) =>
    players.map(
      (player) =>
        `${String(player.sweaterNumber).padStart(2, ' ')} ${player.name.default} ${player.position} ${player.saves} SV ${(player.savePctg * 100).toFixed(1)}%`,
    );

  return [
    ...skaterRows(teamDisplayName(gameDetail.awayTeam), [
      ...(boxscore.awayTeam?.forwards ?? []),
      ...(boxscore.awayTeam?.defense ?? []),
    ]),
    ...goalieRows(boxscore.awayTeam?.goalies ?? []),
    '',
    ...skaterRows(teamDisplayName(gameDetail.homeTeam), [
      ...(boxscore.homeTeam?.forwards ?? []),
      ...(boxscore.homeTeam?.defense ?? []),
    ]),
    ...goalieRows(boxscore.homeTeam?.goalies ?? []),
  ];
};

export const normalizeStandingsTab = (tab?: string): StandingsTab =>
  tab === 'conference' || tab === 'division' ? tab : 'league';

export const normalizeStandingsScope = (
  tab: StandingsTab,
  scope?: string,
): StandingsConference | StandingsDivision | null => {
  if (tab === 'conference') {
    return scope === 'western' ? 'western' : 'eastern';
  }

  if (tab === 'division') {
    if (scope === 'metropolitan' || scope === 'central' || scope === 'pacific') {
      return scope;
    }

    return 'atlantic';
  }

  return null;
};

export const getStandingsItems = (
  standings: StandingsData | undefined,
  tab: StandingsTab,
  scope: StandingsConference | StandingsDivision | null,
) => {
  if (!standings) {
    return [] satisfies StandingListItem[];
  }

  if (tab === 'conference') {
    return scope === 'western' ? standings.western : standings.eastern;
  }

  if (tab === 'division') {
    return standings.divisions[(scope as StandingsDivision) ?? 'atlantic'];
  }

  return standings.league;
};

export const formatStandingRecord = (
  team: Pick<StandingListItem, 'wins' | 'losses' | 'otLosses'>,
) => `${team.wins}-${team.losses}-${team.otLosses}`;

export const formatStandingStreak = (
  team: Pick<StandingListItem, 'streakCode' | 'streakCount'>,
) => `${team.streakCode}${team.streakCount}`;

export const standingsHeader = (
  tab: StandingsTab,
  scope: StandingsConference | StandingsDivision | null,
) => {
  if (tab === 'conference') {
    return scope === 'western' ? 'Western Conference' : 'Eastern Conference';
  }

  if (tab === 'division') {
    const division = (scope as StandingsDivision | null) ?? 'atlantic';
    return `${division.charAt(0).toUpperCase()}${division.slice(1)} Division`;
  }

  return 'League Standings';
};
