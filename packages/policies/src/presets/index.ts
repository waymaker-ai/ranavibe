// ---------------------------------------------------------------------------
// Presets barrel - registry, list(), get()
// ---------------------------------------------------------------------------

import type { Policy } from '../types.js';
import { registerPresets } from '../loader.js';

import { hipaaPolicy } from './hipaa.js';
import { gdprPolicy } from './gdpr.js';
import { ccpaPolicy } from './ccpa.js';
import { secPolicy } from './sec.js';
import { pciPolicy } from './pci.js';
import { ferpaPolicy } from './ferpa.js';
import { soxPolicy } from './sox.js';
import { safetyPolicy } from './safety.js';
import { enterprisePolicy } from './enterprise.js';

// -- Registry ---------------------------------------------------------------

const PRESET_MAP = new Map<string, Policy>([
  ['hipaa', hipaaPolicy],
  ['gdpr', gdprPolicy],
  ['ccpa', ccpaPolicy],
  ['sec', secPolicy],
  ['pci', pciPolicy],
  ['ferpa', ferpaPolicy],
  ['sox', soxPolicy],
  ['safety', safetyPolicy],
  ['enterprise', enterprisePolicy],
]);

// Register with the loader so `extends` works.
registerPresets(PRESET_MAP);

// -- Public API -------------------------------------------------------------

/**
 * List all available preset IDs.
 */
export function list(): string[] {
  return Array.from(PRESET_MAP.keys());
}

/**
 * Get a preset policy by ID. Returns a deep copy so mutations are safe.
 * Throws if the preset is not found.
 */
export function get(id: string): Policy {
  const preset = PRESET_MAP.get(id);
  if (!preset) {
    const available = list().join(', ');
    throw new Error(`Unknown preset "${id}". Available: ${available}`);
  }
  return JSON.parse(JSON.stringify(preset)) as Policy;
}

// Re-export individual presets for direct import
export {
  hipaaPolicy,
  gdprPolicy,
  ccpaPolicy,
  secPolicy,
  pciPolicy,
  ferpaPolicy,
  soxPolicy,
  safetyPolicy,
  enterprisePolicy,
};
