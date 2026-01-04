import { Box, Text, useStdout } from 'ink';
import type React from 'react';
import type { GameListItem } from '@/data/api/client.js';
import { useWindowedList } from '@/hooks/useWindowedList.js';

type ListProps = {
	items: GameListItem[];
	cursorIndex: number;
	height: number;
	onSelect?: (item: GameListItem) => void;
	loading?: boolean;
};

const List: React.FC<ListProps> = ({ items, cursorIndex, height, loading }) => {
	const { stdout } = useStdout();
	const terminalWidth = stdout?.columns || 80;
	const containerWidth = Math.floor(terminalWidth / 2) - 10; // half screen minus borders/padding
	const { visible, start } = useWindowedList(items, cursorIndex, height, 2);

	if (loading) {
		return <Text dimColor>Loading games...</Text>;
	}

	if (items.length === 0) {
		return <Text dimColor>No games found.</Text>;
	}

	const formatGameInfo = (item: GameListItem) => {
		if (item.status === 'final') {
			const overtimeLabel =
				item.periodType === 'OT' ? ' OT' : item.periodType === 'SO' ? ' SO' : '';
			return `${item.awayScore}-${item.homeScore}${overtimeLabel}`;
		}
		if (item.status === 'in_progress') {
			const periodLabel = item.periodType === 'OT' ? 'OT' : item.periodType === 'SO' ? 'SO' : `P${item.period}`;
			const timeInfo = item.clock ? ` ${item.clock}` : '';
			return `${item.awayScore}-${item.homeScore} ${periodLabel}${timeInfo}`;
		}
		return item.startTime;
	};

	return (
		<Box flexDirection="column">
			{visible.map((item, index) => {
				const absoluteIndex = start + index;
				const isSelected = absoluteIndex === cursorIndex;
				const awayWins = item.status === 'final' && item.awayScore > item.homeScore;
				const homeWins = item.status === 'final' && item.homeScore > item.awayScore;

				const leftText = `${item.awayTeam}${awayWins ? ' ✓' : ''} @ ${item.homeTeam}${homeWins ? ' ✓' : ''}`;
				const rightText = formatGameInfo(item);
				const padding = Math.max(1, containerWidth - leftText.length - rightText.length);
				const fullText = `${leftText}${' '.repeat(padding)}${rightText}`;

				return (
					<Box key={item.id}>
						<Text inverse={isSelected}>{fullText}</Text>
					</Box>
				);
			})}
		</Box>
	);
};

export default List;
