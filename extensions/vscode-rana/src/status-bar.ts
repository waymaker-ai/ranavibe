import * as vscode from 'vscode';

/**
 * Manages the CoFounder status bar item that shows guard status, finding counts,
 * and cost estimates at the bottom of the VS Code window.
 */
export class RanaStatusBar implements vscode.Disposable {
  private statusBarItem: vscode.StatusBarItem;
  private findingsCount = 0;
  private errorCount = 0;
  private warningCount = 0;
  private isActive = true;
  private costEstimate: number | undefined;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    this.statusBarItem.command = 'cofounder.showDashboard';
    this.update();
    this.statusBarItem.show();
  }

  /**
   * Update the findings count displayed on the status bar.
   */
  setFindings(total: number, errors: number, warnings: number): void {
    this.findingsCount = total;
    this.errorCount = errors;
    this.warningCount = warnings;
    this.update();
  }

  /**
   * Update the cost estimate displayed on the status bar.
   */
  setCostEstimate(cost: number | undefined): void {
    this.costEstimate = cost;
    this.update();
  }

  /**
   * Toggle active state.
   */
  setActive(active: boolean): void {
    this.isActive = active;
    this.update();
  }

  private update(): void {
    if (!this.isActive) {
      this.statusBarItem.text = '$(shield) CoFounder: Inactive';
      this.statusBarItem.tooltip = 'CoFounder Guardrails - Click to open dashboard';
      this.statusBarItem.backgroundColor = undefined;
      return;
    }

    const parts: string[] = ['$(shield)'];

    if (this.errorCount > 0) {
      parts.push(`$(error) ${this.errorCount}`);
    }
    if (this.warningCount > 0) {
      parts.push(`$(warning) ${this.warningCount}`);
    }

    if (this.findingsCount === 0) {
      parts.push('CoFounder: Clean');
    }

    if (this.costEstimate !== undefined && this.costEstimate > 0) {
      parts.push(`$(credit-card) $${this.costEstimate.toFixed(4)}`);
    }

    this.statusBarItem.text = parts.join(' ');

    const tooltipLines = [
      'CoFounder Guardrails',
      `Findings: ${this.findingsCount} (${this.errorCount} errors, ${this.warningCount} warnings)`,
    ];
    if (this.costEstimate !== undefined) {
      tooltipLines.push(`Estimated cost: $${this.costEstimate.toFixed(4)}`);
    }
    tooltipLines.push('Click to open dashboard');
    this.statusBarItem.tooltip = tooltipLines.join('\n');

    if (this.errorCount > 0) {
      this.statusBarItem.backgroundColor = new vscode.ThemeColor(
        'statusBarItem.errorBackground'
      );
    } else if (this.warningCount > 0) {
      this.statusBarItem.backgroundColor = new vscode.ThemeColor(
        'statusBarItem.warningBackground'
      );
    } else {
      this.statusBarItem.backgroundColor = undefined;
    }
  }

  dispose(): void {
    this.statusBarItem.dispose();
  }
}
