#!/usr/bin/env python3
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

PUCK_DIR = Path('/home/exedev/.openclaw/workspace/puck')
STATE_PATH = Path('/home/exedev/.openclaw/workspace/.openclaw/tmp/highlight-watcher-state.json')
SETTINGS_PATH = Path('/home/exedev/.openclaw/workspace/.openclaw/tmp/highlight-watcher-settings.json')
LOG_PATH = Path('/home/exedev/.openclaw/workspace/.openclaw/tmp/highlight-watcher.log')
LIVE_STATES = {'LIVE', 'CRIT'}

DEFAULT_SETTINGS = {'mode': 'stars_video_goals', 'replayDate': None}
TEAM_MODES = {'off', 'video_all', 'video_goals', 'text_only'}
LEGACY_MODES = {
    'off',
    'whole_league_video_all',
    'whole_league_video_goals',
    'whole_league_text_only',
    'stars_video_all',
    'stars_video_goals',
    'stars_text_only',
}


def run_puck(args: list[str]) -> Any:
    cmd = ['npx', '-y', 'tsx', 'src/index.tsx', *args]
    proc = subprocess.run(cmd, cwd=PUCK_DIR, capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip() or proc.stdout.strip() or 'puck command failed')
    return json.loads(proc.stdout)


def log_event(event: str, **kwargs: Any) -> None:
    payload = {'ts': datetime.now(timezone.utc).isoformat(), 'event': event, **kwargs}
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with LOG_PATH.open('a', encoding='utf-8') as f:
        f.write(json.dumps(payload) + '\n')


def load_settings() -> dict[str, Any]:
    if not SETTINGS_PATH.exists():
        SETTINGS_PATH.parent.mkdir(parents=True, exist_ok=True)
        SETTINGS_PATH.write_text(json.dumps(DEFAULT_SETTINGS, indent=2))
        return dict(DEFAULT_SETTINGS)
    try:
        s = json.loads(SETTINGS_PATH.read_text())
        if 'mode' not in s and 'wholeLeagueMode' not in s:
            s['mode'] = DEFAULT_SETTINGS['mode']
        return s
    except Exception:
        return dict(DEFAULT_SETTINGS)


def normalize_team_mode(v: Any) -> str:
    if v in TEAM_MODES:
        return str(v)
    return 'off'


def resolve_modes(settings: dict[str, Any]) -> tuple[str, dict[str, str]]:
    """Return (wholeLeagueMode, teamModesOverrides).

    New schema preferred:
      {
        "wholeLeagueMode": "off|video_all|video_goals|text_only",
        "teamModes": {"DAL":"video_goals", ...}
      }

    Back-compat with legacy "mode" string.
    """
    team_modes: dict[str, str] = {}
    whole = None

    if isinstance(settings.get('wholeLeagueMode'), str):
        whole = normalize_team_mode(settings.get('wholeLeagueMode'))

    raw_team_modes = settings.get('teamModes')
    if isinstance(raw_team_modes, dict):
        for k, v in raw_team_modes.items():
            if isinstance(k, str) and len(k) == 3:
                team_modes[k.upper()] = normalize_team_mode(v)

    legacy = settings.get('mode', DEFAULT_SETTINGS['mode'])
    if legacy not in LEGACY_MODES:
        legacy = DEFAULT_SETTINGS['mode']

    if whole is None and not team_modes:
        if legacy == 'off':
            whole = 'off'
        elif legacy == 'whole_league_video_all':
            whole = 'video_all'
        elif legacy == 'whole_league_video_goals':
            whole = 'video_goals'
        elif legacy == 'whole_league_text_only':
            whole = 'text_only'
        elif legacy == 'stars_video_all':
            whole = 'off'
            team_modes['DAL'] = 'video_all'
        elif legacy == 'stars_video_goals':
            whole = 'off'
            team_modes['DAL'] = 'video_goals'
        elif legacy == 'stars_text_only':
            whole = 'off'
            team_modes['DAL'] = 'text_only'

    if whole is None:
        whole = 'off'

    return whole, team_modes


def load_state() -> dict[str, Any]:
    if not STATE_PATH.exists():
        return {'sentByScope': {}}
    try:
        return json.loads(STATE_PATH.read_text())
    except Exception:
        return {'sentByScope': {}}


def save_state(state: dict[str, Any]) -> None:
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    STATE_PATH.write_text(json.dumps(state, indent=2))


def mode_for_team(team: str, whole_mode: str, team_modes: dict[str, str]) -> str:
    return team_modes.get(team.upper(), whole_mode)


def caption_for_event(game: dict[str, Any], h: dict[str, Any]) -> str:
    away = game['away']['abbrev']
    home = game['home']['abbrev']
    team = (h.get('teamAbbrev') or '').upper()
    if team not in {away, home}:
        team = home

    opp = away if team == home else home
    team_score = (game.get('home', {}) if team == home else game.get('away', {})).get('score')
    opp_score = (game.get('away', {}) if team == home else game.get('home', {})).get('score')

    scorer = h.get('playerName', 'Unknown')
    t = h.get('timeInPeriod', '??:??')
    caption = f"{team} vs {opp}: Goal by {scorer}. {t}."

    if team_score is not None and opp_score is not None:
        if team_score > opp_score:
            state_txt = 'lead'
        elif team_score < opp_score:
            state_txt = 'trail'
        else:
            state_txt = 'are tied'
        if state_txt == 'are tied':
            caption += f" {team} now tied {team_score}-{opp_score}."
        else:
            caption += f" {team} now {state_txt} {team_score}-{opp_score}."

    return caption


def main() -> int:
    settings = load_settings()
    whole_mode, team_modes = resolve_modes(settings)

    if whole_mode == 'off' and not team_modes:
        log_event('watcher_off')
        print(json.dumps({'status': 'off'}))
        return 0

    replay_date = settings.get('replayDate')
    date_args = ['date', '--date', 'today', '--format', 'json']
    if isinstance(replay_date, str) and replay_date.strip():
        date_args = ['date', '--date', replay_date.strip(), '--format', 'json']

    date_data = run_puck(date_args)
    if isinstance(replay_date, str) and replay_date.strip():
        # historical simulation mode: include all games on that date
        games = [g for g in date_data.get('games', [])]
    else:
        games = [g for g in date_data.get('games', []) if (g or {}).get('state') in LIVE_STATES]

    if not games:
        log_event('no_live_game', wholeLeagueMode=whole_mode, replayDate=replay_date)
        print(json.dumps({'status': 'no_live_game'}))
        return 0

    state = load_state()
    sent_by_scope = state.setdefault('sentByScope', {})
    scope_key = f"whole:{whole_mode}|teams:{json.dumps(team_modes, sort_keys=True)}"
    sent_for_scope = set(sent_by_scope.get(scope_key, []))

    games = sorted(games, key=lambda g: g.get('startTimeUTC', ''))

    for game in games:
        game_id = game['id']
        away = game['away']['abbrev']
        home = game['home']['abbrev']

        away_mode = mode_for_team(away, whole_mode, team_modes)
        home_mode = mode_for_team(home, whole_mode, team_modes)
        if away_mode == 'off' and home_mode == 'off':
            continue

        highlights = run_puck(['highlights', '--game-id', str(game_id), '--limit', '30', '--format', 'json'])
        items = highlights.get('highlights', [])
        if not items:
            continue

        for h in items:
            clip_id = h.get('highlightClipId')
            team = (h.get('teamAbbrev') or '').upper()
            if not clip_id or team not in {away, home}:
                continue

            this_mode = mode_for_team(team, whole_mode, team_modes)
            if this_mode == 'off':
                continue
            if this_mode in {'video_goals', 'text_only'} and not h.get('playerName'):
                continue

            event_key = f"{game_id}:{clip_id}:{team}:{this_mode}"
            if event_key in sent_for_scope:
                continue

            caption = caption_for_event(game, h)
            delivery = 'text' if this_mode == 'text_only' else 'video'

            sent_for_scope.add(event_key)
            sent_by_scope[scope_key] = sorted(sent_for_scope)[-10000:]
            save_state(state)

            log_event(
                'new_event',
                delivery=delivery,
                teamMode=this_mode,
                gameId=game_id,
                team=team,
                highlightClipId=clip_id,
                caption=caption,
            )

            print(
                json.dumps(
                    {
                        'status': 'new_event',
                        'delivery': delivery,
                        'teamMode': this_mode,
                        'gameId': game_id,
                        'replayDate': replay_date,
                        'highlight': h,
                        'caption': caption,
                    }
                )
            )
            return 0

    log_event('no_new_event', wholeLeagueMode=whole_mode, replayDate=replay_date)
    print(json.dumps({'status': 'no_new_event'}))
    return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except Exception as e:
        log_event('error', error=str(e))
        raise
