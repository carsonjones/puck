import { create } from 'zustand';
import { getSearchParamsState, shiftDate, type DetailTab } from '../helpers.js';

type WebAppState = {
  cursor: string | null;
  selectedGameId: string | null;
  detailTab: DetailTab;
  gamesReloadKey: number;
  detailReloadKey: number;
  setCursor: (cursor: string | null) => void;
  setSelectedGameId: (gameId: string | null) => void;
  setDetailTab: (tab: DetailTab) => void;
  hydrateFromUrl: () => void;
  refreshGames: () => void;
  refreshSelectedGame: () => void;
  goToDay: (nextCursor: string) => void;
  goToNextDay: () => void;
  goToPreviousDay: () => void;
  goToToday: () => void;
};

const initialUrlState = getSearchParamsState();

export const useWebAppStore = create<WebAppState>((set, get) => ({
  cursor: initialUrlState.cursor,
  selectedGameId: initialUrlState.selectedGameId,
  detailTab: 'stats',
  gamesReloadKey: 0,
  detailReloadKey: 0,
  setCursor: (cursor) => set({ cursor }),
  setSelectedGameId: (selectedGameId) => set({ selectedGameId }),
  setDetailTab: (detailTab) => set({ detailTab }),
  hydrateFromUrl: () => {
    const nextState = getSearchParamsState();
    set({
      cursor: nextState.cursor,
      selectedGameId: nextState.selectedGameId,
    });
  },
  refreshGames: () => set((state) => ({ gamesReloadKey: state.gamesReloadKey + 1 })),
  refreshSelectedGame: () => set((state) => ({ detailReloadKey: state.detailReloadKey + 1 })),
  goToDay: (nextCursor) => {
    set({
      cursor: nextCursor,
      selectedGameId: null,
    });
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', `${window.location.pathname}?date=${nextCursor}`);
    }
  },
  goToNextDay: () => {
    const { cursor } = get();
    const nextCursor = shiftDate(cursor, 1);
    get().goToDay(nextCursor);
  },
  goToPreviousDay: () => {
    const { cursor } = get();
    const nextCursor = shiftDate(cursor, -1);
    get().goToDay(nextCursor);
  },
  goToToday: () => {
    set({
      cursor: null,
      selectedGameId: null,
    });
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', window.location.pathname);
    }
  },
}));
