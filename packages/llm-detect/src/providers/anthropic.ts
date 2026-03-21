/**
 * Anthropic API provider for LLM detection.
 *
 * Uses native fetch (no SDK dependency) with structured output.
 */

import type { LLMDetectorConfig, LLMProviderInterface, LLMResponse } from '../types';

const DEFAULT_BASE_URL = 'https://api.anthropic.com';
const API_VERSION = '2023-06-01';

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text?: string;
  }>;
  model: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class AnthropicProvider implements LLMProviderInterface {
  async complete(
    systemPrompt: string,
    userPrompt: string,
    config: LLMDetectorConfig
  ): Promise<LLMResponse> {
    const baseUrl = config.baseUrl || DEFAULT_BASE_URL;
    const maxTokens = config.maxTokens ?? 1024;
    const timeout = config.timeout ?? 10000;

    const messages: AnthropicMessage[] = [
      { role: 'user', content: userPrompt },
    ];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': API_VERSION,
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: maxTokens,
          system: systemPrompt,
          messages,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `Anthropic API error (${response.status}): ${errorBody}`
        );
      }

      const data = (await response.json()) as AnthropicResponse;
      const textContent = data.content.find((c) => c.type === 'text');

      if (!textContent?.text) {
        throw new Error('No text content in Anthropic response');
      }

      return parseResponse(textContent.text);
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Parse the LLM response text into a structured LLMResponse.
 */
function parseResponse(text: string): LLMResponse {
  // Extract JSON from the response (handle markdown code blocks)
  let jsonStr = text.trim();

  // Strip markdown code fences if present
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(jsonStr);

    // Validate structure
    if (!Array.isArray(parsed.findings)) {
      return { findings: [], overallConfidence: 0.5 };
    }

    return {
      findings: parsed.findings.map((f: Record<string, unknown>) => ({
        type: String(f.type || 'unknown'),
        value: String(f.value || ''),
        start: typeof f.start === 'number' ? f.start : -1,
        end: typeof f.end === 'number' ? f.end : -1,
        confidence: typeof f.confidence === 'number' ? f.confidence : 0.5,
        explanation: String(f.explanation || ''),
      })),
      overallConfidence:
        typeof parsed.overallConfidence === 'number'
          ? parsed.overallConfidence
          : 0.5,
    };
  } catch {
    // If JSON parsing fails, return empty findings
    return { findings: [], overallConfidence: 0.5 };
  }
}

export default AnthropicProvider;
