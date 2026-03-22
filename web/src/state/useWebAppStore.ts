import { create } from 'zustand';

type WebAppState = {
  gamesReloadKey: number;
  detailReloadKey: number;
  standingsReloadKey: number;
  selectedStandingsTeamAbbrev: string | null;
  refreshGames: () => void;
  refreshSelectedGame: () => void;
  refreshStandings: () => void;
  setSelectedStandingsTeamAbbrev: (teamAbbrev: string | null) => void;
};

export const useWebAppStore = create<WebAppState>((set) => ({
  gamesReloadKey: 0,
  detailReloadKey: 0,
  standingsReloadKey: 0,
  selectedStandingsTeamAbbrev: null,
  refreshGames: () => set((state) => ({ gamesReloadKey: state.gamesReloadKey + 1 })),
  refreshSelectedGame: () => set((state) => ({ detailReloadKey: state.detailReloadKey + 1 })),
  refreshStandings: () => set((state) => ({ standingsReloadKey: state.standingsReloadKey + 1 })),
  setSelectedStandingsTeamAbbrev: (teamAbbrev) => set({ selectedStandingsTeamAbbrev: teamAbbrev }),
}));
