interface VersionResponse {
	minVersion: string;
	latestVersion: string;
	downloadUrl: string;
	homebrewUrl: string;
}

export default {
	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);

		// Handle CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type',
				},
			});
		}

		// Version endpoint
		if (url.pathname === '/api/version' && request.method === 'GET') {
			const versionData: VersionResponse = {
				minVersion: '0.1.0', // Update this when you need to force upgrades
				latestVersion: '0.2.0', // Update this with each release
				downloadUrl: 'https://www.npmjs.com/package/puck',
				homebrewUrl: 'brew install carsonjones/puck/puck',
			};

			return new Response(JSON.stringify(versionData), {
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*',
					'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
				},
			});
		}

		if (url.pathname === '/health' && request.method === 'GET') {
			return new Response(JSON.stringify({ status: 'ok' }), {
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*',
				},
			});
		}

		// 404 for other paths
		return new Response('Not Found', { status: 404 });
	},
};
