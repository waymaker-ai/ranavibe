/**
 * Architectural move 3: MCP re-exposure.
 *
 * Builds MCP tool descriptors from the manifest so non-Claude-Code agents
 * (Cursor, Cline, Windsurf, Claude Desktop, custom MCP clients) can invoke
 * the same skills through the standard MCP protocol.
 *
 * Tools are namespaced `cofounder.skill.<id>` to avoid collisions with
 * other MCP servers.
 */

import type { SkillManifest } from "./types.js";

export interface McpToolDescriptor {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, { type: string; description?: string }>;
    required?: string[];
  };
}

/**
 * Generate MCP tool descriptors from the skill manifest.
 *
 * Each skill becomes a tool with a uniform input schema:
 * - `task` (required): the user's request, in natural language.
 * - `repoRoot` (optional): override the working directory.
 *
 * The MCP server invokes the skill body as a system prompt and routes
 * model selection through `router.ts`.
 */
export function buildMcpTools(manifest: SkillManifest): McpToolDescriptor[] {
  return manifest.skills.map((skill) => ({
    name: `cofounder.skill.${skill.id.replace(/^cofounder-/, "")}`,
    description:
      skill.description.length > 380
        ? skill.description.slice(0, 377) + "..."
        : skill.description,
    inputSchema: {
      type: "object",
      properties: {
        task: {
          type: "string",
          description: "Natural-language request the skill should fulfill.",
        },
        repoRoot: {
          type: "string",
          description: "Optional repo root. Defaults to CLAUDE_PROJECT_DIR or cwd.",
        },
      },
      required: ["task"],
    },
  }));
}

/**
 * Sensitivity-aware tool filter. Hosts can disable skills that would
 * touch PII / shell when running in a context where those aren't allowed.
 */
export function filterToolsBySensitivity(
  manifest: SkillManifest,
  policy: { allowPII?: boolean; allowShell?: boolean; allowCodeWrites?: boolean } = {},
): SkillManifest["skills"] {
  return manifest.skills.filter((s) => {
    if (s.sensitivity.mayTouchPII && policy.allowPII === false) return false;
    if (s.sensitivity.runsShell && policy.allowShell === false) return false;
    if (s.sensitivity.writesCode && policy.allowCodeWrites === false) return false;
    return true;
  });
}
