#!/usr/bin/env node
/**
 * Reproducible benchmarks for the CoFounder Skill Library.
 *
 * Three numbers we can defend with code:
 *
 *   1. Preflight overhead (microseconds)
 *      How long does sensitivity preflight + model routing add per invocation?
 *
 *   2. Model-class cost delta (USD per 1K invocations, by class)
 *      Modeled at published Claude family prices. Shows the dollar gap between
 *      misrouted (everything-on-Opus) vs correctly-routed.
 *
 *   3. Fixture pass rate
 *      Loads MANIFEST.json + fixtures and reports how many assert clean.
 *      Cannot run model-dependent assertions without an API key, so this
 *      reports structural validity (frontmatter, expectations parseable).
 *
 * Run: pnpm --filter @waymakerai/aicofounder-skills benchmark
 */

import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync } from "node:fs";
import { loadAllSkills, buildManifest } from "../manifest.js";
import { preflight } from "../sensitivity.js";
import { route } from "../router.js";
import { loadFixtures } from "../fixture.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkgRoot = resolve(__dirname, "..", "..", "..");
const srcDir = join(pkgRoot, "src");

// Published per-1M-token prices for the Claude families we route between.
// Source: anthropic.com/pricing as of 2026-Q1. Values used only for the
// modeled cost-delta calculation — no API calls are made.
const PRICES = {
  "claude-haiku-4-5-20251001": { in: 1.0, out: 5.0 },
  "claude-sonnet-4-6": { in: 3.0, out: 15.0 },
  "claude-opus-4-7": { in: 15.0, out: 75.0 },
} as const;

function modelCost(model: string, inK: number, outK: number): number {
  const p = (PRICES as Record<string, { in: number; out: number } | undefined>)[model];
  if (!p) return NaN;
  // inK and outK are in thousands of tokens; PRICES are per 1M.
  return ((inK * p.in) + (outK * p.out)) / 1000;
}

// ---------- Benchmark 1: preflight overhead ----------
function benchmarkPreflightOverhead(iters: number): { meanNs: number; medianNs: number } {
  const sensitivity = { mayTouchPII: false, writesCode: true, runsShell: false, network: false };
  const host = { allowPII: true, allowShell: true, allowCodeWrites: true, allowNetwork: true };

  // Warmup
  for (let i = 0; i < 5_000; i++) preflight(sensitivity, host);

  const samples: number[] = [];
  for (let i = 0; i < iters; i++) {
    const t0 = process.hrtime.bigint();
    preflight(sensitivity, host);
    route("mid", { inputTokensEstimate: 8_000 });
    const t1 = process.hrtime.bigint();
    samples.push(Number(t1 - t0));
  }
  samples.sort((a, b) => a - b);
  const sum = samples.reduce((a, b) => a + b, 0);
  return {
    meanNs: sum / samples.length,
    medianNs: samples[Math.floor(samples.length / 2)],
  };
}

// ---------- Benchmark 2: model-class cost delta ----------
function benchmarkCostDelta(): {
  per1kInvocations: { everythingOnOpus: number; correctlyRouted: number; saved: number };
  byClass: Array<{ cls: string; model: string; perCall: number }>;
} {
  // Synthetic mix that matches the manifest's distribution of model classes.
  const records = loadAllSkills(srcDir, pkgRoot);
  const manifest = buildManifest(records);

  // Token sizes assumed per class — derived from the SKILL.md design intent,
  // not measured at runtime. Light: short summaries / classifications.
  // Mid: code generation / refactor with moderate context. Heavy: architecture.
  const tokens = {
    light: { in: 1.5, out: 0.5 }, // 1500 in, 500 out
    mid: { in: 8.0, out: 1.5 },
    heavy: { in: 20.0, out: 4.0 },
  } as const;

  const counts = { light: 0, mid: 0, heavy: 0 };
  for (const s of manifest.skills) counts[s.modelClass]++;
  const total = counts.light + counts.mid + counts.heavy;

  const opusModel = "claude-opus-4-7";
  let everythingOnOpus = 0;
  let correctlyRouted = 0;
  const byClass: Array<{ cls: string; model: string; perCall: number }> = [];

  for (const cls of ["light", "mid", "heavy"] as const) {
    const t = tokens[cls];
    // The router maps cls → DEFAULT_MODELS[cls]; we re-derive here for clarity.
    const routedDecision = route(cls, {});
    const opusCost = modelCost(opusModel, t.in, t.out);
    const routedCost = modelCost(routedDecision.model, t.in, t.out);
    const fraction = counts[cls] / total;
    const callsAtCls = 1000 * fraction;
    everythingOnOpus += callsAtCls * opusCost;
    correctlyRouted += callsAtCls * routedCost;
    byClass.push({ cls, model: routedDecision.model, perCall: routedCost });
  }

  return {
    per1kInvocations: {
      everythingOnOpus: Number(everythingOnOpus.toFixed(4)),
      correctlyRouted: Number(correctlyRouted.toFixed(4)),
      saved: Number((everythingOnOpus - correctlyRouted).toFixed(4)),
    },
    byClass,
  };
}

// ---------- Benchmark 3: fixture structural validity ----------
function benchmarkFixtureStructure(): {
  totalFixtures: number;
  parsedClean: number;
  fixturesWithLatencyBudget: number;
  fixturesWithRefuseAssertions: number;
} {
  const records = loadAllSkills(srcDir, pkgRoot);
  let total = 0;
  let clean = 0;
  let withLatency = 0;
  let withRefuse = 0;
  for (const skill of records) {
    const fixtures = loadFixtures(skill);
    for (const fx of fixtures) {
      total++;
      try {
        // structural validity: required fields parseable
        if (fx.id && fx.expect) clean++;
        if (fx.expect.maxLatencySeconds && fx.expect.maxLatencySeconds > 0) withLatency++;
        if (fx.expect.refusesToWriteFiles && fx.expect.refusesToWriteFiles.length >= 0) withRefuse++;
      } catch {
        /* counts as not-clean */
      }
    }
  }
  return {
    totalFixtures: total,
    parsedClean: clean,
    fixturesWithLatencyBudget: withLatency,
    fixturesWithRefuseAssertions: withRefuse,
  };
}

// ---------- Run + emit ----------
const ITERS = 100_000;

const overhead = benchmarkPreflightOverhead(ITERS);
const cost = benchmarkCostDelta();
const fixtures = benchmarkFixtureStructure();

const report = {
  apiVersion: "cofounder.cx/skills/benchmarks/v1",
  generatedAt: new Date().toISOString(),
  environment: {
    node: process.version,
    platform: process.platform,
    arch: process.arch,
  },
  preflightOverhead: {
    iterations: ITERS,
    meanMicroseconds: Number((overhead.meanNs / 1000).toFixed(3)),
    medianMicroseconds: Number((overhead.medianNs / 1000).toFixed(3)),
    note: "Includes sensitivity preflight + model routing decision. Pure JS, no I/O.",
  },
  modelCostDelta: cost,
  fixtureStructure: fixtures,
};

const outPath = resolve(pkgRoot, "BENCHMARKS.json");
const fs = await import("node:fs");
fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n", "utf8");
process.stderr.write(`Wrote benchmarks to ${outPath}\n`);
process.stdout.write(JSON.stringify(report, null, 2) + "\n");
