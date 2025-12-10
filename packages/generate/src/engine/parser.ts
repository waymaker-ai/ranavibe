import {
  ParsedIntent,
  ParsedIntentSchema,
  Framework,
  Entity,
  Action,
  Constraint,
  Integration,
} from '../types';

// ============================================================================
// Intent Parser - Extracts structured requirements from natural language
// ============================================================================

export interface ParserConfig {
  llmProvider?: LLMProviderInterface;
  defaultFramework?: Framework;
  strictMode?: boolean;
}

export interface LLMProviderInterface {
  complete(prompt: string): Promise<string>;
}

const INTENT_EXTRACTION_PROMPT = `You are an expert software architect. Extract structured requirements from the following natural language description.

DESCRIPTION:
"{description}"

Analyze the description and extract:
1. feature - A concise name for the feature (e.g., "User Authentication", "Product Catalog")
2. entities - Data models/objects mentioned (with fields and relations)
3. actions - Operations to be performed (CRUD, auth, payment, etc.)
4. constraints - Security, performance, UX requirements
5. framework - Target framework (react, next, express, fastify, node)
6. integrations - External services needed (stripe, aws, google, etc.)
7. tags - Relevant keywords for categorization

Output ONLY valid JSON matching this schema:
{
  "feature": "string",
  "description": "string (expanded description)",
  "entities": [
    {
      "name": "string",
      "fields": [{ "name": "string", "type": "string", "required": boolean, "unique": boolean }],
      "relations": [{ "type": "one-to-one|one-to-many|many-to-many", "target": "string" }]
    }
  ],
  "actions": [
    { "name": "string", "type": "create|read|update|delete|auth|payment|upload|custom", "description": "string" }
  ],
  "constraints": [
    { "type": "security|performance|ux|accessibility|compliance", "requirement": "string", "priority": "required|preferred|optional" }
  ],
  "framework": "react|next|express|fastify|node|unknown",
  "integrations": [
    { "service": "string", "purpose": "string", "required": boolean }
  ],
  "tags": ["string"]
}

Be thorough in extracting entities and their relationships. Infer security requirements based on the feature type.`;

export class IntentParser {
  private config: ParserConfig;
  private llmProvider?: LLMProviderInterface;

  constructor(config: ParserConfig = {}) {
    this.config = config;
    this.llmProvider = config.llmProvider;
  }

  /**
   * Parse natural language description into structured intent
   */
  async parse(description: string): Promise<ParsedIntent> {
    // If LLM provider available, use it for extraction
    if (this.llmProvider) {
      return this.parseWithLLM(description);
    }

    // Otherwise, use pattern-based extraction
    return this.parseWithPatterns(description);
  }

  /**
   * Parse using LLM for accurate extraction
   */
  private async parseWithLLM(description: string): Promise<ParsedIntent> {
    const prompt = INTENT_EXTRACTION_PROMPT.replace('{description}', description);

    const response = await this.llmProvider!.complete(prompt);

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, response];
    const jsonStr = jsonMatch[1]?.trim() || response.trim();

    try {
      const parsed = JSON.parse(jsonStr);

      // Validate with Zod schema
      const validated = ParsedIntentSchema.parse(parsed);

      // Enrich with inferred data
      return this.enrichIntent(validated);
    } catch (error) {
      // Fall back to pattern-based parsing
      console.warn('LLM parsing failed, falling back to pattern-based:', error);
      return this.parseWithPatterns(description);
    }
  }

  /**
   * Pattern-based parsing for when LLM is unavailable
   */
  private parseWithPatterns(description: string): ParsedIntent {
    const lower = description.toLowerCase();

    return {
      feature: this.extractFeatureName(description),
      description: description,
      entities: this.extractEntities(description),
      actions: this.extractActions(description),
      constraints: this.extractConstraints(description),
      framework: this.detectFramework(description),
      integrations: this.extractIntegrations(description),
      tags: this.extractTags(description),
    };
  }

  /**
   * Extract feature name from description
   */
  private extractFeatureName(description: string): string {
    // Common feature patterns
    const patterns = [
      /(?:create|build|implement|add)\s+(?:a\s+)?(.+?)(?:\s+(?:with|using|that|for))/i,
      /(.+?)(?:\s+(?:component|page|api|endpoint|form|dashboard|system))/i,
      /^(.+?)$/i,
    ];

    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match && match[1]) {
        return this.titleCase(match[1].trim().slice(0, 50));
      }
    }

    return 'Feature';
  }

  /**
   * Extract entities from description
   */
  private extractEntities(description: string): Entity[] {
    const entities: Entity[] = [];
    const lower = description.toLowerCase();

    // Common entity patterns
    const entityPatterns = [
      { pattern: /user/i, name: 'User', fields: ['id', 'email', 'name', 'password', 'createdAt'] },
      { pattern: /product/i, name: 'Product', fields: ['id', 'name', 'description', 'price', 'image'] },
      { pattern: /order/i, name: 'Order', fields: ['id', 'userId', 'total', 'status', 'createdAt'] },
      { pattern: /post|blog/i, name: 'Post', fields: ['id', 'title', 'content', 'authorId', 'publishedAt'] },
      { pattern: /comment/i, name: 'Comment', fields: ['id', 'content', 'authorId', 'postId', 'createdAt'] },
      { pattern: /category/i, name: 'Category', fields: ['id', 'name', 'slug', 'parentId'] },
      { pattern: /tag/i, name: 'Tag', fields: ['id', 'name', 'slug'] },
      { pattern: /message|chat/i, name: 'Message', fields: ['id', 'content', 'senderId', 'receiverId', 'createdAt'] },
      { pattern: /profile/i, name: 'Profile', fields: ['id', 'userId', 'bio', 'avatar', 'location'] },
      { pattern: /settings?/i, name: 'Settings', fields: ['id', 'userId', 'theme', 'notifications'] },
    ];

    for (const { pattern, name, fields } of entityPatterns) {
      if (pattern.test(lower)) {
        entities.push({
          name,
          fields: fields.map(f => ({
            name: f,
            type: this.inferFieldType(f),
            required: ['id', 'name', 'email', 'title', 'content'].includes(f),
            unique: ['id', 'email', 'slug'].includes(f),
          })),
          relations: this.inferRelations(name, entityPatterns.map(p => p.name)),
        });
      }
    }

    return entities;
  }

  /**
   * Infer field type from field name
   */
  private inferFieldType(fieldName: string): string {
    const lower = fieldName.toLowerCase();

    if (lower === 'id') return 'string';
    if (lower.includes('email')) return 'string';
    if (lower.includes('password')) return 'string';
    if (lower.includes('price') || lower.includes('total') || lower.includes('amount')) return 'number';
    if (lower.includes('count') || lower.includes('quantity')) return 'number';
    if (lower.includes('at') || lower.includes('date')) return 'Date';
    if (lower.includes('is') || lower.includes('has') || lower.includes('enabled')) return 'boolean';
    if (lower.includes('id')) return 'string';
    if (lower.includes('image') || lower.includes('avatar') || lower.includes('url')) return 'string';

    return 'string';
  }

  /**
   * Infer relations between entities
   */
  private inferRelations(entityName: string, allEntities: string[]): Entity['relations'] {
    const relations: Entity['relations'] = [];
    const lower = entityName.toLowerCase();

    // Common relation patterns
    if (lower === 'user') {
      if (allEntities.includes('Post')) {
        relations.push({ type: 'one-to-many', target: 'Post' });
      }
      if (allEntities.includes('Order')) {
        relations.push({ type: 'one-to-many', target: 'Order' });
      }
      if (allEntities.includes('Profile')) {
        relations.push({ type: 'one-to-one', target: 'Profile' });
      }
    }

    if (lower === 'post') {
      if (allEntities.includes('Comment')) {
        relations.push({ type: 'one-to-many', target: 'Comment' });
      }
      if (allEntities.includes('Tag')) {
        relations.push({ type: 'many-to-many', target: 'Tag' });
      }
    }

    return relations;
  }

  /**
   * Extract actions from description
   */
  private extractActions(description: string): Action[] {
    const actions: Action[] = [];
    const lower = description.toLowerCase();

    // Action detection patterns
    const actionPatterns: Array<{ pattern: RegExp; type: Action['type']; name: string }> = [
      { pattern: /create|add|new|register|signup/i, type: 'create', name: 'Create' },
      { pattern: /read|get|list|view|show|display|fetch/i, type: 'read', name: 'Read' },
      { pattern: /update|edit|modify|change/i, type: 'update', name: 'Update' },
      { pattern: /delete|remove|destroy/i, type: 'delete', name: 'Delete' },
      { pattern: /auth|login|logout|signin|signout|authenticate/i, type: 'auth', name: 'Authentication' },
      { pattern: /pay|checkout|purchase|billing|stripe/i, type: 'payment', name: 'Payment' },
      { pattern: /upload|file|image|attachment/i, type: 'upload', name: 'File Upload' },
      { pattern: /search|filter|sort/i, type: 'read', name: 'Search' },
      { pattern: /pagina/i, type: 'read', name: 'Pagination' },
    ];

    for (const { pattern, type, name } of actionPatterns) {
      if (pattern.test(lower)) {
        actions.push({
          name,
          type,
          description: `${name} operation for the feature`,
        });
      }
    }

    // If no actions detected, add default CRUD
    if (actions.length === 0) {
      actions.push(
        { name: 'Create', type: 'create', description: 'Create new records' },
        { name: 'Read', type: 'read', description: 'Read/list records' },
        { name: 'Update', type: 'update', description: 'Update existing records' },
        { name: 'Delete', type: 'delete', description: 'Delete records' }
      );
    }

    return actions;
  }

  /**
   * Extract constraints from description
   */
  private extractConstraints(description: string): Constraint[] {
    const constraints: Constraint[] = [];
    const lower = description.toLowerCase();

    // Security constraints
    if (/auth|login|secure|protected|private/i.test(lower)) {
      constraints.push({
        type: 'security',
        requirement: 'Authentication required',
        priority: 'required',
      });
    }

    if (/owasp|security|secure/i.test(lower)) {
      constraints.push({
        type: 'security',
        requirement: 'OWASP Top 10 compliance',
        priority: 'required',
      });
    }

    if (/rate.?limit/i.test(lower)) {
      constraints.push({
        type: 'security',
        requirement: 'Rate limiting on sensitive endpoints',
        priority: 'required',
      });
    }

    // Performance constraints
    if (/fast|performance|optimize|cache/i.test(lower)) {
      constraints.push({
        type: 'performance',
        requirement: 'Optimized for performance',
        priority: 'preferred',
      });
    }

    if (/real.?time|websocket|live/i.test(lower)) {
      constraints.push({
        type: 'performance',
        requirement: 'Real-time updates support',
        priority: 'required',
      });
    }

    // UX constraints
    if (/responsive|mobile/i.test(lower)) {
      constraints.push({
        type: 'ux',
        requirement: 'Responsive design for mobile',
        priority: 'required',
      });
    }

    if (/dark.?mode|theme/i.test(lower)) {
      constraints.push({
        type: 'ux',
        requirement: 'Dark mode support',
        priority: 'preferred',
      });
    }

    // Accessibility
    if (/accessible|a11y|wcag|aria/i.test(lower)) {
      constraints.push({
        type: 'accessibility',
        requirement: 'WCAG 2.1 AA compliance',
        priority: 'required',
      });
    }

    // Always add basic security constraints
    if (!constraints.some(c => c.type === 'security')) {
      constraints.push({
        type: 'security',
        requirement: 'Input validation',
        priority: 'required',
      });
    }

    return constraints;
  }

  /**
   * Detect framework from description
   */
  private detectFramework(description: string): Framework {
    const lower = description.toLowerCase();

    if (/next\.?js|app.?router|server.?component/i.test(lower)) return 'next';
    if (/react|component|jsx|tsx|hook/i.test(lower)) return 'react';
    if (/express/i.test(lower)) return 'express';
    if (/fastify/i.test(lower)) return 'fastify';
    if (/node|backend|server|api/i.test(lower)) return 'node';

    return this.config.defaultFramework || 'next';
  }

  /**
   * Extract integrations from description
   */
  private extractIntegrations(description: string): Integration[] {
    const integrations: Integration[] = [];
    const lower = description.toLowerCase();

    const integrationPatterns: Array<{ pattern: RegExp; service: string; purpose: string }> = [
      { pattern: /stripe/i, service: 'Stripe', purpose: 'Payment processing' },
      { pattern: /paypal/i, service: 'PayPal', purpose: 'Payment processing' },
      { pattern: /google.?auth|google.?oauth/i, service: 'Google OAuth', purpose: 'Authentication' },
      { pattern: /github.?auth|github.?oauth/i, service: 'GitHub OAuth', purpose: 'Authentication' },
      { pattern: /s3|aws/i, service: 'AWS S3', purpose: 'File storage' },
      { pattern: /cloudinary/i, service: 'Cloudinary', purpose: 'Image optimization' },
      { pattern: /sendgrid|mailgun|ses/i, service: 'Email Service', purpose: 'Email delivery' },
      { pattern: /twilio/i, service: 'Twilio', purpose: 'SMS/Voice' },
      { pattern: /redis/i, service: 'Redis', purpose: 'Caching/Sessions' },
      { pattern: /postgres|mysql|mongodb/i, service: 'Database', purpose: 'Data persistence' },
      { pattern: /supabase/i, service: 'Supabase', purpose: 'Backend as a Service' },
      { pattern: /firebase/i, service: 'Firebase', purpose: 'Backend as a Service' },
      { pattern: /vercel/i, service: 'Vercel', purpose: 'Deployment' },
      { pattern: /websocket|socket\.?io/i, service: 'WebSocket', purpose: 'Real-time communication' },
    ];

    for (const { pattern, service, purpose } of integrationPatterns) {
      if (pattern.test(lower)) {
        integrations.push({
          service,
          purpose,
          required: true,
        });
      }
    }

    return integrations;
  }

  /**
   * Extract tags from description
   */
  private extractTags(description: string): string[] {
    const tags: string[] = [];
    const lower = description.toLowerCase();

    const tagPatterns = [
      'authentication', 'authorization', 'api', 'crud', 'form', 'dashboard',
      'real-time', 'websocket', 'file-upload', 'payment', 'search', 'filter',
      'pagination', 'responsive', 'dark-mode', 'accessibility', 'testing',
      'validation', 'security', 'caching', 'ssr', 'ssg', 'react', 'next.js',
      'typescript', 'tailwind', 'database', 'graphql', 'rest', 'hooks',
    ];

    for (const tag of tagPatterns) {
      if (lower.includes(tag.replace(/-/g, '.?'))) {
        tags.push(tag);
      }
    }

    return [...new Set(tags)];
  }

  /**
   * Enrich intent with inferred data
   */
  private enrichIntent(intent: ParsedIntent): ParsedIntent {
    // Add default security constraints if missing
    if (!intent.constraints.some(c => c.type === 'security')) {
      intent.constraints.push({
        type: 'security',
        requirement: 'Input validation on all user inputs',
        priority: 'required',
      });
    }

    // Add accessibility if UI components are involved
    if (intent.framework === 'react' || intent.framework === 'next') {
      if (!intent.constraints.some(c => c.type === 'accessibility')) {
        intent.constraints.push({
          type: 'accessibility',
          requirement: 'WCAG 2.1 AA compliance',
          priority: 'preferred',
        });
      }
    }

    return intent;
  }

  /**
   * Convert string to title case
   */
  private titleCase(str: string): string {
    return str
      .split(/[\s_-]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}

// Export singleton instance for convenience
export const intentParser = new IntentParser();
