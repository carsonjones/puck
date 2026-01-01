import { Box, Text } from 'ink';
import type React from 'react';
import type { Play } from '@/data/api/client.js';
import { useLineWidth } from '@/hooks/useLineWidth.js';

type PlaysTabProps = {
	plays: Play[];
	scrollIndex: number;
	sortOrder: 'asc' | 'desc';
	height: number;
};

const PlaysTab: React.FC<PlaysTabProps> = ({ plays, scrollIndex, sortOrder, height }) => {
	const lineWidth = useLineWidth();
	const sortedPlays = sortOrder === 'desc' ? [...plays].reverse() : plays;
	const playsHeight = Math.max(5, height - 15);
	const windowSize = Math.max(1, playsHeight);
	const half = Math.floor(windowSize / 2);
	const start = Math.max(0, Math.min(sortedPlays.length - windowSize, scrollIndex - half));
	const end = Math.min(sortedPlays.length, start + windowSize);
	const visiblePlays = sortedPlays.slice(start, end);

	return (
		<Box flexDirection="column">
			{visiblePlays.map((play, idx) => {
				const absoluteIndex = start + idx;
				const isSelected = absoluteIndex === scrollIndex;
				const text = `${'  '}${play.time} ${play.description}`;
				const padding = Math.max(0, lineWidth - text.length);
				const fullText = `${text}${' '.repeat(padding)}`;

				return (
					<Box key={absoluteIndex}>
						<Text inverse={isSelected} color={!isSelected && play.playType === 'goal' ? 'green' : undefined}>
							{fullText}
						</Text>
					</Box>
				);
			})}
		</Box>
	);
};

export default PlaysTab;
