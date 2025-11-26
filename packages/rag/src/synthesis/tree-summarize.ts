/**
 * Tree Summarize Synthesizer
 * Hierarchically summarize chunks in a tree structure
 */

import type { Chunk, Synthesizer, SynthesisResult, Citation, SynthesizerOptions } from '../types';

interface LLMClient {
  complete(prompt: string, options?: { temperature?: number; maxTokens?: number }): Promise<string>;
}

export class TreeSummarizeSynthesizer implements Synthesizer {
  private llm: LLMClient;
  private batchSize: number;

  constructor(llm?: LLMClient, batchSize: number = 4) {
    this.llm = llm || this.mockLLM();
    this.batchSize = batchSize;
  }

  /**
   * Synthesize using tree summarization
   */
  async synthesize(
    query: string,
    chunks: Chunk[],
    options: SynthesizerOptions = {}
  ): Promise<SynthesisResult> {
    const {
      temperature = 0.3,
      maxTokens = 1000,
      systemPrompt,
    } = options;

    if (chunks.length === 0) {
      return {
        answer: 'I could not find relevant information to answer this question.',
        citations: [],
      };
    }

    // Track which original chunks contribute to final answer
    const usedChunks = new Set<string>();

    // Level 0: Original chunks
    let currentLevel = chunks.map(c => c.content);
    let chunkIds = chunks.map(c => c.id);

    // Build tree from bottom up
    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      const nextChunkIds: string[] = [];

      // Process in batches
      for (let i = 0; i < currentLevel.length; i += this.batchSize) {
        const batch = currentLevel.slice(i, i + this.batchSize);
        const batchIds = chunkIds.slice(i, i + this.batchSize);

        // Summarize batch
        const summary = await this.summarizeBatch(query, batch, {
          temperature,
          maxTokens,
          systemPrompt,
        });

        nextLevel.push(summary);

        // Track which chunks contributed
        for (const id of batchIds) {
          usedChunks.add(id);
        }
        nextChunkIds.push(batchIds.join(','));
      }

      currentLevel = nextLevel;
      chunkIds = nextChunkIds;
    }

    // Final answer is the root of the tree
    const answer = currentLevel[0];

    // Build citations from used chunks
    const citations: Citation[] = chunks
      .filter(c => usedChunks.has(c.id))
      .map((chunk, i) => ({
        text: chunk.content.slice(0, 200),
        source: chunk.metadata.source || `Chunk ${i + 1}`,
        score: chunk.metadata.score as number || 0,
        chunkId: chunk.id,
        metadata: chunk.metadata,
      }));

    return {
      answer,
      citations,
    };
  }

  /**
   * Summarize a batch of chunks
   */
  private async summarizeBatch(
    query: string,
    chunks: string[],
    options: { temperature: number; maxTokens: number; systemPrompt?: string }
  ): Promise<string> {
    const combinedContext = chunks.join('\n\n---\n\n');

    const prompt = this.buildBatchPrompt(query, combinedContext, options.systemPrompt);

    return await this.llm.complete(prompt, {
      temperature: options.temperature,
      maxTokens: options.maxTokens,
    });
  }

  /**
   * Build prompt for batch summarization
   */
  private buildBatchPrompt(query: string, context: string, systemPrompt?: string): string {
    const system = systemPrompt || 'You are a helpful assistant that synthesizes information to answer questions.';

    return `${system}

Answer this question by synthesizing information from multiple context chunks.
Combine relevant information into a comprehensive, coherent answer.

Question: ${query}

Context Chunks:
${context}

Synthesized Answer:`;
  }

  /**
   * Mock LLM for testing
   */
  private mockLLM(): LLMClient {
    return {
      complete: async (prompt: string): Promise<string> => {
        const questionMatch = prompt.match(/Question:\s*(.+?)(?:\n|Context)/s);
        const contextMatch = prompt.match(/Context Chunks:\s*(.+?)(?:\n\nSynthesized)/s);

        const question = questionMatch ? questionMatch[1].trim() : '';
        const context = contextMatch ? contextMatch[1].trim() : '';

        // Simulate summarization
        const contextChunks = context.split('---').filter(c => c.trim());
        const summaryParts = contextChunks.map(c => c.trim().slice(0, 100));

        return `To answer "${question.slice(0, 50)}": ${summaryParts.join(' Additionally, ')}...`;
      },
    };
  }
}

/**
 * Factory function
 */
export function treeSummarizeSynthesizer(llm?: LLMClient, batchSize?: number): TreeSummarizeSynthesizer {
  return new TreeSummarizeSynthesizer(llm, batchSize);
}
