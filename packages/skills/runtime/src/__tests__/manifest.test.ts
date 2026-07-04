import { describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadAllSkills, buildManifest, parseSkillFile } from "../manifest.js";

function makeFixtureRepo(): string {
  const root = mkdtempSync(join(tmpdir(), "cofounder-skills-test-"));
  const src = join(root, "src");
  mkdirSync(join(src, "feature-flow", "alpha"), { recursive: true });
  mkdirSync(join(src, "feature-flow", "beta"), { recursive: true });
  mkdirSync(join(src, "documentation", "gamma"), { recursive: true });

  writeFileSync(
    join(src, "feature-flow", "alpha", "SKILL.md"),
    `---
name: cofounder-alpha
description: Alpha skill.
modelClass: light
nextSkill: cofounder-beta
sensitivity:
  writesCode: false
emits: [skill.run]
---

# alpha
body
`,
  );
  writeFileSync(
    join(src, "feature-flow", "beta", "SKILL.md"),
    `---
name: cofounder-beta
description: Beta skill — depends on alpha.
modelClass: heavy
requires: [cofounder-alpha]
sensitivity:
  writesCode: true
  runsShell: true
---

# beta
body
`,
  );
  writeFileSync(
    join(src, "documentation", "gamma", "SKILL.md"),
    `---
name: cofounder-gamma
description: Plain skill, no extensions.
---

# gamma
body
`,
  );
  return root;
}

describe("parseSkillFile", () => {
  it("parses required fields and rejects bare markdown", () => {
    const root = makeFixtureRepo();
    const path = join(root, "src", "feature-flow", "alpha", "SKILL.md");
    const { frontmatter, body } = parseSkillFile(path);
    expect(frontmatter.name).toBe("cofounder-alpha");
    expect(frontmatter.modelClass).toBe("light");
    expect(frontmatter.nextSkill).toBe("cofounder-beta");
    expect(body).toContain("# alpha");
  });
});

describe("loadAllSkills + buildManifest", () => {
  it("loads every SKILL.md under src/", () => {
    const root = makeFixtureRepo();
    const skills = loadAllSkills(join(root, "src"), root);
    expect(skills).toHaveLength(3);
    const ids = skills.map((s) => s.id).sort();
    expect(ids).toEqual(["cofounder-alpha", "cofounder-beta", "cofounder-gamma"]);
  });

  it("derives category from the parent folder under src/", () => {
    const root = makeFixtureRepo();
    const skills = loadAllSkills(join(root, "src"), root);
    const byId = Object.fromEntries(skills.map((s) => [s.id, s.category]));
    expect(byId["cofounder-alpha"]).toBe("feature-flow");
    expect(byId["cofounder-beta"]).toBe("feature-flow");
    expect(byId["cofounder-gamma"]).toBe("documentation");
  });

  it("applies sensible defaults for skills without extensions", () => {
    const root = makeFixtureRepo();
    const m = buildManifest(loadAllSkills(join(root, "src"), root));
    const gamma = m.skills.find((s) => s.id === "cofounder-gamma")!;
    expect(gamma.modelClass).toBe("mid");
    expect(gamma.sensitivity).toEqual({
      mayTouchPII: false,
      writesCode: false,
      runsShell: false,
      network: false,
    });
    expect(gamma.emits).toEqual(["skill.run"]);
  });

  it("preserves explicit extension fields", () => {
    const root = makeFixtureRepo();
    const m = buildManifest(loadAllSkills(join(root, "src"), root));
    const beta = m.skills.find((s) => s.id === "cofounder-beta")!;
    expect(beta.modelClass).toBe("heavy");
    expect(beta.requires).toEqual(["cofounder-alpha"]);
    expect(beta.sensitivity.writesCode).toBe(true);
    expect(beta.sensitivity.runsShell).toBe(true);
  });
});
