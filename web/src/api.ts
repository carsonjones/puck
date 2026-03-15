import type { GameDetail, GamesPage } from '@/data/api/client.js';

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
  const response = await ensureOk(await fetch(`/api/games/${id}`));
  return (await response.json()) as GameDetail;
};
