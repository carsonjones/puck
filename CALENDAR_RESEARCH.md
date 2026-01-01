# Team Schedule Calendar - Research Findings

## Summary
Research into adding calendar/schedule view to team detail pane in standings screen. A schedule endpoint exists and is already used elsewhere in the app.

---

## NHL API Schedule Endpoints

### Available Endpoints

1. **`/club-schedule-season/{teamAbbrev}/{seasonId}`** ✓ Already used
   - Returns: Full season schedule for specific team
   - Data: Array of `ScheduleGame` objects with dates, opponents, scores, game states
   - Current usage: Player game logs
   - **NOT currently used in team detail pane** ← Opportunity

2. **`/score/{date}`** ✓ Already used
   - Returns: All games for specific date
   - Current usage: Main games screen

3. **`/scoreboard/now`** ✓ Already used
   - Returns: Live game updates
   - Current usage: Real-time score updates

### Data Structure
```ts
TeamScheduleResponse {
  games: ScheduleGame[] // Full season games
}

ScheduleGame {
  id: number
  gameDate: string (ISO)
  gameState: 'OFF' | 'FINAL' | 'LIVE' | ...
  homeTeam: { abbrev, score, ... }
  awayTeam: { abbrev, score, ... }
  startTimeUTC: string
  venue: { default: string }
}
```

---

## Current Team Detail Pane (Standings Screen)

### Structure
- Location: `src/ui/components/standings-detail/TeamDetail.tsx`
- Layout: Split pane (left: standings list, right: team detail)
- Right pane tabs:
  - **Team Info** - Logo, record, stats, last 10
  - **Roster** - Current roster by position
  - **Schedule** tab does NOT exist ← Opportunity

### Team Info Tab
- File: `src/ui/components/standings-detail/TeamInfoTab.tsx`
- Shows: Team logo, record, points, goals, streak, last 10 games
- Space available: Right pane is 55% of terminal width (~44 chars in 80-wide terminal)

---

## Calendar View Options for Team Detail

### Recommended: Week View
**Best fit for TUI constraints**

```
┌─ Team Schedule ─────────────────────┐
│ Mon 12/30  Tue 12/31  Wed 1/1  Thu  │
│ vs BOS     @ TOR      ---      vs MTL│
│ 7:00 PM    8:00 PM             7:30  │
│                                      │
│ Fri 1/3    Sat 1/4    Sun 1/5        │
│ @ NYR      vs PHI     ---            │
│ 7:00 PM    6:00 PM                   │
└──────────────────────────────────────┘
```

- 7 days horizontal, scrollable by week
- Shows opponent, home/away, time
- Fits ~44 char width
- Color code: scheduled/live/final

### Alternative: Mini Month Calendar

```
        January 2025
  S  M  T  W  T  F  S
           1  2• 3• 4
  5  6  7  8  9 10 11•
 12 13•14•15 16 17 18
```

- Dots indicate game days
- Select date to show game detail below
- More compact, less info

### Alternative: Scrolling List (Simplest)

```
Mon 12/30  vs BOS     7:00 PM  Scheduled
Tue 12/31  @ TOR      8:00 PM  Scheduled
Thu 1/2    vs MTL     7:30 PM  Scheduled
Fri 1/3    @ NYR      7:00 PM  Final 3-2
```

- Vertical list of upcoming games
- Easier to implement, more detail
- Windowed virtualization already exists

---

## Implementation Notes

### Data Already Available
- `getTeamSchedule(teamAbbrev, seasonId)` in `src/data/nhl/client.ts`
- Returns full season, can filter to show:
  - Next N games
  - Current month
  - Current week
  - Date range

### UI Components to Create/Modify
1. New tab in `TeamDetail.tsx`: "Schedule"
2. New component: `TeamScheduleTab.tsx` (or `TeamCalendarTab.tsx`)
3. Hook: `useTeamSchedule(teamAbbrev)` to fetch data
4. Reuse existing: `useWindowedList`, `formatDate` utils

### Terminal Constraints
- Right pane width: ~44 chars (55% of 80)
- Height: ~20 rows available
- Must fit rounded border + padding

---

## Next Steps (When Ready to Implement)

1. Add "Schedule" tab to `TeamDetail` component
2. Create `TeamScheduleTab` component with chosen view (recommend week view)
3. Fetch team schedule using existing endpoint
4. Add keyboard nav (arrow keys for week/month navigation)
5. Color code games by state (scheduled/live/final)
