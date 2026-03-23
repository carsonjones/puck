import { useEffect } from 'react';
import type { StandingListItem } from '@/data/api/client';
import type { StandingsDetailTab } from '@web/components/StandingsDetailPane';
import type { StandingsConference, StandingsDivision, StandingsTab } from '@web/helpers';

type UseStandingsHotkeysOptions = {
  items: StandingListItem[];
  selectedTeamAbbrev: string | null;
  setSelectedTeamAbbrev: (teamAbbrev: string | null) => void;
  tab: StandingsTab;
  setTab: (tab: StandingsTab) => void;
  scope: StandingsConference | StandingsDivision | null;
  setPreviousScope: () => void;
  setNextScope: () => void;
  refreshStandings: () => void;
  navigateToGames: () => void;
  navigateToPlayers: () => void;
  detailTab?: StandingsDetailTab;
};

export function useStandingsHotkeys({
  items,
  selectedTeamAbbrev,
  setSelectedTeamAbbrev,
  setTab,
  setPreviousScope,
  setNextScope,
  refreshStandings,
  navigateToGames,
  navigateToPlayers,
  detailTab,
}: UseStandingsHotkeysOptions) {
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

      if (event.key === 'g') {
        event.preventDefault();
        navigateToGames();
        return;
      }

      if (event.key === 'p') {
        event.preventDefault();
        navigateToPlayers();
        return;
      }

      if ((event.key === 'j' || event.key === 'ArrowDown' || event.key === 'k' || event.key === 'ArrowUp') && detailTab === 'schedule') {
        return; // schedule tab handles its own navigation
      }

      if (event.key === 'j' || event.key === 'ArrowDown') {
        event.preventDefault();
        const currentIndex = items.findIndex((team) => team.teamAbbrev === selectedTeamAbbrev);
        const nextIndex = currentIndex < 0 ? 0 : Math.min(currentIndex + 1, items.length - 1);
        const nextTeam = items[nextIndex];
        if (nextTeam) {
          setSelectedTeamAbbrev(nextTeam.teamAbbrev);
        }
        return;
      }

      if (event.key === 'k' || event.key === 'ArrowUp') {
        event.preventDefault();
        const currentIndex = items.findIndex((team) => team.teamAbbrev === selectedTeamAbbrev);
        const nextIndex = currentIndex < 0 ? 0 : Math.max(currentIndex - 1, 0);
        const nextTeam = items[nextIndex];
        if (nextTeam) {
          setSelectedTeamAbbrev(nextTeam.teamAbbrev);
        }
        return;
      }

      if (event.key === 'h' || event.key === 'ArrowLeft') {
        event.preventDefault();
        setPreviousScope();
        return;
      }

      if (event.key === 'l' || event.key === 'ArrowRight') {
        event.preventDefault();
        setNextScope();
        return;
      }

      if (event.key === 'r') {
        event.preventDefault();
        refreshStandings();
        return;
      }

      if (event.key === '1') {
        event.preventDefault();
        setTab('league');
        return;
      }

      if (event.key === '2') {
        event.preventDefault();
        setTab('conference');
        return;
      }

      if (event.key === '3') {
        event.preventDefault();
        setTab('division');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [
    detailTab,
    items,
    navigateToGames,
    navigateToPlayers,
    refreshStandings,
    selectedTeamAbbrev,
    setNextScope,
    setPreviousScope,
    setSelectedTeamAbbrev,
    setTab,
  ]);
}
