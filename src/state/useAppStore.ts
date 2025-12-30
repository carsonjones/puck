import { create } from "zustand";

export type FocusedPane = "list" | "detail";
export type DetailTab = "stats" | "plays" | "players";
export type PlaysSortOrder = "asc" | "desc";
export type GameStatus = "scheduled" | "in_progress" | "final";
export type ViewMode = "games" | "standings";
export type StandingsTab = "league" | "conference" | "division";
export type StandingsConference = "eastern" | "western";
export type StandingsDivision = "atlantic" | "metropolitan" | "central" | "pacific";

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
  standingsConference: StandingsConference;
  standingsDivision: StandingsDivision;
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
  setStandingsConference: (conf: StandingsConference) => void;
  setStandingsDivision: (div: StandingsDivision) => void;
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
  standingsConference: "eastern",
  standingsDivision: "atlantic",
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
}));
