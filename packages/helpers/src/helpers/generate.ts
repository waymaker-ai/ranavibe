/**
 * Generate - Content generation helper
 *
 * @example
 * ```typescript
 * import { generate } from '@rana/helpers';
 *
 * // Generate a tweet
 * const tweet = await generate('new product launch', { type: 'tweet' });
 *
 * // Generate an email
 * const email = await generate('follow up after meeting', {
 *   type: 'email',
 *   tone: 'professional',
 *   variables: { recipientName: 'John', meetingDate: 'Monday' }
 * });
 *
 * // Generate a blog post
 * const blog = await generate('benefits of AI in healthcare', {
 *   type: 'blog',
 *   length: 'long',
 *   keywords: ['AI', 'healthcare', 'diagnosis']
 * });
 * ```
 */

import type { GenerateOptions, GenerateResult, GenerateType } from '../types';
import { callLLM } from './base';

const typeGuidelines: Record<GenerateType, string> = {
  text: 'Generate natural, flowing text.',
  email: 'Generate a professional email with subject line, greeting, body, and sign-off.',
  tweet: 'Generate a tweet (max 280 characters). Make it engaging and shareable.',
  blog: 'Generate a blog post with introduction, body sections, and conclusion.',
  code: 'Generate clean, well-commented code.',
  product_description: 'Generate a compelling product description that highlights benefits.',
  headline: 'Generate an attention-grabbing headline.',
};

const lengthGuidelines: Record<'short' | 'medium' | 'long', string> = {
  short: 'Keep it brief (50-100 words for text, 100-200 for email/blog).',
  medium: 'Moderate length (150-300 words for text, 300-500 for email/blog).',
  long: 'Comprehensive (300-500 words for text, 500-1000+ for email/blog).',
};

/**
 * Generate content based on a topic or prompt
 *
 * @param topic - The topic or prompt to generate content about
 * @param options - Generation options
 * @returns Generated content with metadata
 */
export async function generate(
  topic: string,
  options: GenerateOptions = {}
): Promise<GenerateResult> {
  const {
    type = 'text',
    tone,
    length = 'medium',
    keywords,
    template,
    variables,
  } = options;

  const typeGuide = typeGuidelines[type];
  const lengthGuide = lengthGuidelines[length];

  let input = topic;
  if (template && variables) {
    input = template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || `{{${key}}}`);
  }

  const systemPrompt = `You are a professional content creator. Generate ${type} content based on the given topic.

Content Type: ${type}
${typeGuide}

${lengthGuide}
${tone ? `Tone: ${tone}` : ''}
${keywords ? `Include these keywords naturally: ${keywords.join(', ')}` : ''}

Guidelines:
- Be original and engaging
- Write for the target format
- Maintain consistent quality
- Make it actionable/useful for the reader`;

  const { result, metadata } = await callLLM(
    'generate',
    input,
    systemPrompt,
    options
  );

  const content = result as string;
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  return {
    content,
    wordCount,
    type,
    cached: metadata.cached,
    cost: metadata.cost,
    latencyMs: metadata.latencyMs,
  };
}

/**
 * Generate an email
 */
export async function generateEmail(
  topic: string,
  options: Omit<GenerateOptions, 'type'> = {}
): Promise<GenerateResult & { subject?: string }> {
  const result = await generate(topic, { ...options, type: 'email' });

  // Try to extract subject line
  const subjectMatch = result.content.match(/Subject:\s*(.+?)(?:\n|$)/i);
  const subject = subjectMatch ? subjectMatch[1].trim() : undefined;

  return { ...result, subject };
}

/**
 * Generate a tweet
 */
export async function generateTweet(
  topic: string,
  options: Omit<GenerateOptions, 'type' | 'length'> = {}
): Promise<GenerateResult> {
  return generate(topic, { ...options, type: 'tweet', length: 'short' });
}

/**
 * Generate a blog post outline
 */
export async function generateBlogOutline(
  topic: string,
  options: GenerateOptions = {}
): Promise<{ title: string; sections: string[]; keywords: string[] }> {
  const systemPrompt = `You are a content strategist. Create a blog post outline for the given topic.

Respond with a JSON object:
{
  "title": "engaging blog title",
  "sections": ["Introduction", "Section 1", "Section 2", ..., "Conclusion"],
  "keywords": ["keyword1", "keyword2", ...]
}`;

  const { result } = await callLLM(
    'blog_outline',
    topic,
    systemPrompt,
    options,
    (content) => JSON.parse(content)
  );

  return result as { title: string; sections: string[]; keywords: string[] };
}

/**
 * Generate product description
 */
export async function generateProductDescription(
  product: string,
  features: string[],
  options: Omit<GenerateOptions, 'type'> = {}
): Promise<GenerateResult> {
  const input = `Product: ${product}\nFeatures: ${features.join(', ')}`;
  return generate(input, { ...options, type: 'product_description' });
}

/**
 * Generate headlines
 */
export async function generateHeadlines(
  topic: string,
  count: number = 5,
  options: Omit<GenerateOptions, 'type'> = {}
): Promise<string[]> {
  const systemPrompt = `You are a headline writer. Generate ${count} different headlines for the given topic.

Make them:
- Attention-grabbing
- Clear and specific
- Varied in style (question, how-to, list, etc.)

Respond with a JSON array of strings:
["headline 1", "headline 2", ...]`;

  const { result } = await callLLM(
    'headlines',
    topic,
    systemPrompt,
    options,
    (content) => JSON.parse(content)
  );

  return result as string[];
}

/**
 * Generate code
 */
export async function generateCode(
  description: string,
  language: string = 'typescript',
  options: Omit<GenerateOptions, 'type'> = {}
): Promise<GenerateResult & { language: string }> {
  const systemPrompt = `You are an expert ${language} developer. Generate clean, well-documented code based on the description.

Guidelines:
- Follow ${language} best practices
- Include helpful comments
- Handle edge cases
- Make it production-ready

Return only the code, no explanations.`;

  const { result, metadata } = await callLLM(
    'generate_code',
    description,
    systemPrompt,
    options
  );

  const content = result as string;

  return {
    content,
    wordCount: content.split(/\s+/).filter(Boolean).length,
    type: 'code',
    language,
    cached: metadata.cached,
    cost: metadata.cost,
    latencyMs: metadata.latencyMs,
  };
}

/**
 * Batch generate multiple pieces of content
 */
export async function generateBatch(
  topics: string[],
  options: GenerateOptions = {}
): Promise<GenerateResult[]> {
  return Promise.all(topics.map(topic => generate(topic, options)));
}
