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
      return Response.json(
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

    return new Response('Not Found', { status: 404 });
  },
};
