'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Settings, Key, Globe, Database, Shield, Zap } from 'lucide-react';

const features = [
  {
    icon: Settings,
    title: 'Global Configuration',
    description: 'Configure RANA settings for your entire application',
    code: `import { configure, getConfig } from '@rana/core';

// Configure RANA globally
configure({
  // Default model for all operations
  defaultModel: 'claude-sonnet-4-20250514',

  // Default provider
  defaultProvider: 'anthropic',

  // Logging level
  logLevel: 'info',  // 'debug' | 'info' | 'warn' | 'error'

  // Enable telemetry
  telemetry: true,

  // Request timeout (ms)
  timeout: 30000,

  // Retry configuration
  retry: {
    maxAttempts: 3,
    backoff: 'exponential'
  },

  // Cache configuration
  cache: {
    enabled: true,
    ttl: '1h',
    storage: 'redis'
  }
});

// Get current config
const config = getConfig();
console.log(config.defaultModel);  // 'claude-sonnet-4-20250514'`,
  },
  {
    icon: Key,
    title: 'Provider Configuration',
    description: 'Set up API keys and provider settings',
    code: `import { configureProviders } from '@rana/core';

configureProviders({
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    defaultModel: 'claude-sonnet-4-20250514',
    maxTokens: 4096
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORG_ID,
    defaultModel: 'gpt-4o'
  },

  google: {
    apiKey: process.env.GOOGLE_API_KEY,
    defaultModel: 'gemini-pro'
  },

  azure: {
    apiKey: process.env.AZURE_OPENAI_KEY,
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    deploymentName: 'gpt-4'
  },

  cohere: {
    apiKey: process.env.COHERE_API_KEY
  },

  huggingface: {
    apiKey: process.env.HF_API_KEY
  }
});`,
  },
  {
    icon: Globe,
    title: 'Environment Variables',
    description: 'Configure via environment variables',
    code: `# .env file

# Provider API Keys
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=AIza...
COHERE_API_KEY=...
HF_API_KEY=hf_...

# Azure OpenAI
AZURE_OPENAI_KEY=...
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com

# Default Settings
RANA_DEFAULT_MODEL=claude-sonnet-4-20250514
RANA_DEFAULT_PROVIDER=anthropic
RANA_LOG_LEVEL=info
RANA_TIMEOUT=30000

# Cache Settings
RANA_CACHE_ENABLED=true
RANA_CACHE_TTL=3600
RANA_CACHE_REDIS_URL=redis://localhost:6379

# Telemetry
RANA_TELEMETRY=true
RANA_OTLP_ENDPOINT=http://localhost:4318`,
  },
  {
    icon: Database,
    title: 'Storage Configuration',
    description: 'Configure storage backends for various features',
    code: `import { configureStorage } from '@rana/core';

configureStorage({
  // Prompt storage
  prompts: {
    type: 'postgresql',
    connectionString: process.env.DATABASE_URL
  },

  // Memory/conversation storage
  memory: {
    type: 'redis',
    url: process.env.REDIS_URL,
    prefix: 'rana:memory:'
  },

  // Vector store for RAG
  vectors: {
    type: 'pinecone',
    apiKey: process.env.PINECONE_API_KEY,
    environment: 'us-east-1',
    indexName: 'rana-vectors'
  },

  // Cache storage
  cache: {
    type: 'redis',
    url: process.env.REDIS_URL,
    prefix: 'rana:cache:'
  },

  // Audit logs
  audit: {
    type: 'postgresql',
    connectionString: process.env.DATABASE_URL,
    tableName: 'rana_audit_logs'
  }
});`,
  },
  {
    icon: Shield,
    title: 'Security Configuration',
    description: 'Configure security settings and policies',
    code: `import { configureSecurity } from '@rana/core';

configureSecurity({
  // PII detection and redaction
  pii: {
    enabled: true,
    types: ['email', 'phone', 'ssn', 'credit_card'],
    action: 'redact'  // 'redact' | 'block' | 'warn'
  },

  // Prompt injection protection
  promptInjection: {
    enabled: true,
    sensitivity: 'high',
    action: 'block'
  },

  // Content filtering
  contentFilter: {
    enabled: true,
    categories: ['hate', 'violence', 'sexual'],
    thresholds: {
      hate: 0.7,
      violence: 0.8
    }
  },

  // Rate limiting
  rateLimiting: {
    enabled: true,
    defaultLimits: {
      requests: { max: 100, window: '1m' },
      tokens: { max: 100000, window: '1h' }
    }
  },

  // Audit logging
  audit: {
    enabled: true,
    logInputs: true,
    logOutputs: true,
    retention: '7 years'
  }
});`,
  },
  {
    icon: Zap,
    title: 'Performance Configuration',
    description: 'Tune performance and optimization settings',
    code: `import { configurePerformance } from '@rana/core';

configurePerformance({
  // Concurrency limits
  concurrency: {
    maxParallelRequests: 10,
    maxQueueSize: 100,
    queueTimeout: 60000
  },

  // Batching
  batching: {
    enabled: true,
    maxBatchSize: 20,
    maxWaitTime: 100  // ms
  },

  // Streaming
  streaming: {
    enabled: true,
    chunkSize: 1024
  },

  // Cost optimization
  optimization: {
    modelRouting: true,      // Auto-select cheapest model
    promptCompression: true, // Compress long prompts
    caching: true,           // Cache identical requests
    deduplication: true      // Deduplicate concurrent requests
  },

  // Monitoring
  monitoring: {
    metricsEnabled: true,
    tracingEnabled: true,
    samplingRate: 1.0,  // 100% of requests
    exporters: ['prometheus', 'otlp']
  }
});`,
  },
];

export default function ConfigurationPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="container-wide">
        <Link
          href="/docs"
          className="inline-flex items-center text-sm text-foreground-secondary hover:text-foreground mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Documentation
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-gradient-subtle">
              <Settings className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">Configuration</h1>
          </div>
          <p className="text-lg text-foreground-secondary">
            Configure RANA for your environment. Set up providers, storage,
            security, and performance settings.
          </p>
          <div className="mt-4 code-block font-mono text-sm">
            npm install @rana/core
          </div>
        </motion.div>

        {/* Features */}
        <div className="space-y-12">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-lg bg-gradient-subtle">
                  <feature.icon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">{feature.title}</h2>
                  <p className="text-foreground-secondary">{feature.description}</p>
                </div>
              </div>
              <div className="code-block font-mono text-sm overflow-x-auto">
                <pre>{feature.code}</pre>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Config File */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 card"
        >
          <h2 className="text-2xl font-bold mb-4">Configuration File</h2>
          <p className="text-foreground-secondary mb-4">
            You can also use a <code className="px-2 py-1 rounded bg-background-secondary font-mono">rana.config.ts</code> file in your project root:
          </p>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`// rana.config.ts
import { defineConfig } from '@rana/core';

export default defineConfig({
  defaultModel: 'claude-sonnet-4-20250514',
  defaultProvider: 'anthropic',

  providers: {
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY
    }
  },

  storage: {
    prompts: { type: 'postgresql' },
    cache: { type: 'redis' }
  },

  security: {
    pii: { enabled: true },
    promptInjection: { enabled: true }
  },

  performance: {
    optimization: {
      caching: true,
      modelRouting: true
    }
  }
});`}</pre>
          </div>
        </motion.div>

        {/* Validation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8 card bg-gradient-subtle"
        >
          <h2 className="text-2xl font-bold mb-4">Configuration Validation</h2>
          <p className="text-foreground-secondary mb-4">
            Validate your configuration at startup:
          </p>
          <div className="code-block font-mono text-sm overflow-x-auto">
            <pre>{`import { validateConfig } from '@rana/core';

const { valid, errors, warnings } = validateConfig();

if (!valid) {
  console.error('Configuration errors:', errors);
  process.exit(1);
}

if (warnings.length > 0) {
  console.warn('Configuration warnings:', warnings);
}

// Or use the CLI
// npx rana config:validate`}</pre>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
