import { expect, test } from 'bun:test';
import { getStandings } from './client.js';

test('standings returns 32 teams with correct ranks', async () => {
	const data = await getStandings();

	// Should have 32 teams total
	expect(data.league.length).toBe(32);

	// Check all ranks are present (accounting for ties)
	const ranks = data.league.map((t) => t.rank);
	console.log('League ranks:', ranks);

	// First team should be rank 1
	expect(ranks[0]).toBe(1);

	// Ranks should be ascending
	for (let i = 1; i < ranks.length; i++) {
		expect(ranks[i]).toBeGreaterThanOrEqual(ranks[i - 1]);
	}

	// Log teams by rank to debug
	data.league.forEach((team, idx) => {
		console.log(
			`${idx}: Rank ${team.rank} - ${team.teamName} (${team.points}pts, ${team.wins}W) [${team.teamAbbrev}]`,
		);
	});

	// Check for duplicate abbreviations
	const abbrevs = data.league.map((t) => t.teamAbbrev);
	const dupes = abbrevs.filter((a, i) => abbrevs.indexOf(a) !== i);
	if (dupes.length > 0) {
		console.log('DUPLICATE ABBREVS:', dupes);
	}
});
