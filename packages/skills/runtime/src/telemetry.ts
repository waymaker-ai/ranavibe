/**
 * Architectural move 4: Skill telemetry.
 *
 * Every skill emits structured events (skill.run, skill.complete, skill.fail,
 * plus skill-specific events declared in `emits`). The dashboard package
 * (@waymakerai/aicofounder-dashboard) consumes these to show which skills
 * work, which are expensive, and which keep failing.
 *
 * Transports are pluggable. The default writes JSONL to .cofounder/telemetry.jsonl
 * so even users without a dashboard get a local log.
 */

import { appendFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import type { SkillTelemetryEvent } from "./types.js";

export interface TelemetryTransport {
  emit(event: SkillTelemetryEvent): void | Promise<void>;
}

export class JsonlTelemetryTransport implements TelemetryTransport {
  constructor(private logPath: string) {
    const d = dirname(logPath);
    if (!existsSync(d)) mkdirSync(d, { recursive: true });
  }
  emit(event: SkillTelemetryEvent): void {
    appendFileSync(this.logPath, JSON.stringify(event) + "\n", "utf8");
  }
}

export class NoopTransport implements TelemetryTransport {
  emit(): void {
    /* no-op */
  }
}

export class Telemetry {
  private allowedEvents: Set<string>;

  constructor(
    private transport: TelemetryTransport,
    private context: { skillId: string; allowedEvents?: string[] },
  ) {
    this.allowedEvents = new Set(context.allowedEvents ?? []);
  }

  emit(event: string, fields: Partial<SkillTelemetryEvent> = {}): void {
    if (this.allowedEvents.size > 0 && !this.allowedEvents.has(event)) {
      // Soft-warn rather than throw — telemetry shouldn't break execution.
      // A linter can flag undeclared events at build time.
      return;
    }
    this.transport.emit({
      skillId: this.context.skillId,
      event,
      timestamp: new Date().toISOString(),
      ...fields,
    });
  }

  start(): { complete: (outcome?: SkillTelemetryEvent["outcome"]) => void; fail: (msg: string) => void } {
    const t0 = Date.now();
    this.emit("skill.run", { outcome: "ok" });
    return {
      complete: (outcome = "ok") => {
        this.emit("skill.complete", { outcome, durationMs: Date.now() - t0 });
      },
      fail: (msg) => {
        this.emit("skill.fail", { outcome: "fail", durationMs: Date.now() - t0, metadata: { reason: msg } });
      },
    };
  }
}

export function defaultTransport(repoRoot: string): TelemetryTransport {
  if (process.env.COFOUNDER_TELEMETRY === "off") return new NoopTransport();
  return new JsonlTelemetryTransport(join(repoRoot, ".cofounder", "telemetry.jsonl"));
}
