export interface VersionCheckResult {
	isAllowed: boolean;
	message?: string;
	upgradeInstructions?: string;
	latestVersion?: string;
}

interface VersionApiResponse {
	minVersion: string;
	latestVersion: string;
	downloadUrl: string;
	homebrewUrl: string;
}

function compareVersions(current: string, min: string): boolean {
	const currentParts = current.split('.').map(Number);
	const minParts = min.split('.').map(Number);

	for (let i = 0; i < Math.max(currentParts.length, minParts.length); i++) {
		const curr = currentParts[i] || 0;
		const minV = minParts[i] || 0;

		if (curr < minV) return false;
		if (curr > minV) return true;
	}

	return true; // Equal versions
}

export async function checkVersion(
	currentVersion: string,
	apiUrl: string,
): Promise<VersionCheckResult> {
	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 3000);

		const response = await fetch(apiUrl, {
			signal: controller.signal,
			headers: { Accept: 'application/json' },
		});

		clearTimeout(timeout);

		if (!response.ok) {
			console.warn(`Version check failed: ${response.status}`);
			return { isAllowed: true };
		}

		const data = (await response.json()) as VersionApiResponse;

		const isAllowed = compareVersions(currentVersion, data.minVersion);

		if (!isAllowed) {
			return {
				isAllowed: false,
				message: `Version ${currentVersion} is no longer supported (minimum: ${data.minVersion})`,
				upgradeInstructions: `Upgrade:\n  npm: npm install -g puck@latest\n  brew: brew upgrade puck\n\nTo skip this check: puck --skip-version-check`,
				latestVersion: data.latestVersion,
			};
		}

		return { isAllowed: true, latestVersion: data.latestVersion };
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError') {
			console.warn('Version check timed out, continuing...');
		} else {
			console.warn(`Version check failed: ${error}, continuing...`);
		}
		return { isAllowed: true };
	}
}
