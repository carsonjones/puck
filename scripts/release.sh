#!/bin/bash
set -e

# Release script for puck
# Usage: ./scripts/release.sh [patch|minor|major]

VERSION_TYPE=${1:-patch}

echo "🚀 Starting release process..."

# 1. Check for clean git state
if [[ -n $(git status -s) ]]; then
  echo "❌ Git working directory is not clean. Commit or stash changes first."
  exit 1
fi

# 2. Ensure on main branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$BRANCH" != "main" ]]; then
  echo "⚠️  Not on main branch. Current branch: $BRANCH"
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# 3. Run build and tests
echo "📦 Building..."
bun run build

echo "✅ Build successful"

# 4. Bump version
echo "📝 Bumping version ($VERSION_TYPE)..."
npm version $VERSION_TYPE --no-git-tag-version

NEW_VERSION=$(node -p "require('./package.json').version")
echo "New version: $NEW_VERSION"

# 5. Commit version bump
git add package.json
git commit -m "chore: bump version to $NEW_VERSION"

# 6. Create git tag
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"

# 7. Publish to npm
echo "📤 Publishing to npm..."
npm publish

# 8. Push commits and tags
echo "⬆️  Pushing to remote..."
git push origin $BRANCH
git push origin "v$NEW_VERSION"

# 9. Calculate SHA256 for Homebrew formula
echo ""
echo "✅ Release complete!"
echo ""
echo "📋 Next steps:"
echo "1. Deploy Cloudflare Worker (if not already deployed)"
echo "2. Update puck.rb SHA256:"
echo "   - Download tarball: curl -L https://registry.npmjs.org/puck/-/puck-$NEW_VERSION.tgz -o puck-$NEW_VERSION.tgz"
echo "   - Calculate SHA256: shasum -a 256 puck-$NEW_VERSION.tgz"
echo "   - Update puck.rb with the hash"
echo "3. Create GitHub release with notes"
echo "4. Update Homebrew tap repository"
echo ""
