/**
 * Phase 3.1 Feature Examples Index
 *
 * This file provides a quick demo of all Phase 3.1 features.
 * Run individual example files for more comprehensive demonstrations.
 */

export * from './model-router';
export * from './agent-debugger';
export * from './structured-output';
export * from './fine-tuning';
export * from './prompt-collaboration';
export * from './edge-offline';
export * from './voice-realtime';
export * from './advanced-rag';

// Quick demo
async function quickDemo() {
  console.log('='.repeat(60));
  console.log('RANA Phase 3.1 Features Quick Demo');
  console.log('='.repeat(60));

  console.log(`
Phase 3.1 introduces eight major features:

1. MODEL ROUTER
   Intelligent routing across LLM providers
   - Cost, quality, and latency optimization
   - Automatic fallback and circuit breaker
   - Adaptive learning from usage patterns

2. AGENT DEBUGGER
   Step-through debugging for AI agents
   - Breakpoints on LLM calls, tools, state changes
   - Time-travel and replay capabilities
   - Decision tree visualization

3. STRUCTURED OUTPUT
   Schema-based LLM response generation
   - JSON Schema and Zod support
   - Automatic retry on validation failure
   - Schema inference from samples

4. FINE-TUNING PIPELINE
   Dataset preparation and model training
   - Multi-provider support (OpenAI, Together)
   - Dataset validation and augmentation
   - Model comparison and evaluation

5. PROMPT COLLABORATION
   Git-like version control for prompts
   - Version history with diffs
   - Review workflow with approvals
   - A/B testing and analytics

6. EDGE/OFFLINE SUPPORT
   Local model execution
   - llama.cpp and ONNX backends
   - Hybrid cloud + edge mode
   - Model optimization and benchmarking

7. REAL-TIME VOICE
   Voice conversations with AI
   - WebRTC-based real-time interaction
   - Speech-to-text (Whisper)
   - Text-to-speech with multiple voices

8. ADVANCED RAG
   Multi-modal retrieval-augmented generation
   - Text, image, and table indexing
   - Self-correcting answers
   - Query optimization and reranking

Run individual examples for detailed demonstrations:

  npx ts-node model-router.ts
  npx ts-node agent-debugger.ts
  npx ts-node structured-output.ts
  npx ts-node fine-tuning.ts
  npx ts-node prompt-collaboration.ts
  npx ts-node edge-offline.ts
  npx ts-node voice-realtime.ts
  npx ts-node advanced-rag.ts
`);

  console.log('='.repeat(60));
  console.log('For full documentation: https://rana.dev/docs/phase-3');
  console.log('='.repeat(60));
}

// Run if executed directly
if (require.main === module) {
  quickDemo();
}
