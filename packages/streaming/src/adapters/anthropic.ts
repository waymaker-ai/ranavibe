/**
 * @ranavibe/streaming - Anthropic Adapter
 *
 * Parses Anthropic SSE streaming responses and extracts text deltas.
 * Handles the Anthropic Messages API streaming format with
 * content_block_delta events.
 */

/**
 * Anthropic SSE event types relevant for text extraction.
 * The Messages API emits these event types:
 * - message_start
 * - content_block_start
 * - content_block_delta  (contains text deltas)
 * - content_block_stop
 * - message_delta
 * - message_stop
 * - ping
 * - error
 */

/** Shape of a content_block_delta event from Anthropic. */
interface AnthropicContentBlockDelta {
  type: 'content_block_delta';
  index: number;
  delta: {
    type: 'text_delta';
    text: string;
  };
}

/** Shape of an Anthropic streaming event (simplified). */
interface AnthropicStreamEvent {
  type: string;
  [key: string]: unknown;
}

/**
 * Extract text deltas from an Anthropic streaming response.
 *
 * Accepts the stream object returned by the Anthropic SDK's
 * `client.messages.stream()` or `client.messages.create({ stream: true })`.
 *
 * The stream is expected to be an async iterable that yields event objects
 * with a `type` field.
 *
 * @param stream - An async iterable of Anthropic stream events.
 * @yields Text strings from content_block_delta events.
 */
export async function* extractAnthropicDeltas(
  stream: AsyncIterable<AnthropicStreamEvent>,
): AsyncGenerator<string> {
  for await (const event of stream) {
    if (event.type === 'content_block_delta') {
      const delta = event as unknown as AnthropicContentBlockDelta;
      if (delta.delta?.type === 'text_delta' && typeof delta.delta.text === 'string') {
        yield delta.delta.text;
      }
    }
  }
}

/**
 * Extract text deltas from raw Anthropic SSE text lines.
 *
 * Use this when you have a raw HTTP response body (e.g., from fetch)
 * rather than the SDK's parsed stream.
 *
 * @param stream - An async iterable of raw SSE text chunks.
 * @yields Text strings from content_block_delta events.
 */
export async function* extractAnthropicSSEDeltas(
  stream: AsyncIterable<string>,
): AsyncGenerator<string> {
  let buffer = '';

  for await (const chunk of stream) {
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    let currentEvent = '';

    for (const line of lines) {
      if (line.startsWith('event: ')) {
        currentEvent = line.slice(7).trim();
      } else if (line.startsWith('data: ') && currentEvent === 'content_block_delta') {
        const data = line.slice(6);
        try {
          const parsed = JSON.parse(data) as AnthropicContentBlockDelta;
          if (parsed.delta?.type === 'text_delta' && typeof parsed.delta.text === 'string') {
            yield parsed.delta.text;
          }
        } catch {
          // Malformed JSON — skip.
        }
        currentEvent = '';
      } else if (line.trim() === '') {
        currentEvent = '';
      }
    }
  }

  // Process remaining buffer.
  if (buffer.startsWith('data: ')) {
    try {
      const parsed = JSON.parse(buffer.slice(6)) as AnthropicContentBlockDelta;
      if (parsed.delta?.type === 'text_delta' && typeof parsed.delta.text === 'string') {
        yield parsed.delta.text;
      }
    } catch {
      // Ignore.
    }
  }
}
