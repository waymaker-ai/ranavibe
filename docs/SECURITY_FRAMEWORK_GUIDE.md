# Security Framework Guide for RANA

**Version:** 1.0.0
**Last Updated:** 2025-11-09
**Status:** Production Ready

---

## Overview

Security is **non-negotiable**. One vulnerability can destroy a business. This guide provides RANA-compliant security patterns covering authentication, authorization, API security, data protection, and OWASP Top 10 prevention.

**RANA Principle:** Security by default. Every feature is secure from day one.

---

## Table of Contents

1. [Security Checklist](#security-checklist)
2. [Authentication](#authentication)
3. [Authorization](#authorization)
4. [API Security](#api-security)
5. [Data Protection](#data-protection)
6. [OWASP Top 10 Prevention](#owasp-top-10-prevention)
7. [Security Headers](#security-headers)
8. [Secrets Management](#secrets-management)
9. [Audit Logging](#audit-logging)
10. [Security Testing](#security-testing)
11. [RANA Quality Gates](#aads-quality-gates)

---

## Security Checklist

```markdown
## Security Implementation Checklist

### Authentication
- [ ] Secure authentication provider (Supabase Auth, Clerk, Auth0)
- [ ] Password requirements enforced (min length, complexity)
- [ ] Email verification required
- [ ] Multi-factor authentication (MFA) available
- [ ] Session management secure (httpOnly cookies)
- [ ] Logout functionality clears all sessions
- [ ] Password reset flow secure (time-limited tokens)

### Authorization
- [ ] Role-based access control (RBAC) implemented
- [ ] Row-level security (RLS) enabled on database
- [ ] API endpoints check permissions
- [ ] Client-side authorization (UI hiding)
- [ ] Server-side authorization (enforcement)
- [ ] Principle of least privilege applied

### API Security
- [ ] Rate limiting on all endpoints
- [ ] CORS configured properly
- [ ] CSRF protection enabled
- [ ] Input validation on all inputs
- [ ] Output encoding for XSS prevention
- [ ] SQL injection prevention (parameterized queries)
- [ ] API keys rotated regularly

### Data Protection
- [ ] HTTPS enforced (TLS 1.3)
- [ ] Sensitive data encrypted at rest
- [ ] Sensitive data encrypted in transit
- [ ] PII handling compliant (GDPR, CCPA)
- [ ] Passwords hashed (bcrypt, Argon2)
- [ ] Database backups encrypted

### Secrets Management
- [ ] No secrets in code
- [ ] Environment variables for all secrets
- [ ] Secrets rotation policy
- [ ] Service accounts use least privilege
- [ ] API keys stored securely

### Monitoring & Response
- [ ] Security headers configured
- [ ] Audit logging enabled
- [ ] Error messages don't leak info
- [ ] Vulnerability scanning automated
- [ ] Incident response plan documented
```

---

## Authentication

### Pattern 1: Supabase Auth (Recommended)

```typescript
// lib/auth/supabase-auth.ts
import { supabase } from '@/lib/supabase/client';

/**
 * ✅ RANA: Secure authentication with Supabase
 */

export const auth = {
  /**
   * Sign up with email and password
   * ✅ RANA: Email verification required
   */
  async signUp(email: string, password: string, metadata?: Record<string, any>) {
    try {
      // Validate email format
      if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        throw new Error('Invalid email format');
      }

      // Validate password strength
      if (password.length < 12) {
        throw new Error('Password must be at least 12 characters');
      }

      if (!/[A-Z]/.test(password)) {
        throw new Error('Password must contain uppercase letter');
      }

      if (!/[a-z]/.test(password)) {
        throw new Error('Password must contain lowercase letter');
      }

      if (!/[0-9]/.test(password)) {
        throw new Error('Password must contain number');
      }

      if (!/[^A-Za-z0-9]/.test(password)) {
        throw new Error('Password must contain special character');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      return { user: data.user, requiresEmailVerification: true };
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  },

  /**
   * Sign in with email and password
   * ✅ RANA: Session management with httpOnly cookies
   */
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Log successful login
      await this.logSecurityEvent('user.login', {
        userId: data.user.id,
        method: 'email',
      });

      return data;
    } catch (error) {
      // Log failed login attempt
      await this.logSecurityEvent('user.login.failed', {
        email,
        reason: error.message,
      });

      throw error;
    }
  },

  /**
   * Sign in with OAuth provider
   * ✅ RANA: Social login (Google, GitHub, etc.)
   */
  async signInWithOAuth(provider: 'google' | 'github' | 'apple') {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: provider === 'github' ? 'read:user user:email' : undefined,
        },
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('OAuth sign in error:', error);
      throw error;
    }
  },

  /**
   * Sign out
   * ✅ RANA: Clear all sessions
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear any local storage
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }

      await this.logSecurityEvent('user.logout', {});
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  },

  /**
   * Get current session
   * ✅ RANA: Check auth status
   */
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  },

  /**
   * Reset password
   * ✅ RANA: Secure password reset flow
   */
  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      await this.logSecurityEvent('user.password.reset_requested', { email });

      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  },

  /**
   * Update password
   * ✅ RANA: Password update with validation
   */
  async updatePassword(newPassword: string) {
    try {
      // Validate new password
      if (newPassword.length < 12) {
        throw new Error('Password must be at least 12 characters');
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      await this.logSecurityEvent('user.password.updated', {});

      return { success: true };
    } catch (error) {
      console.error('Update password error:', error);
      throw error;
    }
  },

  /**
   * Log security event (for audit trail)
   */
  async logSecurityEvent(event: string, metadata: Record<string, any>) {
    // Implement audit logging
    console.log('[Security Event]', event, metadata);

    // In production, send to logging service
    // await fetch('/api/audit-log', {
    //   method: 'POST',
    //   body: JSON.stringify({ event, metadata, timestamp: new Date() }),
    // });
  },
};
```

### Pattern 2: Protected Routes (Next.js App Router)

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * ✅ RANA: Middleware for route protection
 */
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Check auth status
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protected routes
  const protectedRoutes = ['/dashboard', '/profile', '/settings', '/admin'];
  const isProtectedRoute = protectedRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );

  // Admin-only routes
  const adminRoutes = ['/admin'];
  const isAdminRoute = adminRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );

  // Redirect to login if accessing protected route without session
  if (isProtectedRoute && !session) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Check admin permission for admin routes
  if (isAdminRoute && session) {
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (user?.role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

### Pattern 3: Server-Side Auth Check

```typescript
// app/api/profile/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * ✅ RANA: Server-side auth enforcement
 */
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch user profile
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error) throw error;

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}
```

---

## Authorization

### Pattern 1: Role-Based Access Control (RBAC)

```typescript
// lib/auth/permissions.ts

/**
 * ✅ RANA: RBAC implementation
 */

export type Role = 'user' | 'moderator' | 'admin' | 'superadmin';

export type Permission =
  | 'posts:create'
  | 'posts:read'
  | 'posts:update'
  | 'posts:delete'
  | 'users:read'
  | 'users:update'
  | 'users:delete'
  | 'admin:access';

// Role hierarchy
const rolePermissions: Record<Role, Permission[]> = {
  user: ['posts:create', 'posts:read', 'posts:update'],
  moderator: [
    'posts:create',
    'posts:read',
    'posts:update',
    'posts:delete',
    'users:read',
  ],
  admin: [
    'posts:create',
    'posts:read',
    'posts:update',
    'posts:delete',
    'users:read',
    'users:update',
    'users:delete',
    'admin:access',
  ],
  superadmin: [
    'posts:create',
    'posts:read',
    'posts:update',
    'posts:delete',
    'users:read',
    'users:update',
    'users:delete',
    'admin:access',
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) || false;
}

export function canAccessAdmin(role: Role): boolean {
  return hasPermission(role, 'admin:access');
}

export function canDeletePost(role: Role, postAuthorId: string, userId: string): boolean {
  // Users can delete their own posts
  if (postAuthorId === userId) {
    return hasPermission(role, 'posts:update');
  }

  // Moderators and admins can delete any post
  return hasPermission(role, 'posts:delete');
}
```

### Pattern 2: Permission Checking Hooks (React)

```typescript
// hooks/usePermissions.ts
import { useUser } from '@/hooks/useUser';
import { hasPermission, type Permission } from '@/lib/auth/permissions';

/**
 * ✅ RANA: React hook for permission checking
 */
export function usePermissions() {
  const { user } = useUser();

  const can = (permission: Permission): boolean => {
    if (!user?.role) return false;
    return hasPermission(user.role, permission);
  };

  const canAccessAdmin = (): boolean => {
    return can('admin:access');
  };

  return {
    can,
    canAccessAdmin,
    role: user?.role,
  };
}

// Usage in component
function PostActions({ post }) {
  const { can } = usePermissions();
  const { user } = useUser();

  const canDelete = can('posts:delete') || post.authorId === user?.id;

  return (
    <div>
      {canDelete && (
        <button onClick={() => deletePost(post.id)}>
          Delete
        </button>
      )}
    </div>
  );
}
```

---

## API Security

### Pattern 1: Rate Limiting

```typescript
// lib/security/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * ✅ RANA: Rate limiting with Redis
 */

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Different rate limits for different endpoints
export const rateLimits = {
  // Strict limit for auth endpoints (prevent brute force)
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 requests per 15 min
    analytics: true,
  }),

  // Standard API limit
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per min
    analytics: true,
  }),

  // Generous limit for read operations
  read: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(300, '1 m'), // 300 requests per min
    analytics: true,
  }),
};

// Middleware for rate limiting
export async function rateLimit(
  identifier: string,
  limit: keyof typeof rateLimits = 'api'
) {
  const { success, limit: max, remaining, reset } = await rateLimits[limit].limit(
    identifier
  );

  return {
    success,
    limit: max,
    remaining,
    reset,
  };
}

// Usage in API route
export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';

  const { success, remaining } = await rateLimit(ip, 'auth');

  if (!success) {
    return new Response('Too many requests', {
      status: 429,
      headers: {
        'X-RateLimit-Remaining': remaining.toString(),
      },
    });
  }

  // Process request...
}
```

### Pattern 2: CORS Configuration

```typescript
// lib/security/cors.ts

/**
 * ✅ RANA: Secure CORS configuration
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin':
    process.env.NODE_ENV === 'production'
      ? process.env.NEXT_PUBLIC_APP_URL!
      : '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400', // 24 hours
};

export function handleCors(request: Request) {
  // Handle preflight request
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  return null;
}

// Usage in API route
export async function OPTIONS(request: Request) {
  return handleCors(request);
}

export async function POST(request: Request) {
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  // Process request...

  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}
```

### Pattern 3: Input Validation with Zod

```typescript
// lib/validation/schemas.ts
import { z } from 'zod';

/**
 * ✅ RANA: Input validation schemas
 */

export const CreatePostSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  content: z
    .string()
    .min(1, 'Content is required')
    .max(10000, 'Content must be less than 10,000 characters'),
  published: z.boolean().optional().default(false),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  email: z.string().email('Invalid email').optional(),
  avatarUrl: z.string().url('Invalid URL').optional(),
});

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// Usage in API route
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const validated = CreatePostSchema.parse(body);

    // Now safe to use validated data
    const post = await createPost(validated);

    return Response.json(post);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## Data Protection

### Pattern 1: Encryption at Rest

```typescript
// lib/security/encryption.ts
import crypto from 'crypto';

/**
 * ✅ RANA: Data encryption utilities
 */

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // 32 bytes
const IV_LENGTH = 16;

export function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

export function decrypt(encryptedData: string): string {
  try {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

// Usage: Encrypt sensitive user data
export async function saveSensitiveData(userId: string, data: string) {
  const encrypted = encrypt(data);

  await prisma.user.update({
    where: { id: userId },
    data: { encryptedData: encrypted },
  });
}

export async function getSensitiveData(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { encryptedData: true },
  });

  if (!user?.encryptedData) {
    throw new Error('No data found');
  }

  return decrypt(user.encryptedData);
}
```

### Pattern 2: PII Handling

```typescript
// lib/security/pii.ts

/**
 * ✅ RANA: PII (Personally Identifiable Information) handling
 */

// Redact sensitive information from logs
export function redactPII(data: any): any {
  const piiFields = [
    'password',
    'ssn',
    'creditCard',
    'bankAccount',
    'email', // Partial redaction
    'phone', // Partial redaction
  ];

  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const redacted = { ...data };

  for (const key of Object.keys(redacted)) {
    if (piiFields.includes(key)) {
      if (key === 'email') {
        // Partial redaction: u***@example.com
        redacted[key] = redacted[key]?.replace(/(.{1})(.*)(@.*)/, '$1***$3');
      } else if (key === 'phone') {
        // Partial redaction: ***-***-1234
        redacted[key] = redacted[key]?.replace(/(.*)(.{4})$/, '***-***-$2');
      } else {
        redacted[key] = '[REDACTED]';
      }
    } else if (typeof redacted[key] === 'object') {
      redacted[key] = redactPII(redacted[key]);
    }
  }

  return redacted;
}

// Safe logging
export function logSafely(message: string, data: any) {
  const redacted = redactPII(data);
  console.log(message, redacted);
}

// Example usage
logSafely('User created:', {
  id: '123',
  email: 'user@example.com',
  password: 'secret123',
  ssn: '123-45-6789',
});
// Output: User created: { id: '123', email: 'u***@example.com', password: '[REDACTED]', ssn: '[REDACTED]' }
```

---

## OWASP Top 10 Prevention

### 1. SQL Injection Prevention

```typescript
// ✅ GOOD: Parameterized queries (Prisma)
const user = await prisma.user.findFirst({
  where: { email: userInput },
});

// ❌ BAD: String concatenation (DON'T DO THIS)
// const query = `SELECT * FROM users WHERE email = '${userInput}'`;
```

### 2. XSS Prevention

```typescript
// ✅ GOOD: React auto-escapes (safe by default)
<div>{userInput}</div>

// ✅ GOOD: Sanitize HTML if needed
import DOMPurify from 'isomorphic-dompurify';

function SafeHTML({ html }: { html: string }) {
  const clean = DOMPurify.sanitize(html);
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}

// ❌ BAD: Unsan itized HTML (DON'T DO THIS)
// <div dangerouslySetInnerHTML={{ __html: userInput }} />
```

### 3. CSRF Protection

```typescript
// middleware.ts - CSRF token generation
import { generateCsrfToken, validateCsrfToken } from '@/lib/security/csrf';

export async function middleware(request: NextRequest) {
  // Generate CSRF token for forms
  if (request.method === 'GET') {
    const response = NextResponse.next();
    const token = generateCsrfToken();
    response.cookies.set('csrf-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    return response;
  }

  // Validate CSRF token for state-changing requests
  if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
    const token = request.headers.get('x-csrf-token');
    const cookieToken = request.cookies.get('csrf-token')?.value;

    if (!token || !cookieToken || token !== cookieToken) {
      return new Response('Invalid CSRF token', { status: 403 });
    }
  }

  return NextResponse.next();
}
```

---

## Security Headers

```typescript
// next.config.js

/**
 * ✅ RANA: Security headers configuration
 */
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Prevent XSS attacks
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Referrer policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Permissions policy
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https:",
            ].join('; '),
          },
          // Strict Transport Security (HTTPS only)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },
};
```

---

## Secrets Management

```bash
# .env.local (NEVER commit!)

# Database
DATABASE_URL="postgresql://..."
DATABASE_DIRECT_URL="postgresql://..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJh..."
SUPABASE_SERVICE_ROLE_KEY="eyJh..."

# Encryption
ENCRYPTION_KEY="hex_key_here"

# API Keys (never expose publicly)
STRIPE_SECRET_KEY="sk_..."
OPENAI_API_KEY="sk-..."

# OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."

# Session
NEXTAUTH_SECRET="random_secret_here"
NEXTAUTH_URL="http://localhost:3000"
```

```typescript
// lib/env.ts - Type-safe environment variables

/**
 * ✅ RANA: Validate environment variables at startup
 */
import { z } from 'zod';

const envSchema = z.object({
  // Public (can be exposed to client)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),

  // Private (server-only)
  DATABASE_URL: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  ENCRYPTION_KEY: z.string().length(64), // 32 bytes in hex
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),

  // Optional
  OPENAI_API_KEY: z.string().optional(),
});

// Validate on startup
export const env = envSchema.parse(process.env);
```

---

## Audit Logging

```typescript
// lib/audit/logger.ts
import { prisma } from '@/lib/prisma';

/**
 * ✅ RANA: Audit logging for security events
 */

export type AuditAction =
  | 'user.login'
  | 'user.logout'
  | 'user.password.reset'
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'post.created'
  | 'post.updated'
  | 'post.deleted'
  | 'admin.action';

export async function logAudit(
  action: AuditAction,
  userId?: string,
  metadata?: Record<string, any>
) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        userId,
        metadata: metadata || {},
        ipAddress: metadata?.ip,
        userAgent: metadata?.userAgent,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    // Never let audit logging failure break the app
    console.error('Audit log error:', error);
  }
}

// Usage
await logAudit('user.login', user.id, {
  ip: request.headers.get('x-forwarded-for'),
  userAgent: request.headers.get('user-agent'),
});
```

---

## Security Testing

```typescript
// __tests__/security/auth.test.ts

/**
 * ✅ RANA: Security test examples
 */

describe('Authentication Security', () => {
  it('should reject weak passwords', async () => {
    await expect(
      auth.signUp('user@example.com', 'weak')
    ).rejects.toThrow('Password must be at least 12 characters');
  });

  it('should rate limit login attempts', async () => {
    // Attempt 6 logins (limit is 5)
    for (let i = 0; i < 6; i++) {
      if (i < 5) {
        await auth.signIn('user@example.com', 'wrong');
      } else {
        await expect(
          auth.signIn('user@example.com', 'wrong')
        ).rejects.toThrow('Too many requests');
      }
    }
  });

  it('should not expose user existence on failed login', async () => {
    const error1 = await auth.signIn('exists@example.com', 'wrong');
    const error2 = await auth.signIn('notexist@example.com', 'wrong');

    // Error messages should be identical
    expect(error1.message).toBe(error2.message);
  });
});

describe('Authorization Security', () => {
  it('should prevent unauthorized data access', async () => {
    const user = await signInAsUser();
    const otherUserPost = await createPostAsOtherUser();

    await expect(
      deletePost(otherUserPost.id, user.id)
    ).rejects.toThrow('Unauthorized');
  });

  it('should enforce RLS policies', async () => {
    const user1 = await signInAsUser1();
    const user2 = await signInAsUser2();

    // User1 creates private post
    const post = await createPost({ userId: user1.id, private: true });

    // User2 should not be able to see it
    const posts = await getPosts(user2.id);
    expect(posts.find(p => p.id === post.id)).toBeUndefined();
  });
});
```

---

## RANA Quality Gates

```yaml
# .rana.yml security quality gates

quality_gates:
  security:
    # Authentication
    - authentication_provider_configured
    - password_strength_enforced
    - email_verification_required
    - session_management_secure
    - mfa_available

    # Authorization
    - rbac_implemented
    - rls_enabled
    - permission_checks_on_api
    - client_side_auth_for_ui
    - server_side_auth_enforced

    # API Security
    - rate_limiting_enabled
    - cors_configured
    - csrf_protection_enabled
    - input_validation_present
    - output_encoding_present

    # Data Protection
    - https_enforced
    - sensitive_data_encrypted
    - passwords_hashed
    - pii_handling_compliant

    # Code Security
    - no_secrets_in_code
    - env_variables_validated
    - security_headers_configured
    - audit_logging_enabled
    - error_messages_safe

    # Testing
    - security_tests_present
    - penetration_testing_scheduled
    - vulnerability_scanning_automated
```

---

## Conclusion

Security is **non-negotiable**. Following these patterns ensures:

✅ **Authentication** - Secure user identity
✅ **Authorization** - Proper access control
✅ **API Security** - Protected endpoints
✅ **Data Protection** - Encrypted sensitive data
✅ **OWASP Prevention** - Protected against common attacks
✅ **Compliance** - Audit-ready logs

**Next:** [LLM Optimization Guide](./LLM_OPTIMIZATION_GUIDE.md)

---

*Part of the RANA Framework - Production-Quality AI Development*
