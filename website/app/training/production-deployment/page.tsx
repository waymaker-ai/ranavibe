import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Circle, Play } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Production Deployment | RANA Training',
  description: 'Deploy, monitor, and scale your AI agents in production',
};

const lessons = [
  { id: 1, title: 'Preparing for Production', duration: '15 min', type: 'video' },
  { id: 2, title: 'Environment Configuration', duration: '12 min', type: 'article' },
  { id: 3, title: 'Deploying to Vercel', duration: '18 min', type: 'tutorial' },
  { id: 4, title: 'Deploying to AWS', duration: '25 min', type: 'tutorial' },
  { id: 5, title: 'Docker Containerization', duration: '20 min', type: 'tutorial' },
  { id: 6, title: 'Setting Up Monitoring', duration: '18 min', type: 'article' },
  { id: 7, title: 'OpenTelemetry Integration', duration: '15 min', type: 'tutorial' },
  { id: 8, title: 'Cost Monitoring & Alerts', duration: '12 min', type: 'article' },
  { id: 9, title: 'Scaling Strategies', duration: '20 min', type: 'video' },
  { id: 10, title: 'Security Hardening', duration: '15 min', type: 'tutorial' },
];

export default function ProductionDeploymentPage() {
  return (
    <div className="py-12 md:py-20">
      <div className="container-narrow">
        <Link
          href="/training"
          className="inline-flex items-center text-foreground-secondary hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Training
        </Link>

        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Production Deployment</h1>
          <p className="text-lg text-foreground-secondary mb-6">
            Deploy, monitor, and scale your AI agents in production. Learn
            deployment strategies, monitoring, and security best practices.
          </p>
          <div className="flex items-center gap-6 text-sm text-foreground-secondary">
            <span>10 lessons</span>
            <span>•</span>
            <span>2.5 hours</span>
            <span>•</span>
            <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs">
              Intermediate
            </span>
          </div>
        </div>

        <div className="space-y-4 mb-12">
          <h2 className="text-2xl font-bold mb-6">Course Content</h2>
          {lessons.map((lesson) => (
            <div
              key={lesson.id}
              className="card flex items-center gap-4 opacity-75 cursor-not-allowed"
            >
              <Circle className="h-6 w-6 text-foreground-secondary flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium mb-1">
                  Lesson {lesson.id}: {lesson.title}
                </div>
                <div className="flex items-center gap-3 text-sm text-foreground-secondary">
                  <span className="capitalize">{lesson.type}</span>
                  <span>•</span>
                  <span>{lesson.duration}</span>
                </div>
              </div>
              <Play className="h-5 w-5 text-foreground-secondary" />
            </div>
          ))}
        </div>

        <div className="card bg-gradient-subtle">
          <h2 className="text-2xl font-bold mb-6">What You&apos;ll Learn</h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-gradient-from flex-shrink-0 mt-0.5" />
              <span>Configure production environments securely</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-gradient-from flex-shrink-0 mt-0.5" />
              <span>Deploy to Vercel, AWS, and Docker environments</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-gradient-from flex-shrink-0 mt-0.5" />
              <span>Set up comprehensive monitoring and alerting</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-gradient-from flex-shrink-0 mt-0.5" />
              <span>Implement cost tracking and budget controls</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-gradient-from flex-shrink-0 mt-0.5" />
              <span>Scale your application for high traffic</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-gradient-from flex-shrink-0 mt-0.5" />
              <span>Harden security for production workloads</span>
            </li>
          </ul>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card">
            <h3 className="font-bold mb-2">Deployment Platforms</h3>
            <ul className="text-sm text-foreground-secondary space-y-1">
              <li>• Vercel (recommended)</li>
              <li>• AWS Lambda / ECS</li>
              <li>• Google Cloud Run</li>
              <li>• Docker / Kubernetes</li>
            </ul>
          </div>
          <div className="card">
            <h3 className="font-bold mb-2">Monitoring Tools</h3>
            <ul className="text-sm text-foreground-secondary space-y-1">
              <li>• OpenTelemetry</li>
              <li>• Datadog / New Relic</li>
              <li>• Sentry for errors</li>
              <li>• Custom dashboards</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 card bg-yellow-500/10 border-yellow-500/30">
          <p className="text-yellow-400 font-medium mb-2">Prerequisites</p>
          <p className="text-foreground-secondary">
            Complete RANA Fundamentals and Building AI Agents before starting
            this module.
          </p>
        </div>
      </div>
    </div>
  );
}
