# Deployment Guide for Puck (NHL TUI)

## Overview
Puck is now configured for distribution via npm and Homebrew with version checking via Cloudflare Workers.

## Pre-Release Checklist

### 1. Fix TypeScript Errors
Before publishing, resolve pre-existing TypeScript errors:
```bash
bun run build
```

Current known issues to address:
- Missing types in test files
- Type assertions needed in several files
- Strict null checks in hooks and components

### 2. Deploy Cloudflare Worker

**Setup:**
```bash
# Install wrangler globally
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Update cf-worker/wrangler.toml with your account_id
```

**Deploy:**
```bash
cd cf-worker
wrangler deploy
```

This will give you a worker URL like:
`https://puck-version.YOUR_WORKER.workers.dev`

**Update src/index.tsx:**
Replace the placeholder URL on line 10:
```typescript
const VERSION_API_URL = 'https://puck-version.YOUR_ACTUAL_WORKER.workers.dev/api/version';
```

### 3. Test Locally Before Publishing

**Build:**
```bash
bun run build
```

**Test with npm pack:**
```bash
npm pack
npm install -g ./puck-0.1.0.tgz
puck --skip-version-check  # Test the command works
```

**Uninstall test:**
```bash
npm uninstall -g puck
```

## Publishing to npm

### First Release (v0.1.0)

**Manual approach:**
```bash
# 1. Ensure clean git state
git status

# 2. Build
bun run build

# 3. Test executable permissions
ls -la dist/index.js  # Should show -rwxr-xr-x

# 4. Publish to npm
npm publish
```

**Using release script:**
```bash
./scripts/release.sh patch  # For patch version bump
# OR
./scripts/release.sh minor  # For minor version bump
# OR
./scripts/release.sh major  # For major version bump
```

The script will:
- Check git is clean
- Build the project
- Bump version in package.json
- Create git commit and tag
- Publish to npm
- Push changes to remote

### After npm Publish

**Get tarball SHA256 for Homebrew:**
```bash
# Download the published tarball
curl -L https://registry.npmjs.org/puck/-/puck-0.1.0.tgz -o puck-0.1.0.tgz

# Calculate SHA256
shasum -a 256 puck-0.1.0.tgz
```

**Update puck.rb:**
Replace the empty `sha256 ""` with the calculated hash.

## Setting Up Homebrew Distribution

### 1. Create Homebrew Tap Repository

Create a new GitHub repository: `yourusername/homebrew-puck`

```bash
# Clone the repo
git clone https://github.com/yourusername/homebrew-puck.git
cd homebrew-puck

# Create Formula directory
mkdir Formula
cp /path/to/nhl-tui/puck.rb Formula/puck.rb

# Update puck.rb with correct SHA256 (from above)

# Commit and push
git add Formula/puck.rb
git commit -m "Add puck formula"
git push
```

### 2. Test Homebrew Installation

```bash
# Add your tap
brew tap yourusername/puck

# Install
brew install puck

# Test
puck --skip-version-check
```

### 3. Update Formula for New Releases

After each npm publish:
1. Get new tarball SHA256
2. Update Formula/puck.rb:
   - Change `url` version
   - Update `sha256`
3. Commit and push

## Version Management

### Updating Minimum Version

When you need to force users to upgrade:

**Update Cloudflare Worker:**
Edit `cf-worker/version.ts` and change:
```typescript
minVersion: '0.2.0',  // Users below this will be blocked
latestVersion: '0.2.0',
```

Redeploy:
```bash
cd cf-worker
wrangler deploy
```

**No client code changes needed** - version check happens at runtime.

### Updating Client Version

When releasing a new version:

**Update src/index.tsx:**
```typescript
const CURRENT_VERSION = '0.2.0'; // Line 11
```

**Run release script:**
```bash
./scripts/release.sh patch  # or minor/major
```

## Post-Release Tasks

1. **Create GitHub Release:**
   - Go to GitHub → Releases → Draft new release
   - Tag: `v0.1.0`
   - Title: `v0.1.0`
   - Description: Release notes

2. **Update Homebrew Tap:**
   - Update SHA256 in Formula/puck.rb
   - Commit and push

3. **Test Installation:**
   ```bash
   # npm
   npm install -g puck
   puck

   # Homebrew
   brew upgrade puck
   puck
   ```

## User Installation

### npm
```bash
npm install -g puck
puck
```

### Homebrew
```bash
brew tap yourusername/puck
brew install puck
puck
```

## Troubleshooting

### Build Errors
If TypeScript compilation fails, ensure all strict checks pass:
```bash
bunx tsc --noEmit
```

### Executable Permissions
If dist/index.js isn't executable after build:
```bash
chmod +x dist/index.js
```

### Version Check Failing
Users can bypass with:
```bash
puck --skip-version-check
```

### Cloudflare Worker Issues
Check worker logs:
```bash
wrangler tail
```

## Future Enhancements

- [ ] Automate Homebrew formula updates via CI
- [ ] Add telemetry to Cloudflare Worker
- [ ] Cache version check results locally
- [ ] Support pre-built binaries for non-Bun users
- [ ] Add GitHub Actions for automated releases
