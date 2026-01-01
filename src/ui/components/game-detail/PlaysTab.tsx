import { Box, Text } from 'ink';
import type React from 'react';
import type { Play } from '@/data/api/client.js';
import { useLineWidth } from '@/hooks/useLineWidth.js';
import { useWindowedList } from '@/hooks/useWindowedList.js';

type PlaysTabProps = {
	plays: Play[];
	scrollIndex: number;
	sortOrder: 'asc' | 'desc';
	height: number;
};

const PlaysTab: React.FC<PlaysTabProps> = ({ plays, scrollIndex, sortOrder, height }) => {
	const lineWidth = useLineWidth();
	const sortedPlays = sortOrder === 'desc' ? [...plays].reverse() : plays;
	const { visible: visiblePlays, start } = useWindowedList(sortedPlays, scrollIndex, height, 15);

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
