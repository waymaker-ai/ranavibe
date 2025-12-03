export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent">
            RANA
          </h1>
          <p className="text-2xl text-gray-600 dark:text-gray-300 mb-4">
            Rapid AI Native Architecture
          </p>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Build production-quality products with AI assistants through proven quality gates (tactical) and REPM validation (strategic)
          </p>

          <div className="flex gap-4 justify-center mb-12">
            <a
              href="#get-started"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Get Started
            </a>
            <a
              href="https://github.com/waymaker-ai/ranavibe"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 border-2 border-blue-600 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors font-semibold"
            >
              View on GitHub
            </a>
          </div>

          <div className="bg-gray-800 text-green-400 p-6 rounded-lg font-mono text-left max-w-2xl mx-auto">
            <div className="text-gray-400"># For Claude Desktop (MCP)</div>
            <div>npm install -g @rana/mcp-server</div>
            <div className="mt-4 text-gray-400"># For CLI</div>
            <div>npm install -g @rana/cli</div>
            <div>rana init</div>
          </div>
        </div>
      </section>

      {/* Why RANA Section */}
      <section className="container mx-auto px-4 py-16 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Why RANA?</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            90% of AI-generated code needs fixes. RANA ensures production-quality from the start.
          </p>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h3 className="font-bold mb-2">⚡ Ship Faster</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No rework cycles. Production-ready code first time, every time.
              </p>
            </div>
            <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h3 className="font-bold mb-2">🎯 Build Right</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Strategic validation prevents bad ideas, validates good ones.
              </p>
            </div>
            <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h3 className="font-bold mb-2">🚀 Scale Confidently</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Consistent quality gates and design system across your team.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12">Complete Framework</h2>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-2xl font-bold mb-4">Quality Gates</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Tactical execution framework ensuring production-quality code at every phase
            </p>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              <li>✅ Pre-implementation validation</li>
              <li>✅ Implementation standards</li>
              <li>✅ Testing requirements</li>
              <li>✅ Deployment verification</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold mb-4">REPM Validation</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Strategic framework for validating WHAT to build and WHY before HOW
            </p>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              <li>✅ Outcome definition</li>
              <li>✅ Monetization validation</li>
              <li>✅ Go-to-market strategy</li>
              <li>✅ UX journey mapping</li>
              <li>✅ Product prioritization</li>
              <li>✅ Build planning</li>
              <li>✅ GO/NO-GO decision</li>
            </ul>
          </div>
        </div>

        {/* Additional Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <div className="text-3xl mb-3">🛠️</div>
            <h3 className="text-xl font-bold mb-2">Powerful CLI</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              9 commands for project init, validation, quality gates, REPM, and design system compliance
            </p>
            <code className="text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">rana check pre</code>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <div className="text-3xl mb-3">🎨</div>
            <h3 className="text-xl font-bold mb-2">UI Component Library</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Beautiful glass morphism components with gradients, built with Tailwind CSS
            </p>
            <code className="text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">rana-ui add glass-card</code>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <div className="text-3xl mb-3">📏</div>
            <h3 className="text-xl font-bold mb-2">Design System Checker</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Automated design system compliance checking with coverage metrics and violation reports
            </p>
            <code className="text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">rana design-coverage</code>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <div className="text-3xl mb-3">🔌</div>
            <h3 className="text-xl font-bold mb-2">Claude Code Integration</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              MCP server with 6 tools, 3 resources, and guided prompts for seamless Claude integration
            </p>
            <code className="text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">@rana/mcp-server</code>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <div className="text-3xl mb-3">📦</div>
            <h3 className="text-xl font-bold mb-2">TypeScript SDK</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Programmatic access to all RANA features for custom integrations and automation
            </p>
            <code className="text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">@rana/sdk</code>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <div className="text-3xl mb-3">📚</div>
            <h3 className="text-xl font-bold mb-2">Complete Documentation</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              11 comprehensive guides including quick start, REPM methodology, and prompt library
            </p>
            <code className="text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">docs.rana.cx</code>
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12">Multi-Platform Integration</h2>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center">
            <h3 className="text-xl font-bold mb-2">Claude Desktop</h3>
            <p className="text-gray-600 dark:text-gray-400">MCP Server Integration</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center">
            <h3 className="text-xl font-bold mb-2">ChatGPT</h3>
            <p className="text-gray-600 dark:text-gray-400">Custom GPT + Actions</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center">
            <h3 className="text-xl font-bold mb-2">Gemini</h3>
            <p className="text-gray-600 dark:text-gray-400">Extensions</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="get-started" className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12">Open Core Model</h2>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl font-bold mb-4">Free Forever</h3>
            <div className="text-4xl font-bold mb-6">$0</div>
            <ul className="space-y-3 text-gray-600 dark:text-gray-400 mb-8">
              <li>✅ Core framework (MIT)</li>
              <li>✅ CLI tool</li>
              <li>✅ Documentation</li>
              <li>✅ Self-hosted everything</li>
            </ul>
            <a
              href="https://github.com/waymaker-ai/ranavibe"
              className="block text-center px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors font-semibold"
            >
              Get Started
            </a>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-8 rounded-xl shadow-xl text-white transform scale-105">
            <h3 className="text-2xl font-bold mb-4">Pro</h3>
            <div className="text-4xl font-bold mb-6">$29<span className="text-lg">/mo</span></div>
            <ul className="space-y-3 mb-8">
              <li>✅ Everything in Free</li>
              <li>✅ Hosted API</li>
              <li>✅ Analytics dashboard</li>
              <li>✅ REPM guided validation</li>
              <li>✅ Team collaboration</li>
              <li>✅ Priority support</li>
            </ul>
            <a
              href="#waitlist"
              className="block text-center px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
            >
              Join Waitlist
            </a>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl font-bold mb-4">Enterprise</h3>
            <div className="text-4xl font-bold mb-6">Custom</div>
            <ul className="space-y-3 text-gray-600 dark:text-gray-400 mb-8">
              <li>✅ Everything in Pro</li>
              <li>✅ Custom quality gates</li>
              <li>✅ SSO/SAML</li>
              <li>✅ On-premise deployment</li>
              <li>✅ Dedicated support</li>
              <li>✅ SLA guarantee</li>
            </ul>
            <a
              href="#contact"
              className="block text-center px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors font-semibold"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-12">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
          <p className="mb-4">
            Created with ❤️ by{' '}
            <a
              href="https://betr.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              betr.ai
            </a>
            {' '}and{' '}
            <a
              href="https://waymaker.cx"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              waymaker.cx
            </a>
          </p>
          <p className="mb-4 text-sm">
            Sponsored by{' '}
            <a
              href="https://betr.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              betr.ai
            </a>
            {' '}· With special support from the team
          </p>
          <div className="flex gap-6 justify-center">
            <a href="https://github.com/waymaker-ai/ranavibe" className="hover:text-blue-600">
              GitHub
            </a>
            <a href="https://rana.cx/docs" className="hover:text-blue-600">
              Documentation
            </a>
            <a href="https://twitter.com/waymaker_ai" className="hover:text-blue-600">
              Twitter
            </a>
          </div>
          <p className="mt-6 text-sm">MIT License © 2025 Waymaker AI</p>
        </div>
      </footer>
    </div>
  )
}
