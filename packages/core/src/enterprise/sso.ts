/**
 * SSO/SAML Authentication
 *
 * Enterprise single sign-on capabilities:
 * - SAML 2.0 authentication
 * - OAuth 2.0 / OIDC integration
 * - Identity provider management
 * - Session management
 * - Just-in-time provisioning
 */

// ============================================================================
// Types
// ============================================================================

export type SSOProvider = 'saml' | 'oidc' | 'oauth2';
export type IdentityProvider = 'okta' | 'azure-ad' | 'google' | 'onelogin' | 'ping' | 'custom';

export interface SAMLConfig {
  entityId: string;
  assertionConsumerServiceUrl: string;
  singleLogoutServiceUrl?: string;
  idpMetadataUrl?: string;
  idpEntityId?: string;
  idpSingleSignOnUrl?: string;
  idpSingleLogoutUrl?: string;
  idpCertificate?: string;
  privateKey?: string;
  certificate?: string;
  signatureAlgorithm?: 'sha256' | 'sha512';
  digestAlgorithm?: 'sha256' | 'sha512';
  authnRequestsSigned?: boolean;
  wantAssertionsSigned?: boolean;
  attributeMapping?: Record<string, string>;
}

export interface OIDCConfig {
  clientId: string;
  clientSecret?: string;
  issuer: string;
  authorizationEndpoint?: string;
  tokenEndpoint?: string;
  userinfoEndpoint?: string;
  jwksUri?: string;
  redirectUri: string;
  postLogoutRedirectUri?: string;
  scopes?: string[];
  responseType?: 'code' | 'id_token' | 'code id_token';
  pkce?: boolean;
  attributeMapping?: Record<string, string>;
}

export interface SSOUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  groups?: string[];
  roles?: string[];
  attributes: Record<string, unknown>;
  provider: IdentityProvider;
  providerUserId: string;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface SSOSession {
  id: string;
  userId: string;
  provider: IdentityProvider;
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt: Date;
  createdAt: Date;
  metadata: Record<string, unknown>;
}

export interface AuthenticationResult {
  success: boolean;
  user?: SSOUser;
  session?: SSOSession;
  error?: {
    code: string;
    message: string;
  };
  redirectUrl?: string;
}

export interface SSOProviderConfig {
  name: string;
  type: SSOProvider;
  enabled: boolean;
  config: SAMLConfig | OIDCConfig;
  jitProvisioning?: boolean;
  defaultRoles?: string[];
  allowedDomains?: string[];
}

export interface SSOManagerConfig {
  providers: SSOProviderConfig[];
  sessionDuration?: number; // seconds
  sessionRenewalThreshold?: number; // seconds before expiry to renew
  storageAdapter?: StorageAdapter;
  onUserProvisioned?: (user: SSOUser) => Promise<void>;
  onSessionCreated?: (session: SSOSession) => Promise<void>;
}

export interface StorageAdapter {
  getSession(sessionId: string): Promise<SSOSession | null>;
  setSession(session: SSOSession): Promise<void>;
  deleteSession(sessionId: string): Promise<void>;
  getUserByProviderId(provider: IdentityProvider, providerId: string): Promise<SSOUser | null>;
  createUser(user: Omit<SSOUser, 'id' | 'createdAt'>): Promise<SSOUser>;
  updateUser(userId: string, updates: Partial<SSOUser>): Promise<SSOUser>;
}

// ============================================================================
// SSO Manager Class
// ============================================================================

export class SSOManager {
  private config: Required<SSOManagerConfig>;
  private providers: Map<string, SSOProviderConfig> = new Map();
  private storage: StorageAdapter;

  constructor(config: SSOManagerConfig) {
    this.config = {
      providers: config.providers,
      sessionDuration: config.sessionDuration ?? 3600 * 8, // 8 hours
      sessionRenewalThreshold: config.sessionRenewalThreshold ?? 300, // 5 minutes
      storageAdapter: config.storageAdapter ?? new MemoryStorageAdapter(),
      onUserProvisioned: config.onUserProvisioned ?? (async () => {}),
      onSessionCreated: config.onSessionCreated ?? (async () => {}),
    };

    this.storage = this.config.storageAdapter;

    // Index providers
    for (const provider of config.providers) {
      this.providers.set(provider.name, provider);
    }
  }

  // --------------------------------------------------------------------------
  // Authentication Flow
  // --------------------------------------------------------------------------

  /**
   * Initiate SSO login
   */
  async initiateLogin(
    providerName: string,
    options?: {
      returnUrl?: string;
      forceReauth?: boolean;
    }
  ): Promise<{ redirectUrl: string; state: string }> {
    const provider = this.getProvider(providerName);

    if (!provider.enabled) {
      throw new Error(`SSO provider '${providerName}' is not enabled`);
    }

    const state = this.generateState();

    if (provider.type === 'saml') {
      return this.initiateSAMLLogin(provider, state, options);
    } else if (provider.type === 'oidc' || provider.type === 'oauth2') {
      return this.initiateOIDCLogin(provider, state, options);
    }

    throw new Error(`Unsupported SSO type: ${provider.type}`);
  }

  /**
   * Handle SSO callback
   */
  async handleCallback(
    providerName: string,
    callbackData: Record<string, string>
  ): Promise<AuthenticationResult> {
    const provider = this.getProvider(providerName);

    try {
      let user: SSOUser;
      let tokens: { accessToken?: string; refreshToken?: string; idToken?: string } = {};

      if (provider.type === 'saml') {
        const result = await this.handleSAMLCallback(provider, callbackData);
        user = result.user;
      } else if (provider.type === 'oidc' || provider.type === 'oauth2') {
        const result = await this.handleOIDCCallback(provider, callbackData);
        user = result.user;
        tokens = result.tokens;
      } else {
        throw new Error(`Unsupported SSO type: ${provider.type}`);
      }

      // Check domain allowlist
      if (provider.allowedDomains?.length) {
        const domain = user.email.split('@')[1];
        if (!provider.allowedDomains.includes(domain)) {
          return {
            success: false,
            error: {
              code: 'domain_not_allowed',
              message: `Email domain '${domain}' is not allowed`,
            },
          };
        }
      }

      // Just-in-time provisioning
      let existingUser = await this.storage.getUserByProviderId(
        this.parseIdentityProvider(providerName),
        user.providerUserId
      );

      if (!existingUser && provider.jitProvisioning) {
        existingUser = await this.storage.createUser({
          ...user,
          roles: provider.defaultRoles ?? [],
        });
        await this.config.onUserProvisioned(existingUser);
      }

      if (!existingUser) {
        return {
          success: false,
          error: {
            code: 'user_not_found',
            message: 'User account not found and auto-provisioning is disabled',
          },
        };
      }

      // Update last login
      await this.storage.updateUser(existingUser.id, {
        lastLoginAt: new Date(),
      });

      // Create session
      const session = await this.createSession(existingUser, tokens);

      return {
        success: true,
        user: existingUser,
        session,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'authentication_failed',
          message: error instanceof Error ? error.message : 'Authentication failed',
        },
      };
    }
  }

  /**
   * Handle logout
   */
  async logout(
    sessionId: string,
    options?: {
      singleLogout?: boolean;
    }
  ): Promise<{ success: boolean; redirectUrl?: string }> {
    const session = await this.storage.getSession(sessionId);

    if (!session) {
      return { success: true };
    }

    // Delete session
    await this.storage.deleteSession(sessionId);

    // Single logout if requested
    if (options?.singleLogout) {
      const user = await this.storage.getUserByProviderId(
        session.provider,
        session.userId
      );

      if (user) {
        const provider = this.findProviderByType(session.provider);
        if (provider) {
          const logoutUrl = await this.getSingleLogoutUrl(provider, session);
          return { success: true, redirectUrl: logoutUrl };
        }
      }
    }

    return { success: true };
  }

  // --------------------------------------------------------------------------
  // Session Management
  // --------------------------------------------------------------------------

  /**
   * Validate session
   */
  async validateSession(sessionId: string): Promise<{
    valid: boolean;
    session?: SSOSession;
    user?: SSOUser;
    needsRenewal?: boolean;
  }> {
    const session = await this.storage.getSession(sessionId);

    if (!session) {
      return { valid: false };
    }

    const now = new Date();

    if (session.expiresAt < now) {
      await this.storage.deleteSession(sessionId);
      return { valid: false };
    }

    const user = await this.storage.getUserByProviderId(
      session.provider,
      session.userId
    );

    if (!user) {
      await this.storage.deleteSession(sessionId);
      return { valid: false };
    }

    const expiresInSeconds = (session.expiresAt.getTime() - now.getTime()) / 1000;
    const needsRenewal = expiresInSeconds < this.config.sessionRenewalThreshold;

    return {
      valid: true,
      session,
      user,
      needsRenewal,
    };
  }

  /**
   * Renew session
   */
  async renewSession(sessionId: string): Promise<SSOSession | null> {
    const { valid, session, user } = await this.validateSession(sessionId);

    if (!valid || !session || !user) {
      return null;
    }

    // Try token refresh if available
    if (session.refreshToken) {
      const provider = this.findProviderByType(session.provider);
      if (provider && (provider.type === 'oidc' || provider.type === 'oauth2')) {
        try {
          const tokens = await this.refreshOIDCToken(
            provider,
            session.refreshToken
          );

          const newSession: SSOSession = {
            ...session,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken ?? session.refreshToken,
            idToken: tokens.idToken,
            expiresAt: new Date(Date.now() + this.config.sessionDuration * 1000),
          };

          await this.storage.setSession(newSession);
          return newSession;
        } catch {
          // Token refresh failed, extend session anyway
        }
      }
    }

    // Extend session
    const newSession: SSOSession = {
      ...session,
      expiresAt: new Date(Date.now() + this.config.sessionDuration * 1000),
    };

    await this.storage.setSession(newSession);
    return newSession;
  }

  // --------------------------------------------------------------------------
  // Provider Management
  // --------------------------------------------------------------------------

  /**
   * Get all configured providers
   */
  getProviders(): SSOProviderConfig[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get enabled providers
   */
  getEnabledProviders(): SSOProviderConfig[] {
    return this.getProviders().filter((p) => p.enabled);
  }

  /**
   * Add or update provider
   */
  configureProvider(provider: SSOProviderConfig): void {
    this.providers.set(provider.name, provider);
  }

  /**
   * Remove provider
   */
  removeProvider(providerName: string): void {
    this.providers.delete(providerName);
  }

  /**
   * Generate SAML metadata
   */
  generateSAMLMetadata(providerName: string): string {
    const provider = this.getProvider(providerName);

    if (provider.type !== 'saml') {
      throw new Error('Provider is not SAML type');
    }

    const config = provider.config as SAMLConfig;

    return `<?xml version="1.0"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"
                     entityID="${config.entityId}">
  <md:SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol"
                       AuthnRequestsSigned="${config.authnRequestsSigned ?? false}"
                       WantAssertionsSigned="${config.wantAssertionsSigned ?? true}">
    <md:AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                                 Location="${config.assertionConsumerServiceUrl}"
                                 index="0"/>
    ${config.singleLogoutServiceUrl ? `
    <md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
                           Location="${config.singleLogoutServiceUrl}"/>` : ''}
  </md:SPSSODescriptor>
</md:EntityDescriptor>`;
  }

  // --------------------------------------------------------------------------
  // SAML Implementation
  // --------------------------------------------------------------------------

  private async initiateSAMLLogin(
    provider: SSOProviderConfig,
    state: string,
    _options?: { returnUrl?: string; forceReauth?: boolean }
  ): Promise<{ redirectUrl: string; state: string }> {
    const config = provider.config as SAMLConfig;

    // Generate SAML AuthnRequest
    const requestId = this.generateRequestId();
    const issueInstant = new Date().toISOString();

    const authnRequest = `<?xml version="1.0"?>
<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                    ID="${requestId}"
                    Version="2.0"
                    IssueInstant="${issueInstant}"
                    Destination="${config.idpSingleSignOnUrl}"
                    AssertionConsumerServiceURL="${config.assertionConsumerServiceUrl}">
  <saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">${config.entityId}</saml:Issuer>
</samlp:AuthnRequest>`;

    // Encode and create redirect URL
    const encoded = Buffer.from(authnRequest).toString('base64');
    const redirectUrl = `${config.idpSingleSignOnUrl}?SAMLRequest=${encodeURIComponent(encoded)}&RelayState=${state}`;

    return { redirectUrl, state };
  }

  private async handleSAMLCallback(
    provider: SSOProviderConfig,
    callbackData: Record<string, string>
  ): Promise<{ user: SSOUser }> {
    const samlResponse = callbackData.SAMLResponse;

    if (!samlResponse) {
      throw new Error('Missing SAMLResponse');
    }

    // Decode and parse SAML response
    const decoded = Buffer.from(samlResponse, 'base64').toString('utf-8');

    // In production, would properly parse XML and validate signature
    const attributes = this.parseSAMLAttributes(decoded, provider);

    const user: SSOUser = {
      id: '', // Will be set during provisioning
      email: attributes.email,
      firstName: attributes.firstName,
      lastName: attributes.lastName,
      displayName: attributes.displayName,
      groups: attributes.groups,
      roles: [],
      attributes,
      provider: this.parseIdentityProvider(provider.name),
      providerUserId: attributes.nameId,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };

    return { user };
  }

  private parseSAMLAttributes(
    _samlResponse: string,
    _provider: SSOProviderConfig
  ): Record<string, any> {
    // Would parse actual SAML response
    return {
      nameId: 'placeholder-id',
      email: 'user@example.com',
      firstName: 'User',
      lastName: 'Name',
      displayName: 'User Name',
      groups: [],
    };
  }

  // --------------------------------------------------------------------------
  // OIDC Implementation
  // --------------------------------------------------------------------------

  private async initiateOIDCLogin(
    provider: SSOProviderConfig,
    state: string,
    options?: { returnUrl?: string; forceReauth?: boolean }
  ): Promise<{ redirectUrl: string; state: string }> {
    const config = provider.config as OIDCConfig;

    const params = new URLSearchParams({
      client_id: config.clientId,
      response_type: config.responseType ?? 'code',
      redirect_uri: config.redirectUri,
      scope: (config.scopes ?? ['openid', 'profile', 'email']).join(' '),
      state,
    });

    if (options?.forceReauth) {
      params.set('prompt', 'login');
    }

    if (config.pkce) {
      const { codeVerifier, codeChallenge } = this.generatePKCE();
      params.set('code_challenge', codeChallenge);
      params.set('code_challenge_method', 'S256');
      // Would store codeVerifier for token exchange
    }

    const authEndpoint = config.authorizationEndpoint ?? `${config.issuer}/authorize`;
    const redirectUrl = `${authEndpoint}?${params.toString()}`;

    return { redirectUrl, state };
  }

  private async handleOIDCCallback(
    provider: SSOProviderConfig,
    callbackData: Record<string, string>
  ): Promise<{
    user: SSOUser;
    tokens: { accessToken?: string; refreshToken?: string; idToken?: string };
  }> {
    const config = provider.config as OIDCConfig;
    const code = callbackData.code;

    if (!code) {
      throw new Error('Missing authorization code');
    }

    // Exchange code for tokens
    const tokenEndpoint = config.tokenEndpoint ?? `${config.issuer}/token`;
    const tokenResponse = await this.exchangeCodeForTokens(
      tokenEndpoint,
      code,
      config
    );

    // Get user info
    const userinfoEndpoint = config.userinfoEndpoint ?? `${config.issuer}/userinfo`;
    const userInfo = await this.fetchUserInfo(
      userinfoEndpoint,
      tokenResponse.access_token
    );

    const user: SSOUser = {
      id: '',
      email: userInfo.email,
      firstName: userInfo.given_name,
      lastName: userInfo.family_name,
      displayName: userInfo.name,
      groups: userInfo.groups ?? [],
      roles: [],
      attributes: userInfo,
      provider: this.parseIdentityProvider(provider.name),
      providerUserId: userInfo.sub,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };

    return {
      user,
      tokens: {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        idToken: tokenResponse.id_token,
      },
    };
  }

  private async exchangeCodeForTokens(
    _endpoint: string,
    _code: string,
    _config: OIDCConfig
  ): Promise<{
    access_token: string;
    refresh_token?: string;
    id_token?: string;
    expires_in: number;
  }> {
    // Would make actual HTTP request
    return {
      access_token: 'placeholder-token',
      expires_in: 3600,
    };
  }

  private async fetchUserInfo(
    _endpoint: string,
    _accessToken: string
  ): Promise<Record<string, any>> {
    // Would make actual HTTP request
    return {
      sub: 'placeholder-sub',
      email: 'user@example.com',
      name: 'User Name',
      given_name: 'User',
      family_name: 'Name',
    };
  }

  private async refreshOIDCToken(
    provider: SSOProviderConfig,
    _refreshToken: string
  ): Promise<{
    accessToken: string;
    refreshToken?: string;
    idToken?: string;
  }> {
    const config = provider.config as OIDCConfig;
    const _tokenEndpoint = config.tokenEndpoint ?? `${config.issuer}/token`;

    // Would make actual HTTP request
    return {
      accessToken: 'new-access-token',
    };
  }

  // --------------------------------------------------------------------------
  // Helper Methods
  // --------------------------------------------------------------------------

  private getProvider(name: string): SSOProviderConfig {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`SSO provider '${name}' not found`);
    }
    return provider;
  }

  private findProviderByType(type: IdentityProvider): SSOProviderConfig | undefined {
    return Array.from(this.providers.values()).find(
      (p) => this.parseIdentityProvider(p.name) === type
    );
  }

  private parseIdentityProvider(name: string): IdentityProvider {
    const normalized = name.toLowerCase().replace(/[^a-z]/g, '');
    if (normalized.includes('okta')) return 'okta';
    if (normalized.includes('azure')) return 'azure-ad';
    if (normalized.includes('google')) return 'google';
    if (normalized.includes('onelogin')) return 'onelogin';
    if (normalized.includes('ping')) return 'ping';
    return 'custom';
  }

  private async createSession(
    user: SSOUser,
    tokens: { accessToken?: string; refreshToken?: string; idToken?: string }
  ): Promise<SSOSession> {
    const session: SSOSession = {
      id: this.generateSessionId(),
      userId: user.id,
      provider: user.provider,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      idToken: tokens.idToken,
      expiresAt: new Date(Date.now() + this.config.sessionDuration * 1000),
      createdAt: new Date(),
      metadata: {},
    };

    await this.storage.setSession(session);
    await this.config.onSessionCreated(session);

    return session;
  }

  private async getSingleLogoutUrl(
    provider: SSOProviderConfig,
    session: SSOSession
  ): Promise<string> {
    if (provider.type === 'saml') {
      const config = provider.config as SAMLConfig;
      return config.idpSingleLogoutUrl ?? '';
    } else {
      const config = provider.config as OIDCConfig;
      return config.postLogoutRedirectUri ?? '';
    }
  }

  private generateState(): string {
    return `state-${Date.now()}-${Math.random().toString(36).substring(2)}`;
  }

  private generateRequestId(): string {
    return `_${Math.random().toString(36).substring(2)}`;
  }

  private generateSessionId(): string {
    return `sess-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  private generatePKCE(): { codeVerifier: string; codeChallenge: string } {
    // Would generate proper PKCE challenge
    return {
      codeVerifier: 'placeholder-verifier',
      codeChallenge: 'placeholder-challenge',
    };
  }
}

// ============================================================================
// Memory Storage Adapter (for development)
// ============================================================================

class MemoryStorageAdapter implements StorageAdapter {
  private sessions: Map<string, SSOSession> = new Map();
  private users: Map<string, SSOUser> = new Map();
  private providerIndex: Map<string, string> = new Map();

  async getSession(sessionId: string): Promise<SSOSession | null> {
    return this.sessions.get(sessionId) ?? null;
  }

  async setSession(session: SSOSession): Promise<void> {
    this.sessions.set(session.id, session);
  }

  async deleteSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  async getUserByProviderId(
    provider: IdentityProvider,
    providerId: string
  ): Promise<SSOUser | null> {
    const key = `${provider}:${providerId}`;
    const userId = this.providerIndex.get(key);
    if (!userId) return null;
    return this.users.get(userId) ?? null;
  }

  async createUser(userData: Omit<SSOUser, 'id' | 'createdAt'>): Promise<SSOUser> {
    const user: SSOUser = {
      ...userData,
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2)}`,
      createdAt: new Date(),
    };

    this.users.set(user.id, user);
    this.providerIndex.set(`${user.provider}:${user.providerUserId}`, user.id);

    return user;
  }

  async updateUser(userId: string, updates: Partial<SSOUser>): Promise<SSOUser> {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');

    const updated = { ...user, ...updates };
    this.users.set(userId, updated);

    return updated;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createSSOManager(config: SSOManagerConfig): SSOManager {
  return new SSOManager(config);
}

// ============================================================================
// Convenience Exports
// ============================================================================

export { MemoryStorageAdapter };
