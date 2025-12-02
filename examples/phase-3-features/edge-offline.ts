/**
 * Edge/Offline Example
 * Demonstrates local model execution with llama.cpp and ONNX
 */

import { EdgeRuntime, HybridClient, ModelManager } from '@rana/core';

async function main() {
  // Example 1: Basic edge inference with llama.cpp
  console.log('=== Basic Edge Inference ===');

  const edge = new EdgeRuntime({
    backend: 'llama.cpp',
    modelPath: './models/phi-2-q4.gguf',
    options: {
      contextSize: 2048,
      gpuLayers: -1, // Use all available GPU layers
      threads: 4,
    },
  });

  await edge.load();
  console.log('Model loaded:', edge.modelInfo.name);
  console.log('Parameters:', edge.modelInfo.parameters);
  console.log('Quantization:', edge.modelInfo.quantization);

  // Generate text
  const response = await edge.generate({
    prompt: 'Explain quantum computing in simple terms:',
    maxTokens: 200,
    temperature: 0.7,
    topP: 0.9,
  });

  console.log('\nResponse:', response.text);
  console.log('Tokens generated:', response.tokensGenerated);
  console.log('Time:', response.generationTime, 'ms');
  console.log('Speed:', response.tokensPerSecond.toFixed(1), 'tokens/sec');

  // Example 2: Streaming generation
  console.log('\n=== Streaming Generation ===');

  process.stdout.write('Streaming: ');
  const stream = await edge.generateStream({
    prompt: 'Write a haiku about coding:',
    maxTokens: 50,
  });

  for await (const token of stream) {
    process.stdout.write(token);
  }
  console.log('\n');

  // Example 3: Chat completion
  console.log('\n=== Chat Completion ===');

  const chatEdge = new EdgeRuntime({
    backend: 'llama.cpp',
    modelPath: './models/llama-2-7b-chat-q4.gguf',
    chatTemplate: 'llama2', // or 'chatml', 'vicuna', 'alpaca'
  });

  await chatEdge.load();

  const chatResponse = await chatEdge.chat({
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'What is TypeScript?' },
    ],
    maxTokens: 150,
  });

  console.log('Assistant:', chatResponse.message.content);

  // Example 4: Model management
  console.log('\n=== Model Management ===');

  const manager = new ModelManager({
    modelsDir: './models',
    registry: 'huggingface', // or 'ollama', 'custom'
  });

  // List available models
  const available = await manager.listAvailable({
    filter: {
      parameters: { $lte: 7_000_000_000 }, // Max 7B parameters
      quantization: 'q4',
    },
  });

  console.log('Available models:');
  for (const model of available.slice(0, 5)) {
    console.log(`  - ${model.name} (${model.size}, ${model.quantization})`);
  }

  // Download a model
  console.log('\nDownloading model...');
  await manager.download('phi-2-q4', {
    onProgress: (progress) => {
      process.stdout.write(`\r  Progress: ${progress.percentage}% (${progress.speed} MB/s)`);
    },
  });
  console.log('\n  Download complete!');

  // List installed models
  const installed = await manager.listInstalled();
  console.log('\nInstalled models:');
  for (const model of installed) {
    console.log(`  - ${model.name} (${model.size}, last used: ${model.lastUsed})`);
  }

  // Example 5: ONNX Runtime
  console.log('\n=== ONNX Runtime ===');

  const onnxRuntime = new EdgeRuntime({
    backend: 'onnx',
    modelPath: './models/phi-2.onnx',
    options: {
      executionProviders: ['CUDAExecutionProvider', 'CPUExecutionProvider'],
      graphOptimization: 'all',
    },
  });

  await onnxRuntime.load();

  const onnxResponse = await onnxRuntime.generate({
    prompt: 'The quick brown fox',
    maxTokens: 20,
  });

  console.log('ONNX output:', onnxResponse.text);

  // Example 6: Hybrid cloud + edge
  console.log('\n=== Hybrid Mode ===');

  const hybrid = new HybridClient({
    edge: {
      runtime: edge,
      preferFor: ['simple-tasks', 'offline', 'privacy-sensitive'],
    },
    cloud: {
      provider: 'openai',
      model: 'gpt-4o',
      preferFor: ['complex-tasks', 'long-context'],
    },
    routing: {
      strategy: 'smart', // or 'edge-first', 'cloud-first', 'cost-optimized'
      offlineMode: 'edge-only',
      latencyThreshold: 500, // Use edge if cloud latency > 500ms
    },
  });

  // Automatic routing
  const simpleTask = await hybrid.generate({
    prompt: 'Hello, how are you?',
    task: 'simple-chat',
  });
  console.log(`Simple task routed to: ${simpleTask.source}`);

  const complexTask = await hybrid.generate({
    prompt: 'Analyze this complex codebase and suggest architectural improvements...',
    task: 'complex-analysis',
  });
  console.log(`Complex task routed to: ${complexTask.source}`);

  // Force edge (offline mode)
  const offlineResponse = await hybrid.generate({
    prompt: 'What is 2 + 2?',
    forceEdge: true,
  });
  console.log(`Offline response: ${offlineResponse.text}`);

  // Example 7: Embeddings on edge
  console.log('\n=== Edge Embeddings ===');

  const embeddingsRuntime = new EdgeRuntime({
    backend: 'onnx',
    modelPath: './models/all-MiniLM-L6-v2.onnx',
    type: 'embeddings',
  });

  await embeddingsRuntime.load();

  const embeddings = await embeddingsRuntime.embed([
    'Hello world',
    'How are you?',
    'Machine learning is fascinating',
  ]);

  console.log('Generated embeddings:');
  console.log(`  - Batch size: ${embeddings.length}`);
  console.log(`  - Dimensions: ${embeddings[0].length}`);
  console.log(`  - First 5 values: ${embeddings[0].slice(0, 5).map(v => v.toFixed(4)).join(', ')}`);

  // Example 8: Benchmarking
  console.log('\n=== Benchmarking ===');

  const benchmark = await edge.benchmark({
    prompts: [
      'Short prompt',
      'A medium length prompt that requires more processing',
      'A longer prompt that tests the model capacity with multiple sentences and ideas',
    ],
    iterations: 5,
    metrics: ['latency', 'throughput', 'memory'],
  });

  console.log('Benchmark results:');
  console.log('─'.repeat(50));
  console.log(`  Time to first token: ${benchmark.timeToFirstToken.avg.toFixed(0)}ms (avg)`);
  console.log(`  Tokens per second: ${benchmark.tokensPerSecond.avg.toFixed(1)} (avg)`);
  console.log(`  Memory usage: ${benchmark.memoryUsage.peak.toFixed(0)} MB (peak)`);
  console.log(`  Total latency: ${benchmark.totalLatency.avg.toFixed(0)}ms (avg)`);

  // Example 9: Model optimization
  console.log('\n=== Model Optimization ===');

  // Convert to different quantization
  await manager.convert({
    source: './models/phi-2.gguf',
    output: './models/phi-2-q8.gguf',
    quantization: 'q8_0',
  });
  console.log('Converted model to Q8');

  // Optimize for specific hardware
  await manager.optimize({
    model: './models/phi-2-q4.gguf',
    target: 'apple-silicon', // or 'cuda', 'cpu', 'metal'
    options: {
      flashAttention: true,
      kvCacheQuantization: true,
    },
  });
  console.log('Optimized for Apple Silicon');

  // Example 10: Graceful degradation
  console.log('\n=== Graceful Degradation ===');

  const resilientHybrid = new HybridClient({
    edge: { runtime: edge },
    cloud: { provider: 'openai', model: 'gpt-4o' },
    fallback: {
      onCloudError: 'use-edge',
      onEdgeError: 'use-cloud',
      onBothFail: 'return-cached',
      cache: {
        enabled: true,
        maxAge: 3600, // 1 hour
      },
    },
  });

  try {
    const resilientResponse = await resilientHybrid.generate({
      prompt: 'What is the weather like?',
    });
    console.log(`Response from: ${resilientResponse.source}`);
  } catch (error) {
    console.log('All sources failed, returning cached response');
  }

  // Cleanup
  await edge.unload();
  await chatEdge.unload();
  console.log('\nModels unloaded');
}

main().catch(console.error);
