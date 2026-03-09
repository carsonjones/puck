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

DEFAULT_SETTINGS = {
    'mode': 'stars_video_goals',
}

# Supported modes:
# - off
# - whole_league_video_all
# - whole_league_video_goals
# - whole_league_text_only
# - stars_video_all
# - stars_video_goals
# - stars_text_only


def run_puck(args: list[str]) -> Any:
    cmd = ['npx', '-y', 'tsx', 'src/index.tsx', *args]
    proc = subprocess.run(cmd, cwd=PUCK_DIR, capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip() or proc.stdout.strip() or 'puck command failed')
    return json.loads(proc.stdout)


def log_event(event: str, **kwargs: Any) -> None:
    payload = {
        'ts': datetime.now(timezone.utc).isoformat(),
        'event': event,
        **kwargs,
    }
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
        if 'mode' not in s:
            s['mode'] = DEFAULT_SETTINGS['mode']
        return s
    except Exception:
        return dict(DEFAULT_SETTINGS)


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


def is_goal_only(mode: str) -> bool:
    return mode.endswith('_goals')


def is_text_only(mode: str) -> bool:
    return mode.endswith('_text_only')


def is_stars_scope(mode: str) -> bool:
    return mode.startswith('stars_')


def main() -> int:
    settings = load_settings()
    mode = settings.get('mode', DEFAULT_SETTINGS['mode'])

    valid = {
        'off',
        'whole_league_video_all',
        'whole_league_video_goals',
        'whole_league_text_only',
        'stars_video_all',
        'stars_video_goals',
        'stars_text_only',
    }
    if mode not in valid:
        mode = DEFAULT_SETTINGS['mode']

    if mode == 'off':
        log_event('watcher_off')
        print(json.dumps({'status': 'off', 'mode': mode}))
        return 0

    today = run_puck(['date', '--date', 'today', '--format', 'json'])
    games = today.get('games', [])

    target_games = []
    for g in games:
        state = (g or {}).get('state')
        if state not in LIVE_STATES:
            continue
        away = (((g or {}).get('away') or {}).get('abbrev'))
        home = (((g or {}).get('home') or {}).get('abbrev'))

        if is_stars_scope(mode) and away != 'DAL' and home != 'DAL':
            continue
        target_games.append(g)

    if not target_games:
        log_event('no_live_game', mode=mode)
        print(json.dumps({'status': 'no_live_game', 'mode': mode}))
        return 0

    state = load_state()
    sent_by_scope = state.setdefault('sentByScope', {})
    scope_key = mode
    sent_for_scope = set(sent_by_scope.get(scope_key, []))

    # deterministic order
    target_games = sorted(target_games, key=lambda g: g.get('startTimeUTC', ''))

    for game in target_games:
        game_id = game['id']
        away = game['away']['abbrev']
        home = game['home']['abbrev']

        args = ['highlights', '--game-id', str(game_id), '--limit', '25', '--format', 'json']
        if is_stars_scope(mode):
            args.extend(['--team', 'DAL'])

        highlights = run_puck(args)
        items = highlights.get('highlights', [])

        if is_goal_only(mode):
            # defensive filter if API ever returns non-goal clips
            items = [h for h in items if h.get('playerName')]

        if not items:
            continue

        for h in items:
            clip_id = h.get('highlightClipId')
            if not clip_id:
                continue
            event_key = f"{game_id}:{clip_id}"
            if event_key in sent_for_scope:
                continue

            dal_score = game.get('home', {}).get('score') if home == 'DAL' else game.get('away', {}).get('score')
            opp = away if home == 'DAL' else home
            opp_score = game.get('away', {}).get('score') if home == 'DAL' else game.get('home', {}).get('score')

            scorer = h.get('playerName', 'Unknown')
            t = h.get('timeInPeriod', '??:??')
            caption = f"DAL vs {opp}: Goal by {scorer}. {t}."
            if dal_score is not None and opp_score is not None:
                if dal_score > opp_score:
                    state_txt = 'lead'
                elif dal_score < opp_score:
                    state_txt = 'trail'
                else:
                    state_txt = 'are tied'
                if state_txt == 'are tied':
                    caption += f" Stars now tied {dal_score}-{opp_score}."
                else:
                    caption += f" Stars now {state_txt} {dal_score}-{opp_score}."

            sent_for_scope.add(event_key)
            sent_by_scope[scope_key] = sorted(sent_for_scope)[-5000:]
            save_state(state)

            delivery = 'text' if is_text_only(mode) else 'video'
            log_event(
                'new_event',
                mode=mode,
                delivery=delivery,
                gameId=game_id,
                highlightClipId=clip_id,
                caption=caption,
            )

            print(
                json.dumps(
                    {
                        'status': 'new_event',
                        'mode': mode,
                        'delivery': delivery,
                        'gameId': game_id,
                        'highlight': h,
                        'caption': caption,
                    }
                )
            )
            return 0

    log_event('no_new_event', mode=mode)
    print(json.dumps({'status': 'no_new_event', 'mode': mode}))
    return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except Exception as e:
        log_event('error', error=str(e))
        raise
