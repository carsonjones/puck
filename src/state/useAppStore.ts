import { create } from "zustand";

export type FocusedPane = "list" | "detail";
export type DetailTab = "stats" | "plays" | "players";
export type PlaysSortOrder = "asc" | "desc";
export type GameStatus = "scheduled" | "in_progress" | "final";
export type ViewMode = "games" | "standings" | "players";
export type PlayerDetailTab = "season" | "games" | "bio";
export type StandingsTab = "league" | "conference" | "division";
export type StandingsDetailTab = "info" | "players";
export type StandingsConference = "eastern" | "western";
export type StandingsDivision = "atlantic" | "metropolitan" | "central" | "pacific";
export type StandingsViewMode = "all" | "home" | "road";

interface AppState {
  focusedPane: FocusedPane;
  selectedGameId: string | null;
  listCursorIndex: number;
  pageCursor: string | null;
  detailTab: DetailTab;
  playsScrollIndex: number;
  playsSortOrder: PlaysSortOrder;
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
  setFocusedPane: (pane: FocusedPane) => void;
  moveCursor: (delta: number, maxIndex?: number) => void;
  selectGame: (id: string | null, status?: GameStatus) => void;
  setPageCursor: (cursor: string | null) => void;
  setDetailTab: (tab: DetailTab) => void;
  movePlaysScroll: (delta: number, maxIndex?: number) => void;
  togglePlaysSortOrder: () => void;
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
  setPreviousStandingsState: (state: { teamAbbrev: string | null; playerIndex: number } | null) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  focusedPane: "list",
  selectedGameId: null,
  listCursorIndex: 0,
  pageCursor: null,
  detailTab: "stats",
  playsScrollIndex: 0,
  playsSortOrder: "asc",
  viewMode: "games",
  standingsTab: "league",
  standingsCursorIndex: 0,
  standingsDetailTab: "info",
  standingsPlayersScrollIndex: 0,
  standingsConference: "eastern",
  standingsDivision: "atlantic",
  standingsViewMode: "all",
  playersCursorIndex: 0,
  selectedPlayerId: null,
  playerDetailTab: "season",
  playerDetailScrollIndex: 0,
  previousStandingsState: null,
  setFocusedPane: (pane) => set({ focusedPane: pane }),
  moveCursor: (delta, maxIndex) => {
    const nextIndex = get().listCursorIndex + delta;
    const clamped =
      typeof maxIndex === "number"
        ? Math.max(0, Math.min(maxIndex, nextIndex))
        : Math.max(0, nextIndex);
    set({ listCursorIndex: clamped });
  },
  selectGame: (id, status) => {
    if (id === null) {
      set({ selectedGameId: null });
      return;
    }
    const sortOrder = status === "in_progress" ? "desc" : "asc";
    set({ selectedGameId: id, playsSortOrder: sortOrder });
  },
  setPageCursor: (cursor) => set({ pageCursor: cursor }),
  setDetailTab: (tab) => set({ detailTab: tab }),
  movePlaysScroll: (delta, maxIndex) => {
    const nextIndex = get().playsScrollIndex + delta;
    const clamped =
      typeof maxIndex === "number"
        ? Math.max(0, Math.min(maxIndex, nextIndex))
        : Math.max(0, nextIndex);
    set({ playsScrollIndex: clamped });
  },
  togglePlaysSortOrder: () => {
    const current = get().playsSortOrder;
    set({ playsSortOrder: current === "asc" ? "desc" : "asc", playsScrollIndex: 0 });
  },
  setViewMode: (mode) => set({ viewMode: mode }),
  setStandingsTab: (tab) => set({ standingsTab: tab, standingsCursorIndex: 0 }),
  moveStandingsCursor: (delta, maxIndex) => {
    const nextIndex = get().standingsCursorIndex + delta;
    const clamped =
      typeof maxIndex === "number"
        ? Math.max(0, Math.min(maxIndex, nextIndex))
        : Math.max(0, nextIndex);
    set({ standingsCursorIndex: clamped });
  },
  setStandingsConference: (conf) => set({ standingsConference: conf, standingsCursorIndex: 0 }),
  setStandingsDivision: (div) => set({ standingsDivision: div, standingsCursorIndex: 0 }),
  cycleStandingsViewMode: () => {
    const modes: StandingsViewMode[] = ["all", "home", "road"];
    const current = get().standingsViewMode;
    const currentIndex = modes.indexOf(current);
    const nextIndex = (currentIndex + 1) % modes.length;
    set({ standingsViewMode: modes[nextIndex] });
  },
  setStandingsDetailTab: (tab) => set({ standingsDetailTab: tab, standingsPlayersScrollIndex: 0 }),
  moveStandingsPlayersScroll: (delta, maxIndex) => {
    const nextIndex = get().standingsPlayersScrollIndex + delta;
    const clamped =
      typeof maxIndex === "number"
        ? Math.max(0, Math.min(maxIndex, nextIndex))
        : Math.max(0, nextIndex);
    set({ standingsPlayersScrollIndex: clamped });
  },
  movePlayersCursor: (delta, maxIndex) => {
    const nextIndex = get().playersCursorIndex + delta;
    const clamped =
      typeof maxIndex === "number"
        ? Math.max(0, Math.min(maxIndex, nextIndex))
        : Math.max(0, nextIndex);
    set({ playersCursorIndex: clamped });
  },
  selectPlayer: (id) => set({ selectedPlayerId: id, playerDetailScrollIndex: 0 }),
  setPlayerDetailTab: (tab) => set({ playerDetailTab: tab, playerDetailScrollIndex: 0 }),
  movePlayerDetailScroll: (delta, maxIndex) => {
    const nextIndex = get().playerDetailScrollIndex + delta;
    const clamped =
      typeof maxIndex === "number"
        ? Math.max(0, Math.min(maxIndex, nextIndex))
        : Math.max(0, nextIndex);
    set({ playerDetailScrollIndex: clamped });
  },
  setPreviousStandingsState: (state) => set({ previousStandingsState: state }),
}));
