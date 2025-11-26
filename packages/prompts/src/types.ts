/**
 * Type definitions for @rana/prompts
 */

import { z } from 'zod';

// Prompt definition
export interface PromptDefinition {
  id: string;
  name: string;
  template: string;
  variables: string[];
  version: string;
  description?: string;
  tags?: string[];
  model?: string;
  provider?: string;
  maxTokens?: number;
  temperature?: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Prompt version
export interface PromptVersion {
  version: string;
  template: string;
  variables: string[];
  changelog?: string;
  createdAt: Date;
  createdBy?: string;
  isActive: boolean;
  metrics?: VersionMetrics;
}

export interface VersionMetrics {
  executions: number;
  avgLatency: number;
  avgCost: number;
  successRate: number;
  userRating?: number;
}

// Prompt execution
export interface PromptExecutionOptions {
  variables: Record<string, string>;
  version?: string;
  model?: string;
  provider?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  abTestId?: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

export interface PromptExecutionResult {
  promptId: string;
  version: string;
  response: string;
  variables: Record<string, string>;
  renderedPrompt: string;
  metrics: {
    latencyMs: number;
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
  abTest?: {
    testId: string;
    variant: string;
  };
  executionId: string;
  timestamp: Date;
}

// A/B Testing
export interface ABTestConfig {
  id: string;
  promptId: string;
  name: string;
  variants: ABTestVariant[];
  metric: string;
  trafficSplit?: number[];
  minSampleSize?: number;
  maxDuration?: number; // days
  status: 'draft' | 'running' | 'paused' | 'completed';
  winner?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface ABTestVariant {
  id: string;
  name: string;
  template: string;
  traffic: number; // percentage
  metrics: VariantMetrics;
}

export interface VariantMetrics {
  impressions: number;
  conversions: number;
  conversionRate: number;
  avgLatency: number;
  avgCost: number;
  customMetrics: Record<string, number>;
}

export interface ABTestResult {
  testId: string;
  status: 'running' | 'completed' | 'inconclusive';
  winner?: string;
  confidence: number;
  variants: Array<{
    name: string;
    metrics: VariantMetrics;
    improvement?: number;
  }>;
  recommendation: string;
}

// Analytics
export interface PromptAnalyticsData {
  promptId: string;
  period: 'hour' | 'day' | 'week' | 'month';
  executions: number;
  uniqueUsers: number;
  avgLatency: number;
  p95Latency: number;
  avgCost: number;
  totalCost: number;
  successRate: number;
  errorRate: number;
  errorsByType: Record<string, number>;
  topVariables: Array<{ variable: string; count: number }>;
  hourlyDistribution: number[];
}

export interface PromptUsageReport {
  totalPrompts: number;
  totalExecutions: number;
  totalCost: number;
  avgLatency: number;
  topPrompts: Array<{
    id: string;
    name: string;
    executions: number;
    cost: number;
  }>;
  costByProvider: Record<string, number>;
  executionsByDay: Array<{ date: string; count: number }>;
}

// Optimization
export interface OptimizationSuggestion {
  type: 'cost' | 'latency' | 'quality' | 'structure';
  severity: 'low' | 'medium' | 'high';
  message: string;
  currentValue?: string | number;
  suggestedValue?: string | number;
  estimatedImprovement?: string;
  autoFix?: () => Promise<void>;
}

// Workspace
export interface WorkspaceConfig {
  id: string;
  name: string;
  defaultProvider?: string;
  defaultModel?: string;
  apiKeys?: Record<string, string>;
  webhooks?: WebhookConfig[];
  permissions?: PermissionConfig;
}

export interface WebhookConfig {
  url: string;
  events: ('prompt.executed' | 'prompt.updated' | 'abtest.completed')[];
  secret?: string;
}

export interface PermissionConfig {
  readers: string[];
  writers: string[];
  admins: string[];
}

// Registry
export interface PromptRegistryOptions {
  storage?: 'memory' | 'file' | 'redis' | 'database';
  storagePath?: string;
  redisUrl?: string;
  databaseUrl?: string;
}

// Manager
export interface PromptManagerConfig {
  workspace: string;
  registry?: PromptRegistryOptions;
  analytics?: {
    enabled: boolean;
    sampleRate?: number;
  };
  defaultProvider?: string;
  defaultModel?: string;
  apiKeys?: Record<string, string>;
}
