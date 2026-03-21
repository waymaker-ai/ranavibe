/**
 * API Routes - Request handlers for the dashboard API
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import type { DashboardEvent, MetricQuery, ExportFormat, TimePeriod } from '../types.js';

/** Dependencies injected into route handlers */
export interface RouteDeps {
  collectEvent: (event: Partial<DashboardEvent>) => DashboardEvent;
  getCostMetrics: (query: MetricQuery) => Promise<ReturnType<any>>;
  getSecurityMetrics: (query: MetricQuery) => Promise<ReturnType<any>>;
  getComplianceMetrics: (query: MetricQuery) => Promise<ReturnType<any>>;
  getPerformanceMetrics: (query: MetricQuery) => Promise<ReturnType<any>>;
  getUsageMetrics: (query: MetricQuery) => Promise<ReturnType<any>>;
  getAlerts: () => ReturnType<any>;
  getSummary: () => Promise<ReturnType<any>>;
  exportData: (format: ExportFormat, options?: { from?: number; to?: number }) => Promise<string>;
}

export type RouteHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string>,
  body?: unknown
) => Promise<void>;

export interface Route {
  method: string;
  pattern: RegExp;
  handler: RouteHandler;
}

export function createRoutes(deps: RouteDeps): Route[] {
  return [
    {
      method: 'GET',
      pattern: /^\/api\/health$/,
      handler: handleHealth,
    },
    {
      method: 'GET',
      pattern: /^\/api\/summary$/,
      handler: handleSummary(deps),
    },
    {
      method: 'GET',
      pattern: /^\/api\/metrics\/(\w+)$/,
      handler: handleMetrics(deps),
    },
    {
      method: 'GET',
      pattern: /^\/api\/alerts$/,
      handler: handleAlerts(deps),
    },
    {
      method: 'GET',
      pattern: /^\/api\/export\/(\w+)$/,
      handler: handleExport(deps),
    },
    {
      method: 'POST',
      pattern: /^\/api\/events$/,
      handler: handlePostEvents(deps),
    },
  ];
}

// ============================================================================
// Route Handlers
// ============================================================================

async function handleHealth(
  _req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  sendJson(res, 200, {
    status: 'healthy',
    timestamp: Date.now(),
    uptime: process.uptime(),
  });
}

function handleSummary(deps: RouteDeps): RouteHandler {
  return async (_req, res) => {
    const summary = await deps.getSummary();
    sendJson(res, 200, summary);
  };
}

function handleMetrics(deps: RouteDeps): RouteHandler {
  return async (req, res, params) => {
    const type = params['1'];
    const query = parseMetricQuery(req);

    const handlers: Record<string, (q: MetricQuery) => Promise<unknown>> = {
      cost: deps.getCostMetrics,
      security: deps.getSecurityMetrics,
      compliance: deps.getComplianceMetrics,
      performance: deps.getPerformanceMetrics,
      usage: deps.getUsageMetrics,
    };

    const handler = handlers[type];
    if (!handler) {
      sendJson(res, 404, {
        error: 'Not Found',
        message: `Unknown metric type: ${type}. Available: ${Object.keys(handlers).join(', ')}`,
      });
      return;
    }

    const result = await handler(query);
    sendJson(res, 200, result);
  };
}

function handleAlerts(deps: RouteDeps): RouteHandler {
  return async (_req, res) => {
    const alerts = deps.getAlerts();
    sendJson(res, 200, { alerts });
  };
}

function handleExport(deps: RouteDeps): RouteHandler {
  return async (req, res, params) => {
    const format = params['1'] as ExportFormat;
    const validFormats: ExportFormat[] = ['csv', 'json', 'prometheus'];
    if (!validFormats.includes(format)) {
      sendJson(res, 400, {
        error: 'Bad Request',
        message: `Invalid format: ${format}. Available: ${validFormats.join(', ')}`,
      });
      return;
    }

    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    const from = url.searchParams.get('from')
      ? parseInt(url.searchParams.get('from')!, 10)
      : undefined;
    const to = url.searchParams.get('to')
      ? parseInt(url.searchParams.get('to')!, 10)
      : undefined;

    const data = await deps.exportData(format, { from, to });

    const contentTypes: Record<ExportFormat, string> = {
      csv: 'text/csv',
      json: 'application/json',
      prometheus: 'text/plain; version=0.0.4; charset=utf-8',
    };

    res.writeHead(200, { 'Content-Type': contentTypes[format] });
    res.end(data);
  };
}

function handlePostEvents(deps: RouteDeps): RouteHandler {
  return async (_req, res, _params, body) => {
    if (!body || typeof body !== 'object') {
      sendJson(res, 400, { error: 'Bad Request', message: 'Request body must be a JSON object' });
      return;
    }

    try {
      // Support single event or array of events
      const events = Array.isArray(body) ? body : [body];
      const results: DashboardEvent[] = [];

      for (const eventData of events) {
        const event = deps.collectEvent(eventData as Partial<DashboardEvent>);
        results.push(event);
      }

      sendJson(res, 201, { collected: results.length, events: results });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      sendJson(res, 400, { error: 'Bad Request', message });
    }
  };
}

// ============================================================================
// Helpers
// ============================================================================

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function parseMetricQuery(req: IncomingMessage): MetricQuery {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  const query: MetricQuery = {};

  const period = url.searchParams.get('period');
  if (period) query.period = period as TimePeriod;

  const from = url.searchParams.get('from');
  if (from) query.from = parseInt(from, 10);

  const to = url.searchParams.get('to');
  if (to) query.to = parseInt(to, 10);

  const provider = url.searchParams.get('provider');
  if (provider) query.provider = provider;

  const model = url.searchParams.get('model');
  if (model) query.model = model;

  return query;
}

export { sendJson };
