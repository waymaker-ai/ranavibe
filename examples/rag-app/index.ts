/**
 * RANA RAG (Retrieval-Augmented Generation) Example
 * A complete RAG implementation for question answering
 *
 * Features:
 * - Document ingestion and chunking
 * - Simple vector similarity search
 * - Context-aware response generation
 * - Source citations
 *
 * Run with: npx ts-node index.ts
 */

import readline from 'readline';

// ============================================================================
// Types
// ============================================================================

interface Document {
  id: string;
  title: string;
  content: string;
  source: string;
  metadata?: Record<string, unknown>;
}

interface Chunk {
  id: string;
  documentId: string;
  content: string;
  embedding?: number[];
  metadata?: Record<string, unknown>;
}

interface SearchResult {
  chunk: Chunk;
  score: number;
  document: Document;
}

interface RAGResponse {
  answer: string;
  sources: { title: string; excerpt: string }[];
  confidence: number;
  tokensUsed: number;
}

// ============================================================================
// Simple Vector Store (In-Memory)
// ============================================================================

class SimpleVectorStore {
  private chunks: Chunk[] = [];
  private documents: Map<string, Document> = new Map();

  /**
   * Add a document to the store
   */
  async addDocument(doc: Document): Promise<void> {
    this.documents.set(doc.id, doc);

    // Chunk the document
    const chunks = this.chunkDocument(doc);

    // Generate embeddings for each chunk
    for (const chunk of chunks) {
      chunk.embedding = this.generateEmbedding(chunk.content);
      this.chunks.push(chunk);
    }

    console.log(`\x1b[32m✓ Added "${doc.title}" (${chunks.length} chunks)\x1b[0m`);
  }

  /**
   * Search for relevant chunks
   */
  async search(query: string, topK: number = 3): Promise<SearchResult[]> {
    const queryEmbedding = this.generateEmbedding(query);

    // Calculate similarity scores
    const scored = this.chunks.map(chunk => ({
      chunk,
      score: this.cosineSimilarity(queryEmbedding, chunk.embedding || []),
      document: this.documents.get(chunk.documentId)!,
    }));

    // Sort by score and return top K
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /**
   * Chunk a document into smaller pieces
   */
  private chunkDocument(doc: Document, chunkSize: number = 500, overlap: number = 50): Chunk[] {
    const words = doc.content.split(/\s+/);
    const chunks: Chunk[] = [];
    let chunkIndex = 0;

    for (let i = 0; i < words.length; i += chunkSize - overlap) {
      const chunkWords = words.slice(i, i + chunkSize);
      if (chunkWords.length < 50) continue; // Skip tiny chunks

      chunks.push({
        id: `${doc.id}-chunk-${chunkIndex++}`,
        documentId: doc.id,
        content: chunkWords.join(' '),
      });
    }

    return chunks;
  }

  /**
   * Generate a simple embedding (TF-IDF inspired)
   * In production, use OpenAI embeddings or similar
   */
  private generateEmbedding(text: string): number[] {
    const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    const wordFreq: Map<string, number> = new Map();

    // Count word frequencies
    for (const word of words) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    }

    // Create a fixed-size embedding based on character n-grams
    const embedding = new Array(128).fill(0);
    for (const [word, freq] of wordFreq) {
      // Hash the word to get an index
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        hash = ((hash << 5) - hash + word.charCodeAt(i)) | 0;
      }
      const index = Math.abs(hash) % embedding.length;
      embedding[index] += freq;
    }

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? embedding.map(v => v / magnitude) : embedding;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
    }
    return dotProduct;
  }
}

// ============================================================================
// RAG Pipeline
// ============================================================================

class RAGPipeline {
  private vectorStore: SimpleVectorStore;
  private provider: string;
  private model: string;

  constructor() {
    this.vectorStore = new SimpleVectorStore();

    // Auto-detect provider
    if (process.env.ANTHROPIC_API_KEY) {
      this.provider = 'anthropic';
      this.model = 'claude-3-5-sonnet-20241022';
    } else if (process.env.OPENAI_API_KEY) {
      this.provider = 'openai';
      this.model = 'gpt-4o';
    } else {
      this.provider = 'demo';
      this.model = 'demo';
    }
  }

  /**
   * Index documents
   */
  async indexDocuments(docs: Document[]): Promise<void> {
    console.log('\n\x1b[36m📚 Indexing Documents\x1b[0m\n');
    for (const doc of docs) {
      await this.vectorStore.addDocument(doc);
    }
    console.log();
  }

  /**
   * Answer a question using RAG
   */
  async query(question: string): Promise<RAGResponse> {
    console.log('\x1b[36m🔍 RAG Pipeline\x1b[0m\n');

    // Step 1: Retrieve relevant chunks
    console.log('\x1b[90m1. Retrieving relevant chunks...\x1b[0m');
    const results = await this.vectorStore.search(question, 3);

    if (results.length === 0) {
      return {
        answer: "I couldn't find relevant information to answer this question.",
        sources: [],
        confidence: 0,
        tokensUsed: 0,
      };
    }

    console.log(`   Found ${results.length} relevant chunks`);
    results.forEach((r, i) => {
      console.log(`   ${i + 1}. "${r.document.title}" (score: ${(r.score * 100).toFixed(1)}%)`);
    });

    // Step 2: Build context
    console.log('\n\x1b[90m2. Building context...\x1b[0m');
    const context = results
      .map((r) => `[Source: ${r.document.title}]\n${r.chunk.content}`)
      .join('\n\n---\n\n');

    const contextTokens = context.split(/\s+/).length;
    console.log(`   Context: ${contextTokens} tokens`);

    // Step 3: Generate answer
    console.log('\n\x1b[90m3. Generating answer...\x1b[0m');

    let answer: string;
    let tokensUsed: number;

    if (this.provider === 'demo') {
      // Demo mode - generate a simulated answer
      answer = this.generateDemoAnswer(question, results);
      tokensUsed = answer.split(/\s+/).length + contextTokens;
    } else {
      // Real API call
      const response = await this.callLLM(question, context);
      answer = response.answer;
      tokensUsed = response.tokens;
    }

    // Calculate confidence based on relevance scores
    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    const confidence = Math.min(avgScore * 1.5, 0.99);

    return {
      answer,
      sources: results.map(r => ({
        title: r.document.title,
        excerpt: r.chunk.content.substring(0, 100) + '...',
      })),
      confidence,
      tokensUsed,
    };
  }

  /**
   * Generate a demo answer without API
   */
  private generateDemoAnswer(question: string, results: SearchResult[]): string {
    const topResult = results[0];
    const questionLower = question.toLowerCase();

    // Extract key information from context
    const content = topResult.chunk.content;

    // Simple answer generation based on question type
    if (questionLower.startsWith('what is') || questionLower.startsWith('what are')) {
      return `Based on the documentation, ${content.substring(0, 300)}...

This information comes from "${topResult.document.title}".`;
    }

    if (questionLower.startsWith('how')) {
      return `Here's how to approach this:

${content.substring(0, 400)}

For more details, see "${topResult.document.title}".`;
    }

    return `According to the available documentation:

${content.substring(0, 350)}

Source: ${topResult.document.title}`;
  }

  /**
   * Call LLM API
   */
  private async callLLM(question: string, context: string): Promise<{ answer: string; tokens: number }> {
    const systemPrompt = `You are a helpful assistant that answers questions based on the provided context.
Always cite your sources when answering.
If the context doesn't contain relevant information, say so.
Be concise but thorough.`;

    const userPrompt = `Context:
${context}

Question: ${question}

Answer the question based on the context above. Cite sources when relevant.`;

    if (this.provider === 'anthropic') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      });

      const data = await response.json();
      return {
        answer: data.content[0]?.text || 'Unable to generate answer',
        tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      };
    }

    if (this.provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      });

      const data = await response.json();
      return {
        answer: data.choices[0]?.message?.content || 'Unable to generate answer',
        tokens: data.usage?.total_tokens || 0,
      };
    }

    return { answer: 'Provider not supported', tokens: 0 };
  }
}

// ============================================================================
// Sample Knowledge Base
// ============================================================================

const SAMPLE_DOCUMENTS: Document[] = [
  {
    id: 'rana-overview',
    title: 'RANA Framework Overview',
    source: 'docs/overview.md',
    content: `RANA (Rapid AI Native Architecture) is a production-quality AI development framework designed for modern applications. It provides a unified interface to work with 9 different LLM providers including OpenAI, Anthropic, Google, Groq, Mistral, Cohere, Together AI, xAI, and Ollama.

Key features of RANA include:
- Multi-provider support with automatic fallback
- Cost optimization through intelligent model routing
- Semantic caching to reduce redundant API calls
- Prompt management and protection
- Real-time cost tracking and analytics
- Agent orchestration framework
- RAG (Retrieval-Augmented Generation) pipeline

RANA can achieve up to 70% cost reduction compared to using a single premium model for all tasks. It automatically selects the most appropriate model based on task complexity, using cheaper models for simple tasks and premium models for complex ones.

The framework is designed to be developer-friendly with TypeScript support, comprehensive documentation, and a CLI tool for project management.`,
  },
  {
    id: 'cost-optimization',
    title: 'RANA Cost Optimization Guide',
    source: 'docs/cost-optimization.md',
    content: `RANA provides multiple strategies for reducing LLM API costs:

1. **Intelligent Model Routing**: RANA analyzes each request and routes it to the most cost-effective model that can handle the task. Simple queries go to cheaper models like GPT-4o Mini or Claude Haiku, while complex reasoning tasks use premium models.

2. **Semantic Caching**: RANA caches responses for similar queries. When a new query is semantically similar to a cached one, it returns the cached response instead of making a new API call. This can reduce costs by 30-50% for applications with repetitive queries.

3. **Prompt Optimization**: RANA automatically compresses prompts while preserving meaning. This reduces token usage without sacrificing quality. Techniques include removing redundant whitespace, simplifying instructions, and using efficient formatting.

4. **Batch Processing**: For non-time-sensitive tasks, RANA can batch multiple requests together to take advantage of bulk pricing.

5. **Provider Arbitrage**: Different providers have different pricing. RANA can automatically switch between providers based on current pricing and availability.

Cost tracking is built-in, providing real-time visibility into spending across all providers and models.`,
  },
  {
    id: 'agent-framework',
    title: 'RANA Agent Framework',
    source: 'docs/agents.md',
    content: `The RANA Agent Framework enables building sophisticated AI agents that can use tools and collaborate with other agents.

**Agent Types**:
- BaseAgent: The foundation class for all agents
- LLMAgent: An agent powered by an LLM that can use tools
- WorkflowAgent: For sequential task execution

**Orchestration Patterns**:
- Sequential: Agents run one after another, passing output forward
- Parallel: Multiple agents run simultaneously on the same input
- Hierarchical: A master agent delegates to specialized sub-agents
- Router: Intelligent routing to the most appropriate agent

**Built-in Tools**:
- Calculator: Mathematical operations
- DateTime: Time and date operations
- Memory: Persistent storage during conversations
- JSON: Parse and manipulate JSON data
- WebSearch: Search the web for information (requires API key)

**Creating Custom Tools**:
Tools are defined with a name, description, parameters schema, and an execute function. The LLM uses the description to decide when to call the tool.

Example usage:
\`\`\`typescript
const agent = createAgent({
  name: 'Research Assistant',
  model: 'claude-3-5-sonnet',
  tools: [webSearchTool, calculatorTool],
});

const result = await agent.run('Find the GDP of Japan and calculate per capita');
\`\`\``,
  },
  {
    id: 'getting-started',
    title: 'Getting Started with RANA',
    source: 'docs/getting-started.md',
    content: `Getting started with RANA is straightforward:

**Installation**:
\`\`\`bash
npm install @rana/core @rana/helpers @rana/react
\`\`\`

**Quick Setup**:
\`\`\`bash
npx rana init
npx rana wizard
\`\`\`

**Configuration**:
Add your API keys to .env:
\`\`\`
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
\`\`\`

Or use the CLI:
\`\`\`bash
rana config:set --provider anthropic
rana config:set --provider openai
\`\`\`

**Basic Usage**:
\`\`\`typescript
import { rana } from '@rana/core';

// Simple chat
const response = await rana.chat('Hello!');

// With options
const response = await rana
  .provider('anthropic')
  .model('claude-3-5-sonnet')
  .chat('Explain quantum computing');
\`\`\`

The RANA CLI provides commands for:
- Project initialization (rana init)
- Interactive setup wizard (rana wizard)
- Cost dashboard (rana dashboard)
- Security audits (rana audit)
- Deployment (rana deploy)`,
  },
];

// ============================================================================
// Main Application
// ============================================================================

async function main() {
  console.log('\x1b[36m');
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║   📚 RANA RAG (Question Answering) Demo   ║');
  console.log('╚═══════════════════════════════════════════╝');
  console.log('\x1b[0m');

  // Initialize pipeline
  const pipeline = new RAGPipeline();

  // Index sample documents
  await pipeline.indexDocuments(SAMPLE_DOCUMENTS);

  // Check for API keys
  if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
    console.log('\x1b[33m⚠ No API key found. Running in demo mode.\x1b[0m');
    console.log('\x1b[90mSet ANTHROPIC_API_KEY or OPENAI_API_KEY for full functionality.\x1b[0m\n');
  }

  console.log('\x1b[90mType your question and press Enter. Type "exit" to quit.\x1b[0m\n');

  // Setup readline
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = () => {
    rl.question('\x1b[33mQuestion:\x1b[0m ', async (input) => {
      const trimmed = input.trim();

      if (trimmed.toLowerCase() === 'exit') {
        console.log('\n\x1b[36mGoodbye! 👋\x1b[0m\n');
        rl.close();
        return;
      }

      if (!trimmed) {
        prompt();
        return;
      }

      console.log();

      try {
        const response = await pipeline.query(trimmed);

        console.log('\n\x1b[32m📝 Answer:\x1b[0m\n');
        console.log(response.answer);

        console.log('\n\x1b[90m─────────────────────────────────────\x1b[0m');
        console.log('\x1b[36mSources:\x1b[0m');
        response.sources.forEach((s, i) => {
          console.log(`  ${i + 1}. ${s.title}`);
        });

        console.log(`\n\x1b[90mConfidence: ${(response.confidence * 100).toFixed(0)}% | Tokens: ${response.tokensUsed}\x1b[0m`);
      } catch (error: any) {
        console.log(`\x1b[31mError: ${error.message}\x1b[0m`);
      }

      console.log();
      prompt();
    });
  };

  // Example questions
  console.log('\x1b[90mTry asking:\x1b[0m');
  console.log('\x1b[90m  - What is RANA?\x1b[0m');
  console.log('\x1b[90m  - How does RANA reduce costs?\x1b[0m');
  console.log('\x1b[90m  - What is the agent framework?\x1b[0m');
  console.log('\x1b[90m  - How do I get started with RANA?\x1b[0m\n');

  prompt();
}

main().catch(console.error);
