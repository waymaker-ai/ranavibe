'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Sparkles, FileText, GitBranch,
  TestTube2, Wand2, Shield, DollarSign, Boxes, ShieldAlert, GitFork,
  ScanSearch, Bot, Terminal, BookOpen, ListChecks, Workflow,
} from 'lucide-react';

interface Skill {
  id: string;
  category: string;
  description: string;
  modelClass: 'light' | 'mid' | 'heavy';
  sensitivity: { mayTouchPII?: boolean; writesCode?: boolean; runsShell?: boolean; network?: boolean };
  nextSkill?: string;
  requires?: string[];
}

const skills: Skill[] = [
  // Feature flow
  {
    id: 'cofounder-feature-new',
    category: 'Feature flow',
    description: 'Turns a feature idea into a VibeSpec-compliant spec via clarifying questions and prior-art search. Writes specs/<slug>.spec.yml. Does not write code.',
    modelClass: 'mid',
    sensitivity: {},
    nextSkill: 'cofounder-feature-implement',
  },
  {
    id: 'cofounder-feature-implement',
    category: 'Feature flow',
    description: 'Reads a feature spec and produces a scoped, branch-isolated draft implementation under VibeSpec rules. Adds tests and runs guardrail checks before handing off.',
    modelClass: 'heavy',
    sensitivity: { writesCode: true, runsShell: true },
    nextSkill: 'cofounder-check',
    requires: ['cofounder-feature-new'],
  },
  {
    id: 'cofounder-check',
    category: 'Feature flow',
    description: 'Runs CoFounder safety gates on the current changeset — secrets, mock data, scope, design system, missing tests. Reports Tier 1 / Tier 2 / Tier 3 findings.',
    modelClass: 'mid',
    sensitivity: { runsShell: true },
  },
  {
    id: 'cofounder-spec-review',
    category: 'Feature flow',
    description: 'Reviews a draft feature spec for completeness, testability, and VibeSpec compliance before implementation. Does not modify the spec.',
    modelClass: 'heavy',
    sensitivity: {},
  },

  // Codebase intelligence
  {
    id: 'cofounder-pattern-scout',
    category: 'Codebase intelligence',
    description: 'Searches for similar functions, components, hooks, models, and routes before agents reinvent them. Returns ranked matches with extend-vs-create recommendations.',
    modelClass: 'light',
    sensitivity: {},
    nextSkill: 'cofounder-feature-new',
  },

  // Documentation
  {
    id: 'cofounder-diagram',
    category: 'Documentation',
    description: 'Generates Mermaid (or PlantUML) diagrams from real code — actual imports, actual call graph, actual schema. Never invents relationships.',
    modelClass: 'mid',
    sensitivity: {},
  },
  {
    id: 'cofounder-readme',
    category: 'Documentation',
    description: 'Generates a README from real exports, real scripts, real config. Every code example must be runnable against the current repo.',
    modelClass: 'mid',
    sensitivity: {},
  },

  // VCS
  {
    id: 'cofounder-pr-summary',
    category: 'Version control',
    description: 'Generates a PR description from the actual diff — mental-model framing, blast radius, test coverage. No marketing language, no aspirational "future X".',
    modelClass: 'mid',
    sensitivity: { runsShell: true },
  },
  {
    id: 'cofounder-commit',
    category: 'Version control',
    description: 'Writes a Conventional Commits-style message from the staged diff. Detects multi-purpose diffs and suggests splitting. Will never commit without explicit confirmation.',
    modelClass: 'light',
    sensitivity: { runsShell: true },
  },

  // Testing
  {
    id: 'cofounder-test-plan',
    category: 'Testing',
    description: 'Reads a spec or diff and proposes a tiered test plan — what to assert, at what layer, and what is not worth testing.',
    modelClass: 'mid',
    sensitivity: {},
    nextSkill: 'cofounder-feature-implement',
  },

  // Native (CoFounder differentiators)
  {
    id: 'cofounder-vibespec-author',
    category: 'CoFounder-native',
    description: 'Reads the repo to infer existing conventions (design system, file layout, branching style, test framework) and proposes a VibeSpec that codifies them with evidence.',
    modelClass: 'heavy',
    sensitivity: {},
    nextSkill: 'cofounder-feature-new',
  },
  {
    id: 'cofounder-compliance-frame',
    category: 'CoFounder-native',
    description: 'Reframes a feature spec against HIPAA, GDPR/CCPA, SEC, PCI DSS, FERPA, or SOX requirements before code is written. Wraps the policies and compliance packages.',
    modelClass: 'heavy',
    sensitivity: { mayTouchPII: true },
    nextSkill: 'cofounder-feature-new',
  },
  {
    id: 'cofounder-cost-route',
    category: 'CoFounder-native',
    description: 'Recommends the cheapest model that is still good enough for the task. Also analyzes recent LLM spend and surfaces optimization candidates with dollar estimates.',
    modelClass: 'light',
    sensitivity: {},
  },
  {
    id: 'cofounder-context-fit',
    category: 'CoFounder-native',
    description: 'Distills long inputs (huge files, long histories, large RAG returns) into the minimum context that preserves the answer. Wraps the context-optimizer package.',
    modelClass: 'mid',
    sensitivity: {},
  },
  {
    id: 'cofounder-sandbox-preview',
    category: 'CoFounder-native',
    description: 'Runs destructive operations (migrations, mass renames, third-party API calls with side effects) in the sandbox package and reports what would happen — without touching reality.',
    modelClass: 'mid',
    sensitivity: { runsShell: true },
  },
  {
    id: 'cofounder-second-opinion',
    category: 'CoFounder-native',
    description: 'Routes the same prompt through a different model or provider and diffs the answers. Surfaces substance disagreements (different recommendations), not surface differences (word choice).',
    modelClass: 'heavy',
    sensitivity: { network: true },
  },
];

const subAgents = [
  {
    name: 'cofounder-reviewer',
    description: 'Reviews a diff or PR against the repo VibeSpecs. Reports only high-confidence, high-priority issues across three tiers.',
  },
  {
    name: 'cofounder-scout',
    description: 'Spawnable sub-agent variant of pattern-scout. Use when you want a separate isolated context for a deep prior-art search before writing new code.',
  },
  {
    name: 'cofounder-spec-writer',
    description: 'Asks 3–5 clarifying questions, searches for prior art, and writes a VibeSpec-compliant feature spec. Confirms before writing.',
  },
];

const slashCommands = [
  { name: '/cofounder', description: 'Root command — routes to feature-new, feature-implement, check, or review.' },
  { name: '/spec', description: 'Turn a feature idea into a VibeSpec-compliant spec file.' },
  { name: '/check', description: 'Run CoFounder safety gates on the current changeset.' },
  { name: '/explain-changes', description: 'Mental-model walk-through of the current branch — not a file list.' },
];

const architecturalMoves = [
  {
    icon: GitFork,
    title: 'FlowSpec skill chaining',
    description: 'Skills declare nextSkill (suggested follow-up) and requires (hard prerequisites). The runtime computes a topologically-sorted chain, detects cycles, and surfaces missing dependencies before execution.',
  },
  {
    icon: TestTube2,
    title: 'Golden-fixture replay',
    description: 'Each skill ships fixtures/*.json with input + expected behavior. The CI scanner replays them on every PR so skill regressions get caught — substring assertions, refused-file lists, latency budgets.',
  },
  {
    icon: Boxes,
    title: 'MCP re-exposure',
    description: 'Every skill is auto-published as an MCP tool (cofounder.skill.*) so non-Claude-Code agents (Cursor, Cline, Windsurf, Claude Desktop) can invoke the same skills through the standard protocol.',
  },
  {
    icon: ListChecks,
    title: 'Skill telemetry',
    description: 'Skills emit structured events (skill.run, skill.complete, skill.fail, plus skill-specific events). Default JSONL transport writes locally; the dashboard package consumes them to show what works, what is expensive, and what keeps failing.',
  },
  {
    icon: Shield,
    title: 'Sensitivity declarations + guard mapping',
    description: 'Every skill declares its data class (mayTouchPII, writesCode, runsShell, network). The runtime maps sensitivity to policy presets from the policies package and runs preflight checks before invocation.',
  },
  {
    icon: DollarSign,
    title: 'Per-skill model routing',
    description: 'Skills declare modelClass: light | mid | heavy. The router picks Haiku, Sonnet, or Opus, bumps up for large context, and refuses to downgrade quality-critical skills (spec review, compliance, second-opinion) for cost reasons.',
  },
  {
    icon: ShieldAlert,
    title: 'Sandbox preview for destructive skills',
    description: 'Skills tagged sensitivity.runsShell or writesCode are eligible for sandbox preview. Migrations, mass renames, and side-effecting API calls run in the sandbox package first — three outcomes: safe-to-run, needs-review, blocked.',
  },
];

function ClassPill({ cls }: { cls: 'light' | 'mid' | 'heavy' }) {
  const map = {
    light: { label: 'light', tone: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    mid: { label: 'mid', tone: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
    heavy: { label: 'heavy', tone: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  } as const;
  const m = map[cls];
  return (
    <span className={`px-2 py-0.5 text-xs font-mono rounded ${m.tone}`}>{m.label}</span>
  );
}

function SensitivityFlags({ s }: { s: Skill['sensitivity'] }) {
  const flags: string[] = [];
  if (s.writesCode) flags.push('writes code');
  if (s.runsShell) flags.push('runs shell');
  if (s.mayTouchPII) flags.push('may touch PII');
  if (s.network) flags.push('network');
  if (flags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {flags.map((f) => (
        <span
          key={f}
          className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-amber-500/10 text-amber-600 dark:text-amber-400"
        >
          {f}
        </span>
      ))}
    </div>
  );
}

const categoryIcons: Record<string, any> = {
  'Feature flow': Workflow,
  'Codebase intelligence': ScanSearch,
  Documentation: FileText,
  'Version control': GitBranch,
  Testing: TestTube2,
  'CoFounder-native': Sparkles,
};

export default function SkillsDocsPage() {
  const categories = Array.from(new Set(skills.map((s) => s.category)));

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container max-w-5xl mx-auto px-6">
        {/* Back link */}
        <Link
          href="/docs"
          className="inline-flex items-center text-sm text-foreground-secondary hover:text-foreground mb-6"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Documentation
        </Link>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="h-7 w-7" />
            <h1 className="text-4xl font-bold">CoFounder Skill Library</h1>
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-gradient-to-r from-gradient-from to-gradient-to text-white">
              NEW
            </span>
          </div>
          <p className="text-lg text-foreground-secondary mb-4">
            16 curated skills, 3 sub-agents, and 4 slash commands for AI coding agents working in real codebases —
            spec-driven, guard-enforced, compliance-aware, and cost-routed.
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2 py-1 rounded-full bg-background-secondary font-mono">@waymakerai/aicofounder-skills</span>
            <span className="px-2 py-1 rounded-full bg-background-secondary">Claude Code · MCP · CrewAI · LangChain</span>
            <span className="px-2 py-1 rounded-full bg-background-secondary">MIT</span>
          </div>
        </motion.div>

        {/* Why */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card mb-10"
        >
          <h2 className="text-xl font-bold mb-3">Why a curated skill library?</h2>
          <p className="text-foreground-secondary mb-3">
            Generic skill collections optimize for breadth. CoFounder skills optimize for{' '}
            <span className="font-semibold">depth × leverage</span>: each one stands on the existing CoFounder
            primitives — VibeSpec context, guard policies, compliance presets, sandbox preview, cost router — so a
            skill is meaningfully better here than the same idea would be elsewhere.
          </p>
          <ul className="text-sm text-foreground-secondary space-y-1.5 list-disc list-inside">
            <li>Skills read your VibeSpec at runtime — behavior adapts per project, not per author.</li>
            <li>Sensitivity declarations route every skill through the right policies before it runs.</li>
            <li>Per-skill model routing keeps Haiku-class tasks on Haiku and Opus-class tasks on Opus.</li>
            <li>Destructive skills preview through the sandbox before touching the real workspace.</li>
            <li>Telemetry feeds back: which skills work, which are expensive, which keep failing.</li>
          </ul>
        </motion.div>

        {/* Install */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-xl font-bold mb-3">Install</h2>
          <div className="code-block font-mono text-sm mb-3">npm install @waymakerai/aicofounder-skills</div>
          <p className="text-sm text-foreground-secondary">
            For Claude Code, the skills ship with the{' '}
            <code className="px-1 py-0.5 rounded bg-background-secondary font-mono text-xs">cofounder</code>{' '}
            plugin and are auto-registered. For other MCP-capable agents (Cursor, Cline, Windsurf, Claude Desktop),
            point your MCP client at the CoFounder MCP server — every skill becomes a{' '}
            <code className="px-1 py-0.5 rounded bg-background-secondary font-mono text-xs">cofounder.skill.*</code>{' '}
            tool.
          </p>
        </motion.div>

        {/* Skills, by category */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold mb-1">Skills</h2>
          <p className="text-foreground-secondary mb-6">
            16 skills across six categories. Each declares its sensitivity, model class, and chain position.
          </p>
          <div className="space-y-10">
            {categories.map((cat) => {
              const CatIcon = categoryIcons[cat] ?? Sparkles;
              const inCat = skills.filter((s) => s.category === cat);
              return (
                <div key={cat}>
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
                    <CatIcon className="h-5 w-5" />
                    <h3 className="text-lg font-bold">{cat}</h3>
                    <span className="text-sm text-foreground-secondary">({inCat.length})</span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {inCat.map((skill) => (
                      <div key={skill.id} className="card">
                        <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
                          <code className="font-mono text-sm font-semibold break-all">{skill.id}</code>
                          <ClassPill cls={skill.modelClass} />
                        </div>
                        <p className="text-sm text-foreground-secondary mb-2">{skill.description}</p>
                        <SensitivityFlags s={skill.sensitivity} />
                        {(skill.requires?.length || skill.nextSkill) && (
                          <div className="mt-3 pt-3 border-t border-border text-xs space-y-1">
                            {skill.requires?.length ? (
                              <div className="text-foreground-secondary">
                                <span className="font-mono">requires:</span>{' '}
                                {skill.requires.map((r) => (
                                  <code key={r} className="font-mono mr-1">{r}</code>
                                ))}
                              </div>
                            ) : null}
                            {skill.nextSkill && (
                              <div className="text-foreground-secondary">
                                <span className="font-mono">nextSkill:</span>{' '}
                                <code className="font-mono">{skill.nextSkill}</code>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Sub-agents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <div className="flex items-center gap-2 mb-1">
            <Bot className="h-5 w-5" />
            <h2 className="text-2xl font-bold">Sub-agents</h2>
          </div>
          <p className="text-foreground-secondary mb-6">
            Spawn-on-demand variants for tasks that benefit from a fresh, isolated context window.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {subAgents.map((a) => (
              <div key={a.name} className="card">
                <code className="font-mono text-sm font-semibold mb-2 block">{a.name}</code>
                <p className="text-sm text-foreground-secondary">{a.description}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Slash commands */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-16"
        >
          <div className="flex items-center gap-2 mb-1">
            <Terminal className="h-5 w-5" />
            <h2 className="text-2xl font-bold">Slash commands</h2>
          </div>
          <p className="text-foreground-secondary mb-6">
            Quick triggers for the most common flows. Each delegates to the corresponding skill or agent.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {slashCommands.map((c) => (
              <div key={c.name} className="card">
                <code className="font-mono text-sm font-semibold mb-2 block">{c.name}</code>
                <p className="text-sm text-foreground-secondary">{c.description}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Architectural moves */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-16"
        >
          <div className="flex items-center gap-2 mb-1">
            <Wand2 className="h-5 w-5" />
            <h2 className="text-2xl font-bold">Platform moves</h2>
          </div>
          <p className="text-foreground-secondary mb-6">
            Seven architectural features that make every skill stronger — not just more skills.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {architecturalMoves.map((m) => (
              <div key={m.title} className="card">
                <div className="flex items-start gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-gradient-subtle">
                    <m.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold flex-1">{m.title}</h3>
                </div>
                <p className="text-sm text-foreground-secondary">{m.description}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Skill schema */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="card mb-16"
        >
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-5 w-5" />
            <h2 className="text-xl font-bold">Skill schema</h2>
          </div>
          <p className="text-foreground-secondary text-sm mb-3">
            Skills are markdown files with YAML frontmatter. The CoFounder extensions are additive — a skill without
            them works as a plain Anthropic Agent Skill.
          </p>
          <div className="code-block font-mono text-xs overflow-x-auto">
            <pre>{`---
name: cofounder-feature-implement
description: Use when the user points to a CoFounder feature spec...
sensitivity:
  mayTouchPII: false
  writesCode: true
  runsShell: true
modelClass: heavy           # light | mid | heavy
nextSkill: cofounder-check
requires: [cofounder-feature-new]
emits: [skill.run, branch.created, files.written]
---

# Skill body in markdown — instructions, process, output format.`}</pre>
          </div>
          <div className="mt-4 grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Required fields</h4>
              <ul className="text-foreground-secondary space-y-1 list-disc list-inside">
                <li><code className="font-mono text-xs">name</code> — slug used to invoke</li>
                <li><code className="font-mono text-xs">description</code> — when-to-use hint</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">CoFounder extensions</h4>
              <ul className="text-foreground-secondary space-y-1 list-disc list-inside">
                <li><code className="font-mono text-xs">sensitivity</code> — drives policies & sandbox</li>
                <li><code className="font-mono text-xs">modelClass</code> — drives the router</li>
                <li><code className="font-mono text-xs">nextSkill</code> · <code className="font-mono text-xs">requires</code> — drive chaining</li>
                <li><code className="font-mono text-xs">emits</code> — drives telemetry</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Nav */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-between items-center pt-8 border-t border-border"
        >
          <Link href="/docs/packages" className="text-foreground-secondary hover:text-foreground">
            <ArrowLeft className="inline mr-1 h-4 w-4" />
            Packages
          </Link>
          <Link href="/docs/agents" className="btn-primary px-4 py-2 inline-flex items-center">
            Agents
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
