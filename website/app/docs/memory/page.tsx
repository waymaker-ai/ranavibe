'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Brain, Database, MessageSquare, Clock, Search, Layers } from 'lucide-react';

const features = [
  {
    icon: Database,
    title: 'Conversation Memory',
    description: 'Persistent memory that tracks conversation history across sessions',
    code: `import { ConversationMemory } from '@rana/memory';

const memory = new ConversationMemory({
  maxMessages: 100,
  storage: 'redis',  // or 'postgresql', 'memory'
  ttl: '7d'
});

// Add messages
await memory.add({
  role: 'user',
  content: 'What is machine learning?'
});

await memory.add({
  role: 'assistant',
  content: 'Machine learning is a subset of AI...'
});

// Get conversation history
const history = await memory.getHistory(sessionId);

// Clear memory
await memory.clear(sessionId);`,
  },
  {
    icon: Brain,
    title: 'Semantic Memory',
    description: 'Long-term memory with semantic search and retrieval',
    code: `import { SemanticMemory } from '@rana/memory';

const memory = new SemanticMemory({
  vectorStore: 'pinecone',
  embeddingModel: 'text-embedding-3-small',
  namespace: 'user-memories'
});

// Store a memory
await memory.store({
  content: 'User prefers dark mode and concise responses',
  metadata: { userId: '123', type: 'preference' }
});

// Search memories by meaning
const relevant = await memory.search(
  'What display settings does the user prefer?',
  { limit: 5, threshold: 0.7 }
);

// Get memories by metadata
const preferences = await memory.findByMetadata({
  userId: '123',
  type: 'preference'
});`,
  },
  {
    icon: MessageSquare,
    title: 'Working Memory',
    description: 'Short-term context for the current conversation',
    code: `import { WorkingMemory } from '@rana/memory';

const working = new WorkingMemory({
  maxTokens: 4000,
  compressionStrategy: 'summarize'
});

// Add context
working.add({
  type: 'system',
  content: 'You are a helpful assistant'
});

working.add({
  type: 'context',
  content: 'User is asking about their recent order'
});

// Get optimized context for prompt
const context = await working.getContext();
// Automatically summarizes/compresses if too long

// Clear working memory
working.clear();`,
  },
  {
    icon: Clock,
    title: 'Temporal Memory',
    description: 'Time-aware memory with decay and importance scoring',
    code: `import { TemporalMemory } from '@rana/memory';

const temporal = new TemporalMemory({
  decayRate: 0.1,      // Memories fade over time
  boostOnAccess: true, // Accessing memory strengthens it
  importanceThreshold: 0.3
});

// Store with importance
await temporal.store({
  content: 'User birthday is March 15',
  importance: 1.0  // High importance, decays slower
});

await temporal.store({
  content: 'User mentioned they like coffee',
  importance: 0.5  // Medium importance
});

// Get current memories (filtered by decay)
const active = await temporal.getActive();

// Manually boost a memory
await temporal.boost(memoryId, 0.5);`,
  },
  {
    icon: Search,
    title: 'Memory Search',
    description: 'Unified search across all memory types',
    code: `import { MemoryManager } from '@rana/memory';

const manager = new MemoryManager({
  memories: {
    conversation: conversationMemory,
    semantic: semanticMemory,
    temporal: temporalMemory
  }
});

// Search across all memories
const results = await manager.search('user preferences', {
  types: ['semantic', 'temporal'],
  limit: 10,
  deduplicate: true
});

// Get unified context for a prompt
const context = await manager.getContext({
  query: 'What does the user prefer?',
  maxTokens: 2000,
  includeRecent: true
});`,
  },
  {
    icon: Layers,
    title: 'Memory Compression',
    description: 'Intelligent compression and summarization of memories',
    code: `import { MemoryCompressor } from '@rana/memory';

const compressor = new MemoryCompressor({
  model: 'gpt-4o-mini',
  targetTokens: 1000,
  preserveRecent: 5  // Keep last 5 messages intact
});

// Compress conversation history
const compressed = await compressor.compress(history);

// Summarize long conversations
const summary = await compressor.summarize(history, {
  style: 'bullet-points',
  maxLength: 500
});

// Extract key facts
const facts = await compressor.extractFacts(history);
// ['User is a software developer', 'Prefers Python', ...]`,
  },
];

export default function MemoryPage() {
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
              <Brain className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">Memory & Context</h1>
          </div>
          <p className="text-lg text-foreground-secondary">
            Intelligent memory management for AI applications. Conversation history,
            semantic search, temporal decay, and automatic compression.
          </p>
          <div className="mt-4 code-block font-mono text-sm">
            npm install @rana/memory
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

        {/* Storage Backends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 card"
        >
          <h2 className="text-2xl font-bold mb-6">Supported Storage Backends</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Redis', 'PostgreSQL', 'MongoDB', 'SQLite', 'Pinecone', 'Qdrant', 'Weaviate', 'In-Memory'].map((backend) => (
              <div
                key={backend}
                className="p-4 rounded-lg bg-background-secondary text-center font-medium"
              >
                {backend}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
