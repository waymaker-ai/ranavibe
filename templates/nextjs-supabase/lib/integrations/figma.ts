/**
 * LUKA - Figma Integration
 * Import designs, generate code, sync design systems
 */

/**
 * Figma API Client
 */
export class FigmaClient {
  private apiKey: string;
  private baseUrl = 'https://api.figma.com/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.FIGMA_API_KEY || '';
  }

  private async request(endpoint: string) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'X-Figma-Token': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Figma API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get Figma file data
   */
  async getFile(fileKey: string) {
    return this.request(`/files/${fileKey}`);
  }

  /**
   * Get specific nodes from a file
   */
  async getNodes(fileKey: string, nodeIds: string[]) {
    const ids = nodeIds.join(',');
    return this.request(`/files/${fileKey}/nodes?ids=${ids}`);
  }

  /**
   * Get images from Figma
   */
  async getImages(fileKey: string, nodeIds: string[], format: 'png' | 'jpg' | 'svg' | 'pdf' = 'png', scale: number = 2) {
    const ids = nodeIds.join(',');
    return this.request(`/images/${fileKey}?ids=${ids}&format=${format}&scale=${scale}`);
  }

  /**
   * Get file comments
   */
  async getComments(fileKey: string) {
    return this.request(`/files/${fileKey}/comments`);
  }

  /**
   * Get team projects
   */
  async getTeamProjects(teamId: string) {
    return this.request(`/teams/${teamId}/projects`);
  }

  /**
   * Get project files
   */
  async getProjectFiles(projectId: string) {
    return this.request(`/projects/${projectId}/files`);
  }
}

/**
 * Design Token Extraction
 */
export interface DesignTokens {
  colors: Record<string, string>;
  typography: Record<string, TypographyToken>;
  spacing: Record<string, string>;
  shadows: Record<string, string>;
  radii: Record<string, string>;
}

export interface TypographyToken {
  fontFamily: string;
  fontSize: string;
  fontWeight: number | string;
  lineHeight: string;
  letterSpacing?: string;
}

/**
 * Extract design tokens from Figma file
 */
export async function extractDesignTokens(fileKey: string): Promise<DesignTokens> {
  const figma = new FigmaClient();
  const file = await figma.getFile(fileKey);

  const tokens: DesignTokens = {
    colors: {},
    typography: {},
    spacing: {},
    shadows: {},
    radii: {},
  };

  // Extract from styles
  if (file.document && file.document.children) {
    traverseNode(file.document, (node: any) => {
      // Extract colors
      if (node.fills) {
        node.fills.forEach((fill: any) => {
          if (fill.type === 'SOLID' && fill.color) {
            const { r, g, b, a } = fill.color;
            const hex = rgbToHex(
              Math.round(r * 255),
              Math.round(g * 255),
              Math.round(b * 255)
            );
            if (node.name) {
              tokens.colors[node.name] = hex;
            }
          }
        });
      }

      // Extract typography
      if (node.style && node.style.fontFamily) {
        tokens.typography[node.name] = {
          fontFamily: node.style.fontFamily,
          fontSize: `${node.style.fontSize}px`,
          fontWeight: node.style.fontWeight,
          lineHeight: `${node.style.lineHeightPx}px`,
          letterSpacing: node.style.letterSpacing ? `${node.style.letterSpacing}px` : undefined,
        };
      }

      // Extract spacing
      if (node.type === 'FRAME' && node.paddingLeft) {
        tokens.spacing[`padding-${node.name}`] = `${node.paddingLeft}px`;
      }

      // Extract shadows
      if (node.effects) {
        node.effects.forEach((effect: any) => {
          if (effect.type === 'DROP_SHADOW') {
            const { offset, radius, color } = effect;
            tokens.shadows[node.name] = `${offset.x}px ${offset.y}px ${radius}px ${rgbaString(color)}`;
          }
        });
      }

      // Extract border radius
      if (node.cornerRadius) {
        tokens.radii[node.name] = `${node.cornerRadius}px`;
      }
    });
  }

  return tokens;
}

/**
 * Generate Tailwind config from design tokens
 */
export function generateTailwindConfig(tokens: DesignTokens): string {
  return `// Generated from Figma by LUKA
module.exports = {
  theme: {
    extend: {
      colors: ${JSON.stringify(tokens.colors, null, 2)},
      fontFamily: ${JSON.stringify(
        Object.fromEntries(
          Object.entries(tokens.typography).map(([key, val]) => [key, [val.fontFamily]])
        ),
        null,
        2
      )},
      fontSize: ${JSON.stringify(
        Object.fromEntries(
          Object.entries(tokens.typography).map(([key, val]) => [key, val.fontSize])
        ),
        null,
        2
      )},
      spacing: ${JSON.stringify(tokens.spacing, null, 2)},
      boxShadow: ${JSON.stringify(tokens.shadows, null, 2)},
      borderRadius: ${JSON.stringify(tokens.radii, null, 2)},
    },
  },
};`;
}

/**
 * Generate CSS variables from design tokens
 */
export function generateCSSVariables(tokens: DesignTokens): string {
  let css = ':root {\n';

  // Colors
  Object.entries(tokens.colors).forEach(([name, value]) => {
    css += `  --color-${kebabCase(name)}: ${value};\n`;
  });

  // Typography
  Object.entries(tokens.typography).forEach(([name, token]) => {
    const key = kebabCase(name);
    css += `  --font-${key}: ${token.fontFamily};\n`;
    css += `  --font-size-${key}: ${token.fontSize};\n`;
    css += `  --font-weight-${key}: ${token.fontWeight};\n`;
    css += `  --line-height-${key}: ${token.lineHeight};\n`;
  });

  // Spacing
  Object.entries(tokens.spacing).forEach(([name, value]) => {
    css += `  --spacing-${kebabCase(name)}: ${value};\n`;
  });

  // Shadows
  Object.entries(tokens.shadows).forEach(([name, value]) => {
    css += `  --shadow-${kebabCase(name)}: ${value};\n`;
  });

  // Border radius
  Object.entries(tokens.radii).forEach(([name, value]) => {
    css += `  --radius-${kebabCase(name)}: ${value};\n`;
  });

  css += '}\n';
  return css;
}

/**
 * Convert Figma component to React component
 */
export async function figmaToReact(fileKey: string, nodeId: string): Promise<string> {
  const figma = new FigmaClient();
  const { nodes } = await figma.getNodes(fileKey, [nodeId]);
  const node = nodes[nodeId];

  if (!node) throw new Error('Node not found');

  // Generate React component
  const componentCode = generateReactComponent(node.document);

  return componentCode;
}

/**
 * Generate React component from Figma node
 */
function generateReactComponent(node: any, depth: number = 0): string {
  const indent = '  '.repeat(depth);

  if (node.type === 'TEXT') {
    const style = {
      fontFamily: node.style?.fontFamily,
      fontSize: node.style?.fontSize ? `${node.style.fontSize}px` : undefined,
      fontWeight: node.style?.fontWeight,
      color: node.fills?.[0]?.color ? rgbaString(node.fills[0].color) : undefined,
    };

    return `${indent}<span style={${JSON.stringify(style)}}>${node.characters}</span>`;
  }

  if (node.type === 'FRAME' || node.type === 'COMPONENT') {
    const children = node.children?.map((child: any) =>
      generateReactComponent(child, depth + 1)
    ).join('\n') || '';

    const style = {
      width: node.absoluteBoundingBox?.width ? `${node.absoluteBoundingBox.width}px` : undefined,
      height: node.absoluteBoundingBox?.height ? `${node.absoluteBoundingBox.height}px` : undefined,
      backgroundColor: node.fills?.[0]?.color ? rgbaString(node.fills[0].color) : undefined,
      borderRadius: node.cornerRadius ? `${node.cornerRadius}px` : undefined,
      padding: node.paddingLeft ? `${node.paddingLeft}px` : undefined,
    };

    return `${indent}<div style={${JSON.stringify(style)}}>
${children}
${indent}</div>`;
  }

  return '';
}

/**
 * Figma to Tailwind component
 */
export async function figmaToTailwind(fileKey: string, nodeId: string): Promise<string> {
  const figma = new FigmaClient();
  const { nodes } = await figma.getNodes(fileKey, [nodeId]);
  const node = nodes[nodeId];

  if (!node) throw new Error('Node not found');

  return generateTailwindComponent(node.document);
}

/**
 * Generate Tailwind component
 */
function generateTailwindComponent(node: any, depth: number = 0): string {
  const indent = '  '.repeat(depth);

  if (node.type === 'TEXT') {
    const classes = [];
    if (node.style?.fontWeight >= 600) classes.push('font-bold');
    if (node.style?.fontSize) classes.push(`text-[${node.style.fontSize}px]`);

    return `${indent}<span className="${classes.join(' ')}">${node.characters}</span>`;
  }

  if (node.type === 'FRAME' || node.type === 'COMPONENT') {
    const classes = [];
    if (node.cornerRadius) classes.push(`rounded-[${node.cornerRadius}px]`);
    if (node.paddingLeft) classes.push(`p-[${node.paddingLeft}px]`);

    const children = node.children?.map((child: any) =>
      generateTailwindComponent(child, depth + 1)
    ).join('\n') || '';

    return `${indent}<div className="${classes.join(' ')}">
${children}
${indent}</div>`;
  }

  return '';
}

/**
 * Sync Figma design system to codebase
 */
export async function syncDesignSystem(fileKey: string, outputDir: string = './design-system') {
  const tokens = await extractDesignTokens(fileKey);

  const fs = await import('fs/promises');
  const path = await import('path');

  // Create output directory
  await fs.mkdir(outputDir, { recursive: true });

  // Generate Tailwind config
  const tailwindConfig = generateTailwindConfig(tokens);
  await fs.writeFile(
    path.join(outputDir, 'tailwind.config.js'),
    tailwindConfig
  );

  // Generate CSS variables
  const cssVars = generateCSSVariables(tokens);
  await fs.writeFile(
    path.join(outputDir, 'design-tokens.css'),
    cssVars
  );

  // Generate JSON tokens
  await fs.writeFile(
    path.join(outputDir, 'tokens.json'),
    JSON.stringify(tokens, null, 2)
  );

  console.log(`✅ Design system synced to ${outputDir}`);

  return tokens;
}

/**
 * Figma Webhook Handler (for real-time sync)
 */
export async function handleFigmaWebhook(payload: any) {
  // Figma sends webhooks when files are updated
  const { file_key, timestamp, event_type } = payload;

  if (event_type === 'FILE_UPDATE') {
    console.log(`Figma file ${file_key} updated at ${timestamp}`);

    // Re-sync design system
    await syncDesignSystem(file_key);
  }
}

/**
 * Helper functions
 */
function traverseNode(node: any, callback: (node: any) => void) {
  callback(node);
  if (node.children) {
    node.children.forEach((child: any) => traverseNode(child, callback));
  }
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function rgbaString(color: any): string {
  const { r, g, b, a = 1 } = color;
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
}

function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

/**
 * Example Usage
 */
export const exampleUsage = `
// Extract design tokens
import { extractDesignTokens, syncDesignSystem } from '@/lib/integrations/figma';

const fileKey = 'ABC123'; // From Figma file URL
const tokens = await extractDesignTokens(fileKey);
console.log(tokens.colors);

// Sync entire design system
await syncDesignSystem(fileKey, './src/design-system');

// Convert Figma component to React
import { figmaToReact, figmaToTailwind } from '@/lib/integrations/figma';

const reactCode = await figmaToReact(fileKey, 'nodeId');
const tailwindCode = await figmaToTailwind(fileKey, 'nodeId');

// Setup webhook for auto-sync
// POST /api/figma/webhook
import { handleFigmaWebhook } from '@/lib/integrations/figma';

export async function POST(req: Request) {
  const payload = await req.json();
  await handleFigmaWebhook(payload);
  return Response.json({ success: true });
}
`;

/**
 * Installation:
 * No additional dependencies needed
 *
 * Setup:
 * 1. Get Figma API key: https://www.figma.com/developers/api#access-tokens
 * 2. Add to .env: FIGMA_API_KEY=figd_xxx
 * 3. Get file key from Figma URL: figma.com/file/FILE_KEY/...
 */
