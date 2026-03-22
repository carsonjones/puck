import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { fetchPlayerDetail, fetchPlayers } from '@web/api';
import { Head } from '@web/components/Head';
import { Layout } from '@web/components/Layout';
import { PlayerDetailPane } from '@web/components/PlayerDetailPane';
import { PlayersListPane } from '@web/components/PlayersListPane';
import type { PlayerListItem } from '@/data/api/client';
import { useDebouncedValue } from '@web/hooks/useDebouncedValue';

function fuzzyFilter(query: string, players: PlayerListItem[]): PlayerListItem[] {
  if (!query.trim()) return players;

  const q = query.toLowerCase();
  const scored: { player: PlayerListItem; score: number }[] = [];

  for (const player of players) {
    const fullName = `${player.firstName} ${player.lastName}`.toLowerCase();
    let score = 0;
    let lastMatch = -2;
    let qi = 0;

    for (let i = 0; i < fullName.length && qi < q.length; i++) {
      if (fullName[i] === q[qi]) {
        score += 10;
        if (i === lastMatch + 1) score += 15;
        if (i < 5) score += 5 - i;
        if (i === player.firstName.length + 1) score += 10;
        lastMatch = i;
        qi++;
      }
    }

    if (qi === q.length) scored.push({ player, score });
  }

  return scored.sort((a, b) => b.score - a.score).map((s) => s.player);
}

export function PlayersRoute() {
  const navigate = useNavigate();
  const params = useParams();
  const selectedPlayerId = params.playerId ? Number(params.playerId) : null;
  const [query, setQuery] = useState('');
  const debouncedId = useDebouncedValue(selectedPlayerId, 120);

  const playersQuery = useQuery({
    queryKey: ['players'],
    queryFn: fetchPlayers,
    staleTime: 3_600_000,
  });

  const selectedPlayer = useMemo(
    () => playersQuery.data?.find((p) => p.id === selectedPlayerId) ?? null,
    [playersQuery.data, selectedPlayerId],
  );

  const playerDetailQuery = useQuery({
    queryKey: ['player-detail', debouncedId, selectedPlayer?.teamAbbrev],
    queryFn: () => {
      if (!debouncedId) throw new Error('no player selected');
      return fetchPlayerDetail(debouncedId, selectedPlayer?.teamAbbrev);
    },
    enabled: Boolean(debouncedId),
    staleTime: 300_000,
  });

  const filteredItems = useMemo(
    () => fuzzyFilter(query, playersQuery.data ?? []),
    [query, playersQuery.data],
  );

  const setSelectedPlayerId = (id: number) => {
    navigate(`/players/${id}`);
  };

  const navigateList = useCallback((dir: 1 | -1) => {
    if (filteredItems.length === 0) return;
    const idx = filteredItems.findIndex((p) => p.id === selectedPlayerId);
    const next = idx < 0 ? 0 : Math.max(0, Math.min(filteredItems.length - 1, idx + dir));
    const player = filteredItems[next];
    if (player) setSelectedPlayerId(player.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredItems, selectedPlayerId]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target;
      const inInput = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || (target instanceof HTMLElement && target.isContentEditable);
      if (!inInput) {
        if (e.key === 'j' || e.key === 'ArrowDown') { e.preventDefault(); navigateList(1); return; }
        if (e.key === 'k' || e.key === 'ArrowUp') { e.preventDefault(); navigateList(-1); return; }
        if (e.key === 'g') { e.preventDefault(); navigate('/games'); return; }
        if (e.key === 's') { e.preventDefault(); navigate('/standings'); return; }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navigate, navigateList]);

  const detailStatus =
    !debouncedId
      ? 'idle'
      : playerDetailQuery.status === 'pending'
        ? 'loading'
        : playerDetailQuery.status === 'error'
          ? 'error'
          : 'success';

  return (
    <>
      <Head />
      <Layout
        header={<span>Players</span>}
        footer={
          <>
            <span className="cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('open-cmdk'))}>● puck</span>
            <span className="max-[960px]:hidden">type to search · [g] games [s] standings</span>
          </>
        }
      >
        <section className="grid grid-cols-[minmax(18rem,32rem)_minmax(0,1fr)] gap-3 min-h-0 max-[960px]:grid-cols-1 max-[960px]:grid-rows-[minmax(0,25dvh)_minmax(0,1fr)] max-[960px]:h-full">
          <PlayersListPane
            status={
              playersQuery.status === 'pending'
                ? 'loading'
                : playersQuery.status === 'error'
                  ? 'error'
                  : 'success'
            }
            error={
              playersQuery.error instanceof Error
                ? playersQuery.error.message
                : playersQuery.error
                  ? String(playersQuery.error)
                  : null
            }
            items={filteredItems}
            query={query}
            onQueryChange={setQuery}
            selectedPlayerId={selectedPlayerId}
            onSelectPlayer={setSelectedPlayerId}
            onNavigateUp={() => navigateList(-1)}
            onNavigateDown={() => navigateList(1)}
          />
          <PlayerDetailPane
            status={detailStatus}
            player={playerDetailQuery.data ?? null}
            error={
              playerDetailQuery.error instanceof Error
                ? playerDetailQuery.error.message
                : playerDetailQuery.error
                  ? String(playerDetailQuery.error)
                  : null
            }
          />
        </section>
      </Layout>
    </>
  );
}
