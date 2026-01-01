#!/usr/bin/env bun
import { render } from 'ink';
import App from '@/app.js';
import { checkVersion } from '@/utils/versionCheck.js';

// Version check (unless --skip-version-check flag is present)
const skipVersionCheck = process.argv.includes('--skip-version-check');

if (!skipVersionCheck) {
	const VERSION_API_URL = 'https://puck.neat.workers.dev/api/version';
	const CURRENT_VERSION = '0.1.0'; // Update this when bumping version

	const result = await checkVersion(CURRENT_VERSION, VERSION_API_URL);

	if (!result.isAllowed) {
		console.error(`\n⚠️  ${result.message}\n`);
		if (result.upgradeInstructions) {
			console.error(result.upgradeInstructions);
		}
		console.error('');
		process.exit(1);
	}
}

// Clear terminal for full screen
process.stdout.write('\x1Bc');

process.stdin.setEncoding('utf8');
if (process.stdin.setRawMode) {
	process.stdin.setRawMode(true);
}
process.stdin.resume();

const app = render(<App />, { exitOnCtrlC: false });

app.waitUntilExit().finally(() => {
	if (process.stdin.setRawMode) {
		process.stdin.setRawMode(false);
	}
});
