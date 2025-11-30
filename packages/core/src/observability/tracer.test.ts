/**
 * Unit tests for the RANA Tracer
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  Tracer,
  createTracer,
  getGlobalTracer,
  setGlobalTracer,
  traced,
  tracedSync,
  createTraceContext,
} from './tracer';

describe('Tracer', () => {
  let tracer: Tracer;

  beforeEach(() => {
    tracer = createTracer();
  });

  describe('Basic Tracing', () => {
    it('should create a trace with a root span', () => {
      const span = tracer.startTrace('test_operation', {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
      });

      expect(span).toBeDefined();
      expect(span.name).toBe('test_operation');
      expect(span.context.traceId).toBeDefined();
      expect(span.context.spanId).toBeDefined();
      expect(span.context.parentSpanId).toBeUndefined();
      expect(span.status).toBe('pending');
      expect(span.attributes.provider).toBe('anthropic');
      expect(span.attributes.model).toBe('claude-3-5-sonnet-20241022');
    });

    it('should end a span with success status', () => {
      const span = tracer.startTrace('test_operation');
      tracer.endSpan(span, 'success');

      expect(span.status).toBe('success');
      expect(span.endTime).toBeDefined();
      expect(span.duration).toBeDefined();
      expect(span.duration).toBeGreaterThanOrEqual(0);
    });

    it('should end a span with error status', () => {
      const span = tracer.startTrace('test_operation');
      const error = new Error('Test error');

      tracer.endSpan(span, 'error', error);

      expect(span.status).toBe('error');
      expect(span.error).toBe('Test error');
      expect(span.errorStack).toBeDefined();
    });

    it('should calculate duration correctly', (done) => {
      const span = tracer.startTrace('test_operation');

      setTimeout(() => {
        tracer.endSpan(span, 'success');

        expect(span.duration).toBeGreaterThanOrEqual(50);
        expect(span.duration).toBeLessThan(150);
        done();
      }, 50);
    });
  });

  describe('Nested Spans', () => {
    it('should create child spans', () => {
      const parentSpan = tracer.startTrace('parent_operation');
      const childSpan = tracer.startSpan('child_operation', parentSpan);

      expect(childSpan.context.traceId).toBe(parentSpan.context.traceId);
      expect(childSpan.context.parentSpanId).toBe(parentSpan.context.spanId);
      expect(parentSpan.children).toContain(childSpan);
    });

    it('should support multiple levels of nesting', () => {
      const rootSpan = tracer.startTrace('root');
      const child1Span = tracer.startSpan('child1', rootSpan);
      const child2Span = tracer.startSpan('child2', child1Span);

      expect(child1Span.context.parentSpanId).toBe(rootSpan.context.spanId);
      expect(child2Span.context.parentSpanId).toBe(child1Span.context.spanId);
      expect(rootSpan.children).toContain(child1Span);
      expect(child1Span.children).toContain(child2Span);
    });

    it('should maintain separate trace IDs for different traces', () => {
      const trace1 = tracer.startTrace('trace1');
      const trace2 = tracer.startTrace('trace2');

      expect(trace1.context.traceId).not.toBe(trace2.context.traceId);
    });
  });

  describe('Attributes', () => {
    it('should set attributes on a span', () => {
      const span = tracer.startTrace('test_operation');

      tracer.setAttributes(span, {
        input_tokens: 100,
        output_tokens: 200,
        cost: 0.003,
      });

      expect(span.attributes.input_tokens).toBe(100);
      expect(span.attributes.output_tokens).toBe(200);
      expect(span.attributes.cost).toBe(0.003);
    });

    it('should set a single attribute', () => {
      const span = tracer.startTrace('test_operation');

      tracer.setAttribute(span, 'cached', true);

      expect(span.attributes.cached).toBe(true);
    });

    it('should merge attributes', () => {
      const span = tracer.startTrace('test_operation', {
        provider: 'anthropic',
      });

      tracer.setAttributes(span, {
        model: 'claude-3-5-sonnet-20241022',
        input_tokens: 100,
      });

      expect(span.attributes.provider).toBe('anthropic');
      expect(span.attributes.model).toBe('claude-3-5-sonnet-20241022');
      expect(span.attributes.input_tokens).toBe(100);
    });
  });

  describe('Trace Retrieval', () => {
    it('should retrieve a trace by ID', () => {
      const span = tracer.startTrace('test_operation');
      const traceId = span.context.traceId;

      const trace = tracer.getTrace(traceId);

      expect(trace).toBeDefined();
      expect(trace).toContain(span);
    });

    it('should return undefined for non-existent trace', () => {
      const trace = tracer.getTrace('non-existent-id');

      expect(trace).toBeUndefined();
    });

    it('should get all traces', () => {
      const span1 = tracer.startTrace('trace1');
      const span2 = tracer.startTrace('trace2');

      const allTraces = tracer.getAllTraces();

      expect(allTraces.size).toBe(2);
      expect(allTraces.get(span1.context.traceId)).toContain(span1);
      expect(allTraces.get(span2.context.traceId)).toContain(span2);
    });
  });

  describe('Trace Export', () => {
    it('should export a completed trace', () => {
      const span = tracer.startTrace('test_operation', {
        provider: 'openai',
        model: 'gpt-4o',
      });

      tracer.endSpan(span, 'success');

      const exported = tracer.exportTrace(span.context.traceId);

      expect(exported).toBeDefined();
      expect(exported!.traceId).toBe(span.context.traceId);
      expect(exported!.spans).toContain(span);
      expect(exported!.duration).toBeDefined();
      expect(exported!.status).toBe('success');
      expect(exported!.createdAt).toBeInstanceOf(Date);
    });

    it('should return null for non-existent trace', () => {
      const exported = tracer.exportTrace('non-existent-id');

      expect(exported).toBeNull();
    });

    it('should determine overall status correctly', () => {
      const parentSpan = tracer.startTrace('parent');
      const child1 = tracer.startSpan('child1', parentSpan);
      const child2 = tracer.startSpan('child2', parentSpan);

      tracer.endSpan(child1, 'success');
      tracer.endSpan(child2, 'error', new Error('Test error'));
      tracer.endSpan(parentSpan, 'success');

      const exported = tracer.exportTrace(parentSpan.context.traceId);

      expect(exported!.status).toBe('error');
    });
  });

  describe('Statistics', () => {
    it('should calculate statistics correctly', () => {
      const span1 = tracer.startTrace('trace1');
      tracer.endSpan(span1, 'success');

      const span2 = tracer.startTrace('trace2');
      tracer.endSpan(span2, 'error', new Error('Test'));

      const stats = tracer.getStats();

      expect(stats.totalTraces).toBe(2);
      expect(stats.totalSpans).toBe(2);
      expect(stats.activeSpans).toBe(0);
      expect(stats.successRate).toBe(50);
    });

    it('should track active spans', () => {
      const span1 = tracer.startTrace('trace1');
      const span2 = tracer.startTrace('trace2');

      let stats = tracer.getStats();
      expect(stats.activeSpans).toBe(2);

      tracer.endSpan(span1, 'success');

      stats = tracer.getStats();
      expect(stats.activeSpans).toBe(1);

      tracer.endSpan(span2, 'success');

      stats = tracer.getStats();
      expect(stats.activeSpans).toBe(0);
    });
  });

  describe('Cleanup', () => {
    it('should clear all traces', () => {
      tracer.startTrace('trace1');
      tracer.startTrace('trace2');

      tracer.clearTraces();

      const allTraces = tracer.getAllTraces();
      expect(allTraces.size).toBe(0);
    });

    it('should respect maxTraces limit', () => {
      const limitedTracer = createTracer({ maxTraces: 3 });

      for (let i = 0; i < 5; i++) {
        limitedTracer.startTrace(`trace${i}`);
      }

      const stats = limitedTracer.getStats();
      expect(stats.totalTraces).toBeLessThanOrEqual(3);
    });
  });

  describe('Global Tracer', () => {
    it('should get global tracer', () => {
      const globalTracer = getGlobalTracer();

      expect(globalTracer).toBeInstanceOf(Tracer);
    });

    it('should set global tracer', () => {
      const customTracer = createTracer({ debug: true });
      setGlobalTracer(customTracer);

      const globalTracer = getGlobalTracer();

      expect(globalTracer).toBe(customTracer);
    });
  });

  describe('Function Wrapping', () => {
    it('should wrap async functions with tracing', async () => {
      const testFunction = async (value: number) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return value * 2;
      };

      const tracedFunction = traced('test_async', testFunction, tracer);
      const result = await tracedFunction(5);

      expect(result).toBe(10);

      const stats = tracer.getStats();
      expect(stats.totalTraces).toBe(1);
      expect(stats.totalSpans).toBe(1);
    });

    it('should wrap sync functions with tracing', () => {
      const testFunction = (value: number) => value * 2;

      const tracedFunction = tracedSync('test_sync', testFunction, tracer);
      const result = tracedFunction(5);

      expect(result).toBe(10);

      const stats = tracer.getStats();
      expect(stats.totalTraces).toBe(1);
    });

    it('should handle errors in wrapped async functions', async () => {
      const testFunction = async () => {
        throw new Error('Test error');
      };

      const tracedFunction = traced('test_error', testFunction, tracer);

      await expect(tracedFunction()).rejects.toThrow('Test error');

      const stats = tracer.getStats();
      expect(stats.successRate).toBe(0);
    });

    it('should handle errors in wrapped sync functions', () => {
      const testFunction = () => {
        throw new Error('Test error');
      };

      const tracedFunction = tracedSync('test_error', testFunction, tracer);

      expect(() => tracedFunction()).toThrow('Test error');

      const stats = tracer.getStats();
      expect(stats.successRate).toBe(0);
    });
  });

  describe('Trace Context', () => {
    it('should create a new trace context', () => {
      const context = createTraceContext();

      expect(context.traceId).toBeDefined();
      expect(context.spanId).toBeDefined();
      expect(context.parentSpanId).toBeUndefined();
    });

    it('should create a child trace context', () => {
      const parentSpan = tracer.startTrace('parent');
      const context = createTraceContext(parentSpan);

      expect(context.traceId).toBe(parentSpan.context.traceId);
      expect(context.spanId).not.toBe(parentSpan.context.spanId);
      expect(context.parentSpanId).toBe(parentSpan.context.spanId);
    });
  });

  describe('Auto-Export', () => {
    it('should auto-export completed traces', (done) => {
      let exportedTrace: any = null;

      const exportingTracer = createTracer({
        autoExport: true,
        onExport: (trace) => {
          exportedTrace = trace;
        },
      });

      const span = exportingTracer.startTrace('test_operation');
      exportingTracer.endSpan(span, 'success');

      // Auto-export happens asynchronously
      setTimeout(() => {
        expect(exportedTrace).toBeDefined();
        expect(exportedTrace.traceId).toBe(span.context.traceId);
        done();
      }, 100);
    });
  });
});
