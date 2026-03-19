import { getGame, getPlayerDetail, getPlayersList, getStandings, listGames } from '@/data/api/client.js';

const json = (body: unknown, init?: ResponseInit) =>
  Response.json(body, {
    ...init,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=30',
      ...init?.headers,
    },
  });

export default {
  async fetch(request: Request): Promise<Response> {
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

    if (url.pathname === '/api/health' && request.method === 'GET') {
      return json(
        {
          status: 'ok',
          app: 'puck-web',
          date: '2026-03-14',
        },
        {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store',
          },
        },
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
        return json(await getPlayersList(), {
          headers: { 'Cache-Control': 'public, max-age=3600' },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return json({ error: message }, { status: 500 });
      }
    }

    if (url.pathname.startsWith('/api/players/') && request.method === 'GET') {
      const playerId = Number(url.pathname.slice('/api/players/'.length));
      const teamAbbrev = url.searchParams.get('team') ?? undefined;
      if (Number.isNaN(playerId)) {
        return json({ error: 'Invalid player ID' }, { status: 400 });
      }
      try {
        return json(await getPlayerDetail(playerId, teamAbbrev), {
          headers: { 'Cache-Control': 'public, max-age=300' },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return json({ error: message }, { status: 500 });
      }
    }

    return new Response('Not Found', { status: 404 });
  },
};
