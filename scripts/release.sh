#!/bin/bash

# Release Script for Marcus AI Assistant
# Usage: ./scripts/release.sh [version]

set -e

VERSION=${1:-"patch"}
CURRENT_VERSION=$(node -p "require('./package.json').version")

echo "🚀 Marcus AI Assistant Release Script"
echo "Current version: $CURRENT_VERSION"
echo "Release type: $VERSION"

# Calculate new version
if [[ "$VERSION" == "patch" || "$VERSION" == "minor" || "$VERSION" == "major" ]]; then
    NEW_VERSION=$(npm version $VERSION --no-git-tag-version)
elif [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    npm version $VERSION --no-git-tag-version
    NEW_VERSION=$VERSION
else
    echo "❌ Invalid version. Use: patch, minor, major, or specific version like 1.8.1"
    exit 1
fi

echo "📦 New version: $NEW_VERSION"

# Build and test
echo "🔨 Building application..."
npm run build:electron

echo "✅ Build successful!"

# Create git tag and push
echo "🏷️  Creating git tag..."
git add package.json package-lock.json
git commit -m "🚀 Release v$NEW_VERSION"
git tag "v$NEW_VERSION"

echo "📤 Pushing to GitHub..."
git push origin main
git push origin "v$NEW_VERSION"

echo "✅ Release v$NEW_VERSION created and pushed!"
echo "🌐 GitHub Actions will build and release automatically."
echo "📊 Check: https://github.com/AConteh33/Marcus-2.0/releases"
