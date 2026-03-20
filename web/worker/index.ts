import { getGame, getPlayerDetail, getPlayersList, getStandings, listGames } from '@/data/api/client.js';

type KVNamespace = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
};

type ScheduledEvent = { cron: string; scheduledTime: number };

type Env = {
  CACHE: KVNamespace;
};

const PLAYERS_KV_KEY = 'players-list';

const json = (body: unknown, init?: ResponseInit) =>
  Response.json(body, {
    ...init,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=30',
      ...init?.headers,
    },
  });

async function refreshPlayersCache(env: Env): Promise<void> {
  const players = await getPlayersList();
  await env.CACHE.put(PLAYERS_KV_KEY, JSON.stringify(players), {
    expirationTtl: 7200, // 2h TTL as safety net; cron refreshes every hour
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (url.pathname === '/__scheduled' && request.method === 'GET') {
      await refreshPlayersCache(env);
      return new Response('ok');
    }

    if (url.pathname === '/api/health' && request.method === 'GET') {
      return json(
        { status: 'ok', app: 'puck-web', date: '2026-03-14' },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }

    if (url.pathname === '/api/games' && request.method === 'GET') {
      try {
        const cursor = url.searchParams.get('cursor');
        return json(await listGames({ cursor }));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return json({ error: message }, { status: 500 });
      }
    }

    if (url.pathname === '/api/standings' && request.method === 'GET') {
      try {
        return json(await getStandings());
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return json({ error: message }, { status: 500 });
      }
    }

    if (url.pathname.startsWith('/api/games/') && request.method === 'GET') {
      const gameId = url.pathname.slice('/api/games/'.length);
      try {
        return json(await getGame({ id: gameId }));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return json({ error: message }, { status: 500 });
      }
    }

    if (url.pathname === '/api/players' && request.method === 'GET') {
      try {
        const cached = await env.CACHE.get(PLAYERS_KV_KEY);
        if (cached) {
          return json(JSON.parse(cached), {
            headers: { 'Cache-Control': 'public, max-age=3600' },
          });
        }
        // KV empty — fetch live and populate for next time (background)
        const players = await getPlayersList();
        env.CACHE.put(PLAYERS_KV_KEY, JSON.stringify(players), { expirationTtl: 7200 });
        return json(players, { headers: { 'Cache-Control': 'public, max-age=3600' } });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return json({ error: message }, { status: 500 });
      }
    }

    if (url.pathname.startsWith('/api/players/') && request.method === 'GET') {
      const playerId = Number(url.pathname.slice('/api/players/'.length));
      if (Number.isNaN(playerId)) {
        return json({ error: 'Invalid player ID' }, { status: 400 });
      }
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          return json(await getPlayerDetail(playerId), {
            headers: { 'Cache-Control': 'public, max-age=300' },
          });
        } catch (error) {
          if (error instanceof Error && error.message.includes('429') && attempt < 2) {
            await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
            continue;
          }
          const message = error instanceof Error ? error.message : String(error);
          return json({ error: message }, { status: 500 });
        }
      }
    }

    return new Response('Not Found', { status: 404 });
  },

  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    await refreshPlayersCache(env);
  },
};
