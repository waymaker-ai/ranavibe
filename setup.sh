#!/bin/bash

# RANA v2.0 Quick Setup Script
# This script sets up your local development environment for RANA

set -e  # Exit on error

echo "🚀 RANA v2.0 Quick Setup Script"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Node.js version
echo -e "${BLUE}Checking Node.js version...${NC}"
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js 18+ required. You have: $(node -v)${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js version: $(node -v)${NC}"
echo ""

# Check npm
echo -e "${BLUE}Checking npm...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm version: $(npm -v)${NC}"
echo ""

# Install root dependencies
echo -e "${BLUE}Installing root dependencies...${NC}"
npm install
echo -e "${GREEN}✅ Root dependencies installed${NC}"
echo ""

# Setup core package
echo -e "${BLUE}Setting up @rana/core package...${NC}"
cd packages/core
npm install
npm run build
echo -e "${GREEN}✅ @rana/core built successfully${NC}"
cd ../..
echo ""

# Setup React package
echo -e "${BLUE}Setting up @rana/react package...${NC}"
cd packages/react
npm install
npm run build
echo -e "${GREEN}✅ @rana/react built successfully${NC}"
cd ../..
echo ""

# Setup CLI
echo -e "${BLUE}Setting up @rana/cli...${NC}"
cd tools/cli
npm install
npm run build
echo -e "${GREEN}✅ @rana/cli built successfully${NC}"
cd ../..
echo ""

# Setup example project
echo -e "${BLUE}Setting up example project...${NC}"
cd examples/sdk-demo
npm install
echo -e "${GREEN}✅ Example project ready${NC}"
cd ../..
echo ""

# Link packages for local development
echo -e "${BLUE}Linking packages for local development...${NC}"
cd packages/core
npm link
cd ../react
npm link @rana/core
npm link
cd ../../examples/sdk-demo
npm link @rana/core @rana/react
cd ../..
echo -e "${GREEN}✅ Packages linked${NC}"
echo ""

# Create .env template if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${BLUE}Creating .env template...${NC}"
    cat > .env << 'EOF'
# RANA Configuration
# Copy this to your project and fill in your API keys

# Required: At least one provider
ANTHROPIC_API_KEY=your_anthropic_key_here
OPENAI_API_KEY=your_openai_key_here

# Optional: Additional providers
GOOGLE_API_KEY=your_google_key_here
XAI_API_KEY=your_xai_key_here
MISTRAL_API_KEY=your_mistral_key_here
COHERE_API_KEY=your_cohere_key_here
TOGETHER_API_KEY=your_together_key_here
GROQ_API_KEY=your_groq_key_here

# Optional: Cache configuration
REDIS_URL=redis://localhost:6379
CACHE_TTL=3600

# Optional: Optimization settings
RANA_OPTIMIZE=cost
RANA_DEFAULT_PROVIDER=anthropic
EOF
    echo -e "${GREEN}✅ .env template created${NC}"
else
    echo -e "${YELLOW}⚠️  .env already exists, skipping${NC}"
fi
echo ""

# Test installation
echo -e "${BLUE}Testing installation...${NC}"
node -e "
try {
  const { createRana } = require('./packages/core/dist/index.js');
  console.log('✅ @rana/core works!');
} catch (err) {
  console.error('❌ @rana/core test failed:', err.message);
  process.exit(1);
}
"
echo ""

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ RANA Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo ""
echo "1. Add your API keys to .env file:"
echo "   ${YELLOW}nano .env${NC}"
echo ""
echo "2. Try the quick start:"
echo "   ${YELLOW}cd examples/sdk-demo${NC}"
echo "   ${YELLOW}npm run dev${NC}"
echo ""
echo "3. Run the examples:"
echo "   ${YELLOW}node examples/sdk-demo/src/core-examples.ts${NC}"
echo ""
echo "4. Start building:"
echo "   ${YELLOW}import { createRana } from '@rana/core';${NC}"
echo ""
echo -e "${BLUE}Documentation:${NC}"
echo "   • Quick Start: ${YELLOW}./SDK_QUICK_START.md${NC}"
echo "   • Full Guide: ${YELLOW}./RANA_SDK_GUIDE.md${NC}"
echo "   • Examples: ${YELLOW}./examples/${NC}"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo "   • Build all: ${YELLOW}npm run build:all${NC}"
echo "   • Test all: ${YELLOW}npm test${NC}"
echo "   • CLI: ${YELLOW}rana --help${NC}"
echo ""
echo -e "${GREEN}Happy coding with RANA! 🚀${NC}"
