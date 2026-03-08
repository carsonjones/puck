#!/usr/bin/env bun
import { render } from 'ink';
import App from '@/app.js';
import { parseDateCommandArgs, printDateCommandHelp, runDateCommand } from '@/cli/dateCommand.js';
import { parseGameCommandArgs, printGameCommandHelp, runGameCommand } from '@/cli/gameCommand.js';
import {
	parseLookupCommandArgs,
	printLookupCommandHelp,
	runLookupCommand,
} from '@/cli/lookupCommand.js';
import {
	parseStandingsCommandArgs,
	printStandingsCommandHelp,
	runStandingsCommand,
} from '@/cli/standingsCommand.js';
import {
	parseHighlightsCommandArgs,
	printHighlightsCommandHelp,
	runHighlightsCommand,
} from '@/cli/highlightsCommand.js';
import { startPlayerCacheWorker } from '@/data/nhl/playerCacheWorker.js';
import { checkVersion } from '@/utils/versionCheck.js';

const VERSION_API_URL = 'https://puck.neat.workers.dev/api/version';
const CURRENT_VERSION = '0.3.0'; // Update this when bumping version

const rawArgs = process.argv.slice(2);
const skipVersionCheck = rawArgs.includes('--skip-version-check');
const args = rawArgs.filter((arg) => arg !== '--skip-version-check');
const command = args[0];
const isHelpRequest = args.includes('--help') || args.includes('-h') || command === 'help';
const isDiscoveryRequest = command === 'commands';

if (!skipVersionCheck && !isHelpRequest && !isDiscoveryRequest) {
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

if (command === 'help' || command === '--help' || command === '-h') {
	printHelp(args[1]);
	process.exit(0);
}

if (command === 'version' || command === '--version' || command === '-v') {
	console.log(CURRENT_VERSION);
	process.exit(0);
}

if (!command || command === 'tui') {
	runTui();
} else if (command === 'date') {
	try {
		const options = parseDateCommandArgs(args.slice(1));
		await runDateCommand(options);
		process.exit(0);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`Error: ${message}`);
		process.exit(1);
	}
} else if (command === 'game') {
	try {
		const options = parseGameCommandArgs(args.slice(1));
		await runGameCommand(options);
		process.exit(0);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`Error: ${message}`);
		process.exit(1);
	}
} else if (command === 'lookup') {
	try {
		const options = parseLookupCommandArgs(args.slice(1));
		await runLookupCommand(options);
		process.exit(0);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`Error: ${message}`);
		process.exit(1);
	}
} else if (command === 'standings') {
	try {
		const options = parseStandingsCommandArgs(args.slice(1));
		await runStandingsCommand(options);
		process.exit(0);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`Error: ${message}`);
		process.exit(1);
	}
} else if (command === 'highlights') {
	try {
		const options = parseHighlightsCommandArgs(args.slice(1));
		await runHighlightsCommand(options);
		process.exit(0);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`Error: ${message}`);
		process.exit(1);
	}
} else if (command === 'commands') {
	const format = args.includes('--format=json') || args.includes('--json') ? 'json' : 'table';
	if (format === 'json') {
		console.log(
			JSON.stringify(
				{
					name: 'puck',
					version: CURRENT_VERSION,
					commands: [
						{ name: 'tui', description: 'Launch the interactive TUI (default)' },
						{
							name: 'date',
							description: 'Get games for a date',
							outputs: ['json', 'ndjson', 'table'],
						},
						{
							name: 'game',
							description: 'Get parsed game details and plays',
							outputs: ['json', 'ndjson', 'table'],
						},
						{
							name: 'lookup',
							description: 'Find player/game IDs for pipelines',
							outputs: ['json', 'ndjson', 'table', 'ids-only'],
							subcommands: ['player', 'game'],
						},
						{
							name: 'standings',
							description: 'Get standings snapshot with day-over-day movement',
							outputs: ['json', 'ndjson', 'table'],
						},
						{
							name: 'highlights',
							description: 'Resolve goal highlight clips + direct media URLs',
							outputs: ['json', 'table'],
						},
						{ name: 'help', description: 'Show global or command-specific help' },
						{ name: 'version', description: 'Show current version' },
					],
				},
				null,
				2,
			),
		);
	} else {
		console.log(`Commands:
  tui      Launch the interactive TUI (default)
  date     Get games for a date (json|ndjson|table)
  game     Get parsed game details/plays (json|ndjson|table)
  lookup   Find player/game IDs (json|ndjson|table|ids-only)
  standings Get standings snapshot + movement (json|ndjson|table)
  highlights Resolve goal highlight clips + media URLs (json|table)
  help     Show help (supports: puck help <command>)
  version  Show version`);
	}
	process.exit(0);
} else {
	console.error(`Unknown command: ${command}`);
	console.error("Run 'puck --help' for usage.");
	process.exit(1);
}

function runTui() {
	// Clear terminal for full screen
	process.stdout.write('\x1Bc');

	process.stdin.setEncoding('utf8');
	if (process.stdin.setRawMode) {
		process.stdin.setRawMode(true);
	}
	process.stdin.resume();

	// Start player cache worker (refreshes every 15 minutes)
	const stopPlayerCacheWorker = startPlayerCacheWorker();

	const app = render(<App />, { exitOnCtrlC: false });

	app.waitUntilExit().finally(() => {
		// Stop the player cache worker
		stopPlayerCacheWorker();

		if (process.stdin.setRawMode) {
			process.stdin.setRawMode(false);
		}
	});
}

function printGlobalHelp() {
	console.log(`Usage: puck [command] [options]

Commands:
  tui               Launch the interactive TUI (default)
  date              Get games for a date in machine-readable output
  game              Get parsed game details (plays, stars, scorers, goalies)
  lookup            Find player/game IDs for piping into other commands
  standings         Get standings snapshot with day-over-day movement
  highlights        Resolve goal highlight clips + direct media URLs
  commands          List available commands (use --format=json for agents)

Global Options:
  --skip-version-check   Skip minimum-version gate
  -h, --help             Show help
  -v, --version          Show current version

Date Command:
  puck date --date today --format json
  puck date --date 2026-03-02 --team DAL --format table
  puck date --date +1 --format ndjson

Game Command:
  puck game --id 2025020956 --format json
  puck game --id 2025020958 --plays-only --format ndjson

Lookup Command:
  puck lookup player --query "connor mcdavid" --ids-only
  puck lookup game --date today --team DAL --ids-only

Standings Command:
  puck standings --date today --format json
  puck standings --date yesterday --team DAL --format table

Highlights Command:
  puck highlights --date yesterday --team DAL --limit 2 --format json
  puck highlights --game-id 2025020956 --format table

Discovery:
  puck commands --format=json
  puck help date
  puck help game
  puck help lookup
  puck help standings
  puck help highlights`);
}

function printHelp(topic?: string) {
	if (!topic) {
		printGlobalHelp();
		return;
	}

	if (topic === 'date') {
		printDateCommandHelp();
		return;
	}
	if (topic === 'game') {
		printGameCommandHelp();
		return;
	}
	if (topic === 'lookup') {
		printLookupCommandHelp();
		return;
	}
	if (topic === 'standings') {
		printStandingsCommandHelp();
		return;
	}
	if (topic === 'highlights') {
		printHighlightsCommandHelp();
		return;
	}

	console.error(`Unknown help topic: ${topic}`);
	console.error('Supported topics: date, game, lookup, standings, highlights');
	process.exit(1);
}
