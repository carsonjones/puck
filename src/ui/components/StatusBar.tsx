import { Box, Text } from 'ink';
import type React from 'react';
import { useAppStore } from '@/state/useAppStore.js';

const StatusBar: React.FC<{
	focus: 'list' | 'detail';
	pageCursor: string | null;
	loading?: boolean;
	error?: string | null;
}> = ({ focus, loading, error }) => {
	const viewMode = useAppStore((state) => state.viewMode);
	const gameTeamFilter = useAppStore((state) => state.gameTeamFilter);
	const playerFilter = useAppStore((state) => state.playerFilter);
	const viewName =
		viewMode === 'standings' ? 'Standings' : viewMode === 'players' ? 'Players' : 'Games';

	const hasFilter =
		(viewMode === 'games' && gameTeamFilter) || (viewMode === 'players' && playerFilter);

	const rightText = loading
		? 'Loading'
		: error
			? `Error: ${error}`
			: hasFilter
				? `[x] clear filter | [g] games [s] standings [p] players [q] quit`
				: '[g] games [s] standings [p] players [q] quit';

	return (
		<Box justifyContent="space-between" width="100%">
			<Text>{`${viewName} | ${focus === 'list' ? 'List' : 'Detail'}`}</Text>
			<Text>{rightText}</Text>
		</Box>
	);
};

export default StatusBar;
