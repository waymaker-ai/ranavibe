'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Heart, Users, Sparkles, Shield, Palette, Zap } from 'lucide-react';

const team = [
  {
    name: 'Ashley Kays',
    role: 'Creator & Lead',
    company: 'Waymaker.cx / Betr.ai',
  },
  {
    name: 'Christian Moore',
    role: 'Co-Creator',
    company: 'Core Development',
  },
  {
    name: 'Joshua Schrager',
    role: 'Co-Creator',
    company: 'Core Development',
  },
];

const challenges = [
  {
    icon: Shield,
    title: 'Security Vulnerabilities',
    description: 'AI coding tools can inadvertently introduce security risks that are easy to miss during rapid development.',
  },
  {
    icon: Palette,
    title: 'Inconsistent Design',
    description: 'Without guardrails, AI generates similar-looking designs or inconsistent UI patterns across your application.',
  },
  {
    icon: Zap,
    title: 'Going Off the Rails',
    description: 'When AI agents go wrong, debugging and fixing the mess can take longer than writing the code manually.',
  },
];

export default function AboutPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="container-wide">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto text-center mb-16"
        >
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 mb-6 rounded-full border border-border bg-background-secondary">
            <Heart className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium">Created with love</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Taking a Bite Out of{' '}
            <span className="gradient-text">AI Coding Challenges</span>
          </h1>
          <p className="text-lg text-foreground-secondary max-w-2xl mx-auto">
            RANA was born from real frustration with AI-assisted development and a vision to make it better for everyone.
          </p>
        </motion.div>

        {/* Founder's Story */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-4xl mx-auto mb-20"
        >
          <div className="card">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gradient-from to-gradient-to flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
                AK
              </div>
              <div>
                <h2 className="text-xl font-bold">A Message from Ashley Kays</h2>
                <p className="text-foreground-secondary">Creator of RANA</p>
              </div>
            </div>

            <div className="prose prose-neutral dark:prose-invert max-w-none space-y-4 text-foreground-secondary">
              <p>
                I created RANA after experiencing firsthand the trial and error of using AI agents to create products.
                AI coding tools are truly magical—they can generate entire features in minutes, help you explore new
                technologies, and accelerate development in ways that seemed impossible just a few years ago.
              </p>
              <p>
                But when they go off the rails, it can create incredible headaches and frustration. I&apos;ve spent
                countless hours debugging AI-generated code that looked perfect but had subtle security vulnerabilities.
                I&apos;ve watched projects accumulate technical debt because the AI kept generating similar-looking designs
                without any consistent design language or component library.
              </p>
              <p>
                The biggest issues I kept running into were:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Security concerns</strong> — AI doesn&apos;t always follow best practices for secure coding</li>
                <li><strong>Design inconsistency</strong> — Every generated component looked slightly different</li>
                <li><strong>No design system</strong> — There was no common library or design language being followed</li>
                <li><strong>Unpredictable quality</strong> — Sometimes brilliant, sometimes a complete mess</li>
              </ul>
              <p>
                RANA solves these problems by providing guardrails, design system enforcement, and security validation
                that work alongside your favorite AI coding tools. It doesn&apos;t replace them—it makes them better and
                more reliable.
              </p>
              <p className="font-medium text-foreground">
                Our mission is simple: make AI-assisted coding more efficient, more secure, and more consistent so
                you can focus on building great products.
              </p>
            </div>
          </div>
        </motion.div>

        {/* The Challenges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-20"
        >
          <h2 className="text-3xl font-bold text-center mb-4">The Problems We Solve</h2>
          <p className="text-foreground-secondary text-center mb-12 max-w-2xl mx-auto">
            AI coding tools are powerful, but they come with challenges that RANA addresses head-on.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {challenges.map((challenge, index) => (
              <motion.div
                key={challenge.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="card hover:border-foreground/10"
              >
                <div className="p-3 rounded-lg bg-gradient-subtle w-fit mb-4">
                  <challenge.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{challenge.title}</h3>
                <p className="text-sm text-foreground-secondary">{challenge.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Team */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-20"
        >
          <h2 className="text-3xl font-bold text-center mb-4">The Team</h2>
          <p className="text-foreground-secondary text-center mb-12 max-w-2xl mx-auto">
            RANA is built by a dedicated team passionate about improving the AI development experience.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="card text-center"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gradient-from to-gradient-to flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <h3 className="text-lg font-semibold">{member.name}</h3>
                <p className="text-foreground-secondary text-sm">{member.role}</p>
                <p className="text-foreground-secondary text-xs mt-1">{member.company}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Sponsors & Thanks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="max-w-3xl mx-auto mb-16"
        >
          <div className="card bg-gradient-subtle text-center">
            <Sparkles className="h-8 w-8 mx-auto mb-4 text-gradient-from" />
            <h2 className="text-2xl font-bold mb-4">Sponsors & Acknowledgments</h2>
            <p className="text-foreground-secondary mb-6">
              RANA is proudly sponsored by{' '}
              <Link href="https://betr.ai" target="_blank" className="text-foreground font-medium hover:underline">
                Betr.ai
              </Link>
            </p>
            <div className="border-t border-border pt-6 mt-6">
              <p className="text-foreground-secondary">
                <strong className="text-foreground">Special Thanks</strong>
              </p>
              <p className="text-foreground-secondary mt-2">
                Charles Kays — for sponsorship, strategy, and unwavering support
              </p>
            </div>
          </div>
        </motion.div>

        {/* Companies */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-center mb-16"
        >
          <p className="text-foreground-secondary mb-6">Created in partnership with</p>
          <div className="flex flex-wrap justify-center items-center gap-8">
            <Link
              href="https://waymaker.cx"
              target="_blank"
              className="text-2xl font-bold text-foreground-secondary hover:text-foreground transition-colors"
            >
              Waymaker.cx
            </Link>
            <Link
              href="https://betr.ai"
              target="_blank"
              className="text-2xl font-bold text-foreground-secondary hover:text-foreground transition-colors"
            >
              Betr.ai
            </Link>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold mb-4">Ready to Build Better?</h2>
          <p className="text-foreground-secondary mb-6">
            Join us in making AI-assisted development more reliable.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/docs/quick-start" className="btn-primary px-6 py-3">
              Get Started
            </Link>
            <Link
              href="https://github.com/waymaker-ai/ranavibe"
              target="_blank"
              className="btn-secondary px-6 py-3"
            >
              View on GitHub
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
