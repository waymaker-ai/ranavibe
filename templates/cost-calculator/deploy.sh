#!/bin/bash

# LUKA Cost Calculator - Deployment Script
# Created by Waymaker (Ashley Kays & Christian Moore)
# Made with love to help you succeed faster ❤️

set -e

echo "🚀 LUKA Cost Calculator Deployment"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if deployment platform is specified
if [ -z "$1" ]; then
  echo -e "${YELLOW}Usage: ./deploy.sh [vercel|netlify|github-pages]${NC}"
  echo ""
  echo "Examples:"
  echo "  ./deploy.sh vercel        - Deploy to Vercel"
  echo "  ./deploy.sh netlify       - Deploy to Netlify"
  echo "  ./deploy.sh github-pages  - Deploy to GitHub Pages"
  exit 1
fi

PLATFORM=$1

# Function to check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to deploy to Vercel
deploy_vercel() {
  echo -e "${BLUE}📦 Deploying to Vercel...${NC}"

  if ! command_exists vercel; then
    echo -e "${RED}❌ Vercel CLI not found${NC}"
    echo "Install with: npm i -g vercel"
    exit 1
  fi

  echo -e "${GREEN}✓ Vercel CLI found${NC}"

  # Deploy
  echo -e "${BLUE}Deploying...${NC}"
  vercel --prod

  echo -e "${GREEN}✅ Deployed to Vercel!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Add custom domain: vercel domains add calculator.luka.dev"
  echo "2. Configure DNS CNAME: calculator → cname.vercel-dns.com"
  echo "3. Verify: https://calculator.luka.dev"
}

# Function to deploy to Netlify
deploy_netlify() {
  echo -e "${BLUE}📦 Deploying to Netlify...${NC}"

  if ! command_exists netlify; then
    echo -e "${RED}❌ Netlify CLI not found${NC}"
    echo "Install with: npm i -g netlify-cli"
    exit 1
  fi

  echo -e "${GREEN}✓ Netlify CLI found${NC}"

  # Deploy
  echo -e "${BLUE}Deploying...${NC}"
  netlify deploy --prod --dir=.

  echo -e "${GREEN}✅ Deployed to Netlify!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Add custom domain: netlify domains:add calculator.luka.dev"
  echo "2. Configure DNS CNAME: calculator → <your-site>.netlify.app"
  echo "3. Verify: https://calculator.luka.dev"
}

# Function to deploy to GitHub Pages
deploy_github_pages() {
  echo -e "${BLUE}📦 Deploying to GitHub Pages...${NC}"

  if ! command_exists git; then
    echo -e "${RED}❌ Git not found${NC}"
    exit 1
  fi

  echo -e "${GREEN}✓ Git found${NC}"

  # Check if we're in a git repository
  if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ Not in a git repository${NC}"
    echo "Initialize with: git init"
    exit 1
  fi

  echo -e "${GREEN}✓ Git repository detected${NC}"

  # Create gh-pages branch if it doesn't exist
  if ! git rev-parse --verify gh-pages > /dev/null 2>&1; then
    echo -e "${BLUE}Creating gh-pages branch...${NC}"
    git checkout -b gh-pages
  else
    echo -e "${BLUE}Switching to gh-pages branch...${NC}"
    git checkout gh-pages
  fi

  # Add and commit files
  git add index.html README.md netlify.toml vercel.json
  git commit -m "Deploy cost calculator to GitHub Pages"

  # Push to GitHub
  echo -e "${BLUE}Pushing to GitHub...${NC}"
  git push -u origin gh-pages

  echo -e "${GREEN}✅ Deployed to GitHub Pages!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Enable GitHub Pages in repo settings"
  echo "2. Settings → Pages → Source: gh-pages branch"
  echo "3. Add custom domain (optional): calculator.luka.dev"
  echo "4. Configure DNS CNAME: calculator → <username>.github.io"
  echo "5. Verify: https://<username>.github.io/<repo>"
}

# Main deployment logic
case $PLATFORM in
  vercel)
    deploy_vercel
    ;;
  netlify)
    deploy_netlify
    ;;
  github-pages)
    deploy_github_pages
    ;;
  *)
    echo -e "${RED}❌ Unknown platform: $PLATFORM${NC}"
    echo "Supported platforms: vercel, netlify, github-pages"
    exit 1
    ;;
esac

# Verify deployment
echo ""
echo -e "${BLUE}🔍 Verifying deployment...${NC}"
echo ""

# Wait a bit for DNS/CDN propagation
sleep 5

# Check if URL is accessible (skip for github-pages as URL varies)
if [ "$PLATFORM" != "github-pages" ]; then
  URL="https://calculator.luka.dev"

  if command_exists curl; then
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $URL || echo "000")

    if [ "$HTTP_STATUS" = "200" ]; then
      echo -e "${GREEN}✅ Site is live and responding!${NC}"
      echo -e "${GREEN}🔗 $URL${NC}"
    else
      echo -e "${YELLOW}⚠️  Site returned HTTP $HTTP_STATUS${NC}"
      echo "This might be normal if DNS hasn't propagated yet."
      echo "Wait a few minutes and try: curl -I $URL"
    fi
  fi
fi

echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo "Created by Waymaker (Ashley Kays & Christian Moore)"
echo "Made with love to help you succeed faster ❤️"
echo ""
