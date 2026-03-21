import { GuardPipeline } from '../middleware.js';
import { PIIInterceptor } from '../interceptors/pii-interceptor.js';
import { InjectionInterceptor } from '../interceptors/injection-interceptor.js';
import { AuditInterceptor } from '../interceptors/audit-interceptor.js';
import { RateLimitInterceptor } from '../interceptors/rate-limit-interceptor.js';
import type { GuardConfig } from '../types.js';

interface ToolDefinition {
  name: string;
  description?: string;
  input_schema?: unknown;
  execute?: (...args: any[]) => any;
  [key: string]: unknown;
}

export function guardTool<T extends ToolDefinition>(tool: T, guards: Partial<GuardConfig> = {}): T {
  const pipeline = new GuardPipeline();

  if (guards.rateLimit) pipeline.use(new RateLimitInterceptor(guards.rateLimit));
  if (guards.injection !== false) pipeline.use(new InjectionInterceptor(guards.injection || { sensitivity: 'medium', onDetection: 'block' }));
  if (guards.pii) pipeline.use(new PIIInterceptor(guards.pii));
  if (guards.audit) pipeline.use(new AuditInterceptor(guards.audit));

  if (!tool.execute) return tool;

  const originalExecute = tool.execute;

  const guardedTool = {
    ...tool,
    execute: async (...args: any[]) => {
      const inputStr = args.map((a) => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');

      const inputResult = await pipeline.processInput(inputStr, {
        metadata: { toolName: tool.name },
      });

      if (inputResult.blocked) {
        throw new Error(`[RANA Guard] Tool "${tool.name}" blocked: ${inputResult.reason}`);
      }

      const result = await originalExecute(...args);

      if (result && typeof result === 'string') {
        const outputResult = await pipeline.processOutput(result, {
          metadata: { toolName: tool.name },
        });

        if (outputResult.blocked) {
          throw new Error(`[RANA Guard] Tool "${tool.name}" output blocked: ${outputResult.reason}`);
        }

        return outputResult.transformed || result;
      }

      return result;
    },
  };

  return guardedTool as T;
}
