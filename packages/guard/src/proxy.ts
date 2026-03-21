import { detectProvider } from './providers/index.js';
import { parseAnthropicResponse, extractAnthropicModel } from './providers/anthropic.js';
import { parseOpenAIResponse, extractOpenAIModel } from './providers/openai.js';
import { parseGoogleResponse, extractGoogleModel } from './providers/google.js';
import type { CheckResult } from './types.js';
import type { BudgetEnforcer } from './enforcers/budget.js';
import type { ModelGate } from './enforcers/model-gate.js';

interface ProxyContext {
  check: (text: string, opts?: { model?: string; direction?: 'input' | 'output' }) => CheckResult;
  budget: BudgetEnforcer | null;
  modelGate: ModelGate | null;
  state: { totalCost: number };
}

function extractMessages(args: any[]): string {
  const parts: string[] = [];
  for (const arg of args) {
    if (!arg || typeof arg !== 'object') continue;
    if (Array.isArray(arg.messages)) {
      for (const msg of arg.messages) {
        if (typeof msg.content === 'string') parts.push(msg.content);
        if (Array.isArray(msg.content)) {
          for (const block of msg.content) {
            if (block.type === 'text' && typeof block.text === 'string') parts.push(block.text);
          }
        }
      }
    }
    if (typeof arg.prompt === 'string') parts.push(arg.prompt);
    if (typeof arg.input === 'string') parts.push(arg.input);
  }
  return parts.join('\n');
}

function extractModel(provider: string, args: any[]): string | undefined {
  switch (provider) {
    case 'anthropic': return extractAnthropicModel(args);
    case 'openai': return extractOpenAIModel(args);
    case 'google': return extractGoogleModel(args);
    default: {
      for (const arg of args) {
        if (arg && typeof arg === 'object' && 'model' in arg) return arg.model;
      }
      return undefined;
    }
  }
}

function parseResponse(provider: string, response: any) {
  switch (provider) {
    case 'anthropic': return parseAnthropicResponse(response);
    case 'openai': return parseOpenAIResponse(response);
    case 'google': return parseGoogleResponse(response);
    default: return null;
  }
}

function isCreateMethod(prop: string | symbol): boolean {
  return prop === 'create' || prop === 'generate' || prop === 'generateContent';
}

export function wrapClient<T extends object>(client: T, ctx: ProxyContext): T {
  const provider = detectProvider(client);

  function createMethodProxy(target: any, parentPath: string): any {
    return new Proxy(target, {
      get(obj, prop) {
        const value = obj[prop];

        if (typeof value === 'function' && isCreateMethod(prop)) {
          return async function guardedCall(...args: any[]) {
            // Extract and check input
            const inputText = extractMessages(args);
            const model = extractModel(provider, args);

            if (inputText) {
              const checkResult = ctx.check(inputText, { model, direction: 'input' });
              if (checkResult.blocked) {
                throw new Error(`[RANA Guard] Request blocked: ${checkResult.reason}`);
              }

              // If PII was redacted, modify the arguments
              if (checkResult.redacted) {
                for (const arg of args) {
                  if (arg && typeof arg === 'object' && Array.isArray(arg.messages)) {
                    const lastMsg = arg.messages[arg.messages.length - 1];
                    if (lastMsg && typeof lastMsg.content === 'string') {
                      lastMsg.content = checkResult.redacted;
                    }
                  }
                }
              }
            }

            // Call the original method
            const response = await value.apply(obj, args);

            // Track cost from response
            const usage = parseResponse(provider, response);
            if (usage && ctx.budget) {
              ctx.budget.recordCost(usage.model, usage.inputTokens, usage.outputTokens);
              const estimate = ctx.budget.estimateCost(usage.model, usage.inputTokens, usage.outputTokens);
              ctx.state.totalCost += estimate.totalCost;
            }

            // Check output
            if (response) {
              let outputText = '';
              if (typeof response.content === 'string') {
                outputText = response.content;
              } else if (Array.isArray(response.content)) {
                outputText = response.content
                  .filter((b: any) => b.type === 'text')
                  .map((b: any) => b.text)
                  .join('\n');
              } else if (response.choices?.[0]?.message?.content) {
                outputText = response.choices[0].message.content;
              }

              if (outputText) {
                ctx.check(outputText, { model: usage?.model, direction: 'output' });
              }
            }

            return response;
          };
        }

        if (value && typeof value === 'object' && !Array.isArray(value)) {
          return createMethodProxy(value, `${parentPath}.${String(prop)}`);
        }

        return value;
      },
    });
  }

  return createMethodProxy(client, 'client');
}
