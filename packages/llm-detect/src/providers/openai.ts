/**
 * OpenAI API provider for LLM detection.
 *
 * Uses native fetch (no SDK dependency) with structured output.
 */

import type { LLMDetectorConfig, LLMProviderInterface, LLMResponse } from '../types';

const DEFAULT_BASE_URL = 'https://api.openai.com';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  id: string;
  object: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenAIProvider implements LLMProviderInterface {
  async complete(
    systemPrompt: string,
    userPrompt: string,
    config: LLMDetectorConfig
  ): Promise<LLMResponse> {
    const baseUrl = config.baseUrl || DEFAULT_BASE_URL;
    const maxTokens = config.maxTokens ?? 1024;
    const timeout = config.timeout ?? 10000;

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: maxTokens,
          messages,
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `OpenAI API error (${response.status}): ${errorBody}`
        );
      }

      const data = (await response.json()) as OpenAIResponse;

      if (!data.choices?.[0]?.message?.content) {
        throw new Error('No content in OpenAI response');
      }

      return parseResponse(data.choices[0].message.content);
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Parse the LLM response text into a structured LLMResponse.
 */
function parseResponse(text: string): LLMResponse {
  let jsonStr = text.trim();

  // Strip markdown code fences if present
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(jsonStr);

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
    return { findings: [], overallConfidence: 0.5 };
  }
}

export default OpenAIProvider;
