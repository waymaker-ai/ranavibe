/**
 * @aicofounder/react
 * React hooks and components for CoFounder
 *
 * @example
 * ```tsx
 * import { createCoFounder } from '@aicofounder/core';
 * import { RanaProvider, useCoFounderChat } from '@aicofounder/react';
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
 *       <ChatComponent />
 *     </RanaProvider>
 *   );
 * }
 *
 * function ChatComponent() {
 *   const { chat, response, loading } = useCoFounderChat(cofounder, {
 *     provider: 'anthropic',
 *     optimize: 'cost'
 *   });
 *
 *   return (
 *     <div>
 *       {loading && <div>Loading...</div>}
 *       {response && <div>{response.content}</div>}
 *     </div>
 *   );
 * }
 * ```
 */

// Provider and context
export { RanaProvider, useCoFounder } from './provider';

// Hooks
export {
  useCoFounderChat,
  useCoFounderStream,
  useCoFounderCost,
  useCoFounderOptimize,
  useCoFounderConversation,
} from './hooks';

// Types
export type {
  UseRanaChatOptions,
  UseRanaChatReturn,
  UseRanaStreamReturn,
  UseRanaCostReturn,
  UseRanaOptimizeReturn,
  UseRanaConversationReturn,
} from './hooks';
