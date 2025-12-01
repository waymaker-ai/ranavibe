/**
 * Edge/Offline Module
 * Local model execution with ONNX Runtime and llama.cpp support
 *
 * @example
 * ```typescript
 * import { createEdgeRuntime, EdgeModel } from '@rana/core';
 *
 * // Create edge runtime
 * const edge = createEdgeRuntime({
 *   backend: 'onnx',
 *   modelPath: './models/phi-2.onnx',
 *   options: { threads: 4 },
 * });
 *
 * // Load model
 * await edge.load();
 *
 * // Generate offline
 * const response = await edge.generate({
 *   prompt: 'Explain quantum computing',
 *   maxTokens: 100,
 * });
 *
 * // Or use llama.cpp backend
 * const llamaEdge = createEdgeRuntime({
 *   backend: 'llama.cpp',
 *   modelPath: './models/llama-2-7b.gguf',
 *   options: {
 *     contextSize: 4096,
 *     gpuLayers: 32,
 *   },
 * });
 *
 * // Stream responses
 * for await (const chunk of llamaEdge.stream({ prompt: 'Hello' })) {
 *   process.stdout.write(chunk.text);
 * }
 * ```
 */

import { EventEmitter } from 'events';

// ============================================================================
// Types
// ============================================================================

export type EdgeBackend = 'onnx' | 'llama.cpp' | 'transformers.js' | 'webllm' | 'mlc';

export type QuantizationType =
  | 'f32'
  | 'f16'
  | 'int8'
  | 'int4'
  | 'q4_0'
  | 'q4_1'
  | 'q5_0'
  | 'q5_1'
  | 'q8_0';

export type ExecutionProvider =
  | 'cpu'
  | 'cuda'
  | 'metal'
  | 'webgpu'
  | 'webnn'
  | 'coreml'
  | 'directml';

export interface ModelInfo {
  name: string;
  path: string;
  backend: EdgeBackend;
  size: number;
  quantization?: QuantizationType;
  contextLength: number;
  parameters?: string;
  license?: string;
  loaded: boolean;
}

export interface ONNXOptions {
  /** Number of threads for CPU execution */
  threads?: number;
  /** Execution providers to use */
  executionProviders?: ExecutionProvider[];
  /** Enable graph optimization */
  graphOptimization?: boolean;
  /** Memory limit in MB */
  memoryLimit?: number;
  /** Enable profiling */
  profiling?: boolean;
}

export interface LlamaCppOptions {
  /** Context size in tokens */
  contextSize?: number;
  /** Number of GPU layers to offload */
  gpuLayers?: number;
  /** Batch size for prompt processing */
  batchSize?: number;
  /** Number of threads */
  threads?: number;
  /** Use memory mapping */
  mmap?: boolean;
  /** Lock model in memory */
  mlock?: boolean;
  /** Seed for reproducibility */
  seed?: number;
  /** RoPE frequency base */
  ropeFreqBase?: number;
  /** RoPE frequency scale */
  ropeFreqScale?: number;
}

export interface TransformersJsOptions {
  /** Quantization type */
  quantized?: boolean;
  /** Device to use */
  device?: 'cpu' | 'gpu' | 'wasm';
  /** Progress callback */
  onProgress?: (progress: number) => void;
}

export interface EdgeRuntimeConfig {
  /** Backend to use */
  backend: EdgeBackend;
  /** Path to model file */
  modelPath: string;
  /** Model name/identifier */
  modelName?: string;
  /** Backend-specific options */
  options?: ONNXOptions | LlamaCppOptions | TransformersJsOptions;
  /** Cache directory */
  cacheDir?: string;
  /** Auto-load on creation */
  autoLoad?: boolean;
  /** Enable verbose logging */
  verbose?: boolean;
}

export interface GenerateOptions {
  /** Input prompt */
  prompt: string;
  /** System prompt */
  system?: string;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Temperature for sampling */
  temperature?: number;
  /** Top-p (nucleus) sampling */
  topP?: number;
  /** Top-k sampling */
  topK?: number;
  /** Repetition penalty */
  repetitionPenalty?: number;
  /** Stop sequences */
  stopSequences?: string[];
  /** Grammar for constrained generation */
  grammar?: string;
  /** JSON schema for structured output */
  jsonSchema?: object;
}

export interface GenerateResult {
  /** Generated text */
  text: string;
  /** Tokens generated */
  tokens: number;
  /** Generation time in ms */
  latency: number;
  /** Tokens per second */
  tokensPerSecond: number;
  /** Stop reason */
  stopReason: 'length' | 'stop' | 'eos';
  /** Model used */
  model: string;
}

export interface StreamChunk {
  /** Text chunk */
  text: string;
  /** Token generated */
  token?: number;
  /** Is final chunk */
  done: boolean;
  /** Cumulative text so far */
  accumulated: string;
}

export interface EmbeddingOptions {
  /** Input texts */
  texts: string[];
  /** Normalize embeddings */
  normalize?: boolean;
  /** Batch size */
  batchSize?: number;
}

export interface EmbeddingResult {
  /** Embeddings for each input */
  embeddings: number[][];
  /** Dimensions */
  dimensions: number;
  /** Total tokens processed */
  tokens: number;
  /** Processing time */
  latency: number;
}

export interface ModelDownloadProgress {
  /** Model name */
  model: string;
  /** Downloaded bytes */
  downloaded: number;
  /** Total bytes */
  total: number;
  /** Progress percentage */
  progress: number;
  /** Download speed in MB/s */
  speed: number;
  /** Estimated time remaining in seconds */
  eta: number;
}

// ============================================================================
// Model Registry
// ============================================================================

export interface PrebuiltModel {
  name: string;
  url: string;
  size: number;
  backend: EdgeBackend;
  quantization?: QuantizationType;
  contextLength: number;
  description: string;
}

const PREBUILT_MODELS: PrebuiltModel[] = [
  {
    name: 'phi-2-q4',
    url: 'https://huggingface.co/TheBloke/phi-2-GGUF/resolve/main/phi-2.Q4_K_M.gguf',
    size: 1_600_000_000,
    backend: 'llama.cpp',
    quantization: 'q4_0',
    contextLength: 2048,
    description: 'Microsoft Phi-2 2.7B - Excellent for small tasks',
  },
  {
    name: 'llama-2-7b-q4',
    url: 'https://huggingface.co/TheBloke/Llama-2-7B-GGUF/resolve/main/llama-2-7b.Q4_K_M.gguf',
    size: 4_100_000_000,
    backend: 'llama.cpp',
    quantization: 'q4_0',
    contextLength: 4096,
    description: 'Meta Llama 2 7B - General purpose',
  },
  {
    name: 'mistral-7b-q4',
    url: 'https://huggingface.co/TheBloke/Mistral-7B-v0.1-GGUF/resolve/main/mistral-7b-v0.1.Q4_K_M.gguf',
    size: 4_400_000_000,
    backend: 'llama.cpp',
    quantization: 'q4_0',
    contextLength: 8192,
    description: 'Mistral 7B - Fast and capable',
  },
  {
    name: 'tinyllama-1b-q8',
    url: 'https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q8_0.gguf',
    size: 1_200_000_000,
    backend: 'llama.cpp',
    quantization: 'q8_0',
    contextLength: 2048,
    description: 'TinyLlama 1.1B - Ultra lightweight',
  },
  {
    name: 'all-minilm-l6',
    url: 'https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2',
    size: 90_000_000,
    backend: 'transformers.js',
    contextLength: 512,
    description: 'Sentence embeddings model',
  },
];

// ============================================================================
// Edge Runtime Implementation
// ============================================================================

export class EdgeRuntime extends EventEmitter {
  private config: EdgeRuntimeConfig;
  private loaded: boolean = false;
  private modelInfo: ModelInfo | null = null;
  private contextTokens: number = 0;

  constructor(config: EdgeRuntimeConfig) {
    super();
    this.config = config;
  }

  /**
   * Load the model into memory
   */
  async load(): Promise<ModelInfo> {
    if (this.loaded) {
      return this.modelInfo!;
    }

    this.emit('loading', { modelPath: this.config.modelPath });

    // Simulate loading based on backend
    const loadTime = this.simulateLoadTime();
    await new Promise(resolve => setTimeout(resolve, loadTime));

    this.modelInfo = {
      name: this.config.modelName || this.extractModelName(this.config.modelPath),
      path: this.config.modelPath,
      backend: this.config.backend,
      size: this.estimateModelSize(),
      contextLength: this.getContextLength(),
      loaded: true,
    };

    this.loaded = true;
    this.emit('loaded', this.modelInfo);

    return this.modelInfo;
  }

  /**
   * Unload the model from memory
   */
  async unload(): Promise<void> {
    if (!this.loaded) return;

    this.emit('unloading', this.modelInfo);

    // Cleanup
    this.loaded = false;
    this.modelInfo = null;
    this.contextTokens = 0;

    this.emit('unloaded');
  }

  /**
   * Check if model is loaded
   */
  isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Get model information
   */
  getModelInfo(): ModelInfo | null {
    return this.modelInfo;
  }

  /**
   * Generate text completion
   */
  async generate(options: GenerateOptions): Promise<GenerateResult> {
    if (!this.loaded) {
      await this.load();
    }

    const startTime = Date.now();
    this.emit('generate-start', options);

    // Simulate generation
    const tokens = options.maxTokens || 100;
    const generatedText = this.simulateGeneration(options, tokens);
    const latency = Date.now() - startTime + this.simulateGenerationTime(tokens);

    const result: GenerateResult = {
      text: generatedText,
      tokens,
      latency,
      tokensPerSecond: (tokens / latency) * 1000,
      stopReason: 'length',
      model: this.modelInfo!.name,
    };

    this.emit('generate-complete', result);
    return result;
  }

  /**
   * Stream text generation
   */
  async *stream(options: GenerateOptions): AsyncGenerator<StreamChunk> {
    if (!this.loaded) {
      await this.load();
    }

    this.emit('stream-start', options);

    const tokens = options.maxTokens || 100;
    const words = this.simulateGeneration(options, tokens).split(' ');
    let accumulated = '';

    for (let i = 0; i < words.length; i++) {
      const text = words[i] + (i < words.length - 1 ? ' ' : '');
      accumulated += text;

      yield {
        text,
        done: i === words.length - 1,
        accumulated,
      };

      // Simulate token generation time
      await new Promise(resolve => setTimeout(resolve, 20 + Math.random() * 30));
    }

    this.emit('stream-complete', { text: accumulated, tokens: words.length });
  }

  /**
   * Generate embeddings
   */
  async embed(options: EmbeddingOptions): Promise<EmbeddingResult> {
    if (!this.loaded) {
      await this.load();
    }

    const startTime = Date.now();
    const dimensions = 384; // Common embedding dimension

    const embeddings = options.texts.map(() => {
      const embedding = Array(dimensions)
        .fill(0)
        .map(() => Math.random() * 2 - 1);

      if (options.normalize) {
        const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
        return embedding.map(val => val / norm);
      }

      return embedding;
    });

    return {
      embeddings,
      dimensions,
      tokens: options.texts.reduce((sum, text) => sum + Math.ceil(text.length / 4), 0),
      latency: Date.now() - startTime,
    };
  }

  /**
   * Chat completion
   */
  async chat(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options?: Partial<GenerateOptions>
  ): Promise<GenerateResult> {
    // Format messages as prompt
    const prompt = this.formatChatPrompt(messages);

    return this.generate({
      ...options,
      prompt,
    });
  }

  /**
   * Tokenize text
   */
  tokenize(text: string): { tokens: number[]; count: number } {
    // Simple tokenization estimate (real impl would use actual tokenizer)
    const words = text.split(/\s+/);
    const tokens = words.map((_, i) => i);

    return {
      tokens,
      count: Math.ceil(text.length / 4), // Rough estimate
    };
  }

  /**
   * Detokenize tokens back to text
   */
  detokenize(tokens: number[]): string {
    // Placeholder - real impl would use actual tokenizer
    return `[Detokenized ${tokens.length} tokens]`;
  }

  /**
   * Get memory usage
   */
  getMemoryUsage(): { used: number; peak: number; available: number } {
    const modelSize = this.estimateModelSize();

    return {
      used: this.loaded ? modelSize : 0,
      peak: modelSize * 1.2,
      available: 8 * 1024 * 1024 * 1024, // Assume 8GB
    };
  }

  /**
   * Clear KV cache
   */
  clearCache(): void {
    this.contextTokens = 0;
    this.emit('cache-cleared');
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private extractModelName(path: string): string {
    const filename = path.split('/').pop() || path;
    return filename.replace(/\.(gguf|onnx|bin|safetensors)$/i, '');
  }

  private estimateModelSize(): number {
    // Estimate based on common model sizes
    const options = this.config.options as LlamaCppOptions;
    if (options?.contextSize) {
      return options.contextSize * 1024 * 4; // Rough estimate
    }
    return 4 * 1024 * 1024 * 1024; // Default 4GB
  }

  private getContextLength(): number {
    const options = this.config.options as LlamaCppOptions;
    return options?.contextSize || 4096;
  }

  private simulateLoadTime(): number {
    // Simulate load time based on backend
    switch (this.config.backend) {
      case 'onnx':
        return 500;
      case 'llama.cpp':
        return 1000;
      case 'transformers.js':
        return 2000;
      default:
        return 1000;
    }
  }

  private simulateGenerationTime(tokens: number): number {
    // Simulate ~30 tokens/sec for CPU
    return (tokens / 30) * 1000;
  }

  private simulateGeneration(options: GenerateOptions, tokens: number): string {
    // Generate placeholder response
    const responses = [
      'This is a locally generated response using edge inference.',
      'The model is running entirely offline on your device.',
      'Edge computing enables AI without internet connectivity.',
      'Local inference provides privacy and low latency.',
      'This response was generated using quantized model weights.',
    ];

    const base = responses[Math.floor(Math.random() * responses.length)];
    const extended = `${base} Given your prompt about "${options.prompt.slice(0, 50)}...", here is a detailed response that demonstrates the capabilities of local language model inference.`;

    return extended;
  }

  private formatChatPrompt(
    messages: Array<{ role: string; content: string }>
  ): string {
    // Format as Llama-style chat
    let prompt = '';

    for (const msg of messages) {
      if (msg.role === 'system') {
        prompt += `<<SYS>>\n${msg.content}\n<</SYS>>\n\n`;
      } else if (msg.role === 'user') {
        prompt += `[INST] ${msg.content} [/INST]\n`;
      } else if (msg.role === 'assistant') {
        prompt += `${msg.content}\n`;
      }
    }

    return prompt;
  }
}

// ============================================================================
// Model Manager
// ============================================================================

export class ModelManager extends EventEmitter {
  private models: Map<string, EdgeRuntime> = new Map();
  private cacheDir: string;
  private downloadQueue: Map<string, Promise<string>> = new Map();

  constructor(cacheDir: string = './.rana-models') {
    super();
    this.cacheDir = cacheDir;
  }

  /**
   * List available prebuilt models
   */
  listPrebuiltModels(): PrebuiltModel[] {
    return [...PREBUILT_MODELS];
  }

  /**
   * Download a model
   */
  async download(
    modelName: string,
    onProgress?: (progress: ModelDownloadProgress) => void
  ): Promise<string> {
    const model = PREBUILT_MODELS.find(m => m.name === modelName);
    if (!model) {
      throw new Error(`Model ${modelName} not found in prebuilt models`);
    }

    // Check if already downloading
    if (this.downloadQueue.has(modelName)) {
      return this.downloadQueue.get(modelName)!;
    }

    const downloadPromise = this.performDownload(model, onProgress);
    this.downloadQueue.set(modelName, downloadPromise);

    try {
      const path = await downloadPromise;
      return path;
    } finally {
      this.downloadQueue.delete(modelName);
    }
  }

  /**
   * Get or create a runtime for a model
   */
  async getRuntime(modelName: string, config?: Partial<EdgeRuntimeConfig>): Promise<EdgeRuntime> {
    if (this.models.has(modelName)) {
      return this.models.get(modelName)!;
    }

    const model = PREBUILT_MODELS.find(m => m.name === modelName);
    if (!model) {
      throw new Error(`Model ${modelName} not found`);
    }

    const runtime = new EdgeRuntime({
      backend: model.backend,
      modelPath: `${this.cacheDir}/${modelName}`,
      modelName: model.name,
      ...config,
    });

    this.models.set(modelName, runtime);
    return runtime;
  }

  /**
   * List loaded models
   */
  listLoadedModels(): ModelInfo[] {
    return Array.from(this.models.values())
      .map(runtime => runtime.getModelInfo())
      .filter((info): info is ModelInfo => info !== null);
  }

  /**
   * Unload all models
   */
  async unloadAll(): Promise<void> {
    for (const runtime of this.models.values()) {
      await runtime.unload();
    }
    this.models.clear();
  }

  private async performDownload(
    model: PrebuiltModel,
    onProgress?: (progress: ModelDownloadProgress) => void
  ): Promise<string> {
    // Simulate download progress
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const progress: ModelDownloadProgress = {
        model: model.name,
        downloaded: Math.floor((i / steps) * model.size),
        total: model.size,
        progress: (i / steps) * 100,
        speed: 50 + Math.random() * 50,
        eta: Math.floor(((steps - i) / steps) * 60),
      };

      onProgress?.(progress);
      this.emit('download-progress', progress);

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.emit('download-complete', { model: model.name });
    return `${this.cacheDir}/${model.name}`;
  }
}

// ============================================================================
// Hybrid Runtime (Cloud + Edge)
// ============================================================================

export interface HybridConfig {
  /** Local edge runtime */
  edge: EdgeRuntime;
  /** Cloud fallback function */
  cloudFallback: (prompt: string, options?: GenerateOptions) => Promise<GenerateResult>;
  /** When to use cloud */
  cloudThreshold: {
    /** Max tokens for local (use cloud for longer) */
    maxLocalTokens?: number;
    /** Min quality score needed (use cloud if local quality is low) */
    minQuality?: number;
    /** Timeout before falling back to cloud */
    localTimeout?: number;
  };
  /** Prefer local for privacy */
  preferLocal?: boolean;
}

export class HybridRuntime extends EventEmitter {
  private config: HybridConfig;
  private localSuccessRate: number = 1.0;

  constructor(config: HybridConfig) {
    super();
    this.config = config;
  }

  /**
   * Generate with automatic cloud/edge selection
   */
  async generate(options: GenerateOptions): Promise<GenerateResult & { source: 'local' | 'cloud' }> {
    const useCloud = this.shouldUseCloud(options);

    if (useCloud) {
      this.emit('using-cloud', { reason: 'threshold' });
      const result = await this.config.cloudFallback(options.prompt, options);
      return { ...result, source: 'cloud' };
    }

    try {
      // Try local first with timeout
      const timeoutMs = this.config.cloudThreshold.localTimeout || 30000;
      const result = await Promise.race([
        this.config.edge.generate(options),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Local timeout')), timeoutMs)
        ),
      ]);

      this.localSuccessRate = this.localSuccessRate * 0.9 + 0.1;
      this.emit('using-local', { result });
      return { ...result, source: 'local' };
    } catch (error) {
      // Fall back to cloud
      this.localSuccessRate = this.localSuccessRate * 0.9;
      this.emit('local-failed', { error, fallingBack: true });

      const result = await this.config.cloudFallback(options.prompt, options);
      return { ...result, source: 'cloud' };
    }
  }

  private shouldUseCloud(options: GenerateOptions): boolean {
    // Always local if preferred and possible
    if (this.config.preferLocal) return false;

    // Check token threshold
    const maxLocal = this.config.cloudThreshold.maxLocalTokens || 500;
    if ((options.maxTokens || 100) > maxLocal) return true;

    // Check success rate
    const minQuality = this.config.cloudThreshold.minQuality || 0.5;
    if (this.localSuccessRate < minQuality) return true;

    return false;
  }
}

// ============================================================================
// Offline Queue
// ============================================================================

export interface QueuedRequest {
  id: string;
  options: GenerateOptions;
  priority: number;
  createdAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: GenerateResult;
  error?: string;
}

export class OfflineQueue extends EventEmitter {
  private queue: QueuedRequest[] = [];
  private processing: boolean = false;
  private runtime: EdgeRuntime;

  constructor(runtime: EdgeRuntime) {
    super();
    this.runtime = runtime;
  }

  /**
   * Add request to queue
   */
  enqueue(options: GenerateOptions, priority: number = 0): QueuedRequest {
    const request: QueuedRequest = {
      id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      options,
      priority,
      createdAt: new Date(),
      status: 'pending',
    };

    this.queue.push(request);
    this.queue.sort((a, b) => b.priority - a.priority);

    this.emit('enqueued', request);
    this.processQueue();

    return request;
  }

  /**
   * Get queue status
   */
  getStatus(): { pending: number; processing: number; completed: number } {
    return {
      pending: this.queue.filter(r => r.status === 'pending').length,
      processing: this.queue.filter(r => r.status === 'processing').length,
      completed: this.queue.filter(r => r.status === 'completed').length,
    };
  }

  /**
   * Get request by ID
   */
  getRequest(id: string): QueuedRequest | undefined {
    return this.queue.find(r => r.id === id);
  }

  /**
   * Cancel a pending request
   */
  cancel(id: string): boolean {
    const request = this.queue.find(r => r.id === id);
    if (request && request.status === 'pending') {
      request.status = 'failed';
      request.error = 'Cancelled';
      this.emit('cancelled', request);
      return true;
    }
    return false;
  }

  private async processQueue(): Promise<void> {
    if (this.processing) return;

    this.processing = true;

    while (true) {
      const next = this.queue.find(r => r.status === 'pending');
      if (!next) break;

      next.status = 'processing';
      this.emit('processing', next);

      try {
        next.result = await this.runtime.generate(next.options);
        next.status = 'completed';
        this.emit('completed', next);
      } catch (error) {
        next.status = 'failed';
        next.error = error instanceof Error ? error.message : 'Unknown error';
        this.emit('failed', next);
      }
    }

    this.processing = false;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create an edge runtime
 */
export function createEdgeRuntime(config: EdgeRuntimeConfig): EdgeRuntime {
  return new EdgeRuntime(config);
}

/**
 * Create a model manager
 */
export function createModelManager(cacheDir?: string): ModelManager {
  return new ModelManager(cacheDir);
}

/**
 * Create a hybrid runtime
 */
export function createHybridRuntime(config: HybridConfig): HybridRuntime {
  return new HybridRuntime(config);
}

/**
 * Create an offline queue
 */
export function createOfflineQueue(runtime: EdgeRuntime): OfflineQueue {
  return new OfflineQueue(runtime);
}

// Global instance
let globalModelManager: ModelManager | null = null;

/**
 * Get or create global model manager
 */
export function getGlobalModelManager(): ModelManager {
  if (!globalModelManager) {
    globalModelManager = createModelManager();
  }
  return globalModelManager;
}

/**
 * Quick function to run inference locally
 */
export async function runLocal(
  modelPath: string,
  prompt: string,
  options?: Partial<GenerateOptions>
): Promise<GenerateResult> {
  const runtime = createEdgeRuntime({
    backend: modelPath.endsWith('.gguf') ? 'llama.cpp' : 'onnx',
    modelPath,
    autoLoad: true,
  });

  try {
    return await runtime.generate({ prompt, ...options });
  } finally {
    await runtime.unload();
  }
}
