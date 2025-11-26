# RANA v2.0 Quick Setup Script (PowerShell)
# This script sets up your local development environment for RANA

$ErrorActionPreference = "Stop"

Write-Host "🚀 RANA v2.0 Quick Setup Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js version
Write-Host "Checking Node.js version..." -ForegroundColor Blue
try {
    $nodeVersion = node -v
    $nodeMajor = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($nodeMajor -lt 18) {
        Write-Host "❌ Node.js 18+ required. You have: $nodeVersion" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Node.js not found" -ForegroundColor Red
    exit 1
}

# Check npm
Write-Host "Checking npm..." -ForegroundColor Blue
try {
    $npmVersion = npm -v
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ npm not found" -ForegroundColor Red
    exit 1
}

# Install root dependencies
Write-Host "Installing root dependencies..." -ForegroundColor Blue
npm install
Write-Host "✅ Root dependencies installed" -ForegroundColor Green
Write-Host ""

# Setup core package
Write-Host "Setting up @rana/core package..." -ForegroundColor Blue
Set-Location packages/core
npm install
npm run build
Write-Host "✅ @rana/core built successfully" -ForegroundColor Green
Set-Location ../..
Write-Host ""

# Setup React package
Write-Host "Setting up @rana/react package..." -ForegroundColor Blue
Set-Location packages/react
npm install
npm run build
Write-Host "✅ @rana/react built successfully" -ForegroundColor Green
Set-Location ../..
Write-Host ""

# Setup CLI
Write-Host "Setting up @rana/cli..." -ForegroundColor Blue
Set-Location tools/cli
npm install
npm run build
Write-Host "✅ @rana/cli built successfully" -ForegroundColor Green
Set-Location ../..
Write-Host ""

# Setup example project
Write-Host "Setting up example project..." -ForegroundColor Blue
Set-Location examples/sdk-demo
npm install
Write-Host "✅ Example project ready" -ForegroundColor Green
Set-Location ../..
Write-Host ""

# Link packages for local development
Write-Host "Linking packages for local development..." -ForegroundColor Blue
Set-Location packages/core
npm link
Set-Location ../react
npm link @rana/core
npm link
Set-Location ../../examples/sdk-demo
npm link @rana/core
npm link @rana/react
Set-Location ../..
Write-Host "✅ Packages linked" -ForegroundColor Green
Write-Host ""

# Create .env template if it doesn't exist
if (-not (Test-Path .env)) {
    Write-Host "Creating .env template..." -ForegroundColor Blue
    @"
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
"@ | Out-File -FilePath .env -Encoding UTF8
    Write-Host "✅ .env template created" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env already exists, skipping" -ForegroundColor Yellow
}
Write-Host ""

# Test installation
Write-Host "Testing installation..." -ForegroundColor Blue
try {
    node -e "const { createRana } = require('./packages/core/dist/index.js'); console.log('✅ @rana/core works!');"
} catch {
    Write-Host "❌ @rana/core test failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ RANA Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Blue
Write-Host ""
Write-Host "1. Add your API keys to .env file:"
Write-Host "   notepad .env" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Try the quick start:"
Write-Host "   cd examples/sdk-demo" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Run the examples:"
Write-Host "   node examples/sdk-demo/src/core-examples.ts" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. Start building:"
Write-Host "   import { createRana } from '@rana/core';" -ForegroundColor Yellow
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Blue
Write-Host "   • Quick Start: ./SDK_QUICK_START.md" -ForegroundColor Yellow
Write-Host "   • Full Guide: ./RANA_SDK_GUIDE.md" -ForegroundColor Yellow
Write-Host "   • Examples: ./examples/" -ForegroundColor Yellow
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Blue
Write-Host "   • Build all: npm run build:all" -ForegroundColor Yellow
Write-Host "   • Test all: npm test" -ForegroundColor Yellow
Write-Host "   • CLI: rana --help" -ForegroundColor Yellow
Write-Host ""
Write-Host "Happy coding with RANA! 🚀" -ForegroundColor Green
