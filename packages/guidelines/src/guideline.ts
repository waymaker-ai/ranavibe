/**
 * @rana/guidelines - Guideline factory and helpers
 */

import type {
  Guideline,
  GuidelineCondition,
  GuidelineContent,
  EnforcementLevel,
  GuidelineContext,
} from './types';

/**
 * Guideline creation options
 */
export interface CreateGuidelineOptions {
  /** Unique identifier */
  id: string;

  /** Human-readable name */
  name?: string;

  /** Description */
  description?: string;

  /** Condition for matching */
  condition: GuidelineCondition;

  /** Guideline content */
  content: GuidelineContent;

  /** Enforcement level (default: 'advisory') */
  enforcement?: EnforcementLevel;

  /** Priority (default: 50) */
  priority?: number;

  /** Category */
  category?: string;

  /** Tags */
  tags?: string[];

  /** Version */
  version?: string;

  /** Metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Create a new guideline
 */
export function createGuideline(options: CreateGuidelineOptions): Guideline {
  return {
    id: options.id,
    name: options.name,
    description: options.description,
    condition: options.condition,
    content: options.content,
    enforcement: options.enforcement ?? 'advisory',
    priority: options.priority ?? 50,
    category: options.category,
    tags: options.tags,
    status: 'active',
    version: options.version ?? '1.0.0',
    metadata: options.metadata,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Common condition builders for convenience
 */
export const Conditions = {
  /**
   * Match by topic
   */
  topic: (topics: string | string[]): GuidelineCondition => {
    const topicArray = Array.isArray(topics) ? topics : [topics];
    return (context) => {
      if (!context.topic) return false;
      const contextTopics = Array.isArray(context.topic) ? context.topic : [context.topic];
      return topicArray.some(topic =>
        contextTopics.some(ct => ct.toLowerCase().includes(topic.toLowerCase()))
      );
    };
  },

  /**
   * Match by category
   */
  category: (category: string): GuidelineCondition => {
    return (context) => context.category === category;
  },

  /**
   * Match by user role
   */
  userRole: (roles: string | string[]): GuidelineCondition => {
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return (context) => {
      if (!context.user?.roles) return false;
      return roleArray.some(role => context.user!.roles!.includes(role));
    };
  },

  /**
   * Match by intent
   */
  intent: (intents: string | string[]): GuidelineCondition => {
    const intentArray = Array.isArray(intents) ? intents : [intents];
    return (context) => {
      if (!context.intent) return false;
      return intentArray.includes(context.intent);
    };
  },

  /**
   * Match by message content pattern
   */
  messageContains: (patterns: string | string[]): GuidelineCondition => {
    const patternArray = Array.isArray(patterns) ? patterns : [patterns];
    return (context) => {
      if (!context.message) return false;
      const message = context.message.toLowerCase();
      return patternArray.some(pattern => message.includes(pattern.toLowerCase()));
    };
  },

  /**
   * Match by regex
   */
  messageMatches: (regex: RegExp): GuidelineCondition => {
    return (context) => {
      if (!context.message) return false;
      return regex.test(context.message);
    };
  },

  /**
   * Always match
   */
  always: (): GuidelineCondition => {
    return () => true;
  },

  /**
   * Never match
   */
  never: (): GuidelineCondition => {
    return () => false;
  },

  /**
   * Combine conditions with AND
   */
  and: (...conditions: GuidelineCondition[]): GuidelineCondition => {
    return async (context) => {
      for (const condition of conditions) {
        const result = await condition(context);
        if (!result) return false;
      }
      return true;
    };
  },

  /**
   * Combine conditions with OR
   */
  or: (...conditions: GuidelineCondition[]): GuidelineCondition => {
    return async (context) => {
      for (const condition of conditions) {
        const result = await condition(context);
        if (result) return true;
      }
      return false;
    };
  },

  /**
   * Negate condition
   */
  not: (condition: GuidelineCondition): GuidelineCondition => {
    return async (context) => {
      const result = await condition(context);
      return !result;
    };
  },

  /**
   * Custom condition
   */
  custom: (fn: GuidelineCondition): GuidelineCondition => fn,
};

/**
 * Preset guidelines for common use cases
 */
export const PresetGuidelines = {
  /**
   * No medical advice guideline
   */
  noMedicalAdvice: (): Guideline => createGuideline({
    id: 'no-medical-advice',
    name: 'No Medical Advice',
    description: 'Prevent providing medical diagnoses or treatment recommendations',
    condition: Conditions.or(
      Conditions.topic(['medical', 'health', 'diagnosis', 'treatment']),
      Conditions.messageContains(['should I take', 'diagnose me', 'medical advice'])
    ),
    content: 'You cannot provide medical diagnoses or treatment recommendations. Always suggest consulting with a licensed healthcare professional for medical concerns.',
    enforcement: 'strict',
    priority: 100,
    category: 'healthcare',
    tags: ['medical', 'healthcare', 'safety'],
  }),

  /**
   * Financial disclaimer guideline
   */
  financialDisclaimer: (): Guideline => createGuideline({
    id: 'financial-disclaimer',
    name: 'Financial Disclaimer Required',
    description: 'Require disclaimers on financial and investment discussions',
    condition: Conditions.topic(['investment', 'stock', 'crypto', 'financial advice']),
    content: 'When discussing investments or financial matters, always include appropriate disclaimers. Remind users that past performance does not guarantee future results and suggest consulting with a financial advisor.',
    enforcement: 'advisory',
    priority: 90,
    category: 'finance',
    tags: ['finance', 'investment', 'compliance'],
  }),

  /**
   * Professional tone guideline
   */
  professionalTone: (): Guideline => createGuideline({
    id: 'professional-tone',
    name: 'Professional Tone',
    description: 'Maintain professional and respectful communication',
    condition: Conditions.always(),
    content: 'Maintain a professional, respectful, and helpful tone in all interactions. Avoid slang, overly casual language, or any potentially offensive content.',
    enforcement: 'advisory',
    priority: 50,
    category: 'tone',
    tags: ['communication', 'professionalism'],
  }),

  /**
   * Data privacy guideline
   */
  dataPrivacy: (): Guideline => createGuideline({
    id: 'data-privacy',
    name: 'Data Privacy Protection',
    description: 'Protect user privacy and avoid requesting sensitive information',
    condition: Conditions.messageContains(['password', 'ssn', 'credit card', 'social security']),
    content: 'Never ask for or store sensitive personal information such as passwords, social security numbers, or credit card details. If such information is needed, direct users to secure, official channels.',
    enforcement: 'strict',
    priority: 100,
    category: 'privacy',
    tags: ['privacy', 'security', 'pii'],
  }),

  /**
   * Legal disclaimer guideline
   */
  legalDisclaimer: (): Guideline => createGuideline({
    id: 'legal-disclaimer',
    name: 'Legal Disclaimer Required',
    description: 'Require disclaimers for legal discussions',
    condition: Conditions.or(
      Conditions.topic(['legal', 'law', 'attorney']),
      Conditions.messageContains(['legal advice', 'sue', 'lawsuit', 'legal rights'])
    ),
    content: 'You cannot provide legal advice. Always include a disclaimer that this is not legal advice and recommend consulting with a licensed attorney for legal matters.',
    enforcement: 'strict',
    priority: 100,
    category: 'legal',
    tags: ['legal', 'compliance'],
  }),

  /**
   * Brand voice guideline
   */
  brandVoice: (brandName: string, voice: string): Guideline => createGuideline({
    id: 'brand-voice',
    name: `${brandName} Brand Voice`,
    description: `Maintain ${brandName}'s brand voice and personality`,
    condition: Conditions.always(),
    content: `Maintain ${brandName}'s brand voice: ${voice}`,
    enforcement: 'advisory',
    priority: 60,
    category: 'brand',
    tags: ['brand', 'voice', 'style'],
  }),

  /**
   * Customer support empathy guideline
   */
  customerEmpathy: (): Guideline => createGuideline({
    id: 'customer-empathy',
    name: 'Empathetic Customer Support',
    description: 'Show empathy and understanding in support interactions',
    condition: Conditions.category('support'),
    content: 'Show empathy and understanding. Acknowledge the customer\'s frustration or concern. Use phrases like "I understand how frustrating this must be" and focus on solutions.',
    enforcement: 'advisory',
    priority: 70,
    category: 'support',
    tags: ['support', 'empathy', 'customer-service'],
  }),

  /**
   * Age-appropriate content guideline
   */
  ageAppropriate: (minAge: number = 13): Guideline => createGuideline({
    id: 'age-appropriate',
    name: 'Age-Appropriate Content',
    description: `Ensure content is appropriate for users ${minAge}+`,
    condition: Conditions.always(),
    content: `Ensure all content is appropriate for users aged ${minAge} and above. Avoid mature themes, explicit content, or anything that could be harmful to younger audiences.`,
    enforcement: 'strict',
    priority: 95,
    category: 'safety',
    tags: ['safety', 'age-appropriate', 'content-moderation'],
  }),
};

/**
 * Resolve guideline content (handle both static and dynamic)
 */
export async function resolveContent(
  content: GuidelineContent,
  context: GuidelineContext
): Promise<string> {
  if (typeof content === 'string') {
    return content;
  }
  return await content(context);
}

/**
 * Check if guideline matches context
 */
export async function matchesContext(
  guideline: Guideline,
  context: GuidelineContext
): Promise<boolean> {
  try {
    return await guideline.condition(context);
  } catch (error) {
    console.error(`Error checking guideline ${guideline.id}:`, error);
    return false;
  }
}
