import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { fetchStandings } from '@web/api';
import { Head } from '@web/components/Head';
import { Layout } from '@web/components/Layout';
import { StandingsDetailPane } from '@web/components/StandingsDetailPane';
import { StandingsListPane } from '@web/components/StandingsListPane';
import {
  getStandingsItems,
  normalizeStandingsScope,
  normalizeStandingsTab,
  standingsDivisions,
  standingsHeader,
  type StandingsConference,
  type StandingsDivision,
  type StandingsTab,
} from '@web/helpers';
import { useStandingsHotkeys } from '@web/hooks/useStandingsHotkeys';
import { useWebAppStore } from '@web/state/useWebAppStore';

export function StandingsRoute() {
  const navigate = useNavigate();
  const params = useParams();
  const standingsReloadKey = useWebAppStore((s) => s.standingsReloadKey);
  const refreshStandings = useWebAppStore((s) => s.refreshStandings);
  const selectedStandingsTeamAbbrev = useWebAppStore((s) => s.selectedStandingsTeamAbbrev);
  const setSelectedStandingsTeamAbbrev = useWebAppStore((s) => s.setSelectedStandingsTeamAbbrev);

  const tab = normalizeStandingsTab(params.tab);
  const scope = normalizeStandingsScope(tab, params.scope);

  const standingsQuery = useQuery({
    queryKey: ['standings', standingsReloadKey],
    queryFn: fetchStandings,
    staleTime: 300_000,
    refetchInterval: 300_000,
    refetchIntervalInBackground: false,
  });

  const items = useMemo(
    () => getStandingsItems(standingsQuery.data, tab, scope),
    [scope, standingsQuery.data, tab],
  );

  const selectedTeam = useMemo(
    () =>
      items.find((team) => team.teamAbbrev === selectedStandingsTeamAbbrev) ??
      items[0] ??
      null,
    [items, selectedStandingsTeamAbbrev],
  );

  useEffect(() => {
    if (!selectedTeam) {
      return;
    }

    if (selectedStandingsTeamAbbrev !== selectedTeam.teamAbbrev) {
      setSelectedStandingsTeamAbbrev(selectedTeam.teamAbbrev);
    }
  }, [selectedStandingsTeamAbbrev, selectedTeam, setSelectedStandingsTeamAbbrev]);

  const setTab = (nextTab: StandingsTab) => {
    if (nextTab === 'conference') {
      navigate('/standings/conference/eastern');
      return;
    }

    if (nextTab === 'division') {
      navigate('/standings/division/atlantic');
      return;
    }

    navigate('/standings/league');
  };

  const setScope = (nextScope: StandingsConference | StandingsDivision) => {
    if (tab === 'conference' && (nextScope === 'eastern' || nextScope === 'western')) {
      navigate(`/standings/conference/${nextScope}`);
      return;
    }

    if (
      tab === 'division' &&
      (nextScope === 'atlantic' ||
        nextScope === 'metropolitan' ||
        nextScope === 'central' ||
        nextScope === 'pacific')
    ) {
      navigate(`/standings/division/${nextScope}`);
    }
  };

  const setPreviousScope = () => {
    if (tab === 'conference') {
      setScope(scope === 'western' ? 'eastern' : 'western');
      return;
    }

    if (tab === 'division') {
      const currentIndex = standingsDivisions.indexOf((scope as StandingsDivision) ?? 'atlantic');
      const nextIndex = (currentIndex - 1 + standingsDivisions.length) % standingsDivisions.length;
      setScope(standingsDivisions[nextIndex]!);
    }
  };

  const setNextScope = () => {
    if (tab === 'conference') {
      setScope(scope === 'western' ? 'eastern' : 'western');
      return;
    }

    if (tab === 'division') {
      const currentIndex = standingsDivisions.indexOf((scope as StandingsDivision) ?? 'atlantic');
      const nextIndex = (currentIndex + 1) % standingsDivisions.length;
      setScope(standingsDivisions[nextIndex]!);
    }
  };

  useStandingsHotkeys({
    items,
    selectedTeamAbbrev: selectedTeam?.teamAbbrev ?? null,
    setSelectedTeamAbbrev: setSelectedStandingsTeamAbbrev,
    tab,
    setTab,
    scope,
    setPreviousScope,
    setNextScope,
    refreshStandings,
    navigateToGames: () => navigate('/games'),
  });

  return (
    <>
      <Head />
      <Layout
        header={<span>Standings</span>}
        footer={
          <>
            <span>● puck</span>
            <span className="max-[960px]:hidden">[1/2/3] tabs [h/l] group [j/k] select [g] games [r] refresh</span>
          </>
        }
      >
        <section className="grid grid-cols-[minmax(18rem,32rem)_minmax(0,1fr)] gap-3 min-h-0 max-[960px]:grid-cols-1 max-[960px]:grid-rows-[auto_minmax(0,1fr)] max-[960px]:h-full">
          <StandingsListPane
            header={standingsHeader(tab, scope)}
            status={
              standingsQuery.status === 'pending'
                ? 'loading'
                : standingsQuery.status === 'error'
                  ? 'error'
                  : 'success'
            }
            error={
              standingsQuery.error instanceof Error
                ? standingsQuery.error.message
                : standingsQuery.error
                  ? String(standingsQuery.error)
                  : null
            }
            items={items}
            selectedTeamAbbrev={selectedTeam?.teamAbbrev ?? null}
            onSelectTeam={setSelectedStandingsTeamAbbrev}
            tab={tab}
            scope={scope}
            setTab={setTab}
            setScope={setScope}
          />
          <StandingsDetailPane team={selectedTeam} />
        </section>
      </Layout>
    </>
  );
}
