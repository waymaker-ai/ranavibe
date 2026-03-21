import type { GuardReport } from '../types.js';

export interface CostReportData {
  totalCost: number;
  periodCost: number;
  requestCount: number;
  avgCostPerRequest: number;
  topModels: Array<{ model: string; cost: number; requests: number }>;
  projectedMonthlyCost: number;
}

export function generateCostReport(report: GuardReport, periodDays: number = 1): CostReportData {
  const avgCostPerRequest = report.totalRequests > 0 ? report.totalCost / report.totalRequests : 0;
  const dailyCost = periodDays > 0 ? report.totalCost / periodDays : report.totalCost;
  const projectedMonthlyCost = dailyCost * 30;

  return {
    totalCost: report.totalCost,
    periodCost: report.totalCost,
    requestCount: report.totalRequests,
    avgCostPerRequest,
    topModels: [],
    projectedMonthlyCost,
  };
}

export function formatCostReport(data: CostReportData): string {
  const lines = [
    '=== RANA Cost Report ===',
    '',
    `Total Cost:          $${data.totalCost.toFixed(4)}`,
    `Requests:            ${data.requestCount}`,
    `Avg Cost/Request:    $${data.avgCostPerRequest.toFixed(6)}`,
    `Projected Monthly:   $${data.projectedMonthlyCost.toFixed(2)}`,
    '',
  ];

  if (data.topModels.length > 0) {
    lines.push('Top Models by Cost:');
    for (const m of data.topModels) {
      lines.push(`  ${m.model.padEnd(30)} $${m.cost.toFixed(4)} (${m.requests} reqs)`);
    }
  }

  return lines.join('\n');
}
