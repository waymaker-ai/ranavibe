import { describe, it, expect } from 'vitest';
import { BudgetEnforcer } from './budget.js';

describe('BudgetEnforcer', () => {
  describe('cost estimation', () => {
    it('should estimate cost for a known Anthropic model', () => {
      const enforcer = new BudgetEnforcer({ limit: 100, period: 'day' });
      const estimate = enforcer.estimateCost('claude-sonnet-4-6', 1_000_000, 500_000);
      expect(estimate.inputCost).toBe(3); // 1M * $3/1M
      expect(estimate.outputCost).toBe(7.5); // 500k * $15/1M
      expect(estimate.totalCost).toBe(10.5);
      expect(estimate.provider).toBe('anthropic');
    });

    it('should estimate cost for OpenAI GPT-4o', () => {
      const enforcer = new BudgetEnforcer({ limit: 100, period: 'day' });
      const estimate = enforcer.estimateCost('gpt-4o', 1_000_000, 1_000_000);
      expect(estimate.inputCost).toBe(2.5);
      expect(estimate.outputCost).toBe(10);
      expect(estimate.totalCost).toBe(12.5);
      expect(estimate.provider).toBe('openai');
    });

    it('should return zero cost for unknown models', () => {
      const enforcer = new BudgetEnforcer({ limit: 100, period: 'day' });
      const estimate = enforcer.estimateCost('unknown-model-xyz', 1000, 1000);
      expect(estimate.totalCost).toBe(0);
      expect(estimate.provider).toBe('unknown');
    });

    it('should identify Google provider for Gemini models', () => {
      const enforcer = new BudgetEnforcer({ limit: 100, period: 'day' });
      const estimate = enforcer.estimateCost('gemini-2.0-flash', 1_000_000, 1_000_000);
      expect(estimate.provider).toBe('google');
      expect(estimate.inputCost).toBe(0.1);
    });
  });

  describe('budget checking', () => {
    it('should start with full remaining budget', () => {
      const enforcer = new BudgetEnforcer({ limit: 50, period: 'day' });
      const state = enforcer.checkBudget();
      expect(state.remaining).toBe(50);
      expect(state.spent).toBe(0);
      expect(state.warning).toBe(false);
    });

    it('should reflect recorded costs', () => {
      const enforcer = new BudgetEnforcer({ limit: 10, period: 'day' });
      enforcer.recordCost('gpt-4o-mini', 1_000_000, 1_000_000);
      const state = enforcer.checkBudget();
      expect(state.spent).toBeGreaterThan(0);
      expect(state.remaining).toBeLessThan(10);
    });

    it('should trigger warning at threshold', () => {
      const enforcer = new BudgetEnforcer({ limit: 1, period: 'day', warningThreshold: 0.5 });
      // Record cost that brings us to 80% of budget (well above 50% threshold)
      enforcer.recordCost('claude-opus-4-6', 50_000, 5_000);
      const state = enforcer.checkBudget();
      expect(state.warning).toBe(true);
    });

    it('should detect exceeded budget', () => {
      const enforcer = new BudgetEnforcer({ limit: 0.01, period: 'day' });
      enforcer.recordCost('claude-opus-4-6', 1_000_000, 100_000);
      expect(enforcer.isExceeded()).toBe(true);
    });

    it('should not be exceeded when under limit', () => {
      const enforcer = new BudgetEnforcer({ limit: 1000, period: 'day' });
      enforcer.recordCost('gpt-4o-mini', 1000, 1000);
      expect(enforcer.isExceeded()).toBe(false);
    });
  });

  describe('period tracking', () => {
    it('should reset costs when period is "request"', () => {
      const enforcer = new BudgetEnforcer({ limit: 1, period: 'request' });
      enforcer.recordCost('gpt-4o', 1_000_000, 1_000_000);
      // 'request' period always returns 0 for getCurrentSpent
      const state = enforcer.checkBudget();
      expect(state.spent).toBe(0);
    });

    it('should track costs within a day period', () => {
      const enforcer = new BudgetEnforcer({ limit: 100, period: 'day' });
      enforcer.recordCost('gpt-4o', 100_000, 100_000);
      enforcer.recordCost('gpt-4o', 100_000, 100_000);
      const state = enforcer.checkBudget();
      expect(state.spent).toBeGreaterThan(0);
    });

    it('should reset budget state', () => {
      const enforcer = new BudgetEnforcer({ limit: 10, period: 'day' });
      enforcer.recordCost('gpt-4o', 1_000_000, 1_000_000);
      expect(enforcer.isExceeded()).toBe(true);
      enforcer.reset();
      expect(enforcer.isExceeded()).toBe(false);
    });
  });

  describe('model pricing lookup', () => {
    it('should return pricing for known models', () => {
      const enforcer = new BudgetEnforcer({ limit: 100, period: 'day' });
      const pricing = enforcer.getModelPricing('gpt-4o');
      expect(pricing).toBeDefined();
      expect(pricing!.inputPer1M).toBe(2.5);
      expect(pricing!.outputPer1M).toBe(10);
    });

    it('should return undefined for unknown models', () => {
      const enforcer = new BudgetEnforcer({ limit: 100, period: 'day' });
      expect(enforcer.getModelPricing('totally-unknown')).toBeUndefined();
    });

    it('should support partial model name matching', () => {
      const enforcer = new BudgetEnforcer({ limit: 100, period: 'day' });
      // The model lookup does partial matching
      const pricing = enforcer.getModelPricing('claude-3-haiku-20240307');
      expect(pricing).toBeDefined();
    });
  });

  describe('compareModels', () => {
    it('should return estimates sorted by cost ascending', () => {
      const estimates = BudgetEnforcer.compareModels(1_000_000, 500_000);
      expect(estimates.length).toBeGreaterThan(0);
      for (let i = 1; i < estimates.length; i++) {
        expect(estimates[i].totalCost).toBeGreaterThanOrEqual(estimates[i - 1].totalCost);
      }
    });

    it('should include multiple models', () => {
      const estimates = BudgetEnforcer.compareModels(10_000, 10_000);
      expect(estimates.length).toBeGreaterThan(5);
    });

    it('should show cheaper models first', () => {
      const estimates = BudgetEnforcer.compareModels(1_000_000, 1_000_000);
      // Gemini flash should be cheaper than GPT-4
      const flashIdx = estimates.findIndex((e) => e.model.includes('gemini') && e.model.includes('flash'));
      const gpt4Idx = estimates.findIndex((e) => e.model === 'gpt-4');
      if (flashIdx >= 0 && gpt4Idx >= 0) {
        expect(flashIdx).toBeLessThan(gpt4Idx);
      }
    });
  });

  describe('onExceeded action', () => {
    it('should default to block action', () => {
      const enforcer = new BudgetEnforcer({ limit: 10, period: 'day' });
      expect(enforcer.action).toBe('block');
    });

    it('should respect custom onExceeded action', () => {
      const enforcer = new BudgetEnforcer({ limit: 10, period: 'day', onExceeded: 'warn' });
      expect(enforcer.action).toBe('warn');
    });
  });

  describe('getAllPricing', () => {
    it('should return a copy of all pricing data', () => {
      const pricing = BudgetEnforcer.getAllPricing();
      expect(Object.keys(pricing).length).toBeGreaterThan(10);
      expect(pricing['gpt-4o']).toBeDefined();
      expect(pricing['claude-sonnet-4-6']).toBeDefined();
    });
  });
});
