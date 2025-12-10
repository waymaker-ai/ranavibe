/**
 * API Key Management for RANA
 *
 * Supports two modes:
 * 1. Free Tier: Users bring their own API keys
 * 2. Paid Tier: Waymaker provides API tokens
 */

export type TierType = 'free' | 'waymaker-pro' | 'enterprise';

export interface ApiKeyConfig {
  tier: TierType;

  // For free tier - user provides their own keys
  userKeys?: {
    openai?: string;
    anthropic?: string;
    google?: string;
    xai?: string;
    mistral?: string;
    cohere?: string;
    together?: string;
    groq?: string;
    ollama?: string;
  };

  // For paid tiers - Waymaker provides tokens
  waymakerToken?: string;
  waymakerApiUrl?: string;
}

export interface ApiKeySource {
  provider: string;
  key: string;
  source: 'user' | 'waymaker';
  tier: TierType;
}

/**
 * API Key Manager
 *
 * Determines which API keys to use based on tier
 */
export class ApiKeyManager {
  private config: ApiKeyConfig;

  constructor(config: ApiKeyConfig) {
    this.config = config;
  }

  /**
   * Get API key for a specific provider
   */
  getKey(provider: string): ApiKeySource | null {
    if (this.config.tier === 'free') {
      return this.getFreeKey(provider);
    } else {
      return this.getWaymakerKey(provider);
    }
  }

  /**
   * Get user's own API key (free tier)
   */
  private getFreeKey(provider: string): ApiKeySource | null {
    const key = this.config.userKeys?.[provider as keyof typeof this.config.userKeys];

    if (!key) {
      return null;
    }

    return {
      provider,
      key,
      source: 'user',
      tier: 'free',
    };
  }

  /**
   * Get Waymaker-provided key (paid tiers)
   */
  private getWaymakerKey(provider: string): ApiKeySource | null {
    if (!this.config.waymakerToken) {
      throw new Error('Waymaker token not configured for paid tier');
    }

    // Waymaker token acts as a proxy - we use it to get actual provider keys
    return {
      provider,
      key: this.config.waymakerToken,
      source: 'waymaker',
      tier: this.config.tier,
    };
  }

  /**
   * Check if a provider is available
   */
  isProviderAvailable(provider: string): boolean {
    return this.getKey(provider) !== null;
  }

  /**
   * Get all available providers
   */
  getAvailableProviders(): string[] {
    const providers = ['openai', 'anthropic', 'google', 'xai', 'mistral', 'cohere', 'together', 'groq', 'ollama'];
    return providers.filter(p => this.isProviderAvailable(p));
  }

  /**
   * Validate configuration
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.config.tier === 'free') {
      if (!this.config.userKeys || Object.keys(this.config.userKeys).length === 0) {
        errors.push('Free tier requires at least one user-provided API key');
      }
    } else {
      if (!this.config.waymakerToken) {
        errors.push(`${this.config.tier} tier requires a Waymaker token`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get tier information
   */
  getTierInfo(): {
    tier: TierType;
    keySource: 'user' | 'waymaker';
    providersAvailable: number;
    hasTokens: boolean;
  } {
    return {
      tier: this.config.tier,
      keySource: this.config.tier === 'free' ? 'user' : 'waymaker',
      providersAvailable: this.getAvailableProviders().length,
      hasTokens: this.config.tier !== 'free',
    };
  }
}

/**
 * Create API Key Manager from environment variables
 */
export function createApiKeyManagerFromEnv(): ApiKeyManager {
  // Check if Waymaker token is present (paid tier)
  const waymakerToken = process.env.WAYMAKER_TOKEN || process.env.RANA_WAYMAKER_TOKEN;

  if (waymakerToken) {
    return new ApiKeyManager({
      tier: 'waymaker-pro',
      waymakerToken,
      waymakerApiUrl: process.env.WAYMAKER_API_URL || 'https://api.waymaker.cx',
    });
  }

  // Otherwise use free tier with user's own keys
  return new ApiKeyManager({
    tier: 'free',
    userKeys: {
      openai: process.env.OPENAI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
      google: process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_API_KEY,
      xai: process.env.XAI_API_KEY,
      mistral: process.env.MISTRAL_API_KEY,
      cohere: process.env.COHERE_API_KEY,
      together: process.env.TOGETHER_API_KEY,
      groq: process.env.GROQ_API_KEY,
      ollama: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    },
  });
}

/**
 * Helper to create a free tier config
 */
export function createFreeTierConfig(userKeys: ApiKeyConfig['userKeys']): ApiKeyConfig {
  return {
    tier: 'free',
    userKeys,
  };
}

/**
 * Helper to create a Waymaker Pro config
 */
export function createWaymakerProConfig(waymakerToken: string): ApiKeyConfig {
  return {
    tier: 'waymaker-pro',
    waymakerToken,
    waymakerApiUrl: 'https://api.waymaker.cx',
  };
}

/**
 * Helper to create an Enterprise config
 */
export function createEnterpriseConfig(waymakerToken: string, apiUrl?: string): ApiKeyConfig {
  return {
    tier: 'enterprise',
    waymakerToken,
    waymakerApiUrl: apiUrl || 'https://api.waymaker.cx',
  };
}
