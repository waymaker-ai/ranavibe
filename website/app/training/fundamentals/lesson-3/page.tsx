import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Setting Up Your Environment | RANA Fundamentals',
  description: 'Configure your development environment for RANA development',
};

export default function Lesson3Page() {
  return (
    <div className="py-12 md:py-20">
      <div className="container-narrow">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/training/fundamentals"
            className="inline-flex items-center text-foreground-secondary hover:text-foreground transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Link>
          <span className="text-sm text-foreground-secondary">Lesson 3 of 8</span>
        </div>

        {/* Content */}
        <article className="prose prose-lg max-w-none">
          <h1>Setting Up Your Environment</h1>

          <p className="lead">
            Let&apos;s configure your development environment for RANA development.
            This lesson covers installation, configuration, and verification.
          </p>

          <h2>Prerequisites</h2>

          <ul>
            <li>Node.js 18.0 or higher</li>
            <li>npm 9.0+ or pnpm 8.0+</li>
            <li>An API key from at least one LLM provider</li>
            <li>A code editor (VS Code recommended)</li>
          </ul>

          <h2>Step 1: Create a New Project</h2>

          <p>
            The fastest way to start is with create-rana-app:
          </p>

          <div className="code-block">
            <pre>
              <code>{`npx create-rana-app my-ai-app
cd my-ai-app`}</code>
            </pre>
          </div>

          <p>
            This creates a new project with:
          </p>

          <ul>
            <li>Next.js 14 with App Router</li>
            <li>TypeScript configuration</li>
            <li>RANA packages pre-installed</li>
            <li>Example chat component</li>
            <li>API route template</li>
            <li>Environment file template</li>
          </ul>

          <h2>Step 2: Configure API Keys</h2>

          <p>
            Copy the environment template and add your API keys:
          </p>

          <div className="code-block">
            <pre>
              <code>{`cp .env.example .env.local`}</code>
            </pre>
          </div>

          <p>
            Edit .env.local with your keys:
          </p>

          <div className="code-block">
            <pre>
              <code>{`# .env.local

# Choose at least one provider
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=AIza...

# Optional: Default model
RANA_DEFAULT_MODEL=claude-sonnet-4-20250514`}</code>
            </pre>
          </div>

          <div className="card bg-yellow-500/10 border-yellow-500/30 my-6">
            <p className="text-yellow-500 font-medium mb-2">Security Note</p>
            <p className="text-sm text-foreground-secondary">
              Never commit .env.local to git. It&apos;s already in .gitignore by default.
            </p>
          </div>

          <h2>Step 3: Verify Installation</h2>

          <p>
            Run the doctor command to verify everything is configured correctly:
          </p>

          <div className="code-block">
            <pre>
              <code>{`npx rana doctor`}</code>
            </pre>
          </div>

          <p>
            You should see output like:
          </p>

          <div className="code-block">
            <pre>
              <code>{`✓ Node.js version: 20.10.0
✓ npm version: 10.2.3
✓ @rana/core: 1.0.0
✓ @rana/react: 1.0.0
✓ @rana/prompts: 1.0.0
✓ ANTHROPIC_API_KEY: configured
✓ TypeScript: configured
✓ Next.js: configured

All checks passed! Your environment is ready.`}</code>
            </pre>
          </div>

          <h2>Step 4: Start Development Server</h2>

          <div className="code-block">
            <pre>
              <code>{`npm run dev`}</code>
            </pre>
          </div>

          <p>
            Open http://localhost:3000 to see the example chat application.
          </p>

          <h2>Project Structure</h2>

          <p>
            Your new project has this structure:
          </p>

          <div className="code-block">
            <pre>
              <code>{`my-ai-app/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts    # Chat API endpoint
│   ├── page.tsx            # Home page with chat
│   └── layout.tsx          # Root layout
├── components/
│   └── Chat.tsx            # Chat component
├── lib/
│   └── agent.ts            # Agent configuration
├── .env.example            # Environment template
├── .env.local              # Your API keys (git-ignored)
├── package.json
├── tsconfig.json
└── next.config.js`}</code>
            </pre>
          </div>

          <h2>VS Code Setup (Recommended)</h2>

          <p>
            For the best development experience, install these VS Code extensions:
          </p>

          <ul>
            <li><strong>TypeScript</strong> - Built-in, ensure it&apos;s enabled</li>
            <li><strong>ESLint</strong> - For code linting</li>
            <li><strong>Prettier</strong> - For code formatting</li>
            <li><strong>Tailwind CSS IntelliSense</strong> - For styling</li>
          </ul>

          <p>
            Add these settings to .vscode/settings.json:
          </p>

          <div className="code-block">
            <pre>
              <code>{`{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.tsdk": "node_modules/typescript/lib"
}`}</code>
            </pre>
          </div>

          <h2>Troubleshooting</h2>

          <h3>API Key Not Working</h3>
          <ul>
            <li>Check for extra spaces or quotes in .env.local</li>
            <li>Verify the key is valid in your provider&apos;s dashboard</li>
            <li>Restart the dev server after changing .env.local</li>
          </ul>

          <h3>Module Not Found Errors</h3>
          <div className="code-block">
            <pre>
              <code>{`rm -rf node_modules package-lock.json
npm install`}</code>
            </pre>
          </div>

          <h3>TypeScript Errors</h3>
          <ul>
            <li>Ensure TypeScript 5.0+ is installed</li>
            <li>Restart VS Code TypeScript server (Cmd/Ctrl+Shift+P → Restart TS Server)</li>
          </ul>

          <h2>Checklist</h2>

          <div className="card bg-background-secondary">
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Created project with create-rana-app</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Configured API keys in .env.local</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Verified with rana doctor</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Started dev server successfully</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Tested example chat application</span>
              </li>
            </ul>
          </div>

          <h2>What&apos;s Next?</h2>

          <p>
            Your environment is ready! In the next lesson, we&apos;ll build your
            first RANA project from scratch to understand all the pieces.
          </p>
        </article>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <Link
            href="/training/fundamentals/lesson-2"
            className="text-foreground-secondary hover:text-foreground transition-colors"
          >
            <ArrowLeft className="inline mr-2 h-4 w-4" />
            Previous: Core Architecture
          </Link>
          <Link
            href="/training/fundamentals/lesson-4"
            className="btn-primary px-6 py-3 group"
          >
            Next: Your First RANA Project
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
