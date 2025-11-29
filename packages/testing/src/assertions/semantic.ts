/**
 * Semantic Assertions
 * Compare outputs by meaning, not exact string match
 */

import type { SemanticMatchOptions } from '../types';

/**
 * Default embedding cache to avoid repeated API calls
 */
const embeddingCache = new Map<string, number[]>();

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Get embedding for text
 * Uses OpenAI by default, with caching
 */
export async function getEmbedding(
  text: string,
  options: { model?: string; useCache?: boolean } = {}
): Promise<number[]> {
  const { model = 'text-embedding-3-small', useCache = true } = options;

  // Check cache
  const cacheKey = `${model}:${text}`;
  if (useCache && embeddingCache.has(cacheKey)) {
    return embeddingCache.get(cacheKey)!;
  }

  // Use direct OpenAI API call for embeddings
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY environment variable is required for semantic testing'
    );
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Embedding API error: ${response.statusText}`);
  }

  interface EmbeddingResponse {
    data: Array<{ embedding: number[] }>;
  }

  const data = (await response.json()) as EmbeddingResponse;
  const embedding = data.data[0].embedding;

  if (useCache) {
    embeddingCache.set(cacheKey, embedding);
  }

  return embedding;
}

/**
 * Calculate semantic similarity between two texts
 */
export async function semanticSimilarity(
  text1: string,
  text2: string,
  options: SemanticMatchOptions = {}
): Promise<number> {
  const [embedding1, embedding2] = await Promise.all([
    getEmbedding(text1, options),
    getEmbedding(text2, options),
  ]);

  return cosineSimilarity(embedding1, embedding2);
}

/**
 * Semantic match assertion
 */
export async function assertSemanticMatch(
  actual: string,
  expected: string,
  options: SemanticMatchOptions = {}
): Promise<void> {
  const { similarity: threshold = 0.8 } = options;

  const similarity = await semanticSimilarity(actual, expected, options);

  if (similarity < threshold) {
    const error = new Error(
      `Semantic match failed.\n` +
        `Expected similarity: >= ${threshold}\n` +
        `Actual similarity: ${similarity.toFixed(4)}\n\n` +
        `Actual text:\n${actual}\n\n` +
        `Expected to match:\n${expected}`
    );
    error.name = 'SemanticMatchError';
    throw error;
  }
}

/**
 * Semantic snapshot assertion
 * Saves embedding on first run, compares on subsequent runs
 */
export async function assertSemanticSnapshot(
  actual: string,
  snapshotId: string,
  options: { snapshotDir?: string; threshold?: number } = {}
): Promise<void> {
  const { snapshotDir = '.rana/snapshots', threshold = 0.9 } = options;
  const fs = await import('fs/promises');
  const path = await import('path');

  const snapshotPath = path.join(snapshotDir, `${snapshotId}.json`);

  // Get current embedding
  const currentEmbedding = await getEmbedding(actual);

  try {
    // Try to load existing snapshot
    const snapshotData = await fs.readFile(snapshotPath, 'utf-8');
    const snapshot = JSON.parse(snapshotData);

    // Compare embeddings
    const similarity = cosineSimilarity(currentEmbedding, snapshot.embedding);

    if (similarity < threshold) {
      const error = new Error(
        `Semantic snapshot mismatch for "${snapshotId}".\n` +
          `Expected similarity: >= ${threshold}\n` +
          `Actual similarity: ${similarity.toFixed(4)}\n\n` +
          `Current output:\n${actual}\n\n` +
          `Original output:\n${snapshot.text}`
      );
      error.name = 'SemanticSnapshotError';
      throw error;
    }
  } catch (e) {
    // Snapshot doesn't exist, create it
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
      await fs.mkdir(snapshotDir, { recursive: true });
      await fs.writeFile(
        snapshotPath,
        JSON.stringify(
          {
            text: actual,
            embedding: currentEmbedding,
            createdAt: new Date().toISOString(),
          },
          null,
          2
        )
      );
      console.log(`Created semantic snapshot: ${snapshotId}`);
      return;
    }
    throw e;
  }
}

/**
 * Clear embedding cache
 */
export function clearEmbeddingCache(): void {
  embeddingCache.clear();
}

/**
 * Get cache stats
 */
export function getEmbeddingCacheStats(): { size: number; keys: string[] } {
  return {
    size: embeddingCache.size,
    keys: Array.from(embeddingCache.keys()),
  };
}
