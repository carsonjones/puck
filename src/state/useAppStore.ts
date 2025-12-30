import { create } from "zustand";

export type FocusedPane = "list" | "detail";
export type DetailTab = "stats" | "plays" | "players";
export type PlaysSortOrder = "asc" | "desc";
export type GameStatus = "scheduled" | "in_progress" | "final";

interface AppState {
  focusedPane: FocusedPane;
  selectedGameId: string | null;
  listCursorIndex: number;
  pageCursor: string | null;
  detailTab: DetailTab;
  playsScrollIndex: number;
  playsSortOrder: PlaysSortOrder;
  setFocusedPane: (pane: FocusedPane) => void;
  moveCursor: (delta: number, maxIndex?: number) => void;
  selectGame: (id: string | null, status?: GameStatus) => void;
  setPageCursor: (cursor: string | null) => void;
  setDetailTab: (tab: DetailTab) => void;
  movePlaysScroll: (delta: number, maxIndex?: number) => void;
  togglePlaysSortOrder: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  focusedPane: "list",
  selectedGameId: null,
  listCursorIndex: 0,
  pageCursor: null,
  detailTab: "stats",
  playsScrollIndex: 0,
  playsSortOrder: "asc",
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
    const sortOrder = status === "in_progress" ? "asc" : "desc";
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
}));
