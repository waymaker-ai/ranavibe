/**
 * OpenTelemetry Export Example
 * Demonstrates how to export RANA traces to OpenTelemetry collectors
 */

import { createRana, createOTelExporter, createOTelPlugin } from '@rana/core';

// ============================================================================
// Basic Setup
// ============================================================================

/**
 * Example 1: Basic OpenTelemetry export
 */
async function basicOTelExport() {
  // Create the exporter
  const exporter = createOTelExporter({
    serviceName: 'my-rana-service',
    endpoint: 'http://localhost:4318/v1/traces',
    batchSize: 50,
    batchInterval: 5000,
    debug: true,
  });

  // Use as a plugin
  const rana = createRana({
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY,
      openai: process.env.OPENAI_API_KEY,
    },
    plugins: [exporter.asPlugin()],
  });

  // Make requests - they'll automatically be traced
  const response = await rana.chat('Tell me about OpenTelemetry');
  console.log('Response:', response.content.substring(0, 100));

  // Shutdown to flush remaining spans
  await exporter.shutdown();
}

// ============================================================================
// Advanced Setup with Authentication
// ============================================================================

/**
 * Example 2: Export to a hosted collector with authentication
 */
async function authenticatedOTelExport() {
  const exporter = createOTelExporter({
    serviceName: 'production-rana-app',
    endpoint: 'https://otel-collector.example.com/v1/traces',
    headers: {
      'x-api-key': process.env.OTEL_API_KEY!,
      'x-environment': 'production',
    },
    resourceAttributes: {
      'service.version': '1.0.0',
      'deployment.environment': 'production',
      'k8s.cluster.name': 'prod-cluster-1',
    },
    batchSize: 100,
    batchInterval: 10000,
    onExportSuccess: (spanCount) => {
      console.log(`Successfully exported ${spanCount} spans`);
    },
    onExportError: (error) => {
      console.error('Export failed:', error);
    },
  });

  const rana = createRana({
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY,
      openai: process.env.OPENAI_API_KEY,
    },
    plugins: [exporter.asPlugin()],
  });

  // Your application code
  const response = await rana.chat({
    messages: [{ role: 'user', content: 'Hello!' }],
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
  });

  console.log('Cost:', response.cost.total_cost);

  await exporter.shutdown();
}

// ============================================================================
// Plugin Pattern (Recommended)
// ============================================================================

/**
 * Example 3: Using createOTelPlugin for simpler setup
 */
async function pluginPattern() {
  const rana = createRana({
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY,
    },
    plugins: [
      createOTelPlugin({
        serviceName: 'my-app',
        endpoint: process.env.OTEL_ENDPOINT || 'http://localhost:4318/v1/traces',
        headers: {
          'x-api-key': process.env.OTEL_API_KEY || '',
        },
      }),
    ],
  });

  await rana.chat('What is TypeScript?');
}

// ============================================================================
// Multiple Exporters
// ============================================================================

/**
 * Example 4: Export to multiple collectors
 */
async function multipleExporters() {
  const localExporter = createOTelExporter({
    serviceName: 'dev-rana',
    endpoint: 'http://localhost:4318/v1/traces',
    debug: true,
  });

  const prodExporter = createOTelExporter({
    serviceName: 'prod-rana',
    endpoint: 'https://prod-otel.example.com/v1/traces',
    headers: {
      'x-api-key': process.env.PROD_OTEL_KEY!,
    },
  });

  const rana = createRana({
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY,
    },
    plugins: [localExporter.asPlugin(), prodExporter.asPlugin()],
  });

  await rana.chat('Explain distributed tracing');

  await Promise.all([localExporter.shutdown(), prodExporter.shutdown()]);
}

// ============================================================================
// Trace Grouping
// ============================================================================

/**
 * Example 5: Group related requests in a single trace
 */
async function traceGrouping() {
  const exporter = createOTelExporter({
    serviceName: 'grouped-traces',
    endpoint: 'http://localhost:4318/v1/traces',
  });

  const rana = createRana({
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY,
    },
    plugins: [exporter.asPlugin()],
  });

  // Start a trace for a conversation
  const traceId = exporter.startTrace();
  console.log('Started trace:', traceId);

  try {
    // All these requests will be part of the same trace
    await rana.chat('What is a microservice?');
    await rana.chat('What is a monolith?');
    await rana.chat('Compare them');
  } finally {
    // End the trace
    exporter.endTrace();
  }

  await exporter.shutdown();
}

// ============================================================================
// Conditional Export
// ============================================================================

/**
 * Example 6: Only enable in production
 */
async function conditionalExport() {
  const isProd = process.env.NODE_ENV === 'production';

  const rana = createRana({
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY,
    },
    plugins: isProd
      ? [
          createOTelPlugin({
            serviceName: 'prod-service',
            endpoint: process.env.OTEL_ENDPOINT!,
            headers: {
              'x-api-key': process.env.OTEL_API_KEY!,
            },
          }),
        ]
      : [],
  });

  await rana.chat('Is OpenTelemetry enabled?');
}

// ============================================================================
// Error Tracking
// ============================================================================

/**
 * Example 7: Track errors with OpenTelemetry
 */
async function errorTracking() {
  const exporter = createOTelExporter({
    serviceName: 'error-tracking',
    endpoint: 'http://localhost:4318/v1/traces',
    debug: true,
  });

  const rana = createRana({
    providers: {
      anthropic: process.env.ANTHROPIC_API_KEY,
    },
    plugins: [exporter.asPlugin()],
  });

  try {
    // This might fail (e.g., rate limit, network error)
    await rana.chat({
      messages: [{ role: 'user', content: 'Test' }],
      provider: 'anthropic',
      // Invalid model to trigger error
      model: 'invalid-model' as any,
    });
  } catch (error) {
    console.error('Error caught:', error);
    // Error will be recorded in the trace
  }

  await exporter.shutdown();
}

// ============================================================================
// Run Examples
// ============================================================================

async function main() {
  console.log('OpenTelemetry Export Examples\n');

  try {
    console.log('1. Basic export...');
    await basicOTelExport();

    console.log('\n2. Authenticated export...');
    // Uncomment to run:
    // await authenticatedOTelExport();

    console.log('\n3. Plugin pattern...');
    // await pluginPattern();

    console.log('\n4. Multiple exporters...');
    // await multipleExporters();

    console.log('\n5. Trace grouping...');
    // await traceGrouping();

    console.log('\n6. Conditional export...');
    // await conditionalExport();

    console.log('\n7. Error tracking...');
    // await errorTracking();
  } catch (error) {
    console.error('Example failed:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}
