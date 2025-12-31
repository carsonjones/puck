import React from 'react';
import { useAppStore } from '@/state/useAppStore.js';
import GamesScreen from '@/ui/screens/GamesScreen.js';
import PlayersScreen from '@/ui/screens/PlayersScreen.js';
import StandingsScreen from '@/ui/screens/StandingsScreen.js';

const App: React.FC = () => {
	const viewMode = useAppStore((state) => state.viewMode);

	return viewMode === 'standings' ? (
		<StandingsScreen />
	) : viewMode === 'players' ? (
		<PlayersScreen />
	) : (
		<GamesScreen />
	);
};

export default App;
