/**
 * Refine Synthesizer
 * Iteratively refine answer by processing chunks sequentially
 */

import type { Chunk, Synthesizer, SynthesisResult, Citation, SynthesizerOptions } from '../types';

interface LLMClient {
  complete(prompt: string, options?: { temperature?: number; maxTokens?: number }): Promise<string>;
}

export class RefineSynthesizer implements Synthesizer {
  private llm: LLMClient;

  constructor(llm?: LLMClient) {
    this.llm = llm || this.mockLLM();
  }

  /**
   * Synthesize answer by iteratively refining with each chunk
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

    let currentAnswer = '';
    const citations: Citation[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const isFirst = i === 0;

      const prompt = this.buildRefinePrompt(query, currentAnswer, chunk.content, isFirst, systemPrompt);

      const refined = await this.llm.complete(prompt, {
        temperature,
        maxTokens,
      });

      // Track if this chunk contributed to the answer
      if (this.chunkWasUsed(refined, chunk.content, currentAnswer)) {
        citations.push({
          text: chunk.content.slice(0, 200),
          source: chunk.metadata.source || `Chunk ${i + 1}`,
          score: chunk.metadata.score as number || 0,
          chunkId: chunk.id,
          metadata: {
            chunkIndex: i,
            ...chunk.metadata,
          },
        });
      }

      currentAnswer = refined;
    }

    return {
      answer: currentAnswer,
      citations,
    };
  }

  /**
   * Build refine prompt
   */
  private buildRefinePrompt(
    query: string,
    currentAnswer: string,
    newContext: string,
    isFirst: boolean,
    systemPrompt?: string
  ): string {
    const system = systemPrompt || 'You are a helpful assistant that answers questions based on provided context.';

    if (isFirst) {
      return `${system}

Answer this question using ONLY the provided context. If the context doesn't contain relevant information, say so.

Question: ${query}

Context:
${newContext}

Answer:`;
    }

    return `${system}

You previously answered a question. Now refine your answer using new context.
- If the new context adds valuable information, incorporate it
- If it's redundant or irrelevant, keep the current answer
- Ensure the answer remains coherent and well-structured

Question: ${query}

Current Answer:
${currentAnswer}

New Context:
${newContext}

Refined Answer:`;
  }

  /**
   * Check if chunk contributed to the refined answer
   */
  private chunkWasUsed(newAnswer: string, chunkContent: string, previousAnswer: string): boolean {
    // Extract key phrases from chunk
    const phrases = this.extractPhrases(chunkContent, 3);

    // Check if any new phrases appear in answer that weren't there before
    const answerLower = newAnswer.toLowerCase();
    const previousLower = previousAnswer.toLowerCase();

    for (const phrase of phrases) {
      const phraseLower = phrase.toLowerCase();
      if (answerLower.includes(phraseLower) && !previousLower.includes(phraseLower)) {
        return true;
      }
    }

    // Also check if answer changed significantly
    const changeRatio = this.levenshteinRatio(previousAnswer, newAnswer);
    return changeRatio > 0.1; // More than 10% change
  }

  /**
   * Extract n-word phrases from text
   */
  private extractPhrases(text: string, n: number): string[] {
    const words = text.split(/\s+/).filter(w => w.length > 2);
    const phrases: string[] = [];

    for (let i = 0; i <= words.length - n; i++) {
      phrases.push(words.slice(i, i + n).join(' '));
    }

    return phrases;
  }

  /**
   * Calculate Levenshtein distance ratio
   */
  private levenshteinRatio(a: string, b: string): number {
    if (a === b) return 0;
    if (a.length === 0) return 1;
    if (b.length === 0) return 1;

    // Simplified: just compare lengths and common words
    const wordsA = new Set(a.toLowerCase().split(/\s+/));
    const wordsB = new Set(b.toLowerCase().split(/\s+/));

    const intersection = new Set([...wordsA].filter(w => wordsB.has(w)));
    const union = new Set([...wordsA, ...wordsB]);

    return 1 - (intersection.size / union.size);
  }

  /**
   * Mock LLM for testing
   */
  private mockLLM(): LLMClient {
    return {
      complete: async (prompt: string): Promise<string> => {
        // Extract question and context from prompt
        const questionMatch = prompt.match(/Question:\s*(.+?)(?:\n|Current|Context)/s);
        const contextMatch = prompt.match(/(?:New )?Context:\s*(.+?)(?:\n\n|Refined|Answer:)/s);

        const question = questionMatch ? questionMatch[1].trim() : '';
        const context = contextMatch ? contextMatch[1].trim() : '';

        // Check for current answer in refinement prompts
        const currentMatch = prompt.match(/Current Answer:\s*(.+?)(?:\nNew Context)/s);
        const currentAnswer = currentMatch ? currentMatch[1].trim() : '';

        if (currentAnswer) {
          // Refinement: append relevant info from context
          const contextSummary = context.slice(0, 100);
          return `${currentAnswer}\n\nAdditionally, ${contextSummary.toLowerCase()}...`;
        }

        // Initial answer
        return `Based on the provided context: ${context.slice(0, 200)}...`;
      },
    };
  }
}

/**
 * Factory function
 */
export function refineSynthesizer(llm?: LLMClient): RefineSynthesizer {
  return new RefineSynthesizer(llm);
}
