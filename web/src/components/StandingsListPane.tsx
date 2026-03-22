import { useEffect, useRef, useState } from 'react';
import type { StandingListItem } from '@/data/api/client';
import {
  formatStandingRecord,
  teamDisplayName,
  standingsConferences,
  standingsDivisions,
  standingsDivisionDisplayNames,
  standingsTabs,
  type StandingsConference,
  type StandingsDivision,
  type StandingsTab,
} from '@web/helpers';

type StandingsListPaneProps = {
  header: string;
  status: 'loading' | 'success' | 'error';
  error: string | null;
  items: StandingListItem[];
  selectedTeamAbbrev: string | null;
  onSelectTeam: (teamAbbrev: string) => void;
  tab: StandingsTab;
  scope: StandingsConference | StandingsDivision | null;
  setTab: (tab: StandingsTab) => void;
  setScope: (scope: StandingsConference | StandingsDivision) => void;
};

function getButtonClass(isActive: boolean) {
  return [
    'min-w-32 max-w-32 max-[960px]:min-w-0 max-[960px]:flex-1 flex grow-1 justify-center border-0 px-3 py-[0.4rem] focus:outline-1 focus:outline-light focus:[outline-offset:-1px]',
    isActive ? 'bg-light text-surface' : 'bg-transparent text-dim',
  ].join(' ');
}

export function StandingsListPane({
  status,
  error,
  items,
  selectedTeamAbbrev,
  onSelectTeam,
  tab,
  scope,
  setTab,
  setScope,
}: StandingsListPaneProps) {
  const selectedRef = useRef<HTMLButtonElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const isCollapsed = !isExpanded && Boolean(selectedTeamAbbrev);

  useEffect(() => {
    setIsExpanded(false);
    selectedRef.current?.scrollIntoView({ block: 'nearest' });
  }, [selectedTeamAbbrev]);

  const handleTeamClick = (teamAbbrev: string) => {
    if (teamAbbrev === selectedTeamAbbrev) {
      setIsExpanded((v) => !v);
    } else {
      onSelectTeam(teamAbbrev);
      setIsExpanded(false);
    }
  };
  const subtabs =
    tab === 'conference' ? standingsConferences : tab === 'division' ? standingsDivisions : [];

  const Tabs = (<div className="flex flex-col border-b-2 border-light">
    <section className="flex items-center whitespace-nowrap" aria-label="standings tabs">
      {standingsTabs.map((tabOption) => (
        <button
          key={tabOption}
          className={getButtonClass(tab === tabOption)}
          onClick={() => setTab(tabOption)}
        >
          {tabOption}
        </button>
      ))}
    </section>


    <div className="min-h-0 overflow-auto">
      {subtabs.length > 0 ? (
        <section className="flex items-center whitespace-nowrap" aria-label="standings scope tabs">
          {subtabs.map((scopeOption) => (
            <button
              key={scopeOption}
              className={getButtonClass(scope === scopeOption)}
              onClick={() => setScope(scopeOption)}
            >
              {tab === 'conference' ? scopeOption : standingsDivisionDisplayNames[scopeOption as StandingsDivision]}
            </button>
          ))}
        </section>
      ) : null}

    </div>
  </div>);

  return (
    <aside className={[
      'bg-surface flex flex-col border-2 border-light pb-3',
      'min-h-[34rem] max-[960px]:min-h-0',
      isCollapsed
        ? 'max-[960px]:border-b-0 max-[960px]:pb-0'
        : 'max-[960px]:max-h-[40vh]',
    ].join(' ')}>
      {Tabs}
      {status === 'loading' ? <p className="text-dim m-0 px-3">Loading standings…</p> : null}
      {status === 'error' ? <p className="text-dim m-0 px-3">{error}</p> : null}
      {status === 'success' ? (
        <div className={`grid mt-3 overflow-y-scroll${isCollapsed ? ' max-[960px]:overflow-hidden' : ''}`}>
          {items.map((team) => {
            const isActive = team.teamAbbrev === selectedTeamAbbrev;
            return (
              <button
                key={team.teamAbbrev}
                ref={isActive ? selectedRef : undefined}
                className={[
                  'w-full border-0 flex items-center gap-2 px-3 py-[0.4rem] text-left cursor-pointer tabular-nums',
                  'focus:outline focus:outline-1 focus:outline-light focus:[outline-offset:-1px]',
                  isActive ? 'bg-light text-surface' : 'bg-transparent',
                  isCollapsed && !isActive ? 'max-[960px]:hidden' : '',
                ].join(' ')}
                onClick={() => handleTeamClick(team.teamAbbrev)}
              >
                <span className={`w-[2ch] text-right shrink-0 ${isActive ? '' : 'text-dim'}`}>
                  {team.rank}
                </span>
                <span className="flex-1 min-w-0 truncate">
                  {teamDisplayName(team.teamName)}
                </span>
                <span className={`w-[5ch] text-right shrink-0 ${isActive ? '' : 'text-dim'}`}>
                  {team.points}p
                </span>
                <span className={`w-[10ch] pl-[2ch] text-left shrink-0 ${isActive ? '' : 'text-dim'}`}>
                  {formatStandingRecord(team)}
                </span>

              </button>
            );
          })}
        </div>
      ) : null}
    </aside>
  );
}
