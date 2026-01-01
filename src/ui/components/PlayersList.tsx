import { Box, Text, useStdout } from 'ink';
import type React from 'react';
import type { PlayerLeaderboardItem } from '@/data/api/client.js';
import { useWindowedList } from '@/hooks/useWindowedList.js';

type PlayersListProps = {
	items: PlayerLeaderboardItem[];
	cursorIndex: number;
	height: number;
	loading?: boolean;
	hideSelection?: boolean;
};

const PlayersList: React.FC<PlayersListProps> = ({
	items,
	cursorIndex,
	height,
	loading,
	hideSelection,
}) => {
	const { stdout } = useStdout();
	const terminalWidth = stdout?.columns || 80;
	const containerWidth = Math.max(10, Math.floor(terminalWidth / 2) - 14);

	if (loading) {
		return <Text dimColor>Loading players...</Text>;
	}

	if (items.length === 0) {
		return <Text dimColor>No player data available.</Text>;
	}

	const { visible, start } = useWindowedList(items, cursorIndex, height, 6);

	return (
		<Box flexDirection="column">
			<Box minHeight={1}>
				<Text bold>
					{'Rank'.padEnd(5)} {'Player'.padEnd(20)} {'Team'.padEnd(5)} {'Pos'.padEnd(4)} {'Pts'}
				</Text>
			</Box>
			{visible.map((item, index) => {
				const absoluteIndex = start + index;
				const isSelected = !hideSelection && absoluteIndex === cursorIndex;
				const name = `${item.firstName.charAt(0)}. ${item.lastName}`;

				const rank = `${absoluteIndex + 1}.`.padEnd(5);
				const playerName = name.slice(0, 20).padEnd(20);
				const team = item.teamAbbrev.padEnd(5);
				const pos = item.position.padEnd(4);
				const pts = String(item.points);

				const text = `${rank} ${playerName} ${team} ${pos} ${pts}`;
				const padding = Math.max(0, containerWidth - text.length);
				const fullText = `${text}${' '.repeat(padding)}`;

				return (
					<Box key={`${absoluteIndex}-${item.id}`}>
						<Text inverse={isSelected}>{fullText}</Text>
					</Box>
				);
			})}
		</Box>
	);
};

export default PlayersList;
