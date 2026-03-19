import type { GameDetail, GamesPage, PlayerDetailData, PlayerListItem, StandingsData } from '@/data/api/client';

const gameDetailCache = new Map<string, { data: GameDetail; cachedAt: number }>();
const GAME_DETAIL_TTL_MS = 30_000;

const ensureOk = async (response: Response) => {
  if (response.ok) {
    return response;
  }

  let message = `Request failed with status ${response.status}`;

  try {
    const body = (await response.json()) as { error?: string };
    if (body.error) {
      message = body.error;
    }
  } catch {
    // Ignore parse failures and use the default message.
  }

  throw new Error(message);
};

export const fetchGames = async (cursor: string | null): Promise<GamesPage> => {
  const url = new URL('/api/games', window.location.origin);
  if (cursor) {
    url.searchParams.set('cursor', cursor);
  }

  const response = await ensureOk(await fetch(url));
  return (await response.json()) as GamesPage;
};

export const fetchGameDetail = async (id: string): Promise<GameDetail> => {
  const cached = gameDetailCache.get(id);
  if (cached && Date.now() - cached.cachedAt < GAME_DETAIL_TTL_MS) {
    return cached.data;
  }

  const response = await ensureOk(await fetch(`/api/games/${id}`));
  const data = (await response.json()) as GameDetail;
  gameDetailCache.set(id, { data, cachedAt: Date.now() });
  return data;
};

export const fetchStandings = async (): Promise<StandingsData> => {
  const response = await ensureOk(await fetch('/api/standings'));
  return (await response.json()) as StandingsData;
};

export const fetchPlayers = async (): Promise<PlayerListItem[]> => {
  const response = await ensureOk(await fetch('/api/players'));
  return (await response.json()) as PlayerListItem[];
};

export const fetchPlayerDetail = async (id: number, teamAbbrev?: string): Promise<PlayerDetailData> => {
  const url = new URL(`/api/players/${id}`, window.location.origin);
  if (teamAbbrev) url.searchParams.set('team', teamAbbrev);
  const response = await ensureOk(await fetch(url));
  return (await response.json()) as PlayerDetailData;
};
