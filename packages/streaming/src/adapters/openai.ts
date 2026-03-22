/**
 * @cofounder/streaming - OpenAI Adapter
 *
 * Parses OpenAI streaming chat completion responses and extracts text deltas.
 * Handles the choices[0].delta.content format.
 */

/** Shape of an OpenAI streaming chunk. */
interface OpenAIChatCompletionChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string | null;
    };
    finish_reason: string | null;
  }>;
}

/** Shape of a generic OpenAI stream event (simplified). */
interface OpenAIStreamEvent {
  choices?: Array<{
    delta?: {
      content?: string | null;
    };
    finish_reason?: string | null;
  }>;
  [key: string]: unknown;
}

/**
 * Extract text deltas from an OpenAI streaming response.
 *
 * Accepts the stream object returned by the OpenAI SDK's
 * `client.chat.completions.create({ stream: true })`.
 *
 * The stream is expected to be an async iterable that yields chunk objects
 * with a `choices` array.
 *
 * @param stream - An async iterable of OpenAI stream chunk objects.
 * @yields Text strings from choices[0].delta.content.
 */
export async function* extractOpenAIDeltas(
  stream: AsyncIterable<OpenAIStreamEvent>,
): AsyncGenerator<string> {
  for await (const chunk of stream) {
    const content = chunk.choices?.[0]?.delta?.content;
    if (typeof content === 'string' && content.length > 0) {
      yield content;
    }
  }
}

/**
 * Extract text deltas from raw OpenAI SSE text lines.
 *
 * Use this when you have a raw HTTP response body (e.g., from fetch)
 * rather than the SDK's parsed stream.
 *
 * @param stream - An async iterable of raw SSE text chunks.
 * @yields Text strings from choices[0].delta.content.
 */
export async function* extractOpenAISSEDeltas(
  stream: AsyncIterable<string>,
): AsyncGenerator<string> {
  let buffer = '';

  for await (const chunk of stream) {
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith(':')) continue;

      if (trimmed.startsWith('data: ')) {
        const data = trimmed.slice(6);
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data) as OpenAIChatCompletionChunk;
          const content = parsed.choices?.[0]?.delta?.content;
          if (typeof content === 'string' && content.length > 0) {
            yield content;
          }
        } catch {
          // Malformed JSON — skip.
        }
      }
    }
  }

  // Process remaining buffer.
  if (buffer.trim().startsWith('data: ')) {
    const data = buffer.trim().slice(6);
    if (data !== '[DONE]') {
      try {
        const parsed = JSON.parse(data) as OpenAIChatCompletionChunk;
        const content = parsed.choices?.[0]?.delta?.content;
        if (typeof content === 'string' && content.length > 0) {
          yield content;
        }
      } catch {
        // Ignore.
      }
    }
  }
}
