import { describe, it, expect } from "vitest";
import { planChain, renderChain } from "../chain.js";
import type { SkillManifest } from "../types.js";

const M: SkillManifest = {
  apiVersion: "cofounder.cx/skills/v1",
  generatedAt: "2026-01-01T00:00:00Z",
  skillCount: 5,
  skills: [
    {
      id: "spec",
      path: "spec.md",
      category: "x",
      description: "Spec.",
      sensitivity: { mayTouchPII: false, writesCode: false, runsShell: false, network: false },
      modelClass: "mid",
      nextSkill: "implement",
      requires: [],
      emits: [],
      hasFixtures: false,
    },
    {
      id: "implement",
      path: "implement.md",
      category: "x",
      description: "Implement.",
      sensitivity: { mayTouchPII: false, writesCode: true, runsShell: true, network: false },
      modelClass: "heavy",
      nextSkill: "check",
      requires: ["spec"],
      emits: [],
      hasFixtures: false,
    },
    {
      id: "check",
      path: "check.md",
      category: "x",
      description: "Check.",
      sensitivity: { mayTouchPII: false, writesCode: false, runsShell: true, network: false },
      modelClass: "mid",
      requires: [],
      emits: [],
      hasFixtures: false,
    },
    {
      id: "loop-a",
      path: "a.md",
      category: "y",
      description: "loop a",
      sensitivity: { mayTouchPII: false, writesCode: false, runsShell: false, network: false },
      modelClass: "light",
      requires: ["loop-b"],
      emits: [],
      hasFixtures: false,
    },
    {
      id: "loop-b",
      path: "b.md",
      category: "y",
      description: "loop b",
      sensitivity: { mayTouchPII: false, writesCode: false, runsShell: false, network: false },
      modelClass: "light",
      requires: ["loop-a"],
      emits: [],
      hasFixtures: false,
    },
  ],
};

describe("planChain", () => {
  it("walks requires DAG, then nextSkill chain", () => {
    const plan = planChain(M, "implement");
    const ids = plan.steps.map((s) => s.id);
    expect(ids).toEqual(["spec", "implement", "check"]);
    expect(plan.steps[0].reason).toBe("required");
    expect(plan.steps[1].reason).toBe("starting");
    expect(plan.steps[2].reason).toBe("suggested-next");
  });

  it("reports missing skills without throwing", () => {
    const plan = planChain(M, "does-not-exist");
    expect(plan.missingPrerequisites).toContain("does-not-exist");
  });

  it("detects cycles in requires", () => {
    const plan = planChain(M, "loop-a");
    expect(plan.cycle).toBeDefined();
    expect(plan.cycle).toContain("loop-a");
    expect(plan.cycle).toContain("loop-b");
  });
});

describe("renderChain", () => {
  it("renders a clean numbered list", () => {
    const plan = planChain(M, "implement");
    const out = renderChain(plan);
    expect(out).toContain("`spec`");
    expect(out).toContain("`implement`");
    expect(out).toContain("`check`");
    expect(out).toContain("[prereq]");
    expect(out).toContain("[start]");
    expect(out).toContain("[next]");
  });

  it("renders cycle errors", () => {
    const plan = planChain(M, "loop-a");
    expect(renderChain(plan)).toContain("cycle detected");
  });
});
