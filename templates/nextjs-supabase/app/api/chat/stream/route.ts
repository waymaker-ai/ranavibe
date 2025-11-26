/**
 * LUKA - Streaming Chat API Route
 * Real-time streaming responses with Gemini 2.0 Flash, GPT-4o, Claude
 */

import { NextRequest, NextResponse } from 'next/server';
import { luka } from '@/lib/llm/unified-client';

export const runtime = 'edge'; // Edge runtime for better streaming performance

export async function POST(req: NextRequest) {
  try {
    const { messages, model = 'gemini-2.0-flash-exp' } = await req.json();

    // Validate input
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
    }

    // Create a TransformStream for streaming response
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Start streaming in the background
    (async () => {
      try {
        for await (const chunk of luka.chatStream({ model, messages })) {
          await writer.write(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
        }

        // Send done signal
        await writer.write(encoder.encode('data: [DONE]\n\n'));
        await writer.close();
      } catch (error: any) {
        console.error('Streaming error:', error);
        await writer.write(encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`));
        await writer.close();
      }
    })();

    // Return streaming response
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Frontend usage example:
 *
 * const streamChat = async (messages) => {
 *   const response = await fetch('/api/chat/stream', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ messages, model: 'gemini-2.0-flash-exp' }),
 *   });
 *
 *   const reader = response.body.getReader();
 *   const decoder = new TextDecoder();
 *
 *   while (true) {
 *     const { done, value } = await reader.read();
 *     if (done) break;
 *
 *     const chunk = decoder.decode(value);
 *     const lines = chunk.split('\n');
 *
 *     for (const line of lines) {
 *       if (line.startsWith('data: ')) {
 *         const data = line.slice(6);
 *         if (data === '[DONE]') return;
 *
 *         try {
 *           const { content } = JSON.parse(data);
 *           console.log(content); // Append to UI
 *         } catch (e) {}
 *       }
 *     }
 *   }
 * };
 */
