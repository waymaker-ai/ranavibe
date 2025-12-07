'use client';

import Link from 'next/link';

const caseStudies = [
  {
    company: 'TechCorp AI',
    logo: '🏢',
    industry: 'Enterprise SaaS',
    headline: 'Reduced LLM costs by 60% while improving response quality',
    metrics: [
      { label: 'Cost Reduction', value: '60%' },
      { label: 'Response Time', value: '-40%' },
      { label: 'Uptime', value: '99.9%' },
    ],
    quote: 'RANA\'s cost tracking alone saved us $50k/month. The built-in testing gave us confidence to ship faster.',
    author: 'Sarah Chen',
    role: 'VP of Engineering',
    slug: 'techcorp-ai',
    tags: ['Cost Optimization', 'Testing', 'Enterprise'],
  },
  {
    company: 'HealthAI',
    logo: '🏥',
    industry: 'Healthcare Tech',
    headline: 'Built HIPAA-compliant AI assistant in 2 weeks',
    metrics: [
      { label: 'Dev Time', value: '2 weeks' },
      { label: 'PII Detection', value: '99.7%' },
      { label: 'Compliance', value: 'HIPAA' },
    ],
    quote: 'The PII detection and audit logging made HIPAA compliance straightforward. We launched months ahead of schedule.',
    author: 'Dr. James Miller',
    role: 'CTO',
    slug: 'healthai',
    tags: ['Security', 'Compliance', 'Healthcare'],
  },
  {
    company: 'EduLearn',
    logo: '📚',
    industry: 'EdTech',
    headline: 'Scaled AI tutoring to 1M students with provider fallbacks',
    metrics: [
      { label: 'Students', value: '1M+' },
      { label: 'Availability', value: '99.99%' },
      { label: 'Latency P99', value: '<500ms' },
    ],
    quote: 'RANA\'s automatic fallbacks and circuit breakers mean our students never experience downtime, even during peak hours.',
    author: 'Alex Rodriguez',
    role: 'Head of Platform',
    slug: 'edulearn',
    tags: ['Scale', 'Reliability', 'Education'],
  },
  {
    company: 'DevTools Inc',
    logo: '🛠️',
    industry: 'Developer Tools',
    headline: 'Shipped AI code assistant with 3 engineers in 4 weeks',
    metrics: [
      { label: 'Team Size', value: '3 devs' },
      { label: 'Time to Ship', value: '4 weeks' },
      { label: 'Daily Users', value: '50k+' },
    ],
    quote: 'Coming from LangChain, RANA felt like a breath of fresh air. We shipped in a quarter of the time.',
    author: 'Maria Santos',
    role: 'Founder',
    slug: 'devtools-inc',
    tags: ['Developer Experience', 'Startup', 'Speed'],
  },
  {
    company: 'FinanceBot',
    logo: '💰',
    industry: 'FinTech',
    headline: 'Deployed multi-model strategy saving $200k annually',
    metrics: [
      { label: 'Annual Savings', value: '$200k' },
      { label: 'Models Used', value: '5' },
      { label: 'Accuracy', value: '98.5%' },
    ],
    quote: 'RANA\'s intelligent model routing automatically picks the cheapest model that meets our quality bar. It\'s like magic.',
    author: 'David Kim',
    role: 'ML Lead',
    slug: 'financebot',
    tags: ['Cost Optimization', 'Multi-Model', 'Finance'],
  },
];

export default function CaseStudiesPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Case Studies
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            See how teams are using RANA to build production AI applications
            faster, cheaper, and more reliably.
          </p>
        </div>

        <div className="grid gap-8">
          {caseStudies.map((study, index) => (
            <div
              key={index}
              className="p-8 rounded-2xl border border-gray-800 bg-gray-900/50 hover:bg-gray-900 transition-colors"
            >
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-4xl">{study.logo}</span>
                    <div>
                      <h2 className="text-xl font-semibold">{study.company}</h2>
                      <p className="text-gray-500">{study.industry}</p>
                    </div>
                  </div>

                  <h3 className="text-2xl font-medium mb-4">{study.headline}</h3>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {study.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full bg-gray-800 text-gray-300 text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <blockquote className="border-l-2 border-blue-500 pl-4 italic text-gray-300 mb-4">
                    &ldquo;{study.quote}&rdquo;
                  </blockquote>

                  <div className="text-sm text-gray-500">
                    <span className="text-white">{study.author}</span> · {study.role}
                  </div>
                </div>

                <div className="md:w-64 flex md:flex-col gap-4">
                  {study.metrics.map((metric) => (
                    <div
                      key={metric.label}
                      className="flex-1 p-4 rounded-xl bg-black/50 text-center"
                    >
                      <div className="text-2xl font-bold text-green-400">
                        {metric.value}
                      </div>
                      <div className="text-sm text-gray-500">{metric.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 p-8 rounded-2xl border border-gray-800 bg-gradient-to-br from-blue-900/20 to-purple-900/20 text-center">
          <h2 className="text-2xl font-semibold mb-4">
            Want to be featured?
          </h2>
          <p className="text-gray-400 mb-6">
            We&apos;d love to hear about your RANA success story.
          </p>
          <Link
            href="mailto:casestudies@rana.dev"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-semibold hover:bg-gray-200 transition-colors"
          >
            Share Your Story
          </Link>
        </div>
      </div>
    </div>
  );
}
