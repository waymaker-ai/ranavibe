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

// n8n
export {
  N8nIntegration,
  createN8nIntegration,
} from './n8n';
export type {
  N8nConfig,
  N8nWorkflow,
  N8nExecution,
  N8nNode,
  N8nCredential,
  TriggerWorkflowOptions,
  WebhookHandler as N8nWebhookHandler,
} from './n8n';

// Zapier
export {
  ZapierIntegration,
  createZapierIntegration,
} from './zapier';
export type {
  ZapierConfig,
  ZapierTrigger,
  ZapierAction,
  ZapierSearch,
  ZapierField,
  ZapierContext,
  ZapierBundle,
  ZapierWebhookPayload,
} from './zapier';

// Make (Integromat)
export {
  MakeIntegration,
  createMakeIntegration,
} from './make';
export type {
  MakeConfig,
  MakeScenario,
  MakeExecution,
  MakeModule,
  MakeWebhook,
  MakeBlueprint,
  MakeConnection,
  WebhookHandlerConfig as MakeWebhookHandlerConfig,
} from './make';

// Mem0 (External Memory)
export {
  Mem0Integration,
  Mem0Error,
  createMem0Integration,
  withMemory,
} from './mem0';
export type {
  Mem0Config,
  Memory,
  AddMemoryOptions,
  SearchMemoryOptions,
  MemoryUpdate,
  ConversationMessage,
  MemoryStats,
} from './mem0';

// Zep (Long-term Memory)
export {
  ZepIntegration,
  ZepError,
  createZepIntegration,
  createZepConversation,
} from './zep';
export type {
  ZepConfig,
  ZepUser,
  ZepSession,
  ZepMessage,
  ZepMemory,
  ZepSummary,
  ZepSearchResult,
  ZepFact,
  AddMessagesOptions,
  SearchOptions as ZepSearchOptions,
  GetMemoryOptions,
} from './zep';

// Webflow CMS
export {
  WebflowIntegration,
  WebflowError,
  createWebflowIntegration,
} from './webflow';
export type {
  WebflowConfig,
  WebflowSite,
  WebflowCollection,
  WebflowField,
  WebflowItem,
  WebflowWebhook,
  CreateItemData,
  UpdateItemData,
  ListItemsOptions,
  PublishOptions,
} from './webflow';

// Framer
export {
  FramerIntegration,
  FramerError,
  createFramerIntegration,
} from './framer';
export type {
  FramerConfig,
  FramerProject,
  FramerPage,
  FramerCMSCollection,
  FramerCMSField,
  FramerCMSItem,
  FramerCodeComponent,
  FramerPropDefinition,
  FramerOverride,
  FramerMotionConfig,
} from './framer';

// Airtable
export {
  AirtableIntegration,
  AirtableError,
  createAirtableIntegration,
} from './airtable';
export type {
  AirtableConfig,
  AirtableBase,
  AirtableTable,
  AirtableField,
  AirtableView,
  AirtableRecord,
  ListRecordsOptions,
  CreateRecordData,
  UpdateRecordData,
} from './airtable';

// Notion
export {
  NotionIntegration,
  NotionError,
  createNotionIntegration,
} from './notion';
export type {
  NotionConfig,
  NotionUser,
  NotionDatabase,
  NotionPage,
  NotionBlock,
  NotionRichText,
  NotionPropertySchema,
  NotionPropertyValue,
  QueryDatabaseOptions,
  NotionFilter,
  NotionSort,
  SearchOptions as NotionSearchOptions,
  CreatePageOptions,
  UpdatePageOptions,
} from './notion';
