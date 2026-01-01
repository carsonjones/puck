import { Box, Text } from 'ink';
import type React from 'react';
import type { Play } from '@/data/api/client.js';

type PlaysTabProps = {
	plays: Play[];
	scrollIndex: number;
	sortOrder: 'asc' | 'desc';
	height: number;
};

const PlaysTab: React.FC<PlaysTabProps> = ({ plays, scrollIndex, sortOrder, height }) => {
	const sortedPlays = sortOrder === 'desc' ? [...plays].reverse() : plays;
	const playsHeight = Math.max(5, height - 15);
	const windowSize = Math.max(1, playsHeight);
	const half = Math.floor(windowSize / 2);
	const start = Math.max(0, Math.min(sortedPlays.length - windowSize, scrollIndex - half));
	const end = Math.min(sortedPlays.length, start + windowSize);
	const visiblePlays = sortedPlays.slice(start, end);

	const getRowColor = (play: Play, isSelected: boolean) => {
		if (isSelected) return 'yellow';
		if (play.playType === 'goal') return 'green';
		return 'white';
	}

	return (
		<Box flexDirection="column">
			{visiblePlays.map((play, idx) => {
				const absoluteIndex = start + idx;
				const isSelected = absoluteIndex === scrollIndex;
				return (
					<Box key={absoluteIndex}>
						<Text color={getRowColor(play, isSelected)}>
							{`${isSelected ? '> ' : '  '}${play.time} ${play.description}`}
						</Text>
					</Box>
				);
			})}
		</Box>
	);
};

export default PlaysTab;
