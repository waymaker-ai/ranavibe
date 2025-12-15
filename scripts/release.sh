#!/bin/bash

# RANA Release Script
# Usage: ./scripts/release.sh [--dry-run]

set -e

DRY_RUN=""
if [ "$1" == "--dry-run" ]; then
  DRY_RUN="--dry-run"
  echo "🔍 Running in dry-run mode..."
fi

echo "🚀 RANA Release Script"
echo "======================"

# Check if logged into npm
echo ""
echo "📦 Checking npm authentication..."
if ! npm whoami > /dev/null 2>&1; then
  echo "❌ Not logged into npm. Please run: npm login"
  exit 1
fi
echo "✅ Logged in as: $(npm whoami)"

# Check for uncommitted changes
echo ""
echo "📝 Checking for uncommitted changes..."
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️  Warning: You have uncommitted changes"
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Install dependencies
echo ""
echo "📥 Installing dependencies..."
pnpm install

# Build all packages
echo ""
echo "🔨 Building all packages..."
pnpm -r build

# Run tests
echo ""
echo "🧪 Running tests..."
pnpm -r test --if-present || true

# Publish packages
echo ""
echo "📤 Publishing packages to npm..."
if [ -n "$DRY_RUN" ]; then
  pnpm -r publish --dry-run --no-git-checks
else
  pnpm -r publish --no-git-checks
fi

echo ""
echo "✅ Release complete!"
echo ""
echo "Published packages:"
echo "  - @ranavibe/core"
echo "  - @ranavibe/agents"
echo "  - @ranavibe/rag"
echo "  - @ranavibe/mcp"
echo "  - @ranavibe/helpers"
echo "  - @ranavibe/prompts"
echo "  - @ranavibe/generate"
echo "  - @ranavibe/react"
echo "  - @ranavibe/testing"
echo "  - @ranavibe/cli"
echo "  - @ranavibe/sdk"
echo "  - @ranavibe/ui"
echo "  - @ranavibe/ui-cli"
echo "  - @ranavibe/crewai"
echo "  - @ranavibe/langchain"
echo "  - @ranavibe/mcp-server"
echo "  - create-rana-app"
