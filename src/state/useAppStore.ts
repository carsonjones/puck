import { create } from 'zustand';
import {
  initialAppNavigationState,
  standingsViewModes,
  type AppNavigationState,
  type DetailTab,
  type FocusedPane,
  type GameStatus,
  type PlayerDetailTab,
  type PlaysSortOrder,
  type PreviousStandingsState,
  type StandingsConference,
  type StandingsDetailTab,
  type StandingsDivision,
  type StandingsTab,
  type StandingsViewMode,
  type ViewMode,
} from '@/shared/appState.js';
import { clampIndex } from '@/utils/indexUtils.js';

export type {
  AppNavigationState,
  DetailTab,
  FocusedPane,
  GameStatus,
  PlayerDetailTab,
  PlaysSortOrder,
  PreviousStandingsState,
  StandingsConference,
  StandingsDetailTab,
  StandingsDivision,
  StandingsTab,
  StandingsViewMode,
  ViewMode,
} from '@/shared/appState.js';

interface AppState extends AppNavigationState {
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
  setPreviousStandingsState: (state: PreviousStandingsState | null) => void;
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
  ...initialAppNavigationState,
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
    const current = get().standingsViewMode;
    const currentIndex = standingsViewModes.indexOf(current);
    const nextIndex = (currentIndex + 1) % standingsViewModes.length;
    set({ standingsViewMode: standingsViewModes[nextIndex] });
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
