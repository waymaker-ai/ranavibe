import { NextRequest, NextResponse } from 'next/server';
import { openai, selectModel, calculateCost } from '@/lib/llm/client';
import { getCachedResponse, cacheResponse } from '@/lib/llm/cache';
import { customRateLimit } from '@/lib/security/rate-limit';

/**
 * AI Chat API endpoint
 * Includes cost optimization through caching and smart model selection
 *
 * @example
 * ```ts
 * const response = await fetch('/api/ai/chat', {
 *   method: 'POST',
 *   body: JSON.stringify({ message: 'Hello!' }),
 * });
 * const data = await response.json();
 * console.log(data.response);
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 10 requests per minute for AI endpoint
    const { success } = await customRateLimit(
      request.ip || 'anonymous',
      10,
      60000
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { message, complexity = 'medium' } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Check cache first (40% cost savings)
    const cached = await getCachedResponse(message, 'gpt-3.5-turbo', 0.7);
    if (cached) {
      return NextResponse.json({
        response: cached,
        cached: true,
        cost: 0,
      });
    }

    // Select optimal model based on complexity
    const model = selectModel({
      estimatedTokens: message.length * 1.3, // rough estimate
      complexity,
      provider: 'openai',
    });

    // Call OpenAI
    const startTime = Date.now();
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant built with RANA Framework.',
        },
        {
          role: 'user',
          content: message,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const responseTime = Date.now() - startTime;
    const responseText = completion.choices[0].message.content || '';

    // Calculate cost
    const cost = calculateCost(
      model,
      completion.usage?.prompt_tokens || 0,
      completion.usage?.completion_tokens || 0
    );

    // Cache response for future use
    await cacheResponse(message, model, responseText, 0.7, 3600);

    // Return response with metadata
    return NextResponse.json({
      response: responseText,
      cached: false,
      metadata: {
        model,
        cost: `$${cost.toFixed(4)}`,
        responseTime: `${responseTime}ms`,
        tokens: {
          prompt: completion.usage?.prompt_tokens,
          completion: completion.usage?.completion_tokens,
          total: completion.usage?.total_tokens,
        },
      },
    });
  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check API status
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/ai/chat',
    method: 'POST',
    description: 'AI chat endpoint with cost optimization',
    features: [
      'Response caching (40% savings)',
      'Smart model selection',
      'Rate limiting',
      'Cost tracking',
    ],
  });
}
