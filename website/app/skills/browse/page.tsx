'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Filter, ExternalLink, Sparkles } from 'lucide-react';
import manifest from '@/lib/skills-manifest.json';

interface ManifestSkill {
  id: string;
  path: string;
  category: string;
  description: string;
  sensitivity: { mayTouchPII: boolean; writesCode: boolean; runsShell: boolean; network: boolean };
  modelClass: 'light' | 'mid' | 'heavy';
  nextSkill?: string;
  requires: string[];
  emits: string[];
  hasFixtures: boolean;
}

interface Manifest {
  apiVersion: string;
  generatedAt: string;
  skillCount: number;
  skills: ManifestSkill[];
}

const M = manifest as Manifest;

const CLASS_TONES: Record<ManifestSkill['modelClass'], string> = {
  light: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  mid: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  heavy: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
};

export default function SkillsBrowsePage() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>('');
  const [cls, setCls] = useState<string>('');
  const [sensFilter, setSensFilter] = useState<string>('');

  const categories = useMemo(
    () => Array.from(new Set(M.skills.map((s) => s.category))).sort(),
    [],
  );

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return M.skills.filter((s) => {
      if (q && !s.id.toLowerCase().includes(needle) && !s.description.toLowerCase().includes(needle)) {
        return false;
      }
      if (cat && s.category !== cat) return false;
      if (cls && s.modelClass !== cls) return false;
      if (sensFilter === 'mayTouchPII' && !s.sensitivity.mayTouchPII) return false;
      if (sensFilter === 'writesCode' && !s.sensitivity.writesCode) return false;
      if (sensFilter === 'runsShell' && !s.sensitivity.runsShell) return false;
      if (sensFilter === 'network' && !s.sensitivity.network) return false;
      return true;
    });
  }, [q, cat, cls, sensFilter]);

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container max-w-6xl mx-auto px-6">
        <Link
          href="/docs/skills"
          className="inline-flex items-center text-sm text-foreground-secondary hover:text-foreground mb-6"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Skill Library overview
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="h-7 w-7" />
            <h1 className="text-4xl font-bold">Browse skills</h1>
          </div>
          <p className="text-lg text-foreground-secondary">
            Live view of <code className="font-mono text-sm">MANIFEST.json</code> — every skill in the bundled
            library, with its sensitivity, model class, chain position, and event emissions.
          </p>
          <p className="text-xs text-foreground-secondary mt-2">
            Manifest generated: <span className="font-mono">{M.generatedAt}</span> · Skills: <span className="font-mono">{M.skillCount}</span>
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card mb-8">
          <div className="grid md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs uppercase tracking-wide font-semibold mb-2 text-foreground-secondary">
                <Search className="inline h-3.5 w-3.5 mr-1" />
                Search
              </label>
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Filter by name or description…"
                className="w-full px-3 py-2 rounded border border-border bg-background-secondary font-mono text-sm focus:outline-none focus:border-foreground/40"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide font-semibold mb-2 text-foreground-secondary">
                <Filter className="inline h-3.5 w-3.5 mr-1" />
                Category
              </label>
              <select
                value={cat}
                onChange={(e) => setCat(e.target.value)}
                className="w-full px-3 py-2 rounded border border-border bg-background-secondary text-sm focus:outline-none focus:border-foreground/40"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide font-semibold mb-2 text-foreground-secondary">
                Model class
              </label>
              <select
                value={cls}
                onChange={(e) => setCls(e.target.value)}
                className="w-full px-3 py-2 rounded border border-border bg-background-secondary text-sm focus:outline-none focus:border-foreground/40"
              >
                <option value="">Any class</option>
                <option value="light">light</option>
                <option value="mid">mid</option>
                <option value="heavy">heavy</option>
              </select>
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-xs uppercase tracking-wide font-semibold mb-2 text-foreground-secondary">
              Sensitivity
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { val: '', label: 'Any' },
                { val: 'mayTouchPII', label: 'May touch PII' },
                { val: 'writesCode', label: 'Writes code' },
                { val: 'runsShell', label: 'Runs shell' },
                { val: 'network', label: 'Network' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => setSensFilter(opt.val)}
                  className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                    sensFilter === opt.val
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-background-secondary border-border hover:border-foreground/40'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border text-xs text-foreground-secondary">
            Showing <span className="font-mono font-semibold text-foreground">{filtered.length}</span> of{' '}
            <span className="font-mono">{M.skills.length}</span> skills.
          </div>
        </motion.div>

        {/* Results */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3">
          {filtered.length === 0 && (
            <div className="card text-center py-12 text-foreground-secondary">
              No skills match your filters.
            </div>
          )}
          {filtered.map((s) => {
            const sensFlags: string[] = [];
            if (s.sensitivity.mayTouchPII) sensFlags.push('PII');
            if (s.sensitivity.writesCode) sensFlags.push('writes');
            if (s.sensitivity.runsShell) sensFlags.push('shell');
            if (s.sensitivity.network) sensFlags.push('net');
            return (
              <div key={s.id} className="card hover:border-foreground/20 transition-colors">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <code className="font-mono text-sm font-semibold">{s.id}</code>
                  <span className={`px-2 py-0.5 text-[10px] font-mono rounded ${CLASS_TONES[s.modelClass]}`}>
                    {s.modelClass}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-background-secondary text-foreground-secondary">
                    {s.category}
                  </span>
                  {s.hasFixtures && (
                    <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      fixtures
                    </span>
                  )}
                  {sensFlags.length > 0 && (
                    <span className="ml-1 flex flex-wrap gap-1">
                      {sensFlags.map((f) => (
                        <span
                          key={f}
                          className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        >
                          {f}
                        </span>
                      ))}
                    </span>
                  )}
                </div>
                <p className="text-sm text-foreground-secondary mb-2">{s.description}</p>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
                  {s.requires.length > 0 && (
                    <span className="text-foreground-secondary">
                      requires: {s.requires.map((r) => <code key={r} className="font-mono mr-1">{r}</code>)}
                    </span>
                  )}
                  {s.nextSkill && (
                    <span className="text-foreground-secondary">
                      nextSkill: <code className="font-mono">{s.nextSkill}</code>
                    </span>
                  )}
                  {s.emits.length > 0 && (
                    <span className="text-foreground-secondary">
                      emits: {s.emits.map((e) => <code key={e} className="font-mono mr-1">{e}</code>)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Footer */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-foreground-secondary">
            Want to contribute a skill?{' '}
            <Link
              href="https://github.com/waymaker-ai/cofounder/blob/main/CONTRIBUTING_SKILLS.md"
              className="underline inline-flex items-center"
            >
              Read CONTRIBUTING_SKILLS.md
              <ExternalLink className="ml-1 h-3 w-3" />
            </Link>
            .
          </p>
        </motion.div>
      </div>
    </div>
  );
}
