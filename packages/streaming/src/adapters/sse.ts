/**
 * @waymakerai/aicofounder-streaming - Generic SSE Parser
 *
 * Parses Server-Sent Events (SSE) from any provider.
 * Handles the standard SSE wire format: event, data, id, retry fields.
 */

/** A parsed SSE event. */
export interface SSEEvent {
  /** Event type (defaults to 'message'). */
  event: string;
  /** The data payload (may span multiple data: lines, joined by newlines). */
  data: string;
  /** Optional event ID. */
  id?: string;
  /** Optional retry interval in ms. */
  retry?: number;
}

/**
 * Parse a raw SSE text stream into individual events.
 * Handles multi-line data fields and custom event types.
 */
export function parseSSEStream(raw: string): SSEEvent[] {
  const events: SSEEvent[] = [];
  const blocks = raw.split(/\n\n+/);

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    let event = 'message';
    const dataLines: string[] = [];
    let id: string | undefined;
    let retry: number | undefined;

    const lines = trimmed.split('\n');
    for (const line of lines) {
      // Lines starting with ':' are comments — skip.
      if (line.startsWith(':')) continue;

      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) {
        // Field with no value.
        continue;
      }

      const field = line.slice(0, colonIndex).trim();
      // Value starts after the colon; strip one leading space if present.
      let value = line.slice(colonIndex + 1);
      if (value.startsWith(' ')) {
        value = value.slice(1);
      }

      switch (field) {
        case 'event':
          event = value;
          break;
        case 'data':
          dataLines.push(value);
          break;
        case 'id':
          id = value;
          break;
        case 'retry': {
          const parsed = parseInt(value, 10);
          if (!isNaN(parsed)) retry = parsed;
          break;
        }
      }
    }

    if (dataLines.length > 0) {
      events.push({
        event,
        data: dataLines.join('\n'),
        ...(id !== undefined && { id }),
        ...(retry !== undefined && { retry }),
      });
    }
  }

  return events;
}

/**
 * Async generator that yields text deltas from a generic SSE async iterable.
 * Each yielded string is the raw `data` field from a `message` event.
 * The stream ends when a `data: [DONE]` event is received.
 */
export async function* extractSSETextDeltas(
  stream: AsyncIterable<string>,
): AsyncGenerator<string> {
  let buffer = '';

  for await (const chunk of stream) {
    buffer += chunk;

    // Process complete events (separated by double newline).
    const parts = buffer.split(/\n\n/);
    // Keep the last part as it may be incomplete.
    buffer = parts.pop() ?? '';

    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      const events = parseSSEStream(trimmed);
      for (const evt of events) {
        if (evt.data === '[DONE]') return;
        yield evt.data;
      }
    }
  }

  // Process any remaining buffer.
  if (buffer.trim()) {
    const events = parseSSEStream(buffer);
    for (const evt of events) {
      if (evt.data === '[DONE]') return;
      yield evt.data;
    }
  }
}
