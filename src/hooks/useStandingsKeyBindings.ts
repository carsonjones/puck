import { useInput } from 'ink';
import type { StandingListItem } from '@/data/api/client.js';
import { queryKeys } from '@/data/query/keys.js';
import { queryClient } from '@/data/query/queryClient.js';
import {
	type FocusedPane,
	type StandingsConference,
	type StandingsDivision,
	type StandingsTab,
	useAppStore,
} from '@/state/useAppStore.js';

type StandingsKeyBindingsConfig = {
	focusedPane: FocusedPane;
	items: StandingListItem[];
	standingsCursorIndex: number;
	standingsTab: StandingsTab;
	standingsConference: StandingsConference;
	standingsDivision: StandingsDivision;
	standingsPlayersScrollIndex: number;
	selectedTeam: StandingListItem | null;
	rosterLoading: boolean;
	rosterCount: number;
	allRoster: Array<{ id: number }>;
	onQuit: () => void;
	onInteraction?: () => void;
};

export const useStandingsKeyBindings = (config: StandingsKeyBindingsConfig) => {
	const {
		focusedPane,
		items,
		standingsTab,
		standingsConference,
		standingsDivision,
		standingsPlayersScrollIndex,
		selectedTeam,
		rosterLoading,
		rosterCount,
		allRoster,
		onQuit,
		onInteraction,
	} = config;

	useInput((input, key) => {
		onInteraction?.();

		const {
			teamSearchOpen,
			openTeamSearch,
			setViewMode,
			setFocusedPane,
			moveStandingsCursor,
			setStandingsTab,
			setStandingsConference,
			setStandingsDivision,
			cycleStandingsViewMode,
			moveStandingsPlayersScroll,
			selectPlayer,
			setPlayerFilter,
			setPreviousStandingsState,
		} = useAppStore.getState();

		// Team search modal check
		if (teamSearchOpen) return;

		// Team search modal trigger
		if (input === '/' || (key.ctrl && input === 't')) {
			openTeamSearch();
			return;
		}

		// Global: Quit
		if (input.toLowerCase() === 'q' || (key.ctrl && input === 'c')) {
			onQuit();
			return;
		}

		// Global: View switching
		if (input === 'g') {
			setViewMode('games');
			return;
		}
		if (input === 's') {
			setViewMode('standings');
			return;
		}
		if (input === 'p') {
			setViewMode('players');
			return;
		}

		// Pane switching
		if (key.escape) {
			setFocusedPane('list');
			return;
		}
		if (input === '\t' || key.tab) {
			if (focusedPane === 'list') {
				// Cycle through subtabs when in list pane
				if (standingsTab === 'conference') {
					setStandingsConference(standingsConference === 'eastern' ? 'western' : 'eastern');
					return;
				} else if (standingsTab === 'division') {
					const divs: StandingsDivision[] = ['atlantic', 'metropolitan', 'central', 'pacific'];
					const idx = divs.indexOf(standingsDivision);
					const nextIdx = key.shift
						? (idx - 1 + divs.length) % divs.length
						: (idx + 1) % divs.length;
					const nextDiv = divs[nextIdx];
					if (nextDiv) setStandingsDivision(nextDiv);
					return;
				}
				// League tab: switch to detail pane
				setFocusedPane('detail');
				return;
			} else {
				// In detail pane: cycle through detail tabs
				const { standingsDetailTab, setStandingsDetailTab } = useAppStore.getState();
				setStandingsDetailTab(standingsDetailTab === 'players' ? 'info' : 'players');
				return;
			}
		}

		// Refresh
		if (input === 'r') {
			queryClient.invalidate(queryKeys.standings());
			return;
		}

		// Toggle view mode
		if (input === 'v') {
			cycleStandingsViewMode();
			return;
		}

		// Tab switching
		if (input === '1') {
			setStandingsTab('league');
			return;
		}
		if (input === '2') {
			setStandingsTab('conference');
			return;
		}
		if (input === '3') {
			setStandingsTab('division');
			return;
		}

		// List navigation
		if (focusedPane === 'list') {
			if (input === 'j' || key.downArrow) {
				moveStandingsCursor(1, Math.max(0, items.length - 1));
				return;
			}
			if (input === 'k' || key.upArrow) {
				moveStandingsCursor(-1, Math.max(0, items.length - 1));
				return;
			}
			if (input === 'l' || key.rightArrow || key.return) {
				setFocusedPane('detail');
				return;
			}
		}

		// Detail navigation
		if (focusedPane === 'detail') {
			if (input === 'h' || key.leftArrow) {
				setFocusedPane('list');
				return;
			}

			if (selectedTeam) {
				if (input === 'j' || key.downArrow) {
					moveStandingsPlayersScroll(1, 999);
					return;
				}
				if (input === 'k' || key.upArrow) {
					moveStandingsPlayersScroll(-1);
					return;
				}
				if (key.return) {
					// Don't navigate if roster not loaded
					if (rosterLoading || rosterCount === 0) return;

					const selectedPlayer = allRoster[standingsPlayersScrollIndex];
					if (selectedPlayer) {
						setPreviousStandingsState({
							teamAbbrev: selectedTeam.teamAbbrev,
							playerIndex: standingsPlayersScrollIndex,
						});
						selectPlayer(selectedPlayer.id);
						setPlayerFilter(selectedPlayer.id);
						setFocusedPane('detail');
						setViewMode('players');
					}
					return;
				}
			}
		}
	});
};
