# RANA Template Guide

**Complete guide to using the Next.js + Supabase template**

---

## Quick Start

### 1. Create New Project

```bash
# Option A: Using create-aads-app (coming soon)
npx create-aads-app my-app --template nextjs-supabase

# Option B: Clone manually
git clone https://github.com/waymaker-ai/aads-template-nextjs-supabase my-app
cd my-app
npm install
```

### 2. Setup Supabase

**Create Supabase Project:**
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in project details
4. Wait for project to be created (~2 minutes)
5. Copy your project URL and keys

**Configure Environment:**
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME="My App"
```

### 3. Initialize RANA

```bash
npx aads init
npx aads db:setup
# Select: Supabase
# Follow prompts
```

### 4. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

---

## Template Structure

### Core Files

```
my-app/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Root layout with SEO
│   ├── page.tsx             # Home page
│   ├── globals.css          # Global styles
│   ├── sitemap.ts           # Dynamic sitemap
│   ├── robots.ts            # Robots.txt
│   ├── manifest.ts          # PWA manifest
│   └── api/                 # API routes
│       └── ai/
│           └── chat/        # AI chat endpoint
│               └── route.ts
├── components/
│   └── SEO.tsx              # SEO utilities
├── lib/
│   ├── supabase/            # Supabase clients
│   │   ├── client.ts        # Browser client
│   │   ├── server.ts        # Server client
│   │   └── middleware.ts    # Middleware client
│   ├── llm/                 # LLM utilities
│   │   ├── client.ts        # OpenAI/Anthropic clients
│   │   └── cache.ts         # Response caching
│   └── security/
│       └── rate-limit.ts    # Rate limiting
├── middleware.ts            # Auth + rate limiting
├── .rana.yml               # RANA configuration
├── .env.example            # Environment template
├── next.config.js          # Next.js config
├── tailwind.config.ts      # Tailwind config
└── package.json
```

---

## RANA Frameworks

### 1. Database Framework

**Location:** `lib/supabase/`

**Usage:**

```typescript
// Client component
'use client';
import { createClient } from '@/lib/supabase/client';

export default function MyComponent() {
  const supabase = createClient();

  async function getData() {
    const { data } = await supabase.from('items').select();
    return data;
  }
}
```

```typescript
// Server component
import { createClient } from '@/lib/supabase/server';

export default async function MyPage() {
  const supabase = createClient();
  const { data } = await supabase.from('items').select();

  return <div>{JSON.stringify(data)}</div>;
}
```

**Commands:**
```bash
npx aads db:migrate          # Run migrations
npx aads db:seed             # Seed data
npx aads db:studio           # Open Prisma Studio
npx aads db:status           # Show status
```

---

### 2. Security Framework

**Location:** `lib/security/`, `middleware.ts`

**Features:**
- ✅ Authentication (Supabase)
- ✅ Rate limiting (per IP)
- ✅ Security headers (CSP, HSTS, etc.)
- ✅ CORS configuration
- ✅ Input validation

**Rate Limiting:**

```typescript
// Default rate limit (100 req/min)
import { rateLimit } from '@/lib/security/rate-limit';

export async function GET(request: Request) {
  const { success } = await rateLimit(request.ip);
  if (!success) {
    return new Response('Too Many Requests', { status: 429 });
  }
}
```

```typescript
// Custom rate limit
import { customRateLimit } from '@/lib/security/rate-limit';

export async function POST(request: Request) {
  // 10 requests per minute
  const { success } = await customRateLimit(request.ip, 10, 60000);
  if (!success) {
    return new Response('Too Many Requests', { status: 429 });
  }
}
```

**Commands:**
```bash
npx aads security:audit      # Security scan
npx aads security:audit --fix # Auto-fix issues
```

---

### 3. LLM Framework

**Location:** `lib/llm/`

**Features:**
- ✅ OpenAI integration
- ✅ Anthropic Claude integration
- ✅ Response caching (40% savings)
- ✅ Smart model selection (25% savings)
- ✅ Cost tracking

**Basic Usage:**

```typescript
import { openai } from '@/lib/llm/client';
import { getCachedResponse, cacheResponse } from '@/lib/llm/cache';

export async function POST(request: Request) {
  const { message } = await request.json();

  // Check cache first
  const cached = await getCachedResponse(message, 'gpt-3.5-turbo');
  if (cached) {
    return Response.json({ response: cached });
  }

  // Call LLM
  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: message }],
  });

  const response = completion.choices[0].message.content;

  // Cache response
  await cacheResponse(message, 'gpt-3.5-turbo', response);

  return Response.json({ response });
}
```

**Smart Model Selection:**

```typescript
import { selectModel } from '@/lib/llm/client';

// Automatically select cheapest appropriate model
const model = selectModel({
  estimatedTokens: message.length * 1.3,
  complexity: 'low', // 'low' | 'medium' | 'high'
  provider: 'openai',
});
```

**Commands:**
```bash
npx aads llm:analyze         # Cost analysis
npx aads llm:optimize        # Apply optimizations
npx aads llm:compare         # Compare models
```

---

### 4. SEO Framework

**Location:** `app/sitemap.ts`, `app/robots.ts`, `components/SEO.tsx`

**Features:**
- ✅ Dynamic sitemap
- ✅ Robots.txt
- ✅ Meta tags
- ✅ Open Graph
- ✅ Twitter Cards
- ✅ Structured data (JSON-LD)

**Page Metadata:**

```typescript
// app/about/page.tsx
import { generateMetadata } from '@/components/SEO';

export const metadata = generateMetadata({
  title: 'About',
  description: 'Learn more about us',
  image: '/og-about.png',
  url: '/about',
});

export default function AboutPage() {
  return <div>About page content</div>;
}
```

**Structured Data:**

```typescript
// app/layout.tsx
import { StructuredData } from '@/components/SEO';

<StructuredData
  type="organization"
  data={{
    name: "My Company",
    url: "https://example.com",
    logo: "https://example.com/logo.png",
  }}
/>
```

**Commands:**
```bash
npx aads seo:check           # Validate SEO
npx aads seo:generate        # Generate files
npx aads seo:analyze         # Analyze pages
```

---

### 5. Mobile Framework

**Features:**
- ✅ Touch-optimized components
- ✅ PWA support
- ✅ Responsive design
- ✅ Touch targets (44px minimum)
- ✅ Mobile navigation

**Touch Targets:**

```tsx
// Use touch-target utility class
<button className="touch-target px-4 py-2 bg-blue-500 text-white rounded">
  Click Me
</button>

// Or use Tailwind directly
<button className="min-h-[44px] min-w-[44px] px-4 py-2">
  Click Me
</button>
```

**Responsive Design:**

```tsx
// Mobile-first approach
<div className="flex flex-col md:flex-row gap-4">
  <div>Mobile: stacked</div>
  <div>Desktop: side-by-side</div>
</div>
```

**Commands:**
```bash
npx aads mobile:validate     # Check compliance
npx aads mobile:test         # Test viewports
```

---

## Adding Features

### Authentication

**1. Enable Email Auth in Supabase:**
- Dashboard → Authentication → Providers
- Enable "Email"

**2. Create Login Page:**

```tsx
// app/(auth)/login/page.tsx
'use client';

import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const supabase = createClient();

  async function handleLogin() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
    } else {
      window.location.href = '/dashboard';
    }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="touch-target"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="touch-target"
      />
      <button type="submit" className="touch-target">Login</button>
    </form>
  );
}
```

### Database Tables

**1. Create Migration:**

```sql
-- supabase/migrations/001_create_items.sql
create table items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table items enable row level security;

-- Policy: Users can only see their own items
create policy "Users can view own items"
  on items for select
  using (auth.uid() = user_id);

create policy "Users can insert own items"
  on items for insert
  with check (auth.uid() = user_id);
```

**2. Run Migration:**

```bash
npx aads db:migrate
```

### API Routes

**Create API Endpoint:**

```typescript
// app/api/items/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('items')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from('items')
    .insert([body])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
```

---

## Deployment

### Vercel (Recommended)

**1. Install Vercel CLI:**
```bash
npm i -g vercel
```

**2. Deploy:**
```bash
npx aads deploy
# or
vercel
```

**3. Add Environment Variables:**
- Go to Vercel dashboard → Settings → Environment Variables
- Add all variables from `.env.local`

**4. Redeploy:**
```bash
vercel --prod
```

### Other Platforms

**Railway:**
```bash
npx aads deploy --platform railway
```

**Self-hosted with Docker:**
```bash
docker build -t my-app .
docker run -p 3000:3000 my-app
```

---

## Testing

### Run Tests

```bash
npm run test                 # Unit tests
npm run test:watch           # Watch mode
npm run test:e2e             # E2E tests
npm run test:coverage        # Coverage report
```

### Pre-Deployment Checks

```bash
# Run all RANA checks
npx aads check
npx aads security:audit
npx aads seo:check
npx aads mobile:validate
npx aads llm:analyze

# Auto-fix issues
npx aads check --fix
npx aads security:audit --fix
npx aads seo:check --fix
```

---

## Customization

### Change Site Name

Edit `.env.local`:
```env
NEXT_PUBLIC_SITE_NAME="Your Site Name"
NEXT_PUBLIC_SITE_DESCRIPTION="Your description"
```

### Change Colors

Edit `tailwind.config.ts`:
```typescript
theme: {
  extend: {
    colors: {
      primary: '#your-color',
      secondary: '#your-color',
    },
  },
},
```

### Add Pages

Create new page:
```bash
mkdir -p app/about
touch app/about/page.tsx
```

```tsx
// app/about/page.tsx
import { generateMetadata } from '@/components/SEO';

export const metadata = generateMetadata({
  title: 'About',
  description: 'About us',
});

export default function AboutPage() {
  return <div>About content</div>;
}
```

---

## Troubleshooting

### "Module not found" errors

```bash
rm -rf node_modules .next
npm install
```

### Supabase connection issues

1. Check `.env.local` has correct URL and keys
2. Verify Supabase project is running
3. Check network connectivity

### Rate limiting too strict

Edit `lib/security/rate-limit.ts`:
```typescript
const RATE_LIMIT_CONFIG = {
  maxRequests: 200, // Increase this
  windowMs: 60000,
};
```

### LLM costs too high

```bash
# Analyze costs
npx aads llm:analyze --detailed

# Apply all optimizations
npx aads llm:optimize --all
```

---

## Best Practices

### 1. Use Server Components by Default

```tsx
// ✅ Good: Server component (default)
export default async function Page() {
  const data = await getData();
  return <div>{data}</div>;
}

// ❌ Avoid: Unnecessary client component
'use client';
export default function Page() {
  return <div>Static content</div>;
}
```

### 2. Implement Proper Error Handling

```typescript
try {
  const { data, error } = await supabase.from('items').select();
  if (error) throw error;
  return data;
} catch (error) {
  console.error('Error:', error);
  return [];
}
```

### 3. Use Caching for LLM Calls

```typescript
// Always check cache first
const cached = await getCachedResponse(prompt, model);
if (cached) return cached;

// Only call LLM if not cached
const response = await callLLM(prompt);
await cacheResponse(prompt, model, response);
```

### 4. Validate Input

```typescript
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  message: z.string().min(1).max(1000),
});

export async function POST(request: Request) {
  const body = await request.json();
  const result = schema.safeParse(body);

  if (!result.success) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  // Process validated data
}
```

### 5. Use Quality Gates

Before deploying:
```bash
npm run test
npx aads check --fix
npx aads security:audit
npx aads seo:check
npx aads mobile:validate
```

---

## Resources

- **RANA Docs:** https://docs.rana.dev
- **Next.js Docs:** https://nextjs.org/docs
- **Supabase Docs:** https://supabase.com/docs
- **Tailwind Docs:** https://tailwindcss.com/docs

---

## Support

- **Discord:** https://discord.gg/aads
- **GitHub Issues:** https://github.com/waymaker-ai/aads-framework/issues
- **Email:** support@waymaker.ai

---

**You're ready to build production-ready AI apps!** 🚀
