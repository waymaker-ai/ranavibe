/**
 * React Context Provider for CoFounder
 */

import React, { createContext, useContext, ReactNode } from 'react';
import type { CoFounderClient } from './types';

const RanaContext = createContext<CoFounderClient | null>(null);

export interface RanaProviderProps {
  client: CoFounderClient;
  children: ReactNode;
}

/**
 * Provider component for CoFounder
 *
 * @example
 * ```tsx
 * import { createCoFounder } from '@cofounder/core';
 * import { RanaProvider } from '@cofounder/react';
 *
 * const cofounder = createCoFounder({
 *   providers: {
 *     anthropic: process.env.ANTHROPIC_API_KEY
 *   }
 * });
 *
 * function App() {
 *   return (
 *     <RanaProvider client={cofounder}>
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
 * Hook to access the CoFounder client from context
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const cofounder = useCoFounder();
 *   // Use cofounder client
 * }
 * ```
 */
export function useCoFounder(): CoFounderClient {
  const context = useContext(RanaContext);
  if (!context) {
    throw new Error('useCoFounder must be used within a RanaProvider');
  }
  return context;
}
