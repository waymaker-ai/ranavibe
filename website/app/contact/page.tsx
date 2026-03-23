'use client';

import { motion } from 'framer-motion';
import { Mail, MessageSquare, Github } from 'lucide-react';
import Link from 'next/link';

const contactOptions = [
  {
    icon: Mail,
    title: 'General Inquiries',
    description: 'Questions about CoFounder, partnerships, or anything else.',
    action: 'hello@waymaker.cx',
    href: 'mailto:hello@waymaker.cx',
    label: 'Send Email',
  },
  {
    icon: Mail,
    title: 'Enterprise & Sales',
    description: 'SSO, RBAC, compliance, custom deployments, and volume licensing.',
    action: 'sales@waymaker.cx',
    href: 'mailto:sales@waymaker.cx',
    label: 'Contact Sales',
  },
  {
    icon: MessageSquare,
    title: 'Community',
    description: 'Join our Discord for support, feature requests, and discussions.',
    action: 'Discord',
    href: 'https://discord.gg/cofounder',
    label: 'Join Discord',
    external: true,
  },
  {
    icon: Github,
    title: 'Bug Reports & Features',
    description: 'Found a bug or have a feature request? Open an issue on GitHub.',
    action: 'GitHub Issues',
    href: 'https://github.com/waymaker-ai/cofounder/issues',
    label: 'Open Issue',
    external: true,
  },
];

export default function ContactPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="container-wide max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Get in Touch</h1>
          <p className="text-lg text-foreground-secondary max-w-2xl mx-auto">
            Whether you&apos;re evaluating CoFounder for your team or need help with an
            integration, we&apos;d love to hear from you.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {contactOptions.map((option, index) => (
            <motion.div
              key={option.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
            >
              <Link
                href={option.href}
                target={option.external ? '_blank' : undefined}
                rel={option.external ? 'noopener noreferrer' : undefined}
                className="card block h-full hover:border-foreground/10 transition-colors"
              >
                <div className="p-3 rounded-lg bg-gradient-subtle w-fit mb-4">
                  <option.icon className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-semibold mb-2">{option.title}</h2>
                <p className="text-sm text-foreground-secondary mb-4">
                  {option.description}
                </p>
                <span className="text-sm font-medium text-foreground">
                  {option.label} &rarr;
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
