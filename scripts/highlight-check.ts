#!/usr/bin/env bun

import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const PUCK_DIR = process.env.PUCK_DIR ?? join(import.meta.dir, '..');
const STATE_PATH =
  process.env.HIGHLIGHT_STATE_PATH ??
  join(process.env.HOME!, '.puck', 'highlight-watcher-state.json');
const SETTINGS_PATH =
  process.env.HIGHLIGHT_SETTINGS_PATH ??
  join(process.env.HOME!, '.puck', 'highlight-watcher-settings.json');
const LOG_PATH =
  process.env.HIGHLIGHT_LOG_PATH ?? join(process.env.HOME!, '.puck', 'highlight-watcher.log');
const LIVE_STATES = new Set(['LIVE', 'CRIT']);

const DEFAULT_SETTINGS = { mode: 'stars_video_goals', replayDate: null as string | null };
const TEAM_MODES = new Set(['off', 'video_all', 'video_goals', 'text_only']);
const LEGACY_MODES = new Set([
  'off',
  'whole_league_video_all',
  'whole_league_video_goals',
  'whole_league_text_only',
  'stars_video_all',
  'stars_video_goals',
  'stars_text_only',
]);

interface Game {
  id: number;
  state: string;
  startTimeUTC?: string;
  away: { abbrev: string; score?: number };
  home: { abbrev: string; score?: number };
}

interface Highlight {
  highlightClipId: string;
  mp4Url?: string;
  teamAbbrev?: string;
  playerName?: string;
  timeInPeriod?: string;
  [key: string]: unknown;
}

interface Settings {
  mode?: string;
  wholeLeagueMode?: string;
  teamModes?: Record<string, string>;
  replayDate?: string | null;
}

interface State {
  sentByScope: Record<string, string[]>;
}

async function runPuck(args: string[]): Promise<unknown> {
  const result = await Bun.$`bun src/index.tsx ${args} --skip-version-check`
    .cwd(PUCK_DIR)
    .nothrow();
  if (result.exitCode !== 0) {
    throw new Error(result.stderr.toString().trim() || result.stdout.toString().trim() || 'puck command failed');
  }
  return JSON.parse(result.stdout.toString());
}

function logEvent(event: string, extra: Record<string, unknown> = {}): void {
  const payload = { ts: new Date().toISOString(), event, ...extra };
  try {
    mkdirSync(join(LOG_PATH, '..'), { recursive: true });
    appendFileSync(LOG_PATH, JSON.stringify(payload) + '\n', 'utf8');
  } catch {
    // best-effort
  }
}

async function loadSettings(): Promise<Settings> {
  const file = Bun.file(SETTINGS_PATH);
  if (!(await file.exists())) {
    await Bun.$`mkdir -p ${join(SETTINGS_PATH, '..')}`.quiet();
    await Bun.write(SETTINGS_PATH, JSON.stringify(DEFAULT_SETTINGS, null, 2));
    return { ...DEFAULT_SETTINGS };
  }
  try {
    const s = (await file.json()) as Settings;
    if (!s.mode && !s.wholeLeagueMode) s.mode = DEFAULT_SETTINGS.mode;
    return s;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function normalizeTeamMode(v: unknown): string {
  return TEAM_MODES.has(String(v)) ? String(v) : 'off';
}

function resolveModes(settings: Settings): [string, Record<string, string>] {
  const teamModes: Record<string, string> = {};
  let whole: string | null = null;

  if (typeof settings.wholeLeagueMode === 'string') {
    whole = normalizeTeamMode(settings.wholeLeagueMode);
  }

  if (settings.teamModes && typeof settings.teamModes === 'object') {
    for (const [k, v] of Object.entries(settings.teamModes)) {
      if (typeof k === 'string' && k.length === 3) {
        teamModes[k.toUpperCase()] = normalizeTeamMode(v);
      }
    }
  }

  if (whole === null && Object.keys(teamModes).length === 0) {
    const legacy = LEGACY_MODES.has(settings.mode ?? '') ? settings.mode! : DEFAULT_SETTINGS.mode;
    switch (legacy) {
      case 'off': whole = 'off'; break;
      case 'whole_league_video_all': whole = 'video_all'; break;
      case 'whole_league_video_goals': whole = 'video_goals'; break;
      case 'whole_league_text_only': whole = 'text_only'; break;
      case 'stars_video_all': whole = 'off'; teamModes['DAL'] = 'video_all'; break;
      case 'stars_video_goals': whole = 'off'; teamModes['DAL'] = 'video_goals'; break;
      case 'stars_text_only': whole = 'off'; teamModes['DAL'] = 'text_only'; break;
      default: whole = 'off';
    }
  }

  return [whole ?? 'off', teamModes];
}

async function loadState(): Promise<State> {
  try {
    const text = await Bun.file(STATE_PATH).text();
    return JSON.parse(text) as State;
  } catch {
    return { sentByScope: {} };
  }
}

async function saveState(state: State): Promise<void> {
  await Bun.$`mkdir -p ${join(STATE_PATH, '..')}`.quiet();
  await Bun.write(STATE_PATH, JSON.stringify(state, null, 2));
}

function modeForTeam(team: string, wholeMode: string, teamModes: Record<string, string>): string {
  return teamModes[team.toUpperCase()] ?? wholeMode;
}

function captionForEvent(game: Game, h: Highlight): string {
  const away = game.away.abbrev;
  const home = game.home.abbrev;
  const team = (h.teamAbbrev ?? '').toUpperCase();
  const effectiveTeam = team === away || team === home ? team : home;
  const opp = effectiveTeam === home ? away : home;
  const teamSide = effectiveTeam === home ? game.home : game.away;
  const oppSide = effectiveTeam === home ? game.away : game.home;

  const scorer = h.playerName ?? 'Unknown';
  const t = h.timeInPeriod ?? '??:??';
  let caption = `${effectiveTeam} vs ${opp}: Goal by ${scorer}. ${t}.`;

  if (teamSide.score != null && oppSide.score != null) {
    const ts = teamSide.score;
    const os = oppSide.score;
    if (ts > os) caption += ` ${effectiveTeam} now lead ${ts}-${os}.`;
    else if (ts < os) caption += ` ${effectiveTeam} now trail ${ts}-${os}.`;
    else caption += ` ${effectiveTeam} now tied ${ts}-${os}.`;
  }

  return caption;
}

async function main(): Promise<number> {
  const settings = await loadSettings();
  const [wholeMode, teamModes] = resolveModes(settings);

  if (wholeMode === 'off' && Object.keys(teamModes).length === 0) {
    logEvent('watcher_off');
    console.log(JSON.stringify({ status: 'off' }));
    return 0;
  }

  const replayDate = settings.replayDate ?? null;
  const dateArgs =
    typeof replayDate === 'string' && replayDate.trim()
      ? ['date', '--date', replayDate.trim(), '--format', 'json']
      : ['date', '--date', 'today', '--format', 'json'];

  const dateData = (await runPuck(dateArgs)) as { games?: Game[] };
  let games: Game[] = dateData.games ?? [];

  if (!replayDate) {
    games = games.filter((g) => LIVE_STATES.has(g.state));
  }

  if (!games.length) {
    logEvent('no_live_game', { wholeLeagueMode: wholeMode, replayDate });
    console.log(JSON.stringify({ status: 'no_live_game' }));
    return 0;
  }

  const state = await loadState();
  const sentByScope = (state.sentByScope ??= {});
  const scopeKey = `whole:${wholeMode}|teams:${JSON.stringify(teamModes, Object.keys(teamModes).sort())}`;
  const sentForScope = new Set<string>(sentByScope[scopeKey] ?? []);

  games.sort((a, b) => (a.startTimeUTC ?? '').localeCompare(b.startTimeUTC ?? ''));

  for (const game of games) {
    const gameId = game.id;
    const away = game.away.abbrev;
    const home = game.home.abbrev;

    const awayMode = modeForTeam(away, wholeMode, teamModes);
    const homeMode = modeForTeam(home, wholeMode, teamModes);
    if (awayMode === 'off' && homeMode === 'off') continue;

    const highlightsResult = (await runPuck([
      'highlights',
      '--game-id',
      String(gameId),
      '--limit',
      '30',
      '--format',
      'json',
    ])) as { highlights?: Highlight[] };

    const items = highlightsResult.highlights ?? [];
    if (!items.length) continue;

    for (const h of items) {
      const clipId = h.highlightClipId;
      const team = (h.teamAbbrev ?? '').toUpperCase();
      if (!clipId || (team !== away && team !== home)) continue;

      const thisMode = modeForTeam(team, wholeMode, teamModes);
      if (thisMode === 'off') continue;
      if ((thisMode === 'video_goals' || thisMode === 'text_only') && !h.playerName) continue;

      const eventKey = `${gameId}:${clipId}:${team}:${thisMode}`;
      if (sentForScope.has(eventKey)) continue;

      const caption = captionForEvent(game, h);
      const delivery = thisMode === 'text_only' ? 'text' : 'video';

      sentForScope.add(eventKey);
      sentByScope[scopeKey] = Array.from(sentForScope).sort().slice(-10000);
      await saveState(state);

      logEvent('new_event', { delivery, teamMode: thisMode, gameId, team, highlightClipId: clipId, caption });

      console.log(
        JSON.stringify({
          status: 'new_event',
          delivery,
          teamMode: thisMode,
          gameId,
          replayDate,
          highlight: h,
          caption,
        }),
      );
      return 0;
    }
  }

  logEvent('no_new_event', { wholeLeagueMode: wholeMode, replayDate });
  console.log(JSON.stringify({ status: 'no_new_event' }));
  return 0;
}

try {
  process.exit(await main());
} catch (e) {
  logEvent('error', { error: String(e) });
  throw e;
}
