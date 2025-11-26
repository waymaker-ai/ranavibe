/**
 * @rana/react
 * React hooks and components for RANA
 *
 * @example
 * ```tsx
 * import { createRana } from '@rana/core';
 * import { RanaProvider, useRanaChat } from '@rana/react';
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
 *       <ChatComponent />
 *     </RanaProvider>
 *   );
 * }
 *
 * function ChatComponent() {
 *   const { chat, response, loading } = useRanaChat(rana, {
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
export { RanaProvider, useRana } from './provider';

// Hooks
export {
  useRanaChat,
  useRanaStream,
  useRanaCost,
  useRanaOptimize,
  useRanaConversation,
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
