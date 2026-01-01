#!/usr/bin/env bun

/**
 * Script to collect all unique descKey values from NHL play-by-play API
 * This helps us build a comprehensive mapping for formatDescKey()
 */

import { NhlClient } from '../src/data/nhl/client.ts';

const nhlClient = new NhlClient(fetch);

async function collectDescKeys() {
	console.log('Fetching games from multiple dates...\n');

	const allDescKeys = new Set<string>();
	const allTypeDescKeys = new Set<string>();
	const allReasons = new Set<string>();

	// Check the last 7 days for more comprehensive data
	const dates = [];
	for (let i = 0; i < 7; i++) {
		const date = new Date();
		date.setDate(date.getDate() - i);
		dates.push(date.toISOString().split('T')[0]);
	}

	let totalGames = 0;

	for (const date of dates) {
		console.log(`\nChecking ${date}...`);

		try {
			const scoreboard = await nhlClient.getScheduleByDate(date, 'asc');

			if (!scoreboard.games || scoreboard.games.length === 0) {
				console.log('  No games found');
				continue;
			}

			console.log(`  Found ${scoreboard.games.length} games`);
			totalGames += scoreboard.games.length;

			// Fetch play-by-play for each game
			for (const game of scoreboard.games) {
				console.log(
					`  Processing game ${game.id}: ${game.awayTeam.abbrev} @ ${game.homeTeam.abbrev}`,
				);

				try {
					const playByPlay = await nhlClient.getGamePlayByPlay(game.id);

					let descKeyCount = 0;

					for (const play of playByPlay.plays) {
						// Collect typeDescKey
						if (play.typeDescKey) {
							allTypeDescKeys.add(play.typeDescKey);
						}

						// Collect descKey from details
						if (play.details?.descKey) {
							allDescKeys.add(play.details.descKey);
							descKeyCount++;
						}

						// Collect stoppage reasons
						if (play.typeDescKey === 'stoppage' && play.details?.reason) {
							allReasons.add(play.details.reason);
						}
					}

					console.log(`    Found ${descKeyCount} descKey values`);
				} catch (error) {
					console.error(`    Error fetching play-by-play: ${error}`);
				}
			}
		} catch (error) {
			console.error(`  Error fetching schedule for ${date}: ${error}`);
		}
	}

	if (totalGames === 0) {
		console.log('\nNo games found in the last 7 days.');
		return;
	}

	console.log('\n' + '='.repeat(60));
	console.log('UNIQUE descKey VALUES:');
	console.log('='.repeat(60));
	const sortedDescKeys = Array.from(allDescKeys).sort();
	for (const key of sortedDescKeys) {
		console.log(`  "${key}"`);
	}

	console.log('\n' + '='.repeat(60));
	console.log('UNIQUE typeDescKey VALUES:');
	console.log('='.repeat(60));
	const sortedTypeDescKeys = Array.from(allTypeDescKeys).sort();
	for (const key of sortedTypeDescKeys) {
		console.log(`  "${key}"`);
	}

	console.log('\n' + '='.repeat(60));
	console.log('UNIQUE STOPPAGE REASONS:');
	console.log('='.repeat(60));
	const sortedReasons = Array.from(allReasons).sort();
	for (const reason of sortedReasons) {
		console.log(`  "${reason}"`);
	}

	console.log('\n' + '='.repeat(60));
	console.log('SUMMARY:');
	console.log('='.repeat(60));
	console.log(`Total games processed: ${totalGames}`);
	console.log(`Total unique descKeys: ${allDescKeys.size}`);
	console.log(`Total unique typeDescKeys: ${allTypeDescKeys.size}`);
	console.log(`Total unique stoppage reasons: ${allReasons.size}`);
}

// Run the script
collectDescKeys().catch(console.error);
