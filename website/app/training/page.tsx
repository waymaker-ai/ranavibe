import Link from 'next/link';
import { BookOpen, Video, Code, Award } from 'lucide-react';

const trainingModules = [
  {
    id: 'fundamentals',
    title: 'RANA Fundamentals',
    description: 'Learn the core concepts and architecture of the RANA framework',
    duration: '2 hours',
    lessons: 8,
    level: 'Beginner',
    icon: BookOpen,
  },
  {
    id: 'building-agents',
    title: 'Building AI Agents',
    description: 'Create your first production-ready AI agent from scratch',
    duration: '3 hours',
    lessons: 12,
    level: 'Intermediate',
    icon: Code,
  },
  {
    id: 'advanced-patterns',
    title: 'Advanced Patterns',
    description: 'Master complex agent patterns, streaming, and state management',
    duration: '4 hours',
    lessons: 15,
    level: 'Advanced',
    icon: Video,
  },
  {
    id: 'production-deployment',
    title: 'Production Deployment',
    description: 'Deploy, monitor, and scale your AI agents in production',
    duration: '2.5 hours',
    lessons: 10,
    level: 'Intermediate',
    icon: Award,
  },
];

export default function TrainingPage() {
  return (
    <div className="py-12 md:py-20">
      <div className="container-wide">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            RANA Framework Training
          </h1>
          <p className="text-lg text-foreground-secondary max-w-2xl mx-auto">
            Comprehensive training modules to help you master the RANA framework
            and build production-ready AI agents.
          </p>
        </div>

        {/* Training Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {trainingModules.map((module) => (
            <Link
              key={module.id}
              href={`/training/${module.id}`}
              className="card hover:border-foreground/20 group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-background group-hover:bg-gradient-subtle transition-colors">
                  <module.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{module.title}</h3>
                  <p className="text-foreground-secondary text-sm mb-4">
                    {module.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-foreground-secondary">
                    <span>{module.duration}</span>
                    <span>•</span>
                    <span>{module.lessons} lessons</span>
                    <span>•</span>
                    <span className="px-2 py-0.5 rounded-full bg-background-secondary text-xs">
                      {module.level}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Learning Path */}
        <div className="card bg-background-secondary">
          <h2 className="text-2xl font-bold mb-6">Recommended Learning Path</h2>
          <div className="space-y-4">
            {trainingModules.map((module, index) => (
              <div key={module.id} className="flex items-center gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{module.title}</div>
                  <div className="text-sm text-foreground-secondary">
                    {module.duration} • {module.level}
                  </div>
                </div>
                <Link
                  href={`/training/${module.id}`}
                  className="btn-secondary px-4 py-2 text-sm"
                >
                  Start
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
