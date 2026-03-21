import * as vscode from 'vscode';
import { WorkspaceFinding } from '../scanners/workspace-scanner';

/**
 * WebviewViewProvider for the CoFounder Dashboard panel.
 * Shows cost summary, security summary, and compliance score.
 */
export class DashboardViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'cofounder.dashboard';

  private webviewView?: vscode.WebviewView;
  private findings: WorkspaceFinding[] = [];
  private costEstimate = 0;
  private refreshInterval?: NodeJS.Timeout;

  constructor(private readonly extensionUri: vscode.Uri) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this.webviewView = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
    };

    this.updateHtml();

    // Refresh dashboard every 30 seconds
    this.refreshInterval = setInterval(() => {
      this.updateHtml();
    }, 30_000);

    webviewView.onDidDispose(() => {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
        this.refreshInterval = undefined;
      }
    });

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage((message) => {
      switch (message.command) {
        case 'scan':
          vscode.commands.executeCommand('cofounder.scanWorkspace');
          break;
        case 'openSettings':
          vscode.commands.executeCommand('workbench.action.openSettings', 'cofounder');
          break;
      }
    });
  }

  /**
   * Update findings data and refresh the dashboard.
   */
  setFindings(findings: WorkspaceFinding[]): void {
    this.findings = findings;
    this.updateHtml();
  }

  /**
   * Update cost estimate and refresh.
   */
  setCostEstimate(cost: number): void {
    this.costEstimate = cost;
    this.updateHtml();
  }

  /**
   * Show the dashboard as a full webview panel (for the command).
   */
  showFullDashboard(): void {
    const panel = vscode.window.createWebviewPanel(
      'cofounderDashboard',
      'CoFounder Dashboard',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );
    panel.webview.html = this.getFullDashboardHtml();
  }

  private updateHtml(): void {
    if (!this.webviewView) {
      return;
    }
    this.webviewView.webview.html = this.getSidebarHtml();
  }

  private getSidebarHtml(): string {
    const errorCount = this.findings.filter((f) => f.detection.severity === 'error').length;
    const warningCount = this.findings.filter((f) => f.detection.severity === 'warning').length;
    const infoCount = this.findings.filter((f) => f.detection.severity === 'info').length;
    const totalFindings = this.findings.length;

    const piiCount = this.findings.filter((f) => f.detection.type === 'pii').length;
    const keyCount = this.findings.filter((f) => f.detection.type === 'api-key').length;
    const injectionCount = this.findings.filter((f) => f.detection.type === 'injection').length;
    const modelCount = this.findings.filter((f) => f.detection.type === 'model-usage').length;

    const complianceScore = this.calculateComplianceScore();
    const scoreColor = complianceScore >= 80 ? '#4caf50' : complianceScore >= 50 ? '#ff9800' : '#f44336';

    return /* html */ `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background: var(--vscode-sideBar-background);
            padding: 12px;
            margin: 0;
            font-size: 13px;
          }
          .section {
            margin-bottom: 16px;
          }
          .section-title {
            font-weight: 600;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--vscode-sideBarSectionHeader-foreground);
            margin-bottom: 8px;
          }
          .metric {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
          }
          .metric-label { opacity: 0.8; }
          .metric-value { font-weight: 600; }
          .metric-value.error { color: var(--vscode-errorForeground); }
          .metric-value.warning { color: var(--vscode-editorWarning-foreground); }
          .metric-value.success { color: #4caf50; }
          .score-bar {
            height: 8px;
            border-radius: 4px;
            background: var(--vscode-progressBar-background);
            margin-top: 4px;
            overflow: hidden;
          }
          .score-fill {
            height: 100%;
            border-radius: 4px;
            transition: width 0.3s ease;
          }
          .btn {
            display: block;
            width: 100%;
            padding: 6px 12px;
            border: none;
            border-radius: 4px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            cursor: pointer;
            font-size: 12px;
            margin-top: 8px;
            text-align: center;
          }
          .btn:hover {
            background: var(--vscode-button-hoverBackground);
          }
          .divider {
            border: none;
            border-top: 1px solid var(--vscode-sideBarSectionHeader-border);
            margin: 12px 0;
          }
        </style>
      </head>
      <body>
        <div class="section">
          <div class="section-title">Compliance Score</div>
          <div class="metric">
            <span class="metric-label">Overall</span>
            <span class="metric-value" style="color: ${scoreColor}">${complianceScore}%</span>
          </div>
          <div class="score-bar">
            <div class="score-fill" style="width: ${complianceScore}%; background: ${scoreColor}"></div>
          </div>
        </div>

        <hr class="divider">

        <div class="section">
          <div class="section-title">Security Summary</div>
          <div class="metric">
            <span class="metric-label">Total Findings</span>
            <span class="metric-value ${totalFindings > 0 ? 'warning' : 'success'}">${totalFindings}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Errors</span>
            <span class="metric-value ${errorCount > 0 ? 'error' : ''}">${errorCount}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Warnings</span>
            <span class="metric-value ${warningCount > 0 ? 'warning' : ''}">${warningCount}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Info</span>
            <span class="metric-value">${infoCount}</span>
          </div>
        </div>

        <hr class="divider">

        <div class="section">
          <div class="section-title">By Category</div>
          <div class="metric">
            <span class="metric-label">PII Detections</span>
            <span class="metric-value">${piiCount}</span>
          </div>
          <div class="metric">
            <span class="metric-label">API Keys / Secrets</span>
            <span class="metric-value ${keyCount > 0 ? 'error' : ''}">${keyCount}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Injection Risks</span>
            <span class="metric-value ${injectionCount > 0 ? 'warning' : ''}">${injectionCount}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Model References</span>
            <span class="metric-value">${modelCount}</span>
          </div>
        </div>

        <hr class="divider">

        <div class="section">
          <div class="section-title">Cost Estimate</div>
          <div class="metric">
            <span class="metric-label">Estimated LLM Cost</span>
            <span class="metric-value">$${this.costEstimate.toFixed(4)}</span>
          </div>
        </div>

        <button class="btn" onclick="scan()">Scan Workspace</button>
        <button class="btn" onclick="openSettings()">Settings</button>

        <script>
          const vscode = acquireVsCodeApi();
          function scan() { vscode.postMessage({ command: 'scan' }); }
          function openSettings() { vscode.postMessage({ command: 'openSettings' }); }
        </script>
      </body>
      </html>
    `;
  }

  private getFullDashboardHtml(): string {
    // Reuse the sidebar HTML but with a wider layout
    return this.getSidebarHtml().replace(
      'padding: 12px;',
      'padding: 24px; max-width: 600px; margin: 0 auto;'
    );
  }

  private calculateComplianceScore(): number {
    if (this.findings.length === 0) {
      return 100;
    }

    // Deduct points based on severity
    let deductions = 0;
    for (const f of this.findings) {
      switch (f.detection.severity) {
        case 'error':
          deductions += 10;
          break;
        case 'warning':
          deductions += 3;
          break;
        default:
          deductions += 1;
      }
    }

    return Math.max(0, Math.min(100, 100 - deductions));
  }
}
