import { useInput } from "ink";
import type { GameListItem } from "../data/api/client.js";
import { queryKeys } from "../data/query/keys.js";
import { queryClient } from "../data/query/queryClient.js";
import type { FocusedPane } from "../state/useAppStore.js";

type KeyBindingsConfig = {
  focusedPane: FocusedPane;
  detailTab: string;
  games: GameListItem[];
  listCursorIndex: number;
  pageCursor: string | null;
  selectedGameId: string | null;
  data: { nextCursor?: string | null } | null;
  limit: number;
  playsCount: number;
  onQuit: () => void;
  moveCursor: (delta: number, max: number) => void;
  selectGame: (id: string | null) => void;
  setFocusedPane: (pane: FocusedPane) => void;
  setPageCursor: (cursor: string | null) => void;
  setDetailTab: (tab: "stats" | "plays") => void;
  movePlaysScroll: (delta: number, max: number) => void;
  togglePlaysSortOrder: () => void;
};

export const useKeyBindings = (config: KeyBindingsConfig) => {
  const {
    focusedPane,
    detailTab,
    games,
    listCursorIndex,
    pageCursor,
    selectedGameId,
    data,
    limit,
    playsCount,
    onQuit,
    moveCursor,
    selectGame,
    setFocusedPane,
    setPageCursor,
    setDetailTab,
    movePlaysScroll,
    togglePlaysSortOrder,
  } = config;

  const resolveCursorDate = (value: string | null) => {
    const base = value ? new Date(value) : new Date();
    return Number.isNaN(base.getTime()) ? new Date() : base;
  };

  useInput((input, key) => {
    if (input.toLowerCase() === "q" || (key.ctrl && input === "c")) {
      onQuit();
      return;
    }

    if (key.escape) {
      setFocusedPane("list");
      return;
    }

    if (input === "\t" || key.tab) {
      setFocusedPane(focusedPane === "list" ? "detail" : "list");
      return;
    }

    if (input === "r") {
      queryClient.invalidate(queryKeys.gamesList(pageCursor, limit));
      if (selectedGameId) queryClient.invalidate(queryKeys.gameDetail(selectedGameId));
      return;
    }

    if (input === "1") {
      setDetailTab("stats");
      return;
    }
    if (input === "2") {
      setDetailTab("plays");
      return;
    }

    if (focusedPane === "list") {
      if (input === "j" || key.downArrow) {
        moveCursor(1, Math.max(0, games.length - 1));
        return;
      }
      if (input === "k" || key.upArrow) {
        moveCursor(-1, Math.max(0, games.length - 1));
        return;
      }
      if (key.return) {
        const item = games[listCursorIndex];
        if (item) {
          selectGame(item.id);
          setFocusedPane("detail");
        }
        return;
      }
      if (key.leftArrow) {
        const current = resolveCursorDate(pageCursor);
        const prev = new Date(current);
        prev.setDate(prev.getDate() - 1);
        setPageCursor(prev.toISOString().slice(0, 10));
        return;
      }
      if (key.rightArrow && data?.nextCursor) {
        setPageCursor(data.nextCursor);
        return;
      }
    }

    if (focusedPane === "detail") {
      if (input === "h" || key.leftArrow) {
        setFocusedPane("list");
        return;
      }
      if (input === "s") {
        togglePlaysSortOrder();
        return;
      }
      if (detailTab === "plays" && playsCount > 0) {
        if (input === "j" || key.downArrow) {
          movePlaysScroll(1, playsCount - 1);
          return;
        }
        if (input === "k" || key.upArrow) {
          movePlaysScroll(-1, playsCount - 1);
          return;
        }
      }
    }
  });
};
