import { create } from 'zustand';

type WebAppState = {
  gamesReloadKey: number;
  detailReloadKey: number;
  refreshGames: () => void;
  refreshSelectedGame: () => void;
};

export const useWebAppStore = create<WebAppState>((set, get) => ({
  gamesReloadKey: 0,
  detailReloadKey: 0,
  refreshGames: () => set((state) => ({ gamesReloadKey: state.gamesReloadKey + 1 })),
  refreshSelectedGame: () => set((state) => ({ detailReloadKey: state.detailReloadKey + 1 })),
}));
