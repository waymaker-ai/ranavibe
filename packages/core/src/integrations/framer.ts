/**
 * Framer Integration for RANA
 *
 * Enables AI-powered interactions with Framer sites.
 * Supports code components, overrides, and CMS integration.
 *
 * @see https://www.framer.com/developers
 */

import { EventEmitter } from 'events';

// =============================================================================
// Types
// =============================================================================

export interface FramerConfig {
  /** Framer API token */
  apiToken?: string;
  /** Project ID */
  projectId?: string;
  /** Site URL for client-side integration */
  siteUrl?: string;
  /** Enable debug logging */
  debug?: boolean;
}

export interface FramerProject {
  /** Project ID */
  id: string;
  /** Project name */
  name: string;
  /** Project URL */
  url: string;
  /** Is published */
  isPublished: boolean;
  /** Custom domain */
  customDomain?: string;
  /** Last updated */
  updatedAt: Date;
}

export interface FramerPage {
  /** Page ID */
  id: string;
  /** Page title */
  title: string;
  /** Page path */
  path: string;
  /** Is home page */
  isHome: boolean;
  /** Page metadata */
  metadata?: Record<string, any>;
}

export interface FramerCMSCollection {
  /** Collection ID */
  id: string;
  /** Collection name */
  name: string;
  /** Collection slug */
  slug: string;
  /** Field schema */
  fields: FramerCMSField[];
  /** Item count */
  itemCount: number;
}

export interface FramerCMSField {
  /** Field ID */
  id: string;
  /** Field name */
  name: string;
  /** Field type */
  type: FramerFieldType;
  /** Is required */
  required: boolean;
  /** Default value */
  defaultValue?: any;
}

export type FramerFieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'image'
  | 'file'
  | 'color'
  | 'link'
  | 'richText'
  | 'enum'
  | 'reference';

export interface FramerCMSItem {
  /** Item ID */
  id: string;
  /** Item slug */
  slug: string;
  /** Field data */
  data: Record<string, any>;
  /** Created at */
  createdAt: Date;
  /** Updated at */
  updatedAt: Date;
  /** Is published */
  isPublished: boolean;
}

export interface FramerCodeComponent {
  /** Component name */
  name: string;
  /** Component description */
  description?: string;
  /** Props schema */
  props: FramerPropDefinition[];
  /** Component code (React/TypeScript) */
  code: string;
  /** Dependencies */
  dependencies?: Record<string, string>;
}

export interface FramerPropDefinition {
  /** Prop name */
  name: string;
  /** Prop type */
  type: 'string' | 'number' | 'boolean' | 'color' | 'image' | 'enum' | 'object' | 'array';
  /** Default value */
  defaultValue?: any;
  /** Enum options */
  options?: string[];
  /** Is required */
  required?: boolean;
  /** Description */
  description?: string;
}

export interface FramerOverride {
  /** Override name */
  name: string;
  /** Target component/element */
  target: string;
  /** Override code */
  code: string;
}

export interface FramerMotionConfig {
  /** Animation type */
  type: 'spring' | 'tween' | 'inertia';
  /** Duration (for tween) */
  duration?: number;
  /** Spring stiffness */
  stiffness?: number;
  /** Spring damping */
  damping?: number;
  /** Ease curve */
  ease?: string | number[];
}

// =============================================================================
// Error Classes
// =============================================================================

export class FramerError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'FramerError';
  }
}

// =============================================================================
// Framer Integration
// =============================================================================

export class FramerIntegration extends EventEmitter {
  private config: FramerConfig;

  constructor(config: FramerConfig = {}) {
    super();
    this.config = {
      debug: false,
      ...config,
    };
  }

  // ===========================================================================
  // Code Component Generation
  // ===========================================================================

  /**
   * Generate a Framer code component from description
   */
  generateComponent(options: {
    name: string;
    description: string;
    props?: FramerPropDefinition[];
    hasAnimation?: boolean;
    isResponsive?: boolean;
  }): FramerCodeComponent {
    const { name, description, props = [], hasAnimation, isResponsive } = options;

    const imports = [
      'import { addPropertyControls, ControlType } from "framer"',
    ];

    if (hasAnimation) {
      imports.push('import { motion } from "framer-motion"');
    }

    const propsInterface = this.generatePropsInterface(name, props);
    const propertyControls = this.generatePropertyControls(props);
    const componentCode = this.generateComponentCode(name, props, {
      hasAnimation,
      isResponsive,
    });

    const code = `${imports.join('\n')}

${propsInterface}

/**
 * ${description}
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
${componentCode}

addPropertyControls(${name}, ${propertyControls})

export default ${name}
`;

    return {
      name,
      description,
      props,
      code,
      dependencies: hasAnimation ? { 'framer-motion': '^10.0.0' } : undefined,
    };
  }

  /**
   * Generate an AI-powered chat component
   */
  generateChatComponent(options: {
    name?: string;
    endpoint?: string;
    streamingEnabled?: boolean;
    theme?: 'light' | 'dark' | 'auto';
  } = {}): FramerCodeComponent {
    const {
      name = 'AIChatWidget',
      endpoint = '/api/chat',
      streamingEnabled = true,
      theme = 'auto',
    } = options;

    const code = `import { addPropertyControls, ControlType } from "framer"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface ${name}Props {
  endpoint: string
  placeholder: string
  primaryColor: string
  theme: "light" | "dark" | "auto"
  streaming: boolean
  maxHeight: number
}

/**
 * AI Chat Widget powered by RANA
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export function ${name}({
  endpoint = "${endpoint}",
  placeholder = "Ask me anything...",
  primaryColor = "#6366f1",
  theme = "${theme}",
  streaming = ${streamingEnabled},
  maxHeight = 400,
}: ${name}Props) {
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isDark = theme === "dark" ||
    (theme === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches)

  const styles = {
    container: {
      display: "flex",
      flexDirection: "column" as const,
      height: "100%",
      maxHeight,
      backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
      borderRadius: 12,
      overflow: "hidden",
      boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
    },
    messages: {
      flex: 1,
      overflowY: "auto" as const,
      padding: 16,
      display: "flex",
      flexDirection: "column" as const,
      gap: 12,
    },
    message: (isUser: boolean) => ({
      maxWidth: "80%",
      padding: "10px 14px",
      borderRadius: 16,
      backgroundColor: isUser ? primaryColor : (isDark ? "#2a2a2a" : "#f3f4f6"),
      color: isUser ? "#ffffff" : (isDark ? "#ffffff" : "#1f2937"),
      alignSelf: isUser ? "flex-end" : "flex-start",
    }),
    inputContainer: {
      display: "flex",
      gap: 8,
      padding: 12,
      borderTop: \`1px solid \${isDark ? "#333" : "#e5e7eb"}\`,
    },
    input: {
      flex: 1,
      padding: "10px 14px",
      borderRadius: 20,
      border: \`1px solid \${isDark ? "#444" : "#e5e7eb"}\`,
      backgroundColor: isDark ? "#2a2a2a" : "#ffffff",
      color: isDark ? "#ffffff" : "#1f2937",
      outline: "none",
      fontSize: 14,
    },
    button: {
      padding: "10px 20px",
      borderRadius: 20,
      border: "none",
      backgroundColor: primaryColor,
      color: "#ffffff",
      cursor: "pointer",
      fontSize: 14,
      fontWeight: 500,
    },
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = { role: "user", content: input }
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      if (streaming) {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [...messages, userMessage] }),
        })

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let assistantContent = ""

        setMessages(prev => [...prev, { role: "assistant", content: "" }])

        while (reader) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          assistantContent += chunk

          setMessages(prev => {
            const newMessages = [...prev]
            newMessages[newMessages.length - 1] = {
              role: "assistant",
              content: assistantContent,
            }
            return newMessages
          })
        }
      } else {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [...messages, userMessage] }),
        })

        const data = await response.json()
        setMessages(prev => [...prev, { role: "assistant", content: data.content }])
      }
    } catch (error) {
      console.error("Chat error:", error)
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.messages}>
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={styles.message(msg.role === "user")}
            >
              {msg.content}
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={styles.message(false)}
          >
            <span className="typing-indicator">...</span>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div style={styles.inputContainer}>
        <input
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          placeholder={placeholder}
          disabled={isLoading}
        />
        <button
          style={styles.button}
          onClick={sendMessage}
          disabled={isLoading}
        >
          Send
        </button>
      </div>
    </div>
  )
}

addPropertyControls(${name}, {
  endpoint: {
    type: ControlType.String,
    title: "API Endpoint",
    defaultValue: "${endpoint}",
  },
  placeholder: {
    type: ControlType.String,
    title: "Placeholder",
    defaultValue: "Ask me anything...",
  },
  primaryColor: {
    type: ControlType.Color,
    title: "Primary Color",
    defaultValue: "#6366f1",
  },
  theme: {
    type: ControlType.Enum,
    title: "Theme",
    options: ["light", "dark", "auto"],
    defaultValue: "${theme}",
  },
  streaming: {
    type: ControlType.Boolean,
    title: "Streaming",
    defaultValue: ${streamingEnabled},
  },
  maxHeight: {
    type: ControlType.Number,
    title: "Max Height",
    defaultValue: 400,
    min: 200,
    max: 800,
  },
})

export default ${name}
`;

    return {
      name,
      description: 'AI-powered chat widget with streaming support',
      props: [
        { name: 'endpoint', type: 'string', defaultValue: endpoint },
        { name: 'placeholder', type: 'string', defaultValue: 'Ask me anything...' },
        { name: 'primaryColor', type: 'color', defaultValue: '#6366f1' },
        { name: 'theme', type: 'enum', options: ['light', 'dark', 'auto'], defaultValue: theme },
        { name: 'streaming', type: 'boolean', defaultValue: streamingEnabled },
        { name: 'maxHeight', type: 'number', defaultValue: 400 },
      ],
      code,
      dependencies: {
        'framer-motion': '^10.0.0',
      },
    };
  }

  /**
   * Generate a search component with AI
   */
  generateSearchComponent(options: {
    name?: string;
    endpoint?: string;
    semanticSearch?: boolean;
  } = {}): FramerCodeComponent {
    const {
      name = 'AISearch',
      endpoint = '/api/search',
      semanticSearch = true,
    } = options;

    const code = `import { addPropertyControls, ControlType } from "framer"
import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface ${name}Props {
  endpoint: string
  placeholder: string
  debounceMs: number
  maxResults: number
}

/**
 * AI-Powered Search Component
 * ${semanticSearch ? 'Uses semantic search for intelligent results' : ''}
 */
export function ${name}({
  endpoint = "${endpoint}",
  placeholder = "Search...",
  debounceMs = 300,
  maxResults = 10,
}: ${name}Props) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const debounce = (fn: Function, ms: number) => {
    let timeout: NodeJS.Timeout
    return (...args: any[]) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => fn(...args), ms)
    }
  }

  const search = useCallback(
    debounce(async (q: string) => {
      if (!q.trim()) {
        setResults([])
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(\`\${endpoint}?q=\${encodeURIComponent(q)}&limit=\${maxResults}\`)
        const data = await response.json()
        setResults(data.results || [])
      } catch (error) {
        console.error("Search error:", error)
      } finally {
        setIsLoading(false)
      }
    }, debounceMs),
    [endpoint, maxResults, debounceMs]
  )

  useEffect(() => {
    search(query)
  }, [query, search])

  return (
    <div style={{
      position: "relative",
      width: "100%",
    }}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "12px 16px",
          borderRadius: 8,
          border: "1px solid #e5e7eb",
          fontSize: 16,
          outline: "none",
        }}
      />

      <AnimatePresence>
        {isFocused && (query || isLoading) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              marginTop: 8,
              backgroundColor: "#ffffff",
              borderRadius: 8,
              boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
              overflow: "hidden",
              zIndex: 1000,
            }}
          >
            {isLoading ? (
              <div style={{ padding: 16, textAlign: "center" }}>
                Searching...
              </div>
            ) : results.length > 0 ? (
              results.map((result, i) => (
                <div
                  key={i}
                  style={{
                    padding: 12,
                    borderBottom: i < results.length - 1 ? "1px solid #e5e7eb" : "none",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    if (result.url) window.location.href = result.url
                  }}
                >
                  <div style={{ fontWeight: 500 }}>{result.title}</div>
                  {result.description && (
                    <div style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>
                      {result.description}
                    </div>
                  )}
                </div>
              ))
            ) : query ? (
              <div style={{ padding: 16, textAlign: "center", color: "#6b7280" }}>
                No results found
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

addPropertyControls(${name}, {
  endpoint: {
    type: ControlType.String,
    title: "API Endpoint",
    defaultValue: "${endpoint}",
  },
  placeholder: {
    type: ControlType.String,
    title: "Placeholder",
    defaultValue: "Search...",
  },
  debounceMs: {
    type: ControlType.Number,
    title: "Debounce (ms)",
    defaultValue: 300,
    min: 0,
    max: 1000,
  },
  maxResults: {
    type: ControlType.Number,
    title: "Max Results",
    defaultValue: 10,
    min: 1,
    max: 50,
  },
})

export default ${name}
`;

    return {
      name,
      description: `AI-powered search component ${semanticSearch ? 'with semantic search' : ''}`,
      props: [
        { name: 'endpoint', type: 'string', defaultValue: endpoint },
        { name: 'placeholder', type: 'string', defaultValue: 'Search...' },
        { name: 'debounceMs', type: 'number', defaultValue: 300 },
        { name: 'maxResults', type: 'number', defaultValue: 10 },
      ],
      code,
      dependencies: {
        'framer-motion': '^10.0.0',
      },
    };
  }

  // ===========================================================================
  // Override Generation
  // ===========================================================================

  /**
   * Generate a Framer override
   */
  generateOverride(options: {
    name: string;
    description: string;
    animationType?: 'hover' | 'scroll' | 'click' | 'load';
    motion?: FramerMotionConfig;
  }): FramerOverride {
    const { name, description, animationType = 'hover', motion } = options;

    let code = `import type { ComponentType } from "react"
import { motion } from "framer-motion"

/**
 * ${description}
 */
`;

    switch (animationType) {
      case 'hover':
        code += `export function ${name}(Component: ComponentType): ComponentType {
  return (props) => {
    return (
      <Component
        {...props}
        as={motion.div}
        whileHover={{
          scale: 1.05,
          transition: ${JSON.stringify(motion || { type: 'spring', stiffness: 400, damping: 10 })}
        }}
      />
    )
  }
}`;
        break;

      case 'scroll':
        code += `export function ${name}(Component: ComponentType): ComponentType {
  return (props) => {
    return (
      <Component
        {...props}
        as={motion.div}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={${JSON.stringify(motion || { duration: 0.5, ease: 'easeOut' })}}
      />
    )
  }
}`;
        break;

      case 'click':
        code += `export function ${name}(Component: ComponentType): ComponentType {
  return (props) => {
    return (
      <Component
        {...props}
        as={motion.div}
        whileTap={{ scale: 0.95 }}
        transition={${JSON.stringify(motion || { type: 'spring', stiffness: 400, damping: 17 })}}
      />
    )
  }
}`;
        break;

      case 'load':
        code += `export function ${name}(Component: ComponentType): ComponentType {
  return (props) => {
    return (
      <Component
        {...props}
        as={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={${JSON.stringify(motion || { duration: 0.3 })}}
      />
    )
  }
}`;
        break;
    }

    return {
      name,
      target: '*',
      code,
    };
  }

  // ===========================================================================
  // CMS Template Generation
  // ===========================================================================

  /**
   * Generate CMS collection template
   */
  generateCMSTemplate(options: {
    name: string;
    fields: Array<{
      name: string;
      type: FramerFieldType;
      required?: boolean;
    }>;
  }): {
    collection: Partial<FramerCMSCollection>;
    sampleItems: Array<Partial<FramerCMSItem>>;
  } {
    const { name, fields } = options;

    const collection: Partial<FramerCMSCollection> = {
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      fields: fields.map((f, i) => ({
        id: `field_${i}`,
        name: f.name,
        type: f.type,
        required: f.required ?? false,
      })),
    };

    // Generate sample items
    const sampleItems: Array<Partial<FramerCMSItem>> = [
      {
        slug: 'sample-item-1',
        data: this.generateSampleData(fields),
        isPublished: true,
      },
      {
        slug: 'sample-item-2',
        data: this.generateSampleData(fields),
        isPublished: false,
      },
    ];

    return { collection, sampleItems };
  }

  // ===========================================================================
  // RANA Integration Helpers
  // ===========================================================================

  /**
   * Generate API route handler for Framer
   */
  generateAPIHandler(options: {
    type: 'chat' | 'search' | 'cms';
    ranaConfig?: Record<string, any>;
  }): string {
    const { type, ranaConfig } = options;

    switch (type) {
      case 'chat':
        return `import { createRANA } from '@rana/core';

const rana = createRANA(${JSON.stringify(ranaConfig || {}, null, 2)});

export async function POST(request: Request) {
  const { messages } = await request.json();

  const stream = await rana.chat({
    messages,
    stream: true,
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}`;

      case 'search':
        return `import { createRANA } from '@rana/core';

const rana = createRANA(${JSON.stringify(ranaConfig || {}, null, 2)});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const limit = parseInt(searchParams.get('limit') || '10');

  const results = await rana.search({
    query,
    limit,
    semantic: true,
  });

  return Response.json({ results });
}`;

      case 'cms':
        return `import { createRANA } from '@rana/core';

const rana = createRANA(${JSON.stringify(ranaConfig || {}, null, 2)});

export async function POST(request: Request) {
  const { action, data } = await request.json();

  switch (action) {
    case 'generate':
      const content = await rana.generate({
        prompt: data.prompt,
        schema: data.schema,
      });
      return Response.json({ content });

    case 'summarize':
      const summary = await rana.summarize(data.text);
      return Response.json({ summary });

    case 'translate':
      const translation = await rana.translate({
        text: data.text,
        targetLanguage: data.language,
      });
      return Response.json({ translation });

    default:
      return Response.json({ error: 'Unknown action' }, { status: 400 });
  }
}`;

      default:
        throw new FramerError(`Unknown handler type: ${type}`, 'UNKNOWN_TYPE');
    }
  }

  /**
   * Get integration setup instructions
   */
  getSetupInstructions(): string {
    return `# RANA + Framer Integration Setup

## 1. Install Dependencies

In your Framer project, add the following to your code components:

\`\`\`bash
npm install @rana/core framer-motion
\`\`\`

## 2. Create API Route

Create an API route in your backend (Next.js, Vercel, etc.):

\`\`\`typescript
// app/api/chat/route.ts
${this.generateAPIHandler({ type: 'chat' })}
\`\`\`

## 3. Add Code Component

1. In Framer, go to Assets > Code
2. Click "New File"
3. Paste the generated component code
4. Drag the component onto your canvas

## 4. Configure Component

- Set the API endpoint to your deployed route
- Customize colors and styling
- Enable/disable streaming as needed

## 5. Publish

Publish your Framer site to see the AI integration live!

## Troubleshooting

- Ensure CORS is configured on your API
- Check API endpoint is accessible
- Verify API keys are set in environment variables
`;
  }

  // ===========================================================================
  // Private Helpers
  // ===========================================================================

  private generatePropsInterface(name: string, props: FramerPropDefinition[]): string {
    const propsStr = props.map(p => {
      const type = this.getTSType(p.type);
      return `  ${p.name}${p.required ? '' : '?'}: ${type}`;
    }).join('\n');

    return `interface ${name}Props {\n${propsStr}\n}`;
  }

  private getTSType(type: FramerPropDefinition['type']): string {
    switch (type) {
      case 'string':
      case 'color':
      case 'image':
        return 'string';
      case 'number':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'enum':
        return 'string';
      case 'object':
        return 'Record<string, any>';
      case 'array':
        return 'any[]';
      default:
        return 'any';
    }
  }

  private generatePropertyControls(props: FramerPropDefinition[]): string {
    const controls = props.map(p => {
      const controlType = this.getControlType(p.type);
      let control = `  ${p.name}: {\n    type: ControlType.${controlType},\n    title: "${p.name}",`;

      if (p.defaultValue !== undefined) {
        control += `\n    defaultValue: ${JSON.stringify(p.defaultValue)},`;
      }

      if (p.type === 'enum' && p.options) {
        control += `\n    options: ${JSON.stringify(p.options)},`;
      }

      if (p.description) {
        control += `\n    description: "${p.description}",`;
      }

      control += '\n  }';
      return control;
    }).join(',\n');

    return `{\n${controls}\n}`;
  }

  private getControlType(type: FramerPropDefinition['type']): string {
    switch (type) {
      case 'string':
        return 'String';
      case 'number':
        return 'Number';
      case 'boolean':
        return 'Boolean';
      case 'color':
        return 'Color';
      case 'image':
        return 'Image';
      case 'enum':
        return 'Enum';
      case 'object':
        return 'Object';
      case 'array':
        return 'Array';
      default:
        return 'String';
    }
  }

  private generateComponentCode(
    name: string,
    props: FramerPropDefinition[],
    options: { hasAnimation?: boolean; isResponsive?: boolean }
  ): string {
    const propsDestructure = props.map(p => p.name).join(', ');
    const Component = options.hasAnimation ? 'motion.div' : 'div';

    return `export function ${name}({ ${propsDestructure} }: ${name}Props) {
  return (
    <${Component}
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
      }}
    >
      {/* Component content */}
    </${Component}>
  )
}`;
  }

  private generateSampleData(fields: Array<{ name: string; type: FramerFieldType }>): Record<string, any> {
    const data: Record<string, any> = {};

    for (const field of fields) {
      switch (field.type) {
        case 'string':
          data[field.name] = `Sample ${field.name}`;
          break;
        case 'number':
          data[field.name] = 42;
          break;
        case 'boolean':
          data[field.name] = true;
          break;
        case 'date':
          data[field.name] = new Date().toISOString();
          break;
        case 'image':
          data[field.name] = 'https://via.placeholder.com/400x300';
          break;
        case 'color':
          data[field.name] = '#6366f1';
          break;
        case 'richText':
          data[field.name] = '<p>Sample rich text content</p>';
          break;
        default:
          data[field.name] = null;
      }
    }

    return data;
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a Framer integration instance
 */
export function createFramerIntegration(config?: FramerConfig): FramerIntegration {
  return new FramerIntegration(config);
}
