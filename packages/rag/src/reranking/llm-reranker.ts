/**
 * LLM Reranker
 * Re-rank documents using LLM scoring
 */

import type { Reranker, RetrievalResult, LLMRerankerOptions } from '../types';

interface LLMClient {
  complete(prompt: string, options?: { temperature?: number; maxTokens?: number }): Promise<string>;
}

export class LLMReranker implements Reranker {
  private llm: LLMClient;

  constructor(llm?: LLMClient) {
    this.llm = llm || this.mockLLM();
  }

  /**
   * Re-rank documents using LLM
   */
  async rerank(
    query: string,
    documents: RetrievalResult[],
    options: LLMRerankerOptions = {}
  ): Promise<RetrievalResult[]> {
    const {
      topK = 5,
      temperature = 0,
      batchSize = 10,
    } = options;

    // For small document sets, score all at once
    if (documents.length <= batchSize) {
      const scores = await this.scoreDocuments(query, documents, options);
      return this.applyScores(documents, scores).slice(0, topK);
    }

    // For larger sets, use pairwise comparison approach
    return this.pairwiseRerank(query, documents, topK, options);
  }

  /**
   * Score documents with LLM
   */
  private async scoreDocuments(
    query: string,
    documents: RetrievalResult[],
    options: LLMRerankerOptions
  ): Promise<number[]> {
    const prompt = this.buildScoringPrompt(query, documents);

    const response = await this.llm.complete(prompt, {
      temperature: options.temperature || 0,
      maxTokens: 100,
    });

    return this.parseScores(response, documents.length);
  }

  /**
   * Build prompt for document scoring
   */
  private buildScoringPrompt(query: string, documents: RetrievalResult[]): string {
    const docList = documents
      .map((doc, i) => `[${i}] ${doc.chunk.content.slice(0, 300)}${doc.chunk.content.length > 300 ? '...' : ''}`)
      .join('\n\n');

    return `Rate the relevance of each document to the query on a scale of 0-10.

Query: ${query}

Documents:
${docList}

Output ONLY a JSON array of scores in order, e.g., [8, 5, 3, 7, 2]
Scores:`;
  }

  /**
   * Parse scores from LLM response
   */
  private parseScores(response: string, expectedCount: number): number[] {
    try {
      // Try to extract JSON array
      const match = response.match(/\[[\d\s,\.]+\]/);
      if (match) {
        const scores = JSON.parse(match[0]) as number[];
        // Normalize to 0-1
        return scores.map(s => Math.min(10, Math.max(0, s)) / 10);
      }

      // Try comma-separated numbers
      const numbers = response.match(/\d+(?:\.\d+)?/g);
      if (numbers && numbers.length >= expectedCount) {
        return numbers.slice(0, expectedCount).map(n => Math.min(10, parseFloat(n)) / 10);
      }
    } catch {
      // Fall back to equal scores
    }

    return new Array(expectedCount).fill(0.5);
  }

  /**
   * Apply scores to documents and sort
   */
  private applyScores(documents: RetrievalResult[], scores: number[]): RetrievalResult[] {
    const scored = documents.map((doc, i) => ({
      ...doc,
      score: scores[i] || 0.5,
      metadata: {
        ...doc.metadata,
        originalScore: doc.score,
        llmScore: scores[i] || 0.5,
      },
    }));

    return scored.sort((a, b) => b.score - a.score);
  }

  /**
   * Pairwise reranking for larger document sets
   */
  private async pairwiseRerank(
    query: string,
    documents: RetrievalResult[],
    topK: number,
    options: LLMRerankerOptions
  ): Promise<RetrievalResult[]> {
    const wins = new Map<string, number>();

    // Initialize win counts
    for (const doc of documents) {
      wins.set(doc.id, 0);
    }

    // Compare top candidates pairwise
    const candidates = documents.slice(0, Math.min(documents.length, topK * 2));

    for (let i = 0; i < candidates.length; i++) {
      for (let j = i + 1; j < candidates.length; j++) {
        const winner = await this.comparePair(
          query,
          candidates[i],
          candidates[j],
          options
        );

        if (winner === 'A') {
          wins.set(candidates[i].id, (wins.get(candidates[i].id) || 0) + 1);
        } else if (winner === 'B') {
          wins.set(candidates[j].id, (wins.get(candidates[j].id) || 0) + 1);
        } else {
          // Tie - give half point to each
          wins.set(candidates[i].id, (wins.get(candidates[i].id) || 0) + 0.5);
          wins.set(candidates[j].id, (wins.get(candidates[j].id) || 0) + 0.5);
        }
      }
    }

    // Sort by wins
    const maxWins = Math.max(...wins.values()) || 1;
    const sorted = candidates
      .map(doc => ({
        ...doc,
        score: (wins.get(doc.id) || 0) / maxWins,
        metadata: {
          ...doc.metadata,
          originalScore: doc.score,
          pairwiseWins: wins.get(doc.id) || 0,
        },
      }))
      .sort((a, b) => b.score - a.score);

    return sorted.slice(0, topK);
  }

  /**
   * Compare two documents pairwise
   */
  private async comparePair(
    query: string,
    docA: RetrievalResult,
    docB: RetrievalResult,
    options: LLMRerankerOptions
  ): Promise<'A' | 'B' | 'tie'> {
    const prompt = `Which document is more relevant to the query?

Query: ${query}

Document A:
${docA.chunk.content.slice(0, 300)}

Document B:
${docB.chunk.content.slice(0, 300)}

Answer with ONLY "A", "B", or "tie":`;

    const response = await this.llm.complete(prompt, {
      temperature: 0,
      maxTokens: 10,
    });

    const answer = response.trim().toUpperCase();
    if (answer.startsWith('A')) return 'A';
    if (answer.startsWith('B')) return 'B';
    return 'tie';
  }

  /**
   * Mock LLM for testing
   */
  private mockLLM(): LLMClient {
    return {
      complete: async (prompt: string): Promise<string> => {
        // Simple mock scoring based on query term overlap
        const queryMatch = prompt.match(/Query:\s*(.+?)(?:\n|Document)/s);
        const query = queryMatch ? queryMatch[1].toLowerCase() : '';
        const queryTerms = query.split(/\s+/).filter(t => t.length > 2);

        // Extract documents
        const docMatches = prompt.matchAll(/\[(\d+)\]\s*(.+?)(?=\[\d+\]|Scores:|$)/gs);
        const scores: number[] = [];

        for (const match of docMatches) {
          const doc = match[2].toLowerCase();
          let score = 5;

          for (const term of queryTerms) {
            if (doc.includes(term)) {
              score += 1;
            }
          }

          scores.push(Math.min(10, score));
        }

        return JSON.stringify(scores);
      },
    };
  }
}

/**
 * Factory function
 */
export function llmReranker(llm?: LLMClient): LLMReranker {
  return new LLMReranker(llm);
}
