import { defineConfig } from '@rana/core';

export default defineConfig({
  // Provider API keys
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY || '',
    openai: process.env.OPENAI_API_KEY || '',
    google: process.env.GOOGLE_AI_API_KEY || '',
  },

  // Default settings
  defaults: {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    temperature: 0.7,
    max_tokens: 1024,
    optimize: 'balanced',
  },

  // Caching for 70% cost reduction
  cache: {
    enabled: true,
    ttl: 3600, // 1 hour
    provider: 'memory', // Use 'redis' in production
  },

  // Cost tracking
  cost_tracking: {
    enabled: true,
    log_to_console: true,
    save_to_db: false,
  },

  // Logging
  logging: {
    level: 'info',
    enabled: true,
  },
});
