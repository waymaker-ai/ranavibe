/**
 * Compact Synthesizer
 * Combine all chunks into a single context and generate answer
 */

import type { Chunk, Synthesizer, SynthesisResult, Citation, SynthesizerOptions } from '../types';

interface LLMClient {
  complete(prompt: string, options?: { temperature?: number; maxTokens?: number }): Promise<string>;
}

export class CompactSynthesizer implements Synthesizer {
  private llm: LLMClient;
  private maxContextLength: number;

  constructor(llm?: LLMClient, maxContextLength: number = 8000) {
    this.llm = llm || this.mockLLM();
    this.maxContextLength = maxContextLength;
  }

  /**
   * Synthesize using compact approach (single LLM call)
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

    // Combine chunks up to max context length
    const { context, usedChunks } = this.combineChunks(chunks);

    // Generate answer
    const prompt = this.buildPrompt(query, context, systemPrompt);

    const answer = await this.llm.complete(prompt, {
      temperature,
      maxTokens,
    });

    // Build citations
    const citations: Citation[] = usedChunks.map((chunk, i) => ({
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
   * Combine chunks into context, respecting max length
   */
  private combineChunks(chunks: Chunk[]): { context: string; usedChunks: Chunk[] } {
    const usedChunks: Chunk[] = [];
    const parts: string[] = [];
    let currentLength = 0;

    for (const chunk of chunks) {
      const chunkWithHeader = `[Source: ${chunk.metadata.source || chunk.id}]\n${chunk.content}`;

      if (currentLength + chunkWithHeader.length > this.maxContextLength) {
        // Try to fit partial chunk
        const remainingSpace = this.maxContextLength - currentLength - 100;
        if (remainingSpace > 200) {
          parts.push(`[Source: ${chunk.metadata.source || chunk.id}]\n${chunk.content.slice(0, remainingSpace)}...`);
          usedChunks.push(chunk);
        }
        break;
      }

      parts.push(chunkWithHeader);
      usedChunks.push(chunk);
      currentLength += chunkWithHeader.length + 4; // +4 for separator
    }

    return {
      context: parts.join('\n\n---\n\n'),
      usedChunks,
    };
  }

  /**
   * Build the prompt
   */
  private buildPrompt(query: string, context: string, systemPrompt?: string): string {
    const system = systemPrompt ||
      'You are a helpful assistant that answers questions based on provided context. ' +
      'Always cite your sources using [Source: X] when referencing specific information.';

    return `${system}

Answer the following question using ONLY the information provided in the context.
If the context doesn't contain enough information, acknowledge what you don't know.

Question: ${query}

Context:
${context}

Answer:`;
  }

  /**
   * Mock LLM for testing
   */
  private mockLLM(): LLMClient {
    return {
      complete: async (prompt: string): Promise<string> => {
        const questionMatch = prompt.match(/Question:\s*(.+?)(?:\n|Context:)/s);
        const contextMatch = prompt.match(/Context:\s*(.+?)(?:\n\nAnswer:)/s);

        const question = questionMatch ? questionMatch[1].trim() : '';
        const context = contextMatch ? contextMatch[1].trim() : '';

        // Extract sources
        const sources = context.match(/\[Source: ([^\]]+)\]/g) || [];
        const sourceList = sources.slice(0, 3).join(', ');

        return `Based on the provided context (${sourceList}), regarding "${question.slice(0, 50)}": ${context.slice(0, 300)}...`;
      },
    };
  }
}

/**
 * Factory function
 */
export function compactSynthesizer(llm?: LLMClient, maxContextLength?: number): CompactSynthesizer {
  return new CompactSynthesizer(llm, maxContextLength);
}
