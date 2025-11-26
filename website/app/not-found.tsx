'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, Book, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto text-center"
        >
          <div className="text-8xl font-bold gradient-text mb-4">404</div>
          <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
          <p className="text-foreground-secondary mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="btn-primary px-6 py-3 inline-flex items-center justify-center"
            >
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
            <Link
              href="/docs"
              className="btn-secondary px-6 py-3 inline-flex items-center justify-center"
            >
              <Book className="mr-2 h-4 w-4" />
              View Docs
            </Link>
          </div>

          <div className="mt-12 p-6 rounded-lg bg-background-secondary border border-border text-left">
            <h2 className="font-semibold mb-3">Looking for something?</h2>
            <ul className="space-y-2 text-sm text-foreground-secondary">
              <li>
                <Link href="/docs/quick-start" className="hover:text-foreground">
                  → Quick Start Guide
                </Link>
              </li>
              <li>
                <Link href="/docs/packages" className="hover:text-foreground">
                  → Package Documentation
                </Link>
              </li>
              <li>
                <Link href="/examples" className="hover:text-foreground">
                  → Code Examples
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-foreground">
                  → Pricing
                </Link>
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
