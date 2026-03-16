import { useEffect } from 'react';
import type { GameListItem } from '@/data/api/client';
import type { DetailTab } from '@web/helpers';

type UseGameHotkeysOptions = {
  games: GameListItem[];
  selectedGameId: string | null;
  setSelectedGameId: (gameId: string | null) => void;
  setDetailTab: (tab: DetailTab) => void;
  goToToday: () => void;
  goToNextDay: () => void;
  goToPreviousDay: () => void;
  refreshGames: () => void;
  refreshSelectedGame: () => void;
  navigateToStandings: () => void;
};

export const useGameHotkeys = ({
  games,
  selectedGameId,
  setSelectedGameId,
  setDetailTab,
  goToToday,
  goToNextDay,
  goToPreviousDay,
  refreshGames,
  refreshSelectedGame,
  navigateToStandings,
}: UseGameHotkeysOptions) => {

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }

      if (event.key === 'j' || event.key === 'ArrowDown') {
        event.preventDefault();
        const currentIndex = games.findIndex((game) => game.id === selectedGameId);
        const nextIndex = currentIndex < 0 ? 0 : Math.min(currentIndex + 1, games.length - 1);
        const nextGame = games[nextIndex];
        if (nextGame) {
          setSelectedGameId(nextGame.id);
        }
        return;
      }

      if (event.key === 'k' || event.key === 'ArrowUp') {
        event.preventDefault();
        const currentIndex = games.findIndex((game) => game.id === selectedGameId);
        const nextIndex = currentIndex < 0 ? 0 : Math.max(currentIndex - 1, 0);
        const nextGame = games[nextIndex];
        if (nextGame) {
          setSelectedGameId(nextGame.id);
        }
        return;
      }

      if (event.key === 't') {
        event.preventDefault();
        goToToday();
        return;
      }

      if (event.key === 'l' || event.key === 'ArrowRight' || event.key === 'n') {
        event.preventDefault();
        goToNextDay();
        return;
      }

      if (event.key === 'h' || event.key === 'ArrowLeft' || event.key === 'p') {
        event.preventDefault();
        goToPreviousDay();
        return;
      }

      if (event.key === 'r') {
        event.preventDefault();
        refreshGames();
        refreshSelectedGame();
        return;
      }

      if (event.key === 's') {
        event.preventDefault();
        navigateToStandings();
        return;
      }

      if (event.key === '1') {
        event.preventDefault();
        setDetailTab('stats');
        return;
      }

      if (event.key === '2') {
        event.preventDefault();
        setDetailTab('plays');
        return;
      }

      if (event.key === '3') {
        event.preventDefault();
        setDetailTab('players');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [
    games,
    goToNextDay,
    goToPreviousDay,
    goToToday,
    navigateToStandings,
    refreshGames,
    refreshSelectedGame,
    selectedGameId,
    setDetailTab,
    setSelectedGameId,
  ]);
};
