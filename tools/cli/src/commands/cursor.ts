/**
 * aicofounder cursor:generate
 *
 * Compile VibeSpec files into Cursor rule files (.cursor/rules/<id>.mdc).
 * This lets Cursor users adopt CoFounder rules without rewriting them in
 * Cursor's native format.
 */

import fs from "fs/promises";
import path from "path";
import chalk from "chalk";
import yaml from "js-yaml";

interface VibeSpec {
  id: string;
  name: string;
  description?: string;
  apiVersion?: string;
  vibe?: {
    tone?: string;
    constraints?: string[];
    allowedActions?: string[];
    disallowedActions?: string[];
    designSystem?: {
      componentsPath?: string;
      tokensPath?: string;
      forbidRawColors?: boolean;
      forbidRawSpacing?: boolean;
      requireComponents?: string[];
    };
    dataRules?: {
      forbidMockInProd?: boolean;
      forbidHardcodedCredentials?: boolean;
      piiHandling?: "allow" | "redact" | "block";
    };
    scopeRules?: {
      allowedPaths?: string[];
      forbiddenPaths?: string[];
    };
  };
  llm?: { model?: string; provider?: string };
  security?: { compliance?: string[] };
  metadata?: Record<string, unknown>;
}

interface CursorGenerateOptions {
  outDir?: string;
  alwaysApply?: boolean;
  dryRun?: boolean;
}

const VIBE_DIRS = ["specs/vibes", "config/vibes", ".cofounder/vibes"];

async function findVibeSpecs(root: string): Promise<string[]> {
  const found: string[] = [];
  for (const d of VIBE_DIRS) {
    const full = path.join(root, d);
    try {
      const entries = await fs.readdir(full);
      for (const e of entries) {
        if (e.endsWith(".yml") || e.endsWith(".yaml")) {
          found.push(path.join(full, e));
        }
      }
    } catch {
      // directory doesn't exist; skip
    }
  }
  return found;
}

function compileRule(spec: VibeSpec, opts: CursorGenerateOptions): string {
  const v = spec.vibe ?? {};
  const globs = v.scopeRules?.allowedPaths?.length
    ? v.scopeRules.allowedPaths
    : ["**/*"];

  const frontmatter = [
    "---",
    `description: ${JSON.stringify(spec.description ?? spec.name)}`,
    `globs: ${JSON.stringify(globs)}`,
    `alwaysApply: ${opts.alwaysApply ?? false}`,
    "---",
    "",
  ].join("\n");

  const sections: string[] = [];
  sections.push(`# ${spec.name}`, "");
  if (spec.description) sections.push(spec.description, "");
  sections.push(`> Auto-generated from CoFounder VibeSpec \`${spec.id}\`. Do not edit by hand.`, "");

  if (v.tone) sections.push(`**Tone:** ${v.tone}`, "");

  if (v.constraints?.length) {
    sections.push("## Constraints");
    for (const c of v.constraints) sections.push(`- ${c}`);
    sections.push("");
  }

  if (v.scopeRules?.forbiddenPaths?.length) {
    sections.push("## Never modify");
    for (const p of v.scopeRules.forbiddenPaths) sections.push(`- \`${p}\``);
    sections.push("");
  }

  if (v.designSystem) {
    sections.push("## Design system");
    const ds = v.designSystem;
    if (ds.componentsPath) sections.push(`- Components live in \`${ds.componentsPath}\`. Extend existing ones before creating new.`);
    if (ds.tokensPath) sections.push(`- Tokens: \`${ds.tokensPath}\`. Use tokens, not raw values.`);
    if (ds.forbidRawColors) sections.push(`- **No raw hex colors** (e.g. \`#0A0910\`, \`bg-[#...]\`). Use semantic tokens.`);
    if (ds.forbidRawSpacing) sections.push(`- **No arbitrary spacing** (e.g. \`p-[17px]\`). Use the spacing scale.`);
    if (ds.requireComponents?.length) {
      sections.push(`- Required primitives: ${ds.requireComponents.map((c) => `\`${c}\``).join(", ")}`);
    }
    sections.push("");
  }

  if (v.dataRules) {
    sections.push("## Data rules");
    const dr = v.dataRules;
    if (dr.forbidMockInProd) sections.push("- **No mock/fake data** in production paths. Only in `__tests__`, `fixtures/`, `mocks/`.");
    if (dr.forbidHardcodedCredentials) sections.push("- **No hardcoded credentials.** Use env vars.");
    if (dr.piiHandling === "redact") sections.push("- PII must be redacted in logs and responses.");
    if (dr.piiHandling === "block") sections.push("- PII in inputs must be blocked, not redacted.");
    sections.push("");
  }

  if (v.allowedActions?.length) {
    sections.push("## Allowed actions");
    sections.push(v.allowedActions.map((a) => `\`${a}\``).join(", "));
    sections.push("");
  }
  if (v.disallowedActions?.length) {
    sections.push("## Disallowed actions");
    sections.push(v.disallowedActions.map((a) => `\`${a}\``).join(", "));
    sections.push("");
  }

  if (spec.security?.compliance?.length) {
    sections.push(`## Compliance`, `Follow rules for: ${spec.security.compliance.join(", ").toUpperCase()}`, "");
  }

  sections.push(
    "---",
    "",
    `_CoFounder VibeSpec — edit the source \`.yml\` and re-run_ \`aicofounder cursor:generate\`.`,
  );

  return frontmatter + sections.join("\n") + "\n";
}

export async function cursorGenerateCommand(options: CursorGenerateOptions) {
  const root = process.cwd();
  const outDir = options.outDir ?? path.join(root, ".cursor", "rules");

  console.log(chalk.bold.cyan("\nGenerating Cursor rules from CoFounder VibeSpecs...\n"));

  const specPaths = await findVibeSpecs(root);
  if (specPaths.length === 0) {
    console.log(chalk.yellow("No VibeSpecs found. Searched:"));
    for (const d of VIBE_DIRS) console.log(`  - ${d}/*.yml`);
    console.log(
      chalk.dim("\nCreate one at specs/vibes/<id>.yml. See https://cofounder.cx/spec for the schema."),
    );
    return;
  }

  if (!options.dryRun) {
    await fs.mkdir(outDir, { recursive: true });
  }

  let written = 0;
  for (const p of specPaths) {
    const raw = await fs.readFile(p, "utf8");
    let spec: VibeSpec;
    try {
      spec = yaml.load(raw) as VibeSpec;
    } catch (err) {
      console.log(chalk.red(`  ✗ ${path.relative(root, p)} — YAML parse error`));
      continue;
    }
    if (!spec?.id) {
      console.log(chalk.yellow(`  ⚠ ${path.relative(root, p)} — missing id, skipping`));
      continue;
    }
    const out = compileRule(spec, options);
    const outPath = path.join(outDir, `${spec.id}.mdc`);
    if (options.dryRun) {
      console.log(chalk.dim(`[dry-run] would write ${path.relative(root, outPath)} (${out.length} bytes)`));
    } else {
      await fs.writeFile(outPath, out, "utf8");
      console.log(chalk.green(`  ✓ ${path.relative(root, outPath)}`));
    }
    written += 1;
  }

  console.log(
    chalk.bold(
      `\n${options.dryRun ? "Would write" : "Wrote"} ${written} rule${written === 1 ? "" : "s"} to ${path.relative(root, outDir)}.`,
    ),
  );
  if (!options.dryRun) {
    console.log(
      chalk.dim("\nCommit the generated .mdc files alongside the source VibeSpec YAML so Cursor users get the same rules."),
    );
  }
}
