/**
 * CSV Exporter - Export events as CSV with proper escaping
 */

import type { DashboardEvent } from '../types.js';

const CSV_HEADERS = [
  'id',
  'type',
  'timestamp',
  'datetime',
  'provider',
  'model',
  'data',
  'metadata',
];

/**
 * Export events to CSV format with proper escaping
 */
export function exportCsv(events: DashboardEvent[]): string {
  const lines: string[] = [CSV_HEADERS.join(',')];

  for (const event of events) {
    const row = [
      escapeCsv(event.id),
      escapeCsv(event.type),
      String(event.timestamp),
      escapeCsv(new Date(event.timestamp).toISOString()),
      escapeCsv(event.provider ?? ''),
      escapeCsv(event.model ?? ''),
      escapeCsv(JSON.stringify(event.data)),
      escapeCsv(event.metadata ? JSON.stringify(event.metadata) : ''),
    ];
    lines.push(row.join(','));
  }

  return lines.join('\n') + '\n';
}

/**
 * Export a flat metrics summary as CSV
 */
export function exportMetricsCsv(
  metrics: Record<string, unknown>,
  prefix: string = ''
): string {
  const rows: Array<[string, string]> = [];
  flattenForCsv(metrics, prefix, rows);

  const lines = ['metric,value'];
  for (const [key, value] of rows) {
    lines.push(`${escapeCsv(key)},${escapeCsv(value)}`);
  }

  return lines.join('\n') + '\n';
}

function flattenForCsv(
  obj: Record<string, unknown>,
  prefix: string,
  rows: Array<[string, string]>
): void {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value === null || value === undefined) {
      rows.push([fullKey, '']);
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      flattenForCsv(value as Record<string, unknown>, fullKey, rows);
    } else if (Array.isArray(value)) {
      rows.push([fullKey, JSON.stringify(value)]);
    } else {
      rows.push([fullKey, String(value)]);
    }
  }
}

/**
 * Escape a value for CSV:
 * - Wrap in double quotes if it contains comma, quote, or newline
 * - Double any existing double quotes
 */
function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export { escapeCsv };
