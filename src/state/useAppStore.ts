import { create } from 'zustand';
import { clampIndex } from '@/utils/indexUtils.js';

export type FocusedPane = 'list' | 'detail';
export type DetailTab = 'stats' | 'plays' | 'players';
export type PlaysSortOrder = 'asc' | 'desc';
export type GameStatus = 'scheduled' | 'in_progress' | 'final';
export type ViewMode = 'games' | 'standings' | 'players';
export type PlayerDetailTab = 'season' | 'games' | 'bio';
export type StandingsTab = 'league' | 'conference' | 'division';
export type StandingsDetailTab = 'info' | 'players';
export type StandingsConference = 'eastern' | 'western';
export type StandingsDivision = 'atlantic' | 'metropolitan' | 'central' | 'pacific';
export type StandingsViewMode = 'all' | 'home' | 'road';

interface AppState {
	focusedPane: FocusedPane;
	selectedGameId: string | null;
	listCursorIndex: number;
	pageCursor: string | null;
	detailTab: DetailTab;
	playsScrollIndex: number;
	playsSortOrder: PlaysSortOrder;
	playersTeamTab: 'away' | 'home';
	playersScrollIndex: number;
	viewMode: ViewMode;
	standingsTab: StandingsTab;
	standingsCursorIndex: number;
	standingsDetailTab: StandingsDetailTab;
	standingsPlayersScrollIndex: number;
	standingsConference: StandingsConference;
	standingsDivision: StandingsDivision;
	standingsViewMode: StandingsViewMode;
	playersCursorIndex: number;
	selectedPlayerId: number | null;
	playerDetailTab: PlayerDetailTab;
	playerDetailScrollIndex: number;
	previousStandingsState: {
		teamAbbrev: string | null;
		playerIndex: number;
	} | null;
	teamSearchOpen: boolean;
	teamSearchQuery: string;
	teamSearchCursorIndex: number;
	gameTeamFilter: string | null;
	playerFilter: number | null;
	pendingTeamNavigation: string | null;
	setFocusedPane: (pane: FocusedPane) => void;
	moveCursor: (delta: number, maxIndex?: number) => void;
	selectGame: (id: string | null, status?: GameStatus) => void;
	setPageCursor: (cursor: string | null) => void;
	setDetailTab: (tab: DetailTab) => void;
	movePlaysScroll: (delta: number, maxIndex?: number) => void;
	togglePlaysSortOrder: () => void;
	setPlayersTeamTab: (tab: 'away' | 'home') => void;
	movePlayersScroll: (delta: number, maxIndex?: number) => void;
	setViewMode: (mode: ViewMode) => void;
	setStandingsTab: (tab: StandingsTab) => void;
	moveStandingsCursor: (delta: number, maxIndex?: number) => void;
	setStandingsDetailTab: (tab: StandingsDetailTab) => void;
	moveStandingsPlayersScroll: (delta: number, maxIndex?: number) => void;
	setStandingsConference: (conf: StandingsConference) => void;
	setStandingsDivision: (div: StandingsDivision) => void;
	cycleStandingsViewMode: () => void;
	movePlayersCursor: (delta: number, maxIndex?: number) => void;
	selectPlayer: (id: number | null) => void;
	setPlayerDetailTab: (tab: PlayerDetailTab) => void;
	movePlayerDetailScroll: (delta: number, maxIndex?: number) => void;
	setPreviousStandingsState: (
		state: { teamAbbrev: string | null; playerIndex: number } | null,
	) => void;
	openTeamSearch: () => void;
	closeTeamSearch: () => void;
	setTeamSearchQuery: (query: string) => void;
	moveTeamSearchCursor: (delta: number, maxIndex?: number) => void;
	setGameTeamFilter: (abbrev: string | null) => void;
	setPlayerFilter: (playerId: number | null) => void;
	resetTeamSearch: () => void;
	navigateToTeamInStandings: (teamAbbrev: string) => void;
	clearPendingTeamNavigation: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
	focusedPane: 'list',
	selectedGameId: null,
	listCursorIndex: 0,
	pageCursor: null,
	detailTab: 'stats',
	playsScrollIndex: 0,
	playsSortOrder: 'asc',
	playersTeamTab: 'away',
	playersScrollIndex: 0,
	viewMode: 'games',
	standingsTab: 'league',
	standingsCursorIndex: 0,
	standingsDetailTab: 'players',
	standingsPlayersScrollIndex: 0,
	standingsConference: 'eastern',
	standingsDivision: 'atlantic',
	standingsViewMode: 'all',
	playersCursorIndex: 0,
	selectedPlayerId: null,
	playerDetailTab: 'season',
	playerDetailScrollIndex: 0,
	previousStandingsState: null,
	teamSearchOpen: false,
	teamSearchQuery: '',
	teamSearchCursorIndex: 0,
	gameTeamFilter: null,
	playerFilter: null,
	pendingTeamNavigation: null,
	setFocusedPane: (pane) => set({ focusedPane: pane }),
	moveCursor: (delta, maxIndex) => {
		set({ listCursorIndex: clampIndex(get().listCursorIndex, delta, maxIndex) });
	},
	selectGame: (id, status) => {
		if (id === null) {
			set({ selectedGameId: null });
			return;
		}
		const sortOrder = status === 'in_progress' ? 'desc' : 'asc';
		set({ selectedGameId: id, playsSortOrder: sortOrder, playersScrollIndex: 0 });
	},
	setPageCursor: (cursor) => set({ pageCursor: cursor }),
	setDetailTab: (tab) => set({ detailTab: tab, playersScrollIndex: 0 }),
	movePlaysScroll: (delta, maxIndex) => {
		set({ playsScrollIndex: clampIndex(get().playsScrollIndex, delta, maxIndex) });
	},
	togglePlaysSortOrder: () => {
		const current = get().playsSortOrder;
		set({ playsSortOrder: current === 'asc' ? 'desc' : 'asc', playsScrollIndex: 0 });
	},
	setPlayersTeamTab: (tab) => set({ playersTeamTab: tab, playersScrollIndex: 0 }),
	movePlayersScroll: (delta, maxIndex) => {
		set({ playersScrollIndex: clampIndex(get().playersScrollIndex, delta, maxIndex) });
	},
	setViewMode: (mode) => set({ viewMode: mode, focusedPane: 'list' }),
	setStandingsTab: (tab) => set({ standingsTab: tab, standingsCursorIndex: 0 }),
	moveStandingsCursor: (delta, maxIndex) => {
		set({ standingsCursorIndex: clampIndex(get().standingsCursorIndex, delta, maxIndex) });
	},
	setStandingsConference: (conf) => set({ standingsConference: conf, standingsCursorIndex: 0 }),
	setStandingsDivision: (div) => set({ standingsDivision: div, standingsCursorIndex: 0 }),
	cycleStandingsViewMode: () => {
		const modes: StandingsViewMode[] = ['all', 'home', 'road'];
		const current = get().standingsViewMode;
		const currentIndex = modes.indexOf(current);
		const nextIndex = (currentIndex + 1) % modes.length;
		set({ standingsViewMode: modes[nextIndex] });
	},
	setStandingsDetailTab: (tab) => set({ standingsDetailTab: tab, standingsPlayersScrollIndex: 0 }),
	moveStandingsPlayersScroll: (delta, maxIndex) => {
		set({
			standingsPlayersScrollIndex: clampIndex(get().standingsPlayersScrollIndex, delta, maxIndex),
		});
	},
	movePlayersCursor: (delta, maxIndex) => {
		set({ playersCursorIndex: clampIndex(get().playersCursorIndex, delta, maxIndex) });
	},
	selectPlayer: (id) => set({ selectedPlayerId: id, playerDetailScrollIndex: 0 }),
	setPlayerDetailTab: (tab) => set({ playerDetailTab: tab, playerDetailScrollIndex: 0 }),
	movePlayerDetailScroll: (delta, maxIndex) => {
		set({ playerDetailScrollIndex: clampIndex(get().playerDetailScrollIndex, delta, maxIndex) });
	},
	setPreviousStandingsState: (state) => set({ previousStandingsState: state }),
	openTeamSearch: () =>
		set({ teamSearchOpen: true, teamSearchQuery: '', teamSearchCursorIndex: 0 }),
	closeTeamSearch: () => set({ teamSearchOpen: false }),
	setTeamSearchQuery: (query) => set({ teamSearchQuery: query, teamSearchCursorIndex: 0 }),
	moveTeamSearchCursor: (delta, maxIndex) => {
		set({ teamSearchCursorIndex: clampIndex(get().teamSearchCursorIndex, delta, maxIndex) });
	},
	setGameTeamFilter: (abbrev) => set({ gameTeamFilter: abbrev }),
	setPlayerFilter: (playerId) => set({ playerFilter: playerId }),
	resetTeamSearch: () =>
		set({ teamSearchOpen: false, teamSearchQuery: '', teamSearchCursorIndex: 0 }),
	navigateToTeamInStandings: (teamAbbrev) =>
		set({ viewMode: 'standings', pendingTeamNavigation: teamAbbrev, focusedPane: 'detail' }),
	clearPendingTeamNavigation: () => set({ pendingTeamNavigation: null }),
}));
