/**
 * JSON Exporter - Export events and metrics as JSON
 */

import type { DashboardEvent, DashboardSummary } from '../types.js';

export interface JsonExportOptions {
  from?: number;
  to?: number;
  pretty?: boolean;
}

/**
 * Export events as JSON with metadata
 */
export function exportJson(events: DashboardEvent[], options: JsonExportOptions = {}): string {
  const exportData = {
    exportedAt: new Date().toISOString(),
    dateRange: {
      from: options.from ? new Date(options.from).toISOString() : null,
      to: options.to ? new Date(options.to).toISOString() : null,
    },
    totalEvents: events.length,
    events,
  };

  return options.pretty !== false
    ? JSON.stringify(exportData, null, 2)
    : JSON.stringify(exportData);
}

/**
 * Export a full dashboard summary as JSON
 */
export function exportSummaryJson(summary: DashboardSummary, options: JsonExportOptions = {}): string {
  const exportData = {
    exportedAt: new Date().toISOString(),
    dateRange: {
      from: options.from ? new Date(options.from).toISOString() : null,
      to: options.to ? new Date(options.to).toISOString() : null,
    },
    summary,
  };

  return options.pretty !== false
    ? JSON.stringify(exportData, null, 2)
    : JSON.stringify(exportData);
}
