import type { PlayerSearchResult } from '../data/nhl/models';

export type ScoredPlayerMatch = {
	player: PlayerSearchResult;
	score: number;
};

/**
 * Fuzzy match players by name with scoring
 * Similar to fuzzyMatchTeams but for player names
 */
export function fuzzyMatchPlayers(
	query: string,
	players: PlayerSearchResult[],
): ScoredPlayerMatch[] {
	if (!query.trim()) {
		return players.map((p) => ({ player: p, score: 0 }));
	}

	const lowerQuery = query.toLowerCase();
	const scored: ScoredPlayerMatch[] = [];

	for (const player of players) {
		const firstName = player.firstName.default;
		const lastName = player.lastName.default;
		const fullName = `${firstName} ${lastName}`;
		const searchableText = fullName.toLowerCase();
		let score = 0;
		let lastMatchIndex = -2;
		let queryIndex = 0;

		for (let i = 0; i < searchableText.length && queryIndex < lowerQuery.length; i++) {
			if (searchableText[i] === lowerQuery[queryIndex]) {
				score += 10; // Base match

				// Consecutive bonus
				if (i === lastMatchIndex + 1) {
					score += 15;
				}

				// Early position bonus (matching at start of name)
				if (i < 5) {
					score += 5 - i;
				}

				// Start of last name bonus (after space)
				if (i === firstName.length + 1) {
					score += 10;
				}

				// Case match bonus
				const fullNameChar = fullName[i] ?? '';
				const queryChar = query[queryIndex] ?? '';

				if (fullNameChar === queryChar) {
					score += 5;
				}

				lastMatchIndex = i;
				queryIndex++;
			}
		}

		// Only include if all query chars matched
		if (queryIndex === lowerQuery.length) {
			scored.push({ player, score });
		}
	}

	return scored.sort((a, b) => b.score - a.score);
}
