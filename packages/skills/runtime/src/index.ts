/**
 * @waymakerai/aicofounder-skills
 *
 * Public runtime API. Consumers (claude-code-plugin, mcp-server, ci) import
 * from here.
 */

export * from "./types.js";
export {
  parseSkillFile,
  loadAllSkills,
  buildManifest,
  writeManifest,
} from "./manifest.js";
export { planChain, renderChain } from "./chain.js";
export type { ChainStep, ChainPlan } from "./chain.js";
export {
  loadFixtures,
  runFixture,
  runAllFixtures,
  summarizeResults,
} from "./fixture.js";
export type { FixtureExecutor } from "./fixture.js";
export { buildMcpTools, filterToolsBySensitivity } from "./mcp.js";
export type { McpToolDescriptor } from "./mcp.js";
export {
  Telemetry,
  JsonlTelemetryTransport,
  NoopTransport,
  defaultTransport,
} from "./telemetry.js";
export type { TelemetryTransport } from "./telemetry.js";
export { presetsForSensitivity, preflight } from "./sensitivity.js";
export type { HostPolicy, PreflightResult } from "./sensitivity.js";
export { route, DEFAULT_MODELS, HEAVY_NEEDS_SKILLS } from "./router.js";
export type { ModelRegistry, RoutingHint, RoutingDecision } from "./router.js";
export {
  requiresSandboxPreview,
  pickSandboxPolicy,
  previewBeforeRun,
} from "./sandbox.js";
export type {
  SandboxAdapter,
  SandboxPreviewRequest,
  SandboxPreviewResult,
} from "./sandbox.js";
