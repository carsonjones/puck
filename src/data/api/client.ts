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
  plays: Array<{ time: string; description: string }>;
};

export type GamesPage = {
  items: GameListItem[];
  nextCursor: string | null;
};

const TEAM_POOL = [
  "Bruins",
  "Rangers",
  "Maple Leafs",
  "Canadiens",
  "Lightning",
  "Panthers",
  "Oilers",
  "Flames",
  "Canucks",
  "Avalanche",
  "Stars",
  "Golden Knights",
  "Kings",
  "Kraken",
];

const VENUES = [
  "Madison Square Garden",
  "TD Garden",
  "Rogers Place",
  "Ball Arena",
  "Scotiabank Arena",
  "Crypto.com Arena",
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const nhlClient = new NhlClient();

const requireToken = () => {
  const token = getToken();
  if (!token) throw new Error("Missing NHL token");
  return token;
};

const seeded = (seed: number) => {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => (value = (value * 16807) % 2147483647) / 2147483647;
};

const makeGame = (index: number, page: number): GameListItem => {
  const rand = seeded(page * 1000 + index)();
  const date = new Date(Date.now() + page * 24 * 60 * 60 * 1000);
  const day = date.toISOString().slice(0, 10);
  const homeTeam = TEAM_POOL[(index * 2) % TEAM_POOL.length];
  const awayTeam = TEAM_POOL[(index * 2 + 3) % TEAM_POOL.length];
  const startHour = 18 + Math.floor(rand * 4);
  const status = rand > 0.66 ? "scheduled" : rand > 0.33 ? "in_progress" : "final";

  return {
    id: `game-${page}-${index}`,
    date: day,
    homeTeam,
    awayTeam,
    startTime: `${startHour}:00`,
    status,
  };
};

const makeDetail = (listItem: GameListItem): GameDetail => {
  const seed = listItem.id
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const rand = seeded(seed);

  return {
    ...listItem,
    venue: VENUES[seed % VENUES.length],
    homeScore: Math.floor(rand() * 6),
    awayScore: Math.floor(rand() * 6),
    period: 3,
    clock: rand() > 0.5 ? "12:34" : "",
    gameType: 2,
    broadcasts: ["ESPN", "SN"],
    leaders: {
      home: [`${listItem.homeTeam} Leader 1`, `${listItem.homeTeam} Leader 2`],
      away: [`${listItem.awayTeam} Leader 1`, `${listItem.awayTeam} Leader 2`],
    },
    threeStars: [`${listItem.homeTeam} Star`, `${listItem.awayTeam} Star`, "Goalie Star"],
    stats: {
      shots: { home: 20 + Math.floor(rand() * 15), away: 20 + Math.floor(rand() * 15) },
      hits: { home: 10 + Math.floor(rand() * 15), away: 10 + Math.floor(rand() * 15) },
      faceoffPct: { home: 45 + Math.floor(rand() * 10), away: 45 + Math.floor(rand() * 10) },
    },
    plays: [
      { time: "19:32", description: `${listItem.homeTeam} win faceoff` },
      { time: "15:04", description: `${listItem.awayTeam} shot on goal` },
      { time: "09:18", description: `${listItem.homeTeam} power play` },
    ],
  };
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
  return sorted.slice(0, count).map((player) => `${player.name.default} ${player.points}P`);
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

  try {
    const schedule = await nhlClient.getScheduleByDate(formatDate(target), "asc");
    const items = schedule.games.map(mapGameListItem);
    const nextDate = addDays(target, 1);

    return {
      items,
      nextCursor: formatDate(nextDate),
    };
  } catch {
    const page = cursor ? Number(cursor) : 0;
    const safePage = Number.isNaN(page) ? 0 : page;
    const items = Array.from({ length: limit }, (_, index) => makeGame(index, safePage));
    await sleep(250 + Math.random() * 200);
    return {
      items,
      nextCursor: safePage < 6 ? String(safePage + 1) : null,
    };
  }
};

export const getGame = async ({ id }: { id: string }): Promise<GameDetail> => {
  const numericId = Number(id);
  if (!Number.isNaN(numericId)) {
    try {
      const [details, playByPlay, boxscore] = await Promise.all([
        nhlClient.getGameDetails(numericId),
        nhlClient.getGamePlayByPlay(numericId).catch(() => null),
        nhlClient.getGameBoxscore(numericId).catch(() => null),
      ]);
      return mapGameDetail(details, playByPlay, boxscore);
    } catch {
      // Fall through to mock detail if the live API fails.
    }
  }

  const [_, pageStr, indexStr] = id.split("-");
  const page = Number(pageStr ?? 0);
  const index = Number(indexStr ?? 0);
  const listItem = makeGame(index, page);
  await sleep(200 + Math.random() * 150);
  return makeDetail(listItem);
};
