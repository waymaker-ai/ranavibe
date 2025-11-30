/**
 * @rana/integrations
 * Third-party service integrations for RANA
 */

// Hugging Face
export {
  HuggingFaceProvider,
  HuggingFaceError,
  ModelLoadingError,
  createHuggingFaceProvider,
  createHuggingFaceEmbeddings,
  POPULAR_MODELS,
} from './huggingface';
export type {
  HuggingFaceTask,
  HuggingFaceConfig,
  GenerationOptions,
  EmbeddingOptions,
  ClassificationOptions,
  SummarizationOptions,
  QAOptions,
  TranslationOptions,
  GenerationResult,
  EmbeddingResult,
  ClassificationResult,
  SummarizationResult,
  QAResult,
  TranslationResult,
  StreamChunk,
  ModelInfo,
} from './huggingface';

// Vercel
export {
  VercelClient,
  VercelError,
  createVercelClient,
  createVercelConfig,
  createRanaVercelConfig,
  deployToVercel,
  getDeployButton,
  generateDeployReadme,
} from './vercel';
export type {
  VercelFramework,
  VercelRegion,
  VercelConfigOptions,
  VercelJson,
  CronJob,
  Rewrite,
  Redirect,
  Header,
  GitSettings,
  VercelDeployOptions,
  Deployment,
  DeploymentStatus,
  BuildLog,
  Project,
  Domain,
} from './vercel';

// Supabase
export {
  SupabaseVectorStore,
  SupabaseVectorError,
  createSupabaseVectorStore,
  createAndInitSupabaseVectorStore,
  getSupabaseSetupSQL,
} from './supabase';
export type {
  SupabaseConfig,
  EmbeddingProvider,
  Document,
  SearchOptions,
  HybridSearchOptions,
  SearchResult,
  SupabaseVectorStats,
} from './supabase';

// Weights & Biases
export {
  WandbTracker,
  WandbRun,
  WandbError,
  createWandbTracker,
  createRanaWandbMiddleware,
  withExperiment,
} from './wandb';
export type {
  WandbConfig,
  RunConfig,
  LogData,
  PromptVersion,
  TableData,
  ImageData,
  RunSummary,
  Artifact,
  RanaWandbMiddleware,
} from './wandb';

// Sentry
export {
  SentryIntegration,
  createSentryIntegration,
  initSentry,
  withSentry,
} from './sentry';
export type {
  SentryConfig,
  SentryLevel,
  SentryEvent,
  SentryUser,
  Breadcrumb,
  CaptureOptions,
  Transaction,
  Span,
  LLMContext,
} from './sentry';
