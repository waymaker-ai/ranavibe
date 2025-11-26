import { generateMetadata } from '@/components/SEO';

/**
 * Home page metadata
 */
export const metadata = generateMetadata({
  title: 'Home',
  description: 'Welcome to our app built with RANA Framework',
  image: '/og-image.png',
  url: '/',
});

/**
 * Home page component
 */
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-24">
      <div className="max-w-5xl w-full">
        {/* Skip to content link for accessibility */}
        <a href="#main-content" className="skip-to-content">
          Skip to content
        </a>

        <div id="main-content" className="text-center space-y-8">
          {/* Hero section */}
          <h1 className="text-4xl md:text-6xl font-bold">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              RANA
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Your production-ready Next.js + Supabase app with all RANA frameworks
            pre-configured.
          </p>

          {/* Feature grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            <FeatureCard
              icon="🗄️"
              title="Database"
              description="Supabase with Row-Level Security"
            />
            <FeatureCard
              icon="🔒"
              title="Security"
              description="Auth + rate limiting + security headers"
            />
            <FeatureCard
              icon="🤖"
              title="LLM Optimization"
              description="70% cost reduction with caching"
            />
            <FeatureCard
              icon="🔍"
              title="SEO"
              description="Sitemap, meta tags, structured data"
            />
            <FeatureCard
              icon="📱"
              title="Mobile-First"
              description="PWA-ready with touch optimization"
            />
            <FeatureCard
              icon="🚀"
              title="Deploy"
              description="Vercel, Railway, or self-hosted"
            />
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
            <a
              href="/docs"
              className="touch-target px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Get Started
            </a>
            <a
              href="https://github.com/waymaker-ai/aads-framework"
              target="_blank"
              rel="noopener noreferrer"
              className="touch-target px-8 py-3 border-2 border-gray-300 dark:border-gray-700 rounded-lg font-semibold hover:border-gray-400 transition-colors"
            >
              View on GitHub
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 pt-16 border-t border-gray-200 dark:border-gray-800">
            <StatCard label="Setup Time" value="5 min" />
            <StatCard label="Cost Savings" value="70%" />
            <StatCard label="Security Score" value="95/100" />
            <StatCard label="Lighthouse" value="100" />
          </div>
        </div>
      </div>
    </main>
  );
}

/**
 * Feature card component
 */
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}

/**
 * Stat card component
 */
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-blue-600">{value}</div>
      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{label}</div>
    </div>
  );
}
