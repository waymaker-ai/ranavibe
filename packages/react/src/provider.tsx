/**
 * React Context Provider for RANA
 */

import React, { createContext, useContext, ReactNode } from 'react';
import type { RanaClient } from './types';

const RanaContext = createContext<RanaClient | null>(null);

export interface RanaProviderProps {
  client: RanaClient;
  children: ReactNode;
}

/**
 * Provider component for RANA
 *
 * @example
 * ```tsx
 * import { createRana } from '@rana/core';
 * import { RanaProvider } from '@rana/react';
 *
 * const rana = createRana({
 *   providers: {
 *     anthropic: process.env.ANTHROPIC_API_KEY
 *   }
 * });
 *
 * function App() {
 *   return (
 *     <RanaProvider client={rana}>
 *       <YourApp />
 *     </RanaProvider>
 *   );
 * }
 * ```
 */
export function RanaProvider({ client, children }: RanaProviderProps) {
  return <RanaContext.Provider value={client}>{children}</RanaContext.Provider>;
}

/**
 * Hook to access the RANA client from context
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const rana = useRana();
 *   // Use rana client
 * }
 * ```
 */
export function useRana(): RanaClient {
  const context = useContext(RanaContext);
  if (!context) {
    throw new Error('useRana must be used within a RanaProvider');
  }
  return context;
}
