import { getToken } from "../../auth/token.js";
import { NhlClient } from "../nhl/client.js";
import type {
  BoxscoreResponse,
  Game as NhlGame,
  GameDetails as NhlGameDetails,
  PlayByPlayResponse,
  PlayerStats,
  RosterSpot,
} from "../nhl/models.js";

export type GameListItem = {
  id: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  status: "scheduled" | "in_progress" | "final";
};

export type GameDetail = GameListItem & {
  venue: string;
  homeScore: number;
  awayScore: number;
  period: number;
  clock: string;
  broadcasts: string[];
  gameType: number;
  leaders: {
    home: string[];
    away: string[];
  };
  threeStars: string[];
  stats: {
    shots: { home: number; away: number };
    hits: { home: number; away: number };
    faceoffPct: { home: number; away: number };
  };
  plays: Play[];
};

export type Play = {
  time: string;
  description: string;
};

export type GamesPage = {
  items: GameListItem[];
  nextCursor: string | null;
};



const nhlClient = new NhlClient();

const requireToken = () => {
  const token = getToken();
  if (!token) throw new Error("Missing NHL token");
  return token;
};



const formatDate = (date: Date) => date.toISOString().slice(0, 10);

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const mapGameStatus = (gameState: string): GameListItem["status"] => {
  const normalized = gameState.toLowerCase();
  if (normalized.includes("final") || normalized === "off") return "final";
  if (normalized.includes("live") || normalized.includes("inprogress") || normalized === "crit") return "in_progress";
  return "scheduled";
};

const formatLocalTime = (isoTimestamp: string) => {
  const parsed = new Date(isoTimestamp);
  if (Number.isNaN(parsed.getTime())) return isoTimestamp.slice(11, 16);
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(parsed);
};

const mapGameListItem = (game: NhlGame): GameListItem => ({
  id: String(game.id),
  date: game.gameDate.slice(0, 10),
  homeTeam: game.homeTeam.commonName?.default ?? game.homeTeam.name.default,
  awayTeam: game.awayTeam.commonName?.default ?? game.awayTeam.name.default,
  startTime: formatLocalTime(game.startTimeUTC),
  status: mapGameStatus(game.gameState),
});

const sumHits = (players: PlayerStats[]) => players.reduce((total, player) => total + (player.hits ?? 0), 0);

const topScorers = (players: PlayerStats[], count: number) => {
  const sorted = [...players].sort((a, b) => b.points - a.points || b.goals - a.goals);
  return sorted.slice(0, count).map((player) => `${player.name.default} • ${player.goals}G ${player.assists}A ${player.points}P`);
};

const rosterMapFromPlayByPlay = (plays: PlayByPlayResponse | null) => {
  const map = new Map<number, string>();
  if (!plays) return map;
  plays.rosterSpots.forEach((spot: RosterSpot) => {
    map.set(spot.playerId, `${spot.firstName.default} ${spot.lastName.default}`);
  });
  return map;
};

const describePlay = (play: PlayByPlayResponse["plays"][number], rosterMap: Map<number, string>) => {
  const details = play.details;
  const scorer = details?.scoringPlayerId ? rosterMap.get(details.scoringPlayerId) : undefined;
  const shooter = details?.shootingPlayerId ? rosterMap.get(details.shootingPlayerId) : undefined;
  const committer = details?.committedByPlayerId ? rosterMap.get(details.committedByPlayerId) : undefined;
  const drawnBy = details?.drawnByPlayerId ? rosterMap.get(details.drawnByPlayerId) : undefined;

  if (scorer) return `Goal - ${scorer}`;
  if (shooter) return `Shot - ${shooter} (${details?.shotType ?? "shot"})`;
  if (committer) return `Penalty - ${committer}${drawnBy ? ` on ${drawnBy}` : ""}`;
  if (details?.descKey) return details.descKey;
  return play.typeDescKey;
};

const resolvePeriod = (plays: PlayByPlayResponse | null) => {
  if (!plays || plays.plays.length === 0) return 0;
  return plays.plays.reduce(
    (max, play) => Math.max(max, play.periodDescriptor.number),
    0
  );
};

const mapGameDetail = (
  game: NhlGameDetails,
  plays: PlayByPlayResponse | null,
  boxscore: BoxscoreResponse | null
): GameDetail => {
  const homePlayers = boxscore?.playerByGameStats?.homeTeam
    ? [...boxscore.playerByGameStats.homeTeam.forwards, ...boxscore.playerByGameStats.homeTeam.defense]
    : [];
  const awayPlayers = boxscore?.playerByGameStats?.awayTeam
    ? [...boxscore.playerByGameStats.awayTeam.forwards, ...boxscore.playerByGameStats.awayTeam.defense]
    : [];

  const rosterMap = rosterMapFromPlayByPlay(plays);
  const period = resolvePeriod(plays);
  const clock = game.clock?.timeRemaining ?? "";

  let status = mapGameStatus(game.gameState);
  if (status === "scheduled" && (game.homeTeam.score > 0 || game.awayTeam.score > 0) && period > 0 && (clock === "00:00" || clock === "")) {
    status = "final";
  }

  return {
    id: String(game.id),
    date: game.gameDate.slice(0, 10),
    homeTeam: game.homeTeam.commonName.default,
    awayTeam: game.awayTeam.commonName.default,
    startTime: formatLocalTime(game.startTimeUTC),
    status,
    venue: game.venue.default,
    homeScore: game.homeTeam.score,
    awayScore: game.awayTeam.score,
    period,
    clock,
    gameType: game.gameType,
    broadcasts:
      game.tvBroadcasts
        ?.map((cast) => cast.network)
        .filter((network): network is string => Boolean(network)) ?? [],
    leaders: {
      home: topScorers(homePlayers, 3),
      away: topScorers(awayPlayers, 3),
    },
    threeStars: game.threeStars?.map((star) => `${star.name.default} (${star.teamAbbrev})`) ?? [],
    stats: {
      shots: { home: game.homeTeam.sog, away: game.awayTeam.sog },
      hits: { home: sumHits(homePlayers), away: sumHits(awayPlayers) },
      faceoffPct: { home: 0, away: 0 },
    },
    plays:
      plays?.plays
        ?.map((play) => ({
          time: `P${play.periodDescriptor.number} ${play.timeInPeriod}`,
          description: describePlay(play, rosterMap),
        })) ?? [],
  };
};

export const listGames = async ({
  cursor,
  limit,
}: {
  cursor: string | null;
  limit: number;
}): Promise<GamesPage> => {
  const target = cursor ? new Date(cursor) : new Date();
  if (Number.isNaN(target.getTime())) {
    throw new Error(`Invalid cursor date: ${cursor}`);
  }

  const schedule = await nhlClient.getScheduleByDate(formatDate(target), "asc");
  const items = schedule.games.map(mapGameListItem);
  const nextDate = addDays(target, 1);

  return {
    items,
    nextCursor: formatDate(nextDate),
  };
};

export const getGame = async ({ id }: { id: string }): Promise<GameDetail> => {
  const numericId = Number(id);
  if (Number.isNaN(numericId)) {
    throw new Error(`Invalid game ID: ${id}`);
  }

  const [details, playByPlay, boxscore] = await Promise.all([
    nhlClient.getGameDetails(numericId),
    nhlClient.getGamePlayByPlay(numericId).catch(() => null),
    nhlClient.getGameBoxscore(numericId).catch(() => null),
  ]);

  return mapGameDetail(details, playByPlay, boxscore);
};
