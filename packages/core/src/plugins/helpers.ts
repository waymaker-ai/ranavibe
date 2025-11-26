/**
 * Plugin Helpers
 */

import type { RanaPlugin } from '../types';

/**
 * Define a RANA plugin with TypeScript support
 *
 * @example
 * ```typescript
 * import { definePlugin } from '@rana/core';
 *
 * export default definePlugin({
 *   name: 'my-plugin',
 *   async onInit(config) {
 *     console.log('Plugin initialized');
 *   },
 *   async onBeforeRequest(request) {
 *     console.log('Before request:', request);
 *     return request;
 *   },
 *   async onAfterResponse(response) {
 *     console.log('After response:', response);
 *     return response;
 *   }
 * });
 * ```
 */
export function definePlugin(plugin: RanaPlugin): RanaPlugin {
  return plugin;
}
