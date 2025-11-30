/**
 * @rana/integrations/huggingface
 * Hugging Face models integration
 *
 * Supports:
 * - Inference API (serverless)
 * - Inference Endpoints (dedicated)
 * - Text generation, embeddings, classification
 * - Streaming responses
 *
 * @example
 * ```typescript
 * import { createHuggingFaceProvider } from '@rana/core';
 *
 * const hf = createHuggingFaceProvider({
 *   apiKey: process.env.HF_API_KEY,
 * });
 *
 * // Text generation
 * const response = await hf.generate({
 *   model: 'mistralai/Mistral-7B-Instruct-v0.2',
 *   prompt: 'Explain quantum computing in simple terms',
 * });
 *
 * // Embeddings
 * const embeddings = await hf.embed({
 *   model: 'sentence-transformers/all-MiniLM-L6-v2',
 *   texts: ['Hello world', 'How are you?'],
 * });
 * ```
 */

// ============================================================================
// Types
// ============================================================================

export type HuggingFaceTask =
  | 'text-generation'
  | 'text2text-generation'
  | 'feature-extraction'
  | 'fill-mask'
  | 'summarization'
  | 'question-answering'
  | 'text-classification'
  | 'token-classification'
  | 'zero-shot-classification'
  | 'translation'
  | 'conversational';

export interface HuggingFaceConfig {
  /** Hugging Face API key */
  apiKey: string;
  /** Base URL for API (default: https://api-inference.huggingface.co) */
  baseUrl?: string;
  /** Default model to use */
  defaultModel?: string;
  /** Request timeout in ms */
  timeout?: number;
  /** Whether to wait for model to load */
  waitForModel?: boolean;
  /** Use GPU if available */
  useGpu?: boolean;
  /** Cache responses */
  useCache?: boolean;
}

export interface GenerationOptions {
  /** Model ID (e.g., 'mistralai/Mistral-7B-Instruct-v0.2') */
  model?: string;
  /** Input prompt or messages */
  prompt?: string;
  /** Messages for chat-style models */
  messages?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Temperature (0-2) */
  temperature?: number;
  /** Top-p sampling */
  topP?: number;
  /** Top-k sampling */
  topK?: number;
  /** Repetition penalty */
  repetitionPenalty?: number;
  /** Stop sequences */
  stopSequences?: string[];
  /** Stream response */
  stream?: boolean;
  /** Return full text (including prompt) */
  returnFullText?: boolean;
  /** Number of generations */
  numReturnSequences?: number;
}

export interface EmbeddingOptions {
  /** Model ID (e.g., 'sentence-transformers/all-MiniLM-L6-v2') */
  model?: string;
  /** Texts to embed */
  texts: string[];
  /** Normalize embeddings */
  normalize?: boolean;
  /** Truncate long texts */
  truncate?: boolean;
}

export interface ClassificationOptions {
  /** Model ID */
  model?: string;
  /** Text to classify */
  text: string;
  /** Candidate labels for zero-shot */
  candidateLabels?: string[];
  /** Multi-label classification */
  multiLabel?: boolean;
}

export interface SummarizationOptions {
  /** Model ID */
  model?: string;
  /** Text to summarize */
  text: string;
  /** Max summary length */
  maxLength?: number;
  /** Min summary length */
  minLength?: number;
}

export interface QAOptions {
  /** Model ID */
  model?: string;
  /** Question to answer */
  question: string;
  /** Context to search for answer */
  context: string;
}

export interface TranslationOptions {
  /** Model ID */
  model?: string;
  /** Text to translate */
  text: string;
  /** Source language */
  sourceLang?: string;
  /** Target language */
  targetLang?: string;
}

export interface GenerationResult {
  text: string;
  finishReason?: 'length' | 'stop' | 'eos_token';
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface EmbeddingResult {
  embeddings: number[][];
  model: string;
  dimensions: number;
}

export interface ClassificationResult {
  labels: string[];
  scores: number[];
  model: string;
}

export interface SummarizationResult {
  summary: string;
  model: string;
}

export interface QAResult {
  answer: string;
  score: number;
  start: number;
  end: number;
}

export interface TranslationResult {
  translatedText: string;
  model: string;
}

export interface StreamChunk {
  token: string;
  isFinished: boolean;
  generatedText?: string;
}

export interface ModelInfo {
  id: string;
  author: string;
  downloads: number;
  likes: number;
  tags: string[];
  pipeline_tag?: HuggingFaceTask;
  library_name?: string;
  createdAt: Date;
  lastModified: Date;
}

// ============================================================================
// Popular Models Registry
// ============================================================================

export const POPULAR_MODELS = {
  // Text Generation
  textGeneration: {
    'mistral-7b': 'mistralai/Mistral-7B-Instruct-v0.2',
    'mixtral-8x7b': 'mistralai/Mixtral-8x7B-Instruct-v0.1',
    'llama-2-70b': 'meta-llama/Llama-2-70b-chat-hf',
    'llama-2-13b': 'meta-llama/Llama-2-13b-chat-hf',
    'llama-2-7b': 'meta-llama/Llama-2-7b-chat-hf',
    'falcon-180b': 'tiiuae/falcon-180B-chat',
    'falcon-40b': 'tiiuae/falcon-40b-instruct',
    'codellama-34b': 'codellama/CodeLlama-34b-Instruct-hf',
    'starcoder2': 'bigcode/starcoder2-15b',
    'phi-2': 'microsoft/phi-2',
    'gemma-7b': 'google/gemma-7b-it',
    'zephyr-7b': 'HuggingFaceH4/zephyr-7b-beta',
    'openchat-3.5': 'openchat/openchat-3.5',
    'neural-chat-7b': 'Intel/neural-chat-7b-v3-1',
  },

  // Embeddings
  embeddings: {
    'all-minilm': 'sentence-transformers/all-MiniLM-L6-v2',
    'all-mpnet': 'sentence-transformers/all-mpnet-base-v2',
    'bge-large': 'BAAI/bge-large-en-v1.5',
    'bge-small': 'BAAI/bge-small-en-v1.5',
    'e5-large': 'intfloat/e5-large-v2',
    'gte-large': 'thenlper/gte-large',
    'instructor-large': 'hkunlp/instructor-large',
    'multilingual-e5': 'intfloat/multilingual-e5-large',
  },

  // Classification
  classification: {
    'roberta-sentiment': 'cardiffnlp/twitter-roberta-base-sentiment-latest',
    'distilbert-emotion': 'j-hartmann/emotion-english-distilroberta-base',
    'bart-mnli': 'facebook/bart-large-mnli',
    'deberta-nli': 'MoritzLaworta/DeBERTa-v3-large-mnli-fever-anli-ling-wanli',
  },

  // Summarization
  summarization: {
    'bart-cnn': 'facebook/bart-large-cnn',
    'pegasus': 'google/pegasus-xsum',
    'flan-t5': 'google/flan-t5-large',
  },

  // Translation
  translation: {
    'opus-mt': 'Helsinki-NLP/opus-mt-en-de',
    'mbart': 'facebook/mbart-large-50-many-to-many-mmt',
    'nllb': 'facebook/nllb-200-distilled-600M',
  },

  // Q&A
  qa: {
    'roberta-squad': 'deepset/roberta-base-squad2',
    'distilbert-squad': 'distilbert-base-cased-distilled-squad',
    'xlm-roberta-squad': 'deepset/xlm-roberta-large-squad2',
  },
} as const;

// ============================================================================
// Hugging Face Provider
// ============================================================================

export class HuggingFaceProvider {
  private config: Required<HuggingFaceConfig>;
  private cache: Map<string, { result: unknown; timestamp: number }> = new Map();
  private cacheMaxAge = 5 * 60 * 1000; // 5 minutes

  constructor(config: HuggingFaceConfig) {
    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || 'https://api-inference.huggingface.co',
      defaultModel: config.defaultModel || POPULAR_MODELS.textGeneration['mistral-7b'],
      timeout: config.timeout || 120000,
      waitForModel: config.waitForModel ?? true,
      useGpu: config.useGpu ?? true,
      useCache: config.useCache ?? false,
    };
  }

  // --------------------------------------------------------------------------
  // Text Generation
  // --------------------------------------------------------------------------

  /**
   * Generate text using a language model
   */
  async generate(options: GenerationOptions): Promise<GenerationResult> {
    const model = options.model || this.config.defaultModel;

    // Build input - support both prompt and messages format
    let input: string;
    if (options.messages) {
      input = this.formatMessages(options.messages);
    } else if (options.prompt) {
      input = options.prompt;
    } else {
      throw new Error('Either prompt or messages must be provided');
    }

    const payload = {
      inputs: input,
      parameters: {
        max_new_tokens: options.maxTokens || 256,
        temperature: options.temperature ?? 0.7,
        top_p: options.topP,
        top_k: options.topK,
        repetition_penalty: options.repetitionPenalty,
        stop: options.stopSequences,
        return_full_text: options.returnFullText ?? false,
        num_return_sequences: options.numReturnSequences || 1,
        do_sample: (options.temperature ?? 0.7) > 0,
      },
      options: {
        wait_for_model: this.config.waitForModel,
        use_gpu: this.config.useGpu,
        use_cache: this.config.useCache,
      },
    };

    const response = await this.request<Array<{ generated_text: string }>>(
      `/models/${model}`,
      payload
    );

    const generated = Array.isArray(response) ? response[0] : response;
    let text = generated.generated_text;

    // Remove the prompt from the beginning if return_full_text was true
    if (options.returnFullText === false && text.startsWith(input)) {
      text = text.slice(input.length).trim();
    }

    return {
      text,
      finishReason: 'stop',
    };
  }

  /**
   * Stream text generation
   */
  async *generateStream(options: GenerationOptions): AsyncGenerator<StreamChunk> {
    const model = options.model || this.config.defaultModel;

    let input: string;
    if (options.messages) {
      input = this.formatMessages(options.messages);
    } else if (options.prompt) {
      input = options.prompt;
    } else {
      throw new Error('Either prompt or messages must be provided');
    }

    const payload = {
      inputs: input,
      parameters: {
        max_new_tokens: options.maxTokens || 256,
        temperature: options.temperature ?? 0.7,
        top_p: options.topP,
        top_k: options.topK,
        repetition_penalty: options.repetitionPenalty,
        stop: options.stopSequences,
        return_full_text: false,
        do_sample: (options.temperature ?? 0.7) > 0,
      },
      stream: true,
      options: {
        wait_for_model: this.config.waitForModel,
        use_gpu: this.config.useGpu,
      },
    };

    const response = await fetch(`${this.config.baseUrl}/models/${model}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new HuggingFaceError(`Generation failed: ${error}`, response.status);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new HuggingFaceError('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const data = line.slice(5).trim();
            if (data === '[DONE]') {
              yield { token: '', isFinished: true, generatedText: fullText };
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const token = parsed.token?.text || parsed.generated_text || '';
              fullText += token;
              yield {
                token,
                isFinished: false,
              };
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      yield { token: '', isFinished: true, generatedText: fullText };
    } finally {
      reader.releaseLock();
    }
  }

  // --------------------------------------------------------------------------
  // Embeddings
  // --------------------------------------------------------------------------

  /**
   * Generate embeddings for texts
   */
  async embed(options: EmbeddingOptions): Promise<EmbeddingResult> {
    const model = options.model || POPULAR_MODELS.embeddings['all-minilm'];

    // Check cache
    const cacheKey = `embed:${model}:${JSON.stringify(options.texts)}`;
    const cached = this.getFromCache<EmbeddingResult>(cacheKey);
    if (cached) return cached;

    const payload = {
      inputs: options.texts,
      options: {
        wait_for_model: this.config.waitForModel,
        use_gpu: this.config.useGpu,
      },
    };

    const response = await this.request<number[][] | number[][][]>(
      `/pipeline/feature-extraction/${model}`,
      payload
    );

    // Handle different response formats
    let embeddings: number[][];
    if (Array.isArray(response[0]) && Array.isArray(response[0][0])) {
      // Model returns [batch, tokens, dims] - mean pool over tokens
      embeddings = (response as number[][][]).map((tokenEmbeddings) =>
        this.meanPool(tokenEmbeddings)
      );
    } else {
      embeddings = response as number[][];
    }

    // Normalize if requested
    if (options.normalize !== false) {
      embeddings = embeddings.map((e) => this.normalize(e));
    }

    const result: EmbeddingResult = {
      embeddings,
      model,
      dimensions: embeddings[0]?.length || 0,
    };

    this.setCache(cacheKey, result);
    return result;
  }

  // --------------------------------------------------------------------------
  // Classification
  // --------------------------------------------------------------------------

  /**
   * Classify text
   */
  async classify(options: ClassificationOptions): Promise<ClassificationResult> {
    const model = options.model || POPULAR_MODELS.classification['roberta-sentiment'];

    // Zero-shot classification
    if (options.candidateLabels?.length) {
      const payload = {
        inputs: options.text,
        parameters: {
          candidate_labels: options.candidateLabels,
          multi_label: options.multiLabel ?? false,
        },
        options: {
          wait_for_model: this.config.waitForModel,
        },
      };

      const response = await this.request<{
        labels: string[];
        scores: number[];
      }>(`/models/${model}`, payload);

      return {
        labels: response.labels,
        scores: response.scores,
        model,
      };
    }

    // Standard classification
    const payload = {
      inputs: options.text,
      options: {
        wait_for_model: this.config.waitForModel,
      },
    };

    const response = await this.request<Array<Array<{ label: string; score: number }>>>(
      `/models/${model}`,
      payload
    );

    const predictions = response[0] || [];
    return {
      labels: predictions.map((p) => p.label),
      scores: predictions.map((p) => p.score),
      model,
    };
  }

  // --------------------------------------------------------------------------
  // Summarization
  // --------------------------------------------------------------------------

  /**
   * Summarize text
   */
  async summarize(options: SummarizationOptions): Promise<SummarizationResult> {
    const model = options.model || POPULAR_MODELS.summarization['bart-cnn'];

    const payload = {
      inputs: options.text,
      parameters: {
        max_length: options.maxLength,
        min_length: options.minLength,
      },
      options: {
        wait_for_model: this.config.waitForModel,
      },
    };

    const response = await this.request<Array<{ summary_text: string }>>(
      `/models/${model}`,
      payload
    );

    return {
      summary: response[0].summary_text,
      model,
    };
  }

  // --------------------------------------------------------------------------
  // Question Answering
  // --------------------------------------------------------------------------

  /**
   * Answer questions based on context
   */
  async answer(options: QAOptions): Promise<QAResult> {
    const model = options.model || POPULAR_MODELS.qa['roberta-squad'];

    const payload = {
      inputs: {
        question: options.question,
        context: options.context,
      },
      options: {
        wait_for_model: this.config.waitForModel,
      },
    };

    const response = await this.request<{
      answer: string;
      score: number;
      start: number;
      end: number;
    }>(`/models/${model}`, payload);

    return response;
  }

  // --------------------------------------------------------------------------
  // Translation
  // --------------------------------------------------------------------------

  /**
   * Translate text
   */
  async translate(options: TranslationOptions): Promise<TranslationResult> {
    // Auto-select model based on language pair
    let model = options.model;
    if (!model && options.sourceLang && options.targetLang) {
      model = `Helsinki-NLP/opus-mt-${options.sourceLang}-${options.targetLang}`;
    }
    model = model || POPULAR_MODELS.translation['opus-mt'];

    const payload = {
      inputs: options.text,
      options: {
        wait_for_model: this.config.waitForModel,
      },
    };

    const response = await this.request<Array<{ translation_text: string }>>(
      `/models/${model}`,
      payload
    );

    return {
      translatedText: response[0].translation_text,
      model,
    };
  }

  // --------------------------------------------------------------------------
  // Model Info
  // --------------------------------------------------------------------------

  /**
   * Get information about a model
   */
  async getModelInfo(modelId: string): Promise<ModelInfo> {
    const response = await fetch(`https://huggingface.co/api/models/${modelId}`, {
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new HuggingFaceError(`Failed to get model info: ${response.statusText}`, response.status);
    }

    const data = await response.json() as {
      modelId?: string;
      id?: string;
      author: string;
      downloads?: number;
      likes?: number;
      tags?: string[];
      pipeline_tag?: HuggingFaceTask;
      library_name?: string;
      createdAt: string;
      lastModified: string;
    };
    return {
      id: data.modelId || data.id || '',
      author: data.author,
      downloads: data.downloads || 0,
      likes: data.likes || 0,
      tags: data.tags || [],
      pipeline_tag: data.pipeline_tag,
      library_name: data.library_name,
      createdAt: new Date(data.createdAt),
      lastModified: new Date(data.lastModified),
    };
  }

  /**
   * Search for models
   */
  async searchModels(
    query: string,
    options?: { task?: HuggingFaceTask; limit?: number }
  ): Promise<ModelInfo[]> {
    const params = new URLSearchParams({
      search: query,
      limit: String(options?.limit || 10),
    });

    if (options?.task) {
      params.set('filter', options.task);
    }

    const response = await fetch(`https://huggingface.co/api/models?${params}`, {
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new HuggingFaceError(`Failed to search models: ${response.statusText}`, response.status);
    }

    const data = await response.json() as Array<{
      modelId?: string;
      id?: string;
      author: string;
      downloads?: number;
      likes?: number;
      tags?: string[];
      pipeline_tag?: HuggingFaceTask;
      library_name?: string;
      createdAt: string;
      lastModified: string;
    }>;
    return data.map((m) => ({
      id: m.modelId || m.id || '',
      author: m.author,
      downloads: m.downloads || 0,
      likes: m.likes || 0,
      tags: m.tags || [],
      pipeline_tag: m.pipeline_tag,
      library_name: m.library_name,
      createdAt: new Date(m.createdAt),
      lastModified: new Date(m.lastModified),
    }));
  }

  // --------------------------------------------------------------------------
  // Private Helpers
  // --------------------------------------------------------------------------

  private async request<T>(endpoint: string, payload: unknown): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.config.baseUrl}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.text();

        // Check for model loading
        if (response.status === 503) {
          const errorData = JSON.parse(error);
          if (errorData.error?.includes('loading')) {
            const estimatedTime = errorData.estimated_time || 20;
            throw new ModelLoadingError(
              `Model is loading, estimated time: ${estimatedTime}s`,
              estimatedTime
            );
          }
        }

        throw new HuggingFaceError(
          `Request failed: ${error}`,
          response.status
        );
      }

      return await response.json() as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private formatMessages(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  ): string {
    // Format as Mistral/Llama style
    let formatted = '';
    for (const msg of messages) {
      if (msg.role === 'system') {
        formatted += `<|system|>\n${msg.content}</s>\n`;
      } else if (msg.role === 'user') {
        formatted += `<|user|>\n${msg.content}</s>\n`;
      } else if (msg.role === 'assistant') {
        formatted += `<|assistant|>\n${msg.content}</s>\n`;
      }
    }
    formatted += '<|assistant|>\n';
    return formatted;
  }

  private meanPool(tokenEmbeddings: number[][]): number[] {
    const dims = tokenEmbeddings[0].length;
    const result = new Array(dims).fill(0);
    for (const embedding of tokenEmbeddings) {
      for (let i = 0; i < dims; i++) {
        result[i] += embedding[i];
      }
    }
    for (let i = 0; i < dims; i++) {
      result[i] /= tokenEmbeddings.length;
    }
    return result;
  }

  private normalize(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    if (magnitude === 0) return vector;
    return vector.map((v) => v / magnitude);
  }

  private getFromCache<T>(key: string): T | undefined {
    if (!this.config.useCache) return undefined;
    const cached = this.cache.get(key);
    if (!cached) return undefined;
    if (Date.now() - cached.timestamp > this.cacheMaxAge) {
      this.cache.delete(key);
      return undefined;
    }
    return cached.result as T;
  }

  private setCache(key: string, result: unknown): void {
    if (!this.config.useCache) return;
    this.cache.set(key, { result, timestamp: Date.now() });
  }
}

// ============================================================================
// Errors
// ============================================================================

export class HuggingFaceError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'HuggingFaceError';
  }
}

export class ModelLoadingError extends HuggingFaceError {
  constructor(
    message: string,
    public estimatedTime: number
  ) {
    super(message, 503);
    this.name = 'ModelLoadingError';
  }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a Hugging Face provider
 */
export function createHuggingFaceProvider(config: HuggingFaceConfig): HuggingFaceProvider {
  return new HuggingFaceProvider(config);
}

/**
 * Create Hugging Face embedding provider compatible with VectorMemory
 */
export function createHuggingFaceEmbeddings(config: HuggingFaceConfig & { model?: string }) {
  const hf = createHuggingFaceProvider(config);
  const model = config.model || POPULAR_MODELS.embeddings['all-minilm'];

  return {
    embed: async (texts: string[]): Promise<number[][]> => {
      const result = await hf.embed({ model, texts });
      return result.embeddings;
    },

    embedSingle: async (text: string): Promise<number[]> => {
      const result = await hf.embed({ model, texts: [text] });
      return result.embeddings[0];
    },

    getDimensions: (): number => {
      // Common embedding dimensions
      const dimensionMap: Record<string, number> = {
        'sentence-transformers/all-MiniLM-L6-v2': 384,
        'sentence-transformers/all-mpnet-base-v2': 768,
        'BAAI/bge-large-en-v1.5': 1024,
        'BAAI/bge-small-en-v1.5': 384,
        'intfloat/e5-large-v2': 1024,
        'thenlper/gte-large': 1024,
      };
      return dimensionMap[model] || 768;
    },
  };
}
