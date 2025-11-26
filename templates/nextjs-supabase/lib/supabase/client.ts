import { createBrowserClient } from '@supabase/ssr';

/**
 * Create a Supabase client for use in client components
 *
 * @example
 * ```tsx
 * 'use client';
 *
 * import { createClient } from '@/lib/supabase/client';
 *
 * export default function MyComponent() {
 *   const supabase = createClient();
 *
 *   async function getData() {
 *     const { data } = await supabase.from('items').select();
 *     return data;
 *   }
 * }
 * ```
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
