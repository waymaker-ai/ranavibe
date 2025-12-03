# RANA Integrations Guide

This guide covers all available integrations in RANA, enabling you to connect AI capabilities with your favorite tools and platforms.

## Table of Contents

1. [Automation Platforms](#automation-platforms)
   - [n8n](#n8n)
   - [Zapier](#zapier)
   - [Make (Integromat)](#make-integromat)
2. [External Memory](#external-memory)
   - [Mem0](#mem0)
   - [Zep](#zep)
3. [No-Code Platforms](#no-code-platforms)
   - [Webflow](#webflow)
   - [Framer](#framer)
4. [Productivity Tools](#productivity-tools)
   - [Airtable](#airtable)
   - [Notion](#notion)
5. [Existing Integrations](#existing-integrations)

---

## Automation Platforms

### n8n

n8n is a workflow automation tool that lets you connect various services together.

#### Installation

```typescript
import { createN8nIntegration } from '@rana/core';

const n8n = createN8nIntegration({
  baseUrl: 'http://localhost:5678', // Your n8n instance
  apiKey: process.env.N8N_API_KEY,
});
```

#### Features

- **Workflow Management**: List, trigger, and manage workflows
- **Custom RANA Nodes**: Pre-built nodes for AI operations
- **Webhook Handling**: Receive and process n8n webhooks
- **Credential Integration**: Secure credential management

#### Example Usage

```typescript
// List all workflows
const workflows = await n8n.listWorkflows();

// Trigger a workflow
const execution = await n8n.triggerWorkflow('workflow-id', {
  data: { message: 'Hello from RANA!' },
  wait: true,
});

// Register webhook handler
n8n.onWebhook('/rana-webhook', async (data, headers) => {
  console.log('Received webhook:', data);
  return { success: true };
});

// Get RANA node definitions for n8n
const nodeDefinitions = n8n.getRanaNodeDefinitions();
```

#### Custom Nodes

RANA provides pre-built n8n nodes:

- **Chat Completion**: Generate AI responses
- **Text Embedding**: Create vector embeddings
- **Agent Execute**: Run RANA agents
- **RAG Query**: Query knowledge bases
- **Summarize**: Summarize text content

---

### Zapier

Connect RANA with 6,000+ apps through Zapier.

#### Installation

```typescript
import { createZapierIntegration } from '@rana/core';

const zapier = createZapierIntegration({
  clientId: process.env.ZAPIER_CLIENT_ID,
  clientSecret: process.env.ZAPIER_CLIENT_SECRET,
});
```

#### Features

- **Triggers**: New chat response, agent completion, RAG results
- **Actions**: Send message, summarize text, classify content, run agent
- **Searches**: Find conversations, search knowledge base
- **OAuth2**: Secure authentication flow

#### Example Usage

```typescript
// Register a trigger handler
zapier.onTrigger('new_chat_response', async (bundle) => {
  const responses = await getRecentResponses(bundle.inputData.since);
  return responses;
});

// Register an action handler
zapier.onAction('send_message', async (bundle) => {
  const response = await rana.chat({
    messages: [{ role: 'user', content: bundle.inputData.message }],
  });
  return { response: response.content };
});

// Get app definition for Zapier CLI
const appDefinition = zapier.getAppDefinition();
```

#### Pre-built Definitions

| Type | Key | Description |
|------|-----|-------------|
| Trigger | `new_chat_response` | Fires on new AI responses |
| Action | `send_message` | Send a message to RANA |
| Action | `summarize_text` | Summarize any text |
| Action | `classify_text` | Classify content into categories |
| Action | `query_rag` | Query knowledge base |
| Action | `run_agent` | Execute a RANA agent |
| Search | `find_conversation` | Search conversation history |

---

### Make (Integromat)

Visual automation platform for complex workflows.

#### Installation

```typescript
import { createMakeIntegration } from '@rana/core';

const make = createMakeIntegration({
  apiKey: process.env.MAKE_API_KEY,
  teamId: 'your-team-id',
  zone: 'us', // or 'eu'
});
```

#### Features

- **Scenario Management**: Create and trigger scenarios
- **RANA Modules**: Pre-built modules for AI operations
- **Webhook Processing**: Handle Make webhooks
- **Blueprint Generation**: Create reusable templates

#### Example Usage

```typescript
// List scenarios
const scenarios = await make.listScenarios();

// Trigger a scenario
const execution = await make.triggerScenario('scenario-id', {
  query: 'What is the weather today?',
});

// Register webhook handler
make.registerWebhook('webhook-id', {
  handler: async (data) => {
    return { processed: true, result: data };
  },
});

// Get RANA module definitions
const modules = make.getRanaModuleDefinitions();
```

#### RANA Modules for Make

- **Chat**: Send messages and receive AI responses
- **Embed**: Generate embeddings for text
- **RAG Query**: Search knowledge bases
- **Summarize**: Generate summaries
- **Classify**: Categorize content
- **Agent**: Execute RANA agents

---

## External Memory

### Mem0

Persistent memory for AI agents using Mem0.

#### Installation

```typescript
import { createMem0Integration, withMemory } from '@rana/core';

const mem0 = createMem0Integration({
  apiKey: process.env.MEM0_API_KEY,
  defaultUserId: 'user-123',
});
```

#### Features

- **Memory CRUD**: Add, search, update, delete memories
- **Conversation Extraction**: Auto-extract memories from chats
- **Context Injection**: Automatically inject relevant memories
- **Memory Types**: Facts, preferences, interactions, context

#### Example Usage

```typescript
// Add a memory
const memory = await mem0.add('User prefers dark mode', {
  userId: 'user-123',
  type: 'preference',
});

// Search memories
const results = await mem0.search('color preferences', {
  userId: 'user-123',
  limit: 5,
});

// Extract memories from conversation
const messages = [
  { role: 'user', content: "I'm a software engineer" },
  { role: 'assistant', content: "That's great! What languages do you work with?" },
];
const extracted = await mem0.addFromConversation(messages, {
  userId: 'user-123',
});

// Get context for LLM
const { context, memories } = await mem0.getContext(messages, {
  userId: 'user-123',
});

// Wrap agent with memory
const memoryAgent = withMemory(agent, mem0, {
  userId: 'user-123',
  injectContext: true,
  extractMemories: true,
});
```

#### Middleware Usage

```typescript
const middleware = mem0.createMiddleware({
  extractMemories: true,
  injectContext: true,
  userId: (ctx) => ctx.userId,
});

// Use with your framework
app.use('/chat', middleware);
```

---

### Zep

Long-term memory store with automatic summarization.

#### Installation

```typescript
import { createZepIntegration, createZepConversation } from '@rana/core';

const zep = createZepIntegration({
  apiKey: process.env.ZEP_API_KEY,
  baseUrl: 'https://api.getzep.com/api/v2',
});
```

#### Features

- **Session Management**: Create and manage conversation sessions
- **Auto-Summarization**: Automatic conversation summaries
- **Fact Extraction**: Extract and store facts about users
- **Semantic Search**: Search across all sessions
- **User Profiles**: Manage user information

#### Example Usage

```typescript
// Create a session
const session = await zep.createSession({
  sessionId: 'session-123',
  userId: 'user-456',
});

// Add messages
await zep.addMemory('session-123', [
  { role: 'user', content: 'My name is Alice' },
  { role: 'assistant', content: 'Nice to meet you, Alice!' },
]);

// Get memory with summary
const memory = await zep.getMemory('session-123', {
  lastN: 10,
});
console.log(memory.summary?.content);
console.log(memory.facts);

// Search across sessions
const results = await zep.searchAll('project deadlines', {
  userId: 'user-456',
  limit: 10,
});

// Get user facts
const facts = await zep.getFacts('user-456');

// Create conversation manager
const conversation = createZepConversation(zep, {
  sessionId: 'session-123',
  systemPrompt: 'You are a helpful assistant.',
});

await conversation.addMessage('user', 'Hello!');
const context = await conversation.getContext();
```

---

## No-Code Platforms

### Webflow

AI-powered content management for Webflow CMS.

#### Installation

```typescript
import { createWebflowIntegration } from '@rana/core';

const webflow = createWebflowIntegration({
  apiToken: process.env.WEBFLOW_API_TOKEN,
  siteId: 'your-site-id',
});
```

#### Features

- **CMS Management**: Full CRUD for CMS items
- **AI Content Generation**: Create content from descriptions
- **Semantic Search**: Search CMS items intelligently
- **Webhook Support**: React to CMS changes
- **Bulk Operations**: Efficient batch operations

#### Example Usage

```typescript
// List collections
const collections = await webflow.listCollections();

// List items
const { items } = await webflow.listItems('collection-id', {
  limit: 50,
});

// Create item from AI description
const item = await webflow.createFromDescription(
  'blog-posts',
  'An article about AI trends in 2024, focusing on LLMs and agents',
  llm
);

// Update item with AI
const updated = await webflow.updateFromInstructions(
  'blog-posts',
  'item-id',
  'Make the title more engaging and add a call to action',
  llm
);

// Semantic search
const results = await webflow.semanticSearch('blog-posts', 'machine learning', {
  limit: 10,
  embedder: myEmbedder,
});

// Publish site
await webflow.publishSite();
```

#### Tool Definitions for Agents

```typescript
const tools = webflow.getToolDefinitions();
// Use with RANA agents for autonomous CMS management
```

---

### Framer

Build AI-powered components and interactions for Framer.

#### Installation

```typescript
import { createFramerIntegration } from '@rana/core';

const framer = createFramerIntegration({
  debug: true,
});
```

#### Features

- **Code Component Generation**: Create Framer components from descriptions
- **Chat Widget**: Pre-built AI chat component
- **Search Component**: AI-powered search widget
- **Override Generation**: Animation and interaction overrides
- **API Route Templates**: Backend integration templates

#### Example Usage

```typescript
// Generate a custom component
const component = framer.generateComponent({
  name: 'FeatureCard',
  description: 'A card displaying a feature with icon, title, and description',
  props: [
    { name: 'icon', type: 'string', required: true },
    { name: 'title', type: 'string', required: true },
    { name: 'description', type: 'string' },
    { name: 'accentColor', type: 'color', defaultValue: '#6366f1' },
  ],
  hasAnimation: true,
  isResponsive: true,
});

// Generate AI chat widget
const chatWidget = framer.generateChatComponent({
  name: 'SupportChat',
  endpoint: '/api/chat',
  streamingEnabled: true,
  theme: 'auto',
});

// Generate search component
const search = framer.generateSearchComponent({
  endpoint: '/api/search',
  semanticSearch: true,
});

// Generate animation override
const hoverEffect = framer.generateOverride({
  name: 'withHover',
  description: 'Scale up on hover',
  animationType: 'hover',
  motion: { type: 'spring', stiffness: 400, damping: 10 },
});

// Get API route handler
const chatHandler = framer.generateAPIHandler({
  type: 'chat',
  ranaConfig: { model: 'gpt-4' },
});
```

---

## Productivity Tools

### Airtable

AI-powered database operations with Airtable.

#### Installation

```typescript
import { createAirtableIntegration } from '@rana/core';

const airtable = createAirtableIntegration({
  apiKey: process.env.AIRTABLE_API_KEY,
  baseId: 'appXXXXXXXXXXXXXX',
});
```

#### Features

- **Record CRUD**: Full record management
- **Natural Language Queries**: Query with plain English
- **AI Record Creation**: Create records from descriptions
- **Formula Builder**: Build filter formulas programmatically
- **Bulk Operations**: Efficient batch updates

#### Example Usage

```typescript
// List records
const { records } = await airtable.listRecords('Tasks', {
  filterByFormula: '{Status} = "In Progress"',
  sort: [{ field: 'Due Date', direction: 'asc' }],
});

// Create record
const record = await airtable.createRecord('Tasks', {
  fields: {
    Name: 'Review PR',
    Status: 'To Do',
    'Due Date': '2024-03-15',
    Priority: 'High',
  },
});

// Natural language query
const results = await airtable.queryNatural(
  'Tasks',
  'Find all high priority tasks due this week that are not completed',
  llm
);

// Create from description
const newRecord = await airtable.createFromDescription(
  'Contacts',
  'Add John Smith from Acme Corp, his email is john@acme.com',
  llm
);

// Build formula
const formula = airtable.buildFormula([
  { field: 'Status', operator: '!=', value: 'Done' },
  { field: 'Priority', operator: '=', value: 'High' },
], 'AND');
```

#### Tool Definitions for Agents

```typescript
const tools = airtable.getToolDefinitions();
// Available tools:
// - airtable_list_records
// - airtable_create_record
// - airtable_update_record
// - airtable_delete_record
// - airtable_search
```

---

### Notion

AI-powered knowledge management with Notion.

#### Installation

```typescript
import { createNotionIntegration } from '@rana/core';

const notion = createNotionIntegration({
  apiKey: process.env.NOTION_API_KEY,
});
```

#### Features

- **Page & Database Management**: Full CRUD operations
- **Content Blocks**: Create rich content programmatically
- **Natural Language Search**: Search pages semantically
- **AI Content Generation**: Generate page content from outlines
- **Block Helpers**: Easy block creation utilities

#### Example Usage

```typescript
// Search pages
const results = await notion.search({
  query: 'meeting notes',
  filter: { value: 'page', property: 'object' },
});

// Query database
const { results: pages } = await notion.queryDatabase('database-id', {
  filter: {
    property: 'Status',
    select: { equals: 'In Progress' },
  },
  sorts: [{ property: 'Priority', direction: 'descending' }],
});

// Create page
const page = await notion.createPage({
  parent: { database_id: 'database-id' },
  properties: {
    Title: { title: [{ text: { content: 'New Project' } }] },
    Status: { select: { name: 'Planning' } },
  },
  children: [
    notion.createHeading('Overview', 1),
    notion.createParagraph('This is the project overview.'),
    notion.createBulletedListItem('First objective'),
    notion.createBulletedListItem('Second objective'),
  ],
});

// Generate content from outline
const blocks = await notion.generatePageContent(
  `# Meeting Notes
  - Discussed Q1 goals
  - Assigned action items
  - Next meeting: Friday`,
  llm
);

// Create page from description
const newPage = await notion.createPageFromDescription(
  'database-id',
  'Create a task for reviewing the marketing proposal, due next Monday, high priority',
  llm
);
```

#### Content Helpers

```typescript
// Rich text
const text = notion.createRichText('Hello', {
  bold: true,
  color: 'blue',
});

// Blocks
const heading = notion.createHeading('Title', 1);
const paragraph = notion.createParagraph('Content');
const bullet = notion.createBulletedListItem('Item');
const todo = notion.createToDo('Task', false);
const code = notion.createCodeBlock('console.log("hi")', 'javascript');
const callout = notion.createCallout('Important note!', '💡');
const quote = notion.createQuote('Famous quote');
const divider = notion.createDivider();
```

---

## Existing Integrations

RANA also includes these pre-built integrations:

### Hugging Face
Model inference and embeddings from Hugging Face.

```typescript
import { createHuggingFaceProvider } from '@rana/core';
```

### Vercel
Deploy and manage Vercel projects.

```typescript
import { createVercelClient } from '@rana/core';
```

### Supabase
Vector storage with Supabase pgvector.

```typescript
import { createSupabaseVectorStore } from '@rana/core';
```

### Weights & Biases
Experiment tracking and logging.

```typescript
import { createWandbTracker } from '@rana/core';
```

### Sentry
Error tracking and performance monitoring.

```typescript
import { createSentryIntegration } from '@rana/core';
```

---

## Best Practices

### Error Handling

All integrations throw typed errors:

```typescript
try {
  await notion.createPage(options);
} catch (error) {
  if (error instanceof NotionError) {
    console.error(`Notion error: ${error.code} - ${error.message}`);
  }
}
```

### Rate Limiting

Integrations handle rate limits internally, but you can add delays:

```typescript
for (const item of items) {
  await airtable.createRecord('Table', { fields: item });
  await sleep(100); // Add delay between requests
}
```

### Event Handling

Subscribe to integration events:

```typescript
notion.on('page:created', (page) => {
  console.log('Created page:', page.id);
});

airtable.on('record:updated', (data) => {
  console.log('Updated record in:', data.table);
});
```

### Middleware Pattern

Use middleware for automatic processing:

```typescript
const mem0Middleware = mem0.createMiddleware({
  extractMemories: true,
  injectContext: true,
});

app.post('/chat', mem0Middleware, handleChat);
```

---

## Contributing

To add a new integration:

1. Create a new file in `packages/core/src/integrations/`
2. Follow the existing patterns for types, errors, and event handling
3. Export from `packages/core/src/integrations/index.ts`
4. Add documentation to this guide
5. Add examples to `examples/`

For questions or issues, open a GitHub issue.
