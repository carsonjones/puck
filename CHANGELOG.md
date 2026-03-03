# Changelog

## [0.3.0] - 2026-03-03

### Added
- Headless `puck date` command for machine-readable daily schedule output
- Headless `puck game` command with parsed plays, scorers, assists, and goalie stats
- `puck lookup player|game` command for ID discovery and pipeline-friendly `--ids-only`
- Command discovery support via `puck commands --format=json` and `puck help <command>`
- NDJSON output support for streaming workflows (`date`, `game`, `lookup`)

## [0.2.0] - 2026-01-03

### Added
- Player search with fuzzy matching
- Player search caching with background refresh
- Score display for in-progress games

### Changed
- Performance tuning and optimizations

### Fixed
- Linting and formatting improvements

## [0.1.0] - Initial Release
