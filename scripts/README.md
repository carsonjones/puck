# Scripts

Utility scripts for the NHL TUI project.

## collect-desc-keys.ts

Collects all unique `descKey`, `typeDescKey`, and stoppage reason values from the NHL play-by-play API over the last 7 days.

### Usage

```bash
bun scripts/collect-desc-keys.ts
```

### Purpose

This script helps maintain the `formatDescKey()` function in `src/data/api/client.ts` by discovering all possible values that the NHL API returns. The API can return inconsistent formatting (lowercase, hyphens, camelCase, etc.), and this script helps us build a comprehensive mapping to human-readable strings.

### Output

The script outputs three categories of unique values:

1. **descKey values** - Used primarily for penalty descriptions
   - Examples: `"high-sticking"`, `"holding"`, `"too-many-men-on-the-ice"`

2. **typeDescKey values** - Play event types
   - Examples: `"goal"`, `"shot-on-goal"`, `"blocked-shot"`, `"penalty"`

3. **Stoppage reasons** - Reasons for game stoppages
   - Examples: `"icing"`, `"offside"`, `"puck-in-netting"`, `"tv-timeout"`

### When to Run

Run this script when:
- Adding support for new event types
- Users report unformatted or oddly formatted play descriptions
- NHL API changes or adds new event types
- You want to verify all current event types are properly handled

### Example Output

```
============================================================
UNIQUE descKey VALUES:
============================================================
  "boarding"
  "cross-checking"
  "high-sticking"
  "holding"
  ...

============================================================
SUMMARY:
============================================================
Total games processed: 44
Total unique descKeys: 19
Total unique typeDescKeys: 16
Total unique stoppage reasons: 26
```

Use this data to update the `specialCases` mapping in the `formatDescKey()` function.
