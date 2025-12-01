import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Circle, Play } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Advanced Patterns | RANA Training',
  description: 'Master complex agent patterns, streaming, and state management',
};

const lessons = [
  { id: 1, title: 'Advanced Streaming Patterns', duration: '20 min', type: 'video' },
  { id: 2, title: 'Server-Sent Events Deep Dive', duration: '15 min', type: 'article' },
  { id: 3, title: 'Complex State Management', duration: '25 min', type: 'tutorial' },
  { id: 4, title: 'Optimistic Updates', duration: '18 min', type: 'tutorial' },
  { id: 5, title: 'Caching Strategies', duration: '20 min', type: 'article' },
  { id: 6, title: 'Parallel Agent Execution', duration: '22 min', type: 'tutorial' },
  { id: 7, title: 'Agent Pipelines', duration: '25 min', type: 'video' },
  { id: 8, title: 'Human-in-the-Loop Patterns', duration: '18 min', type: 'article' },
  { id: 9, title: 'Retry and Fallback Strategies', duration: '15 min', type: 'tutorial' },
  { id: 10, title: 'Rate Limiting Implementation', duration: '12 min', type: 'article' },
  { id: 11, title: 'Cost Optimization Techniques', duration: '20 min', type: 'tutorial' },
  { id: 12, title: 'Building a Multi-Model Router', duration: '25 min', type: 'tutorial' },
  { id: 13, title: 'RAG Implementation Patterns', duration: '30 min', type: 'video' },
  { id: 14, title: 'Semantic Caching', duration: '18 min', type: 'article' },
  { id: 15, title: 'Advanced Error Recovery', duration: '15 min', type: 'tutorial' },
];

export default function AdvancedPatternsPage() {
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
          <h1 className="text-4xl font-bold mb-4">Advanced Patterns</h1>
          <p className="text-lg text-foreground-secondary mb-6">
            Master complex agent patterns, streaming, state management, and
            optimization techniques for production applications.
          </p>
          <div className="flex items-center gap-6 text-sm text-foreground-secondary">
            <span>15 lessons</span>
            <span>•</span>
            <span>4 hours</span>
            <span>•</span>
            <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs">
              Advanced
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
              <span>Implement advanced streaming patterns for real-time UX</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-gradient-from flex-shrink-0 mt-0.5" />
              <span>Manage complex state across multiple agents and sessions</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-gradient-from flex-shrink-0 mt-0.5" />
              <span>Build agent pipelines for multi-step processing</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-gradient-from flex-shrink-0 mt-0.5" />
              <span>Implement intelligent caching and cost optimization</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-gradient-from flex-shrink-0 mt-0.5" />
              <span>Design robust error recovery and fallback strategies</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-gradient-from flex-shrink-0 mt-0.5" />
              <span>Build production-grade RAG systems</span>
            </li>
          </ul>
        </div>

        <div className="mt-8 card bg-red-500/10 border-red-500/30">
          <p className="text-red-400 font-medium mb-2">Prerequisites</p>
          <p className="text-foreground-secondary">
            Complete both RANA Fundamentals and Building AI Agents courses before
            starting this advanced module.
          </p>
          <div className="flex gap-4 mt-4">
            <Link href="/training/fundamentals" className="btn-secondary">
              Fundamentals
            </Link>
            <Link href="/training/building-agents" className="btn-secondary">
              Building Agents
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
