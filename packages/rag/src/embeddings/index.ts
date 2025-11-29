/**
 * Embedding Providers for RAG
 * Support for OpenAI, Cohere, and local models
 */

export interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
  readonly dimension: number;
  readonly model: string;
}

/**
 * OpenAI Embeddings
 */
export interface OpenAIEmbeddingConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

export class OpenAIEmbeddings implements EmbeddingProvider {
  private apiKey: string;
  private baseUrl: string;
  public readonly model: string;
  public readonly dimension: number;

  constructor(config: OpenAIEmbeddingConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'text-embedding-3-small';
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';

    // Set dimension based on model
    this.dimension = this.model === 'text-embedding-3-large' ? 3072 :
                     this.model === 'text-embedding-3-small' ? 1536 :
                     this.model === 'text-embedding-ada-002' ? 1536 : 1536;
  }

  async embed(text: string): Promise<number[]> {
    const embeddings = await this.embedBatch([text]);
    return embeddings[0];
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        input: texts,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI embeddings failed: ${error}`);
    }

    const data = await response.json() as {
      data: Array<{ embedding: number[]; index: number }>;
    };

    // Sort by index and extract embeddings
    return data.data
      .sort((a, b) => a.index - b.index)
      .map(item => item.embedding);
  }
}

/**
 * Cohere Embeddings
 */
export interface CohereEmbeddingConfig {
  apiKey: string;
  model?: string;
  inputType?: 'search_document' | 'search_query' | 'classification' | 'clustering';
}

export class CohereEmbeddings implements EmbeddingProvider {
  private apiKey: string;
  private inputType: string;
  public readonly model: string;
  public readonly dimension: number;

  constructor(config: CohereEmbeddingConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'embed-english-v3.0';
    this.inputType = config.inputType || 'search_document';

    // Cohere v3 models have 1024 dimensions
    this.dimension = this.model.includes('v3') ? 1024 : 4096;
  }

  async embed(text: string): Promise<number[]> {
    const embeddings = await this.embedBatch([text]);
    return embeddings[0];
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const response = await fetch('https://api.cohere.ai/v1/embed', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        texts,
        input_type: this.inputType,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cohere embeddings failed: ${error}`);
    }

    const data = await response.json() as {
      embeddings: number[][];
    };

    return data.embeddings;
  }
}

/**
 * Voyage AI Embeddings
 */
export interface VoyageEmbeddingConfig {
  apiKey: string;
  model?: string;
  inputType?: 'query' | 'document';
}

export class VoyageEmbeddings implements EmbeddingProvider {
  private apiKey: string;
  private inputType: string;
  public readonly model: string;
  public readonly dimension: number;

  constructor(config: VoyageEmbeddingConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'voyage-2';
    this.inputType = config.inputType || 'document';

    // Voyage dimensions
    this.dimension = this.model === 'voyage-large-2' ? 1536 :
                     this.model === 'voyage-2' ? 1024 : 1024;
  }

  async embed(text: string): Promise<number[]> {
    const embeddings = await this.embedBatch([text]);
    return embeddings[0];
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const response = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        input: texts,
        input_type: this.inputType,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Voyage embeddings failed: ${error}`);
    }

    const data = await response.json() as {
      data: Array<{ embedding: number[] }>;
    };

    return data.data.map(item => item.embedding);
  }
}

/**
 * Google/Vertex AI Embeddings
 */
export interface GoogleEmbeddingConfig {
  apiKey: string;
  model?: string;
}

export class GoogleEmbeddings implements EmbeddingProvider {
  private apiKey: string;
  public readonly model: string;
  public readonly dimension: number;

  constructor(config: GoogleEmbeddingConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'text-embedding-004';
    this.dimension = 768;
  }

  async embed(text: string): Promise<number[]> {
    const embeddings = await this.embedBatch([text]);
    return embeddings[0];
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];

    // Google API requires individual requests for each text
    for (const text of texts) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:embedContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: `models/${this.model}`,
            content: { parts: [{ text }] },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Google embeddings failed: ${error}`);
      }

      const data = await response.json() as {
        embedding: { values: number[] };
      };

      results.push(data.embedding.values);
    }

    return results;
  }
}

/**
 * Local/Mock Embeddings for testing
 */
export class MockEmbeddings implements EmbeddingProvider {
  public readonly model = 'mock';
  public readonly dimension: number;

  constructor(dimension: number = 384) {
    this.dimension = dimension;
  }

  async embed(text: string): Promise<number[]> {
    const embedding = new Array(this.dimension).fill(0);
    const words = text.toLowerCase().split(/\s+/);

    for (const word of words) {
      for (let i = 0; i < word.length; i++) {
        const idx = (word.charCodeAt(i) * (i + 1)) % this.dimension;
        embedding[idx] += 1 / words.length;
      }
    }

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum: number, v: number) => sum + v * v, 0));
    return magnitude > 0 ? embedding.map((v: number) => v / magnitude) : embedding;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map(text => this.embed(text)));
  }
}

/**
 * Factory function to create embeddings provider
 */
export function createEmbeddings(
  provider: 'openai' | 'cohere' | 'voyage' | 'google' | 'mock',
  config: OpenAIEmbeddingConfig | CohereEmbeddingConfig | VoyageEmbeddingConfig | GoogleEmbeddingConfig | { dimension?: number } = {}
): EmbeddingProvider {
  switch (provider) {
    case 'openai':
      return new OpenAIEmbeddings(config as OpenAIEmbeddingConfig);
    case 'cohere':
      return new CohereEmbeddings(config as CohereEmbeddingConfig);
    case 'voyage':
      return new VoyageEmbeddings(config as VoyageEmbeddingConfig);
    case 'google':
      return new GoogleEmbeddings(config as GoogleEmbeddingConfig);
    case 'mock':
    default:
      return new MockEmbeddings((config as { dimension?: number }).dimension);
  }
}
