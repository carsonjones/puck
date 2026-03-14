#!/usr/bin/env bun

import { join } from 'node:path';

const WATCH_TEAM = 'DAL';
const PUCK_DIR = process.env.PUCK_DIR ?? join(import.meta.dir, '..');
const STATE_PATH =
  process.env.STARS_STATE_PATH ?? join(process.env.HOME!, '.puck', 'stars-highlight-state.json');
const LIVE_STATES = new Set(['LIVE', 'CRIT']);

interface Game {
  id: number;
  state: string;
  away: { abbrev: string };
  home: { abbrev: string };
}

interface Highlight {
  highlightClipId: string;
  mp4Url: string;
  [key: string]: unknown;
}

interface State {
  sentByGame: Record<string, string[]>;
}

async function runPuck(args: string[]): Promise<unknown> {
  const result = await Bun.$`bun src/index.tsx ${args} --skip-version-check`.cwd(PUCK_DIR).text();
  return JSON.parse(result);
}

async function loadState(): Promise<State> {
  try {
    const text = await Bun.file(STATE_PATH).text();
    return JSON.parse(text) as State;
  } catch {
    return { sentByGame: {} };
  }
}

async function saveState(state: State): Promise<void> {
  await Bun.$`mkdir -p ${join(STATE_PATH, '..')}`.quiet();
  await Bun.write(STATE_PATH, JSON.stringify(state, null, 2));
}

const today = (await runPuck(['date', '--date', 'today', '--format', 'json'])) as {
  games: Game[];
};
const games = today.games ?? [];

const liveGame = games.find(
  (g) => LIVE_STATES.has(g.state) && (g.away.abbrev === WATCH_TEAM || g.home.abbrev === WATCH_TEAM),
);

if (!liveGame) {
  console.log(JSON.stringify({ status: 'no_live_game' }));
  process.exit(0);
}

const gameId = liveGame.id;
const highlightsResult = (await runPuck([
  'highlights',
  '--game-id',
  String(gameId),
  '--team',
  WATCH_TEAM,
  '--limit',
  '10',
  '--format',
  'json',
])) as { highlights: Highlight[] };

const items = highlightsResult.highlights ?? [];
if (!items.length) {
  console.log(JSON.stringify({ status: 'no_highlights', gameId }));
  process.exit(0);
}

const state = await loadState();
const sentByGame = state.sentByGame;
const sentForGame = new Set<string>(sentByGame[String(gameId)] ?? []);

for (const h of items) {
  if (!h.highlightClipId || !h.mp4Url) continue;
  if (sentForGame.has(h.highlightClipId)) continue;

  sentForGame.add(h.highlightClipId);
  const sorted = Array.from(sentForGame).sort().slice(-200);
  sentByGame[String(gameId)] = sorted;
  await saveState(state);

  console.log(JSON.stringify({ status: 'new_highlight', gameId, highlight: h }));
  process.exit(0);
}

console.log(JSON.stringify({ status: 'no_new_highlight', gameId }));
