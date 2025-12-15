import { RanaConfig, QualityGate } from '../config/index';

export interface QualityGateResult {
  gate: QualityGate;
  passed: boolean;
  message: string;
}

export interface PhaseResults {
  phase: string;
  gates: QualityGateResult[];
  allPassed: boolean;
}

export class QualityGateChecker {
  private config: RanaConfig;

  constructor(config: RanaConfig) {
    this.config = config;
  }

  /**
   * Check all quality gates for a specific phase
   */
  checkPhase(
    phase: 'pre_implementation' | 'implementation' | 'testing' | 'deployment'
  ): PhaseResults {
    const gates = this.config.quality_gates[phase];
    const results: QualityGateResult[] = [];

    for (const gate of gates) {
      // For now, gates require manual verification
      // In future, we can add automated checks
      results.push({
        gate,
        passed: false, // Manual verification required
        message: `Manual verification required: ${gate.description}`,
      });
    }

    return {
      phase,
      gates: results,
      allPassed: results.every((r) => r.passed),
    };
  }

  /**
   * Get gates that apply to a major feature
   */
  getMajorFeatureGates(): QualityGate[] {
    const gates = this.config.quality_gates.pre_implementation;
    return gates.filter((g) => g.required_for === 'major_features');
  }
}
