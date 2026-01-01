import { Box, Text } from 'ink';
import type React from 'react';
import { useLineWidth } from '@/hooks/useLineWidth.js';
import { usePlayerGameLog } from '@/data/hooks/usePlayerGameLog.js';
import { useAppStore } from '@/state/useAppStore.js';
import { useWindowedList } from '@/hooks/useWindowedList.js';

type PlayerGamesTabProps = {
	playerId: number;
	scrollIndex: number;
	height: number;
};

const PlayerGamesTab: React.FC<PlayerGamesTabProps> = ({ playerId, scrollIndex, height }) => {
	const lineWidth = useLineWidth();
	const { playerDetailTab } = useAppStore();
	// Only fetch game log when on games tab (lazy load for performance)
	const shouldFetch = playerDetailTab === 'games';
	const { data: gameLog, status } = usePlayerGameLog(shouldFetch ? playerId : null);

	if (status === 'loading') {
		return <Text dimColor>Loading game log...</Text>;
	}

	if (status === 'error') {
		return <Text color="red">Failed to load game log.</Text>;
	}

	if (!gameLog || gameLog.length === 0) {
		return <Text dimColor>No game log available.</Text>;
	}

	const { visible, start } = useWindowedList(gameLog, scrollIndex, height, 12);

	return (
		<Box flexDirection="column">
			<Box>
				<Text bold>
					{`${'Date'.padEnd(12)} ${'Opp'.padEnd(8)} ${'G'.padStart(3)} ${'A'.padStart(3)} ${'P'.padStart(3)} ${'+/-'.padStart(4)} ${'SOG'.padStart(4)} ${'TOI'.padStart(6)}`}
				</Text>
			</Box>
			{visible.map((game, idx) => {
				const absoluteIndex = start + idx;
				const isSelected = absoluteIndex === scrollIndex;
				const vsPrefix = game.homeAway === 'home' ? 'vs ' : '@ ';

				const text = `${'  '}${game.date.padEnd(10)} ${(vsPrefix + game.opponent).padEnd(8)} ${String(game.goals).padStart(3)} ${String(game.assists).padStart(3)} ${String(game.points).padStart(3)} ${((game.plusMinus >= 0 ? '+' : '') + game.plusMinus).padStart(4)} ${String(game.shots).padStart(4)} ${game.toi.padStart(6)}`;
				const padding = Math.max(0, lineWidth - text.length);
				const fullText = `${text}${' '.repeat(padding)}`;

				return (
					<Box key={game.gameId}>
						<Text inverse={isSelected}>{fullText}</Text>
					</Box>
				);
			})}
		</Box>
	);
};

export default PlayerGamesTab;
