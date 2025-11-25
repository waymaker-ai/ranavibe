import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'What is RANA? | RANA Fundamentals',
  description: 'Introduction to the RANA framework and its core principles',
};

export default function Lesson1Page() {
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
          <span className="text-sm text-foreground-secondary">Lesson 1 of 8</span>
        </div>

        {/* Content */}
        <article className="prose prose-lg max-w-none">
          <h1>What is RANA?</h1>

          <p className="lead">
            RANA (React Agent Next Architecture) is a professional framework for
            building production-ready AI agents with React and Next.js. It provides
            a complete architecture for developing, deploying, and scaling
            intelligent applications.
          </p>

          <h2>Why RANA?</h2>

          <p>
            Building AI agents from scratch is challenging. You need to handle:
          </p>

          <ul>
            <li>LLM integration and API management</li>
            <li>Streaming responses and real-time updates</li>
            <li>State management and conversation history</li>
            <li>Error handling and retry logic</li>
            <li>Security, rate limiting, and cost optimization</li>
            <li>Authentication and authorization</li>
            <li>Database integration and caching</li>
            <li>Production deployment and monitoring</li>
          </ul>

          <p>
            RANA solves all of these problems with a cohesive, type-safe framework
            that follows industry best practices.
          </p>

          <h2>Core Principles</h2>

          <h3>1. Type Safety First</h3>
          <p>
            RANA is built with TypeScript from the ground up. Every API, hook, and
            component is fully typed with comprehensive inference. You get
            autocomplete and compile-time error checking throughout your entire
            application.
          </p>

          <div className="code-block">
            <pre>
              <code>{`import { useAgent } from '@rana/react';

// Full type inference
const { send, messages, isLoading } = useAgent({
  model: 'gpt-4',
  systemPrompt: 'You are a helpful assistant',
});

// TypeScript knows the exact shape of messages
messages.map(msg => msg.content); // ✅ Type-safe`}</code>
            </pre>
          </div>

          <h3>2. Production Ready</h3>
          <p>
            RANA isn&apos;t a toy framework—it&apos;s designed for real-world applications.
            It includes:
          </p>

          <ul>
            <li>Built-in security framework with input validation</li>
            <li>Rate limiting and cost controls</li>
            <li>Database integration with Supabase</li>
            <li>Authentication and session management</li>
            <li>Monitoring and observability</li>
            <li>SEO optimization for AI-powered content</li>
          </ul>

          <h3>3. Developer Experience</h3>
          <p>
            RANA prioritizes developer productivity with:
          </p>

          <ul>
            <li>Simple, intuitive APIs</li>
            <li>Comprehensive documentation and training</li>
            <li>CLI tools for scaffolding and management</li>
            <li>Hot module replacement and fast refresh</li>
            <li>Detailed error messages</li>
          </ul>

          <h3>4. Performance Optimized</h3>
          <p>
            Every part of RANA is optimized for performance:
          </p>

          <ul>
            <li>Streaming responses for instant feedback</li>
            <li>Intelligent caching to reduce API calls</li>
            <li>Prompt optimization and compression</li>
            <li>Lazy loading and code splitting</li>
            <li>Edge runtime support</li>
          </ul>

          <h2>Framework Architecture</h2>

          <p>RANA consists of three main packages:</p>

          <h3>@rana/core</h3>
          <p>
            The core LLM client library. Handles API communication, streaming,
            error handling, and retry logic. Works with any JavaScript environment.
          </p>

          <h3>@rana/react</h3>
          <p>
            React hooks and components for building AI interfaces. Provides
            <code>useAgent</code>, <code>useChat</code>, and other hooks for
            managing agent state.
          </p>

          <h3>@rana/cli</h3>
          <p>
            Command-line tools for project initialization, validation, and
            deployment. Includes generators for common patterns and best practices.
          </p>

          <h2>Who Should Use RANA?</h2>

          <p>RANA is perfect for:</p>

          <ul>
            <li>
              <strong>Startups</strong> building AI-powered products who need to
              move fast without sacrificing quality
            </li>
            <li>
              <strong>Agencies</strong> delivering AI projects for clients with
              tight deadlines
            </li>
            <li>
              <strong>Enterprise teams</strong> requiring a secure, scalable
              architecture for internal tools
            </li>
            <li>
              <strong>Indie developers</strong> wanting to ship production-ready AI
              apps without reinventing the wheel
            </li>
          </ul>

          <h2>What&apos;s Next?</h2>

          <p>
            In the next lesson, we&apos;ll dive into the core architecture and explore
            how all the pieces fit together.
          </p>
        </article>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <div className="text-foreground-secondary text-sm">Previous lesson</div>
          <Link
            href="/training/fundamentals/lesson-2"
            className="btn-primary px-6 py-3 group"
          >
            Next: Core Architecture
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
