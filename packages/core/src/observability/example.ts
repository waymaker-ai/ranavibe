/**
 * Example usage of the RANA Tracer
 * This file demonstrates how to use the tracing system for observability
 */

import {
  createTracer,
  getGlobalTracer,
  setGlobalTracer,
  traced,
  type Tracer,
  type Span,
} from './tracer.js';

// ============================================================================
// Example 1: Basic Tracing
// ============================================================================

function basicExample() {
  console.log('\n=== Example 1: Basic Tracing ===\n');

  const tracer = createTracer({ debug: true });

  // Start a trace
  const span = tracer.startTrace('chat_request', {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
  });

  // Simulate some work
  setTimeout(() => {
    // Add attributes during execution
    tracer.setAttributes(span, {
      input_tokens: 150,
      output_tokens: 300,
      total_tokens: 450,
      cost: 0.0045,
    });

    // End the span
    tracer.endSpan(span, 'success');

    // Get statistics
    const stats = tracer.getStats();
    console.log('\nTracer Stats:', stats);

    // Export the trace
    const exported = tracer.exportTrace(span.context.traceId);
    console.log('\nExported Trace:', JSON.stringify(exported, null, 2));
  }, 100);
}

// ============================================================================
// Example 2: Parent-Child Spans (Nested Operations)
// ============================================================================

function nestedExample() {
  console.log('\n=== Example 2: Nested Spans ===\n');

  const tracer = createTracer({ debug: true });

  // Start parent trace
  const parentSpan = tracer.startTrace('chat_with_tools', {
    provider: 'openai',
    model: 'gpt-4o',
  });

  // Child span 1: Process user input
  const inputSpan = tracer.startSpan('process_input', parentSpan);
  tracer.setAttributes(inputSpan, { input_length: 250 });
  setTimeout(() => {
    tracer.endSpan(inputSpan, 'success');
  }, 50);

  // Child span 2: Make LLM request
  const llmSpan = tracer.startSpan('llm_request', parentSpan, {
    model: 'gpt-4o',
  });
  setTimeout(() => {
    tracer.setAttributes(llmSpan, {
      input_tokens: 200,
      output_tokens: 100,
      cost: 0.005,
    });
    tracer.endSpan(llmSpan, 'success');
  }, 150);

  // Child span 3: Process tool calls (nested under llmSpan)
  setTimeout(() => {
    const toolSpan = tracer.startSpan('tool_execution', llmSpan, {
      tool_name: 'search',
    });
    setTimeout(() => {
      tracer.setAttributes(toolSpan, {
        tool_result: 'success',
      });
      tracer.endSpan(toolSpan, 'success');
    }, 100);
  }, 160);

  // End parent after all children complete
  setTimeout(() => {
    tracer.setAttributes(parentSpan, {
      total_tokens: 300,
      cost: 0.005,
    });
    tracer.endSpan(parentSpan, 'success');

    // Export the complete trace
    const exported = tracer.exportTrace(parentSpan.context.traceId);
    console.log('\nNested Trace:', JSON.stringify(exported, null, 2));
  }, 300);
}

// ============================================================================
// Example 3: Error Handling
// ============================================================================

function errorExample() {
  console.log('\n=== Example 3: Error Handling ===\n');

  const tracer = createTracer({ debug: true });

  const span = tracer.startTrace('failed_request', {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
  });

  try {
    // Simulate an error
    throw new Error('Rate limit exceeded');
  } catch (error) {
    tracer.endSpan(span, 'error', error as Error);
  }

  // Export the failed trace
  const exported = tracer.exportTrace(span.context.traceId);
  console.log('\nFailed Trace:', JSON.stringify(exported, null, 2));
}

// ============================================================================
// Example 4: Global Tracer
// ============================================================================

function globalTracerExample() {
  console.log('\n=== Example 4: Global Tracer ===\n');

  // Set up a global tracer with auto-export
  const tracer = createTracer({
    maxTraces: 100,
    autoExport: true,
    onExport: (trace) => {
      console.log(`\n[Auto-Exported] Trace ${trace.traceId}:`);
      console.log(`  Duration: ${trace.duration}ms`);
      console.log(`  Status: ${trace.status}`);
      console.log(`  Spans: ${trace.spans.length}`);
    },
  });

  setGlobalTracer(tracer);

  // Use the global tracer
  const globalTracer = getGlobalTracer();
  const span = globalTracer.startTrace('global_request', {
    provider: 'openai',
    model: 'gpt-4o-mini',
  });

  setTimeout(() => {
    globalTracer.setAttributes(span, {
      input_tokens: 50,
      output_tokens: 75,
      cost: 0.0001,
    });
    globalTracer.endSpan(span, 'success');
  }, 50);
}

// ============================================================================
// Example 5: Function Wrapping
// ============================================================================

async function complexOperation(message: string): Promise<string> {
  // Simulate async work
  await new Promise((resolve) => setTimeout(resolve, 100));
  return `Processed: ${message}`;
}

function wrappedFunctionExample() {
  console.log('\n=== Example 5: Wrapped Functions ===\n');

  const tracer = createTracer({ debug: true });

  // Wrap the function with automatic tracing
  const tracedOperation = traced('complex_operation', complexOperation, tracer);

  // Call the wrapped function
  tracedOperation('Hello, RANA!').then((result) => {
    console.log('Result:', result);
    console.log('\nStats:', tracer.getStats());
  });
}

// ============================================================================
// Example 6: Real-World Chat Request Simulation
// ============================================================================

async function simulateChatRequest(tracer: Tracer): Promise<void> {
  console.log('\n=== Example 6: Real-World Chat Request ===\n');

  // Start main request trace
  const requestSpan = tracer.startTrace('rana.chat', {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    optimize: 'balanced',
  });

  try {
    // 1. Budget check
    const budgetSpan = tracer.startSpan('budget_check', requestSpan);
    await new Promise((resolve) => setTimeout(resolve, 10));
    tracer.setAttributes(budgetSpan, { budget_remaining: 5.0 });
    tracer.endSpan(budgetSpan, 'success');

    // 2. Cache lookup
    const cacheSpan = tracer.startSpan('cache_lookup', requestSpan);
    await new Promise((resolve) => setTimeout(resolve, 15));
    tracer.setAttributes(cacheSpan, { cache_hit: false });
    tracer.endSpan(cacheSpan, 'success');

    // 3. Provider request
    const providerSpan = tracer.startSpan('provider_request', requestSpan, {
      provider: 'anthropic',
    });

    // 3a. Rate limit check
    const rateLimitSpan = tracer.startSpan('rate_limit_check', providerSpan);
    await new Promise((resolve) => setTimeout(resolve, 5));
    tracer.endSpan(rateLimitSpan, 'success');

    // 3b. API call
    const apiSpan = tracer.startSpan('api_call', providerSpan);
    await new Promise((resolve) => setTimeout(resolve, 250));
    tracer.setAttributes(apiSpan, {
      input_tokens: 1500,
      output_tokens: 800,
      latency_ms: 245,
    });
    tracer.endSpan(apiSpan, 'success');

    tracer.setAttributes(providerSpan, {
      total_tokens: 2300,
      cost: 0.0115,
    });
    tracer.endSpan(providerSpan, 'success');

    // 4. Cache write
    const cacheWriteSpan = tracer.startSpan('cache_write', requestSpan);
    await new Promise((resolve) => setTimeout(resolve, 8));
    tracer.endSpan(cacheWriteSpan, 'success');

    // 5. Cost tracking
    const costSpan = tracer.startSpan('cost_tracking', requestSpan);
    await new Promise((resolve) => setTimeout(resolve, 5));
    tracer.setAttributes(costSpan, {
      total_cost: 0.0115,
      budget_used_percent: 23,
    });
    tracer.endSpan(costSpan, 'success');

    // End main request
    tracer.setAttributes(requestSpan, {
      input_tokens: 1500,
      output_tokens: 800,
      total_tokens: 2300,
      cost: 0.0115,
      cached: false,
      latency_ms: 293,
    });
    tracer.endSpan(requestSpan, 'success');

    // Export and display
    const exported = tracer.exportTrace(requestSpan.context.traceId);
    console.log('\nComplete Request Trace:');
    console.log(JSON.stringify(exported, null, 2));

    console.log('\n\nTrace Summary:');
    console.log(`  Total Duration: ${exported.duration}ms`);
    console.log(`  Status: ${exported.status}`);
    console.log(`  Total Cost: $${requestSpan.attributes.cost}`);
    console.log(`  Tokens: ${requestSpan.attributes.total_tokens}`);
  } catch (error) {
    tracer.endSpan(requestSpan, 'error', error as Error);
  }
}

// ============================================================================
// Run Examples
// ============================================================================

export function runExamples() {
  // Uncomment to run individual examples:

  // basicExample();

  // setTimeout(() => nestedExample(), 500);

  // setTimeout(() => errorExample(), 1500);

  // setTimeout(() => globalTracerExample(), 2000);

  // setTimeout(() => wrappedFunctionExample(), 2500);

  // Run the comprehensive example
  const tracer = createTracer({
    debug: true,
    maxTraces: 1000,
  });

  setTimeout(() => {
    simulateChatRequest(tracer);
  }, 100);
}

// Only run if executed directly
if (require.main === module) {
  runExamples();
}
