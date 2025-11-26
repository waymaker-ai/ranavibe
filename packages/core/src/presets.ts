/**
 * RANA Presets
 * Pre-configured setups for common use cases
 */

import type { RanaConfig, RanaChatRequest } from './types';

/**
 * Preset configurations for common scenarios
 */
export const presets = {
  /**
   * Development preset - Fast responses, minimal cost
   */
  development: {
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY,
    },
    defaults: {
      provider: 'anthropic' as const,
      model: 'claude-3-5-haiku-20241022',
      temperature: 0.7,
      max_tokens: 1000,
      optimize: 'cost' as const,
      cache: true,
    },
    cache: {
      enabled: true,
      type: 'memory' as const,
      ttl: 3600,
    },
  },

  /**
   * Production preset - Balanced quality and cost
   */
  production: {
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY,
      openai: process.env.OPENAI_API_KEY,
    },
    defaults: {
      provider: 'anthropic' as const,
      model: 'claude-3-5-sonnet-20241022',
      temperature: 0.7,
      max_tokens: 4000,
      optimize: 'balanced' as const,
      cache: true,
    },
    cache: {
      enabled: true,
      type: 'redis' as const,
      ttl: 7200,
      redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      },
    },
  },

  /**
   * High-quality preset - Best possible responses
   */
  highQuality: {
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY,
      openai: process.env.OPENAI_API_KEY,
    },
    defaults: {
      provider: 'anthropic' as const,
      model: 'claude-3-opus-20240229',
      temperature: 0.9,
      max_tokens: 8000,
      optimize: 'quality' as const,
      cache: false,
    },
    cache: {
      enabled: false,
    },
  },

  /**
   * Cost-optimized preset - Minimum cost
   */
  costOptimized: {
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY,
      google: process.env.GOOGLE_API_KEY,
      groq: process.env.GROQ_API_KEY,
    },
    defaults: {
      provider: 'google' as const,
      model: 'gemini-pro',
      temperature: 0.7,
      max_tokens: 2000,
      optimize: 'cost' as const,
      cache: true,
    },
    cache: {
      enabled: true,
      type: 'memory' as const,
      ttl: 86400, // 24 hours
    },
  },

  /**
   * Speed-optimized preset - Fastest responses
   */
  speedOptimized: {
    providers: {
      groq: process.env.GROQ_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
    },
    defaults: {
      provider: 'groq' as const,
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 2000,
      optimize: 'speed' as const,
      cache: true,
    },
    cache: {
      enabled: true,
      type: 'memory' as const,
      ttl: 1800,
    },
  },

  /**
   * Multi-provider preset - Use all providers
   */
  multiProvider: {
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY,
      openai: process.env.OPENAI_API_KEY,
      google: process.env.GOOGLE_API_KEY,
      xai: process.env.XAI_API_KEY,
      mistral: process.env.MISTRAL_API_KEY,
      cohere: process.env.COHERE_API_KEY,
      together: process.env.TOGETHER_API_KEY,
      groq: process.env.GROQ_API_KEY,
    },
    defaults: {
      optimize: 'balanced' as const,
      cache: true,
    },
    cache: {
      enabled: true,
      type: 'redis' as const,
      ttl: 3600,
      redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      },
    },
  },

  /**
   * Local-only preset - No API costs
   */
  local: {
    providers: {
      ollama: 'http://localhost:11434',
    },
    defaults: {
      provider: 'ollama' as const,
      model: 'llama3',
      temperature: 0.7,
      max_tokens: 4000,
      cache: false,
    },
    cache: {
      enabled: false,
    },
  },
};

/**
 * Request templates for common tasks
 */
export const templates = {
  /**
   * Summarization template
   */
  summarize: (text: string, maxLength: number = 200): RanaChatRequest => ({
    messages: [
      {
        role: 'system',
        content: `You are a helpful assistant that summarizes text concisely in under ${maxLength} words.`,
      },
      {
        role: 'user',
        content: `Please summarize the following text:\n\n${text}`,
      },
    ],
    temperature: 0.3,
    max_tokens: Math.ceil(maxLength * 1.5),
  }),

  /**
   * Code review template
   */
  codeReview: (code: string, language: string = 'typescript'): RanaChatRequest => ({
    messages: [
      {
        role: 'system',
        content: 'You are an expert code reviewer. Provide constructive feedback on code quality, best practices, potential bugs, and improvements.',
      },
      {
        role: 'user',
        content: `Please review this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``,
      },
    ],
    temperature: 0.5,
    max_tokens: 2000,
  }),

  /**
   * Translation template
   */
  translate: (text: string, from: string, to: string): RanaChatRequest => ({
    messages: [
      {
        role: 'system',
        content: `You are a professional translator. Translate text from ${from} to ${to} accurately while preserving meaning and tone.`,
      },
      {
        role: 'user',
        content: `Translate this text to ${to}:\n\n${text}`,
      },
    ],
    temperature: 0.3,
    max_tokens: Math.ceil(text.length * 2),
  }),

  /**
   * Q&A template
   */
  qa: (question: string, context?: string): RanaChatRequest => ({
    messages: [
      {
        role: 'system',
        content: context
          ? `You are a helpful assistant. Answer questions based on the following context:\n\n${context}`
          : 'You are a helpful assistant. Answer questions accurately and concisely.',
      },
      {
        role: 'user',
        content: question,
      },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  }),

  /**
   * Brainstorming template
   */
  brainstorm: (topic: string, count: number = 10): RanaChatRequest => ({
    messages: [
      {
        role: 'system',
        content: `You are a creative brainstorming assistant. Generate ${count} unique and diverse ideas.`,
      },
      {
        role: 'user',
        content: `Generate ${count} ideas for: ${topic}`,
      },
    ],
    temperature: 0.9,
    max_tokens: 2000,
  }),

  /**
   * Classification template
   */
  classify: (text: string, categories: string[]): RanaChatRequest => ({
    messages: [
      {
        role: 'system',
        content: `You are a text classifier. Classify the given text into one of these categories: ${categories.join(', ')}. Respond with only the category name.`,
      },
      {
        role: 'user',
        content: text,
      },
    ],
    temperature: 0.1,
    max_tokens: 50,
  }),

  /**
   * Sentiment analysis template
   */
  sentiment: (text: string): RanaChatRequest => ({
    messages: [
      {
        role: 'system',
        content: 'You are a sentiment analyzer. Analyze the sentiment of the text and respond with: positive, negative, or neutral. Then provide a brief explanation.',
      },
      {
        role: 'user',
        content: text,
      },
    ],
    temperature: 0.1,
    max_tokens: 200,
  }),

  /**
   * Entity extraction template
   */
  extractEntities: (text: string, entityTypes: string[] = ['person', 'organization', 'location', 'date']): RanaChatRequest => ({
    messages: [
      {
        role: 'system',
        content: `You are an entity extractor. Extract ${entityTypes.join(', ')} entities from the text. Format as JSON.`,
      },
      {
        role: 'user',
        content: text,
      },
    ],
    temperature: 0.1,
    max_tokens: 1000,
  }),

  /**
   * Creative writing template
   */
  creativeWrite: (prompt: string, style?: string): RanaChatRequest => ({
    messages: [
      {
        role: 'system',
        content: style
          ? `You are a creative writer. Write in a ${style} style.`
          : 'You are a creative writer. Write engaging and original content.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.9,
    max_tokens: 4000,
  }),

  /**
   * Data formatting template
   */
  formatData: (data: string, format: 'json' | 'yaml' | 'csv' | 'markdown'): RanaChatRequest => ({
    messages: [
      {
        role: 'system',
        content: `You are a data formatter. Convert the given data to ${format} format.`,
      },
      {
        role: 'user',
        content: `Convert this to ${format}:\n\n${data}`,
      },
    ],
    temperature: 0.1,
    max_tokens: 2000,
  }),
};

/**
 * Optimization strategies
 */
export const strategies = {
  /**
   * Cost optimization strategy
   */
  minimizeCost: {
    optimize: 'cost' as const,
    cache: true,
    providers: ['google', 'groq', 'anthropic'] as const,
    temperature: 0.7,
    max_tokens: 2000,
  },

  /**
   * Speed optimization strategy
   */
  maximizeSpeed: {
    optimize: 'speed' as const,
    cache: true,
    providers: ['groq', 'anthropic'] as const,
    temperature: 0.7,
    max_tokens: 1000,
  },

  /**
   * Quality optimization strategy
   */
  maximizeQuality: {
    optimize: 'quality' as const,
    cache: false,
    providers: ['anthropic', 'openai'] as const,
    temperature: 0.9,
    max_tokens: 8000,
  },

  /**
   * Balanced strategy
   */
  balanced: {
    optimize: 'balanced' as const,
    cache: true,
    providers: ['anthropic', 'openai', 'google'] as const,
    temperature: 0.7,
    max_tokens: 4000,
  },
};

/**
 * Helper to get preset configuration
 */
export function getPreset(preset: keyof typeof presets): Partial<RanaConfig> {
  return presets[preset];
}

/**
 * Helper to get request template
 */
export function getTemplate(
  template: keyof typeof templates,
  ...args: any[]
): RanaChatRequest {
  return (templates[template] as any)(...args);
}

/**
 * Helper to get optimization strategy
 */
export function getStrategy(strategy: keyof typeof strategies) {
  return strategies[strategy];
}
