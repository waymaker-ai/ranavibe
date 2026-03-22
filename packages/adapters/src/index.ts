/**
 * @waymakerai/aicofounder-adapters — Integration adapters for enterprise guardrail products.
 *
 * Provides unified conversion between CoFounder policies and Lakera Guard,
 * AWS Bedrock Guardrails, and Galileo evaluation formats.
 */

// Types
export type {
  Adapter,
  AdapterConfig,
  AdapterResult,
  BedrockConfig,
  ExportResult,
  GalileoConfig,
  ImportResult,
  LakeraConfig,
  PolicyMapping,
  RanaAction,
  RanaCategory,
  CoFounderPolicyConfig,
  Severity,
  UnifiedAdapterConfig,
  UnifiedFinding,
} from './types';

// Adapter factories
export { createLakeraAdapter } from './lakera';
export { createBedrockAdapter } from './bedrock';
export { createGalileoAdapter } from './galileo';

// Unified adapter
export { createUnifiedAdapter } from './unified';
export type { UnifiedResult } from './unified';
