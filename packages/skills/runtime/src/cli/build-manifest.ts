#!/usr/bin/env node
/**
 * CLI: regenerate MANIFEST.json from src/.
 *
 * Usage:
 *   pnpm --filter @waymakerai/aicofounder-skills manifest
 */

import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadAllSkills, buildManifest, writeManifest } from "../manifest.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// runtime/dist/cli/build-manifest.js → runtime/dist/cli → runtime/dist → runtime → packages/skills
const pkgRoot = resolve(__dirname, "..", "..", "..");
const srcDir = join(pkgRoot, "src");
const outPath = join(pkgRoot, "MANIFEST.json");

const records = loadAllSkills(srcDir, pkgRoot);
const manifest = buildManifest(records);
writeManifest(manifest, outPath);

process.stderr.write(
  `Wrote ${manifest.skills.length} skills to ${outPath}\n`,
);
