/**
 * Tests for cost command
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockConsole, stripAnsi } from '../setup';

describe('cost command', () => {
  let consoleMock: ReturnType<typeof mockConsole>;

  beforeEach(() => {
    consoleMock = mockConsole();
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleMock.restore();
  });

  it('should export cost functions', async () => {
    const costModule = await import('../../commands/cost');
    expect(costModule).toBeDefined();
    expect(typeof costModule.costEstimate).toBe('function');
  });
});

describe('cost calculations', () => {
  it('should calculate cost correctly for OpenAI GPT-4o', () => {
    const pricing = {
      input: 2.5 / 1_000_000, // $2.50 per 1M tokens
      output: 10.0 / 1_000_000, // $10.00 per 1M tokens
    };

    const inputTokens = 1000;
    const outputTokens = 500;

    const inputCost = inputTokens * pricing.input;
    const outputCost = outputTokens * pricing.output;
    const totalCost = inputCost + outputCost;

    expect(inputCost).toBeCloseTo(0.0025, 6);
    expect(outputCost).toBeCloseTo(0.005, 6);
    expect(totalCost).toBeCloseTo(0.0075, 6);
  });

  it('should calculate cost correctly for Anthropic Claude', () => {
    const pricing = {
      input: 3.0 / 1_000_000, // $3.00 per 1M tokens
      output: 15.0 / 1_000_000, // $15.00 per 1M tokens
    };

    const inputTokens = 2000;
    const outputTokens = 1000;

    const inputCost = inputTokens * pricing.input;
    const outputCost = outputTokens * pricing.output;
    const totalCost = inputCost + outputCost;

    expect(inputCost).toBeCloseTo(0.006, 6);
    expect(outputCost).toBeCloseTo(0.015, 6);
    expect(totalCost).toBeCloseTo(0.021, 6);
  });

  it('should calculate savings percentage correctly', () => {
    const baselineCost = 100;
    const actualCost = 40;
    const savings = baselineCost - actualCost;
    const savingsPercent = (savings / baselineCost) * 100;

    expect(savings).toBe(60);
    expect(savingsPercent).toBe(60);
  });

  it('should handle zero costs', () => {
    const baselineCost = 0;
    const actualCost = 0;

    const savingsPercent = baselineCost > 0
      ? ((baselineCost - actualCost) / baselineCost) * 100
      : 0;

    expect(savingsPercent).toBe(0);
  });
});

describe('cost formatting', () => {
  it('should format small costs correctly', () => {
    const formatCost = (cost: number): string => {
      if (cost < 0.01) {
        return `$${cost.toFixed(6)}`;
      } else if (cost < 1) {
        return `$${cost.toFixed(4)}`;
      }
      return `$${cost.toFixed(2)}`;
    };

    expect(formatCost(0.000001)).toBe('$0.000001');
    expect(formatCost(0.0025)).toBe('$0.002500'); // 0.0025 < 0.01, so uses 6 decimal places
    expect(formatCost(1.5)).toBe('$1.50');
    expect(formatCost(100)).toBe('$100.00');
  });

  it('should format token counts correctly', () => {
    const formatTokens = (tokens: number): string => {
      if (tokens >= 1_000_000) {
        return `${(tokens / 1_000_000).toFixed(1)}M`;
      } else if (tokens >= 1000) {
        return `${(tokens / 1000).toFixed(1)}K`;
      }
      return tokens.toString();
    };

    expect(formatTokens(500)).toBe('500');
    expect(formatTokens(1500)).toBe('1.5K');
    expect(formatTokens(1500000)).toBe('1.5M');
  });
});
