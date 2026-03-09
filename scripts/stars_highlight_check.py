#!/usr/bin/env python3
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

PUCK_DIR = Path('/home/exedev/.openclaw/workspace/puck')
STATE_PATH = Path('/home/exedev/.openclaw/workspace/.openclaw/tmp/stars-highlight-state.json')
LOG_PATH = Path('/home/exedev/.openclaw/workspace/.openclaw/tmp/stars-highlight.log')
LIVE_STATES = {'LIVE', 'CRIT'}


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


def load_state() -> dict[str, Any]:
    if not STATE_PATH.exists():
        return {'sentByGame': {}}
    try:
        return json.loads(STATE_PATH.read_text())
    except Exception:
        return {'sentByGame': {}}


def save_state(state: dict[str, Any]) -> None:
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    STATE_PATH.write_text(json.dumps(state, indent=2))


def main() -> int:
    today = run_puck(['date', '--date', 'today', '--format', 'json'])
    games = today.get('games', [])

    dal_live = None
    for g in games:
        away = (((g or {}).get('away') or {}).get('abbrev'))
        home = (((g or {}).get('home') or {}).get('abbrev'))
        state = (g or {}).get('state')
        if state in LIVE_STATES and (away == 'DAL' or home == 'DAL'):
            dal_live = g
            break

    if not dal_live:
        log_event('no_live_game')
        print(json.dumps({'status': 'no_live_game'}))
        return 0

    game_id = dal_live['id']
    log_event('live_game_found', gameId=game_id, state=dal_live.get('state'))
    highlights = run_puck([
        'highlights',
        '--game-id',
        str(game_id),
        '--team',
        'DAL',
        '--limit',
        '10',
        '--format',
        'json',
    ])

    items = highlights.get('highlights', [])
    if not items:
        log_event('no_highlights', gameId=game_id)
        print(json.dumps({'status': 'no_highlights', 'gameId': game_id}))
        return 0

    state = load_state()
    sent_by_game = state.setdefault('sentByGame', {})
    sent_for_game = set(sent_by_game.get(str(game_id), []))

    for h in items:
        clip_id = h.get('highlightClipId')
        mp4 = h.get('mp4Url')
        if not clip_id or not mp4:
            continue
        if clip_id in sent_for_game:
            continue

        sent_for_game.add(clip_id)
        sent_by_game[str(game_id)] = sorted(sent_for_game)
        # keep state bounded
        if len(sent_by_game[str(game_id)]) > 200:
            sent_by_game[str(game_id)] = sent_by_game[str(game_id)][-200:]
        save_state(state)
        log_event(
            'new_highlight',
            gameId=game_id,
            highlightClipId=clip_id,
            playerName=h.get('playerName'),
            timeInPeriod=h.get('timeInPeriod'),
        )

        print(
            json.dumps(
                {
                    'status': 'new_highlight',
                    'gameId': game_id,
                    'highlight': h,
                }
            )
        )
        return 0

    log_event('no_new_highlight', gameId=game_id)
    print(json.dumps({'status': 'no_new_highlight', 'gameId': game_id}))
    return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except Exception as e:
        log_event('error', error=str(e))
        raise
