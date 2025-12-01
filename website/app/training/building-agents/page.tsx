import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Circle, Play } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Building AI Agents | RANA Training',
  description: 'Learn to create production-ready AI agents from scratch',
};

const lessons = [
  { id: 1, title: 'Introduction to Agents', duration: '12 min', type: 'video' },
  { id: 2, title: 'Agent Configuration Deep Dive', duration: '18 min', type: 'article' },
  { id: 3, title: 'Creating Custom Tools', duration: '25 min', type: 'tutorial' },
  { id: 4, title: 'Tool Execution Patterns', duration: '20 min', type: 'article' },
  { id: 5, title: 'Memory and Context Management', duration: '22 min', type: 'tutorial' },
  { id: 6, title: 'Multi-Tool Agents', duration: '18 min', type: 'video' },
  { id: 7, title: 'Agent Orchestration', duration: '20 min', type: 'article' },
  { id: 8, title: 'Building a Research Agent', duration: '30 min', type: 'tutorial' },
  { id: 9, title: 'Building a Code Assistant', duration: '30 min', type: 'tutorial' },
  { id: 10, title: 'Error Handling Strategies', duration: '15 min', type: 'article' },
  { id: 11, title: 'Testing Your Agents', duration: '18 min', type: 'tutorial' },
  { id: 12, title: 'Agent Best Practices', duration: '12 min', type: 'video' },
];

export default function BuildingAgentsPage() {
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
          <h1 className="text-4xl font-bold mb-4">Building AI Agents</h1>
          <p className="text-lg text-foreground-secondary mb-6">
            Create your first production-ready AI agent from scratch. Learn tools,
            memory management, orchestration, and best practices.
          </p>
          <div className="flex items-center gap-6 text-sm text-foreground-secondary">
            <span>12 lessons</span>
            <span>•</span>
            <span>3 hours</span>
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
              <span>Design and implement custom tools for your agents</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-gradient-from flex-shrink-0 mt-0.5" />
              <span>Manage agent memory and conversation context effectively</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-gradient-from flex-shrink-0 mt-0.5" />
              <span>Orchestrate multiple agents for complex tasks</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-gradient-from flex-shrink-0 mt-0.5" />
              <span>Build real-world agents: research assistant, code helper</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-gradient-from flex-shrink-0 mt-0.5" />
              <span>Test and debug agents with RANA&apos;s testing framework</span>
            </li>
          </ul>
        </div>

        <div className="mt-8 card bg-yellow-500/10 border-yellow-500/30">
          <p className="text-yellow-400 font-medium mb-2">Prerequisites</p>
          <p className="text-foreground-secondary">
            Complete the RANA Fundamentals course before starting this module.
          </p>
          <Link href="/training/fundamentals" className="btn-secondary mt-4 inline-block">
            Start with Fundamentals
          </Link>
        </div>
      </div>
    </div>
  );
}
