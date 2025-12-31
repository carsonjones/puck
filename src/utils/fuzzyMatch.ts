type Team = {
	teamName: string;
	teamAbbrev: string;
};

export type ScoredMatch<T extends Team> = {
	team: T;
	score: number;
};

export function fuzzyMatchTeams<T extends Team>(query: string, teams: T[]): ScoredMatch<T>[] {
	if (!query.trim()) {
		return teams.map((t) => ({ team: t, score: 0 }));
	}

	const lowerQuery = query.toLowerCase();
	const scored: ScoredMatch<T>[] = [];

	for (const team of teams) {
		const searchableText = `${team.teamName} ${team.teamAbbrev}`.toLowerCase();
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

				// Early position bonus
				if (i < 5) {
					score += 5 - i;
				}

				// Case match bonus - check original strings
				const teamNameChar = team.teamName[i] ?? '';
				const teamAbbrevChar = team.teamAbbrev[i - team.teamName.length - 1] ?? ''; // account for space
				const queryChar = query[queryIndex] ?? '';

				if (teamNameChar === queryChar || teamAbbrevChar === queryChar) {
					score += 5;
				}

				lastMatchIndex = i;
				queryIndex++;
			}
		}

		// Only include if all query chars matched
		if (queryIndex === lowerQuery.length) {
			scored.push({ team, score });
		}
	}

	return scored.sort((a, b) => b.score - a.score);
}
