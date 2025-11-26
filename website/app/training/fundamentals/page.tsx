import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Circle, Play } from 'lucide-react';

export const metadata: Metadata = {
  title: 'RANA Fundamentals Training',
  description: 'Learn the core concepts and architecture of the RANA framework',
};

const lessons = [
  {
    id: 1,
    title: 'What is RANA?',
    duration: '10 min',
    type: 'video',
    completed: false,
  },
  {
    id: 2,
    title: 'Core Architecture Overview',
    duration: '15 min',
    type: 'article',
    completed: false,
  },
  {
    id: 3,
    title: 'Setting Up Your Environment',
    duration: '12 min',
    type: 'tutorial',
    completed: false,
  },
  {
    id: 4,
    title: 'Your First RANA Project',
    duration: '20 min',
    type: 'tutorial',
    completed: false,
  },
  {
    id: 5,
    title: 'Understanding the LLM Client',
    duration: '18 min',
    type: 'article',
    completed: false,
  },
  {
    id: 6,
    title: 'React Hooks Deep Dive',
    duration: '25 min',
    type: 'video',
    completed: false,
  },
  {
    id: 7,
    title: 'State Management Patterns',
    duration: '15 min',
    type: 'article',
    completed: false,
  },
  {
    id: 8,
    title: 'Building Your First Agent',
    duration: '30 min',
    type: 'tutorial',
    completed: false,
  },
];

export default function FundamentalsTrainingPage() {
  return (
    <div className="py-12 md:py-20">
      <div className="container-narrow">
        {/* Back link */}
        <Link
          href="/training"
          className="inline-flex items-center text-foreground-secondary hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Training
        </Link>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">RANA Fundamentals</h1>
          <p className="text-lg text-foreground-secondary mb-6">
            Learn the core concepts and architecture of the RANA framework.
            Perfect for beginners starting their AI agent development journey.
          </p>
          <div className="flex items-center gap-6 text-sm text-foreground-secondary">
            <span>8 lessons</span>
            <span>•</span>
            <span>2 hours</span>
            <span>•</span>
            <span className="px-2 py-0.5 rounded-full bg-background-secondary text-xs">
              Beginner
            </span>
          </div>
        </div>

        {/* Course content */}
        <div className="space-y-4 mb-12">
          <h2 className="text-2xl font-bold mb-6">Course Content</h2>
          {lessons.map((lesson) => (
            <Link
              key={lesson.id}
              href={`/training/fundamentals/lesson-${lesson.id}`}
              className="card flex items-center gap-4 hover:border-foreground/20"
            >
              {lesson.completed ? (
                <CheckCircle2 className="h-6 w-6 text-gradient-from flex-shrink-0" />
              ) : (
                <Circle className="h-6 w-6 text-foreground-secondary flex-shrink-0" />
              )}
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
              <Play className="h-5 w-5 text-foreground-secondary group-hover:text-foreground transition-colors" />
            </Link>
          ))}
        </div>

        {/* What you'll learn */}
        <div className="card bg-background-secondary">
          <h2 className="text-2xl font-bold mb-6">What You&apos;ll Learn</h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-gradient-from flex-shrink-0 mt-0.5" />
              <span>
                Understand the RANA framework architecture and design principles
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-gradient-from flex-shrink-0 mt-0.5" />
              <span>Set up and configure your development environment</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-gradient-from flex-shrink-0 mt-0.5" />
              <span>Master the core LLM client API and React hooks</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-gradient-from flex-shrink-0 mt-0.5" />
              <span>Implement proper state management patterns</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-gradient-from flex-shrink-0 mt-0.5" />
              <span>Build and deploy your first AI agent</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
