import * as vscode from 'vscode';
import { InlineScanner } from './scanners/inline-scanner';
import { WorkspaceScanner } from './scanners/workspace-scanner';
import { FindingsViewProvider } from './views/findings-view';
import { PoliciesViewProvider } from './views/policies-view';
import { DashboardViewProvider } from './views/dashboard-view';
import { RanaStatusBar } from './status-bar';
import { registerScanFileCommand } from './commands/scan-file';
import { registerScanWorkspaceCommand } from './commands/scan-workspace';
import { registerCheckComplianceCommand } from './commands/check-compliance';
import { registerEstimateCostCommand } from './commands/estimate-cost';

/**
 * Activates the RANA Guardrails extension.
 * Sets up inline scanning, tree views, commands, and the status bar.
 */
export function activate(context: vscode.ExtensionContext): void {
  // -----------------------------------------------------------------------
  // Core components
  // -----------------------------------------------------------------------
  const inlineScanner = new InlineScanner();
  const workspaceScanner = new WorkspaceScanner();
  const statusBar = new RanaStatusBar();

  context.subscriptions.push(inlineScanner);
  context.subscriptions.push(statusBar);

  // -----------------------------------------------------------------------
  // Tree view providers
  // -----------------------------------------------------------------------
  const findingsView = new FindingsViewProvider();
  const policiesView = new PoliciesViewProvider();
  const dashboardView = new DashboardViewProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('rana.findings', findingsView)
  );
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('rana.policies', policiesView)
  );
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(DashboardViewProvider.viewType, dashboardView)
  );

  // -----------------------------------------------------------------------
  // Commands
  // -----------------------------------------------------------------------
  context.subscriptions.push(
    registerScanFileCommand(context, inlineScanner)
  );
  context.subscriptions.push(
    registerScanWorkspaceCommand(context, workspaceScanner, findingsView, dashboardView, statusBar)
  );
  context.subscriptions.push(
    registerCheckComplianceCommand(context)
  );
  context.subscriptions.push(
    registerEstimateCostCommand(context)
  );

  // Show Dashboard command opens the full dashboard panel
  context.subscriptions.push(
    vscode.commands.registerCommand('rana.showDashboard', () => {
      dashboardView.showFullDashboard();
    })
  );

  // -----------------------------------------------------------------------
  // Wire up inline scanner to status bar
  // -----------------------------------------------------------------------
  inlineScanner.onDiagnosticsChanged = () => {
    const counts = inlineScanner.getCounts();
    statusBar.setFindings(counts.total, counts.errors, counts.warnings);
  };

  // -----------------------------------------------------------------------
  // Configuration change listener
  // -----------------------------------------------------------------------
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('rana.enableInlineScan')) {
        const config = vscode.workspace.getConfiguration('rana');
        const enabled = config.get<boolean>('enableInlineScan', true);
        inlineScanner.setEnabled(enabled);
        statusBar.setActive(enabled);
      }

      if (
        event.affectsConfiguration('rana.injectionSensitivity') ||
        event.affectsConfiguration('rana.piiMode')
      ) {
        // Re-scan all open documents with new settings
        for (const doc of vscode.workspace.textDocuments) {
          inlineScanner.scanDocument(doc);
        }
      }
    })
  );

  // -----------------------------------------------------------------------
  // Policy view context menu commands
  // -----------------------------------------------------------------------
  context.subscriptions.push(
    vscode.commands.registerCommand('rana.togglePolicy', (node: any) => {
      if (node && node.kind === 'file') {
        policiesView.togglePolicy(node);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('rana.createPolicy', async (node: any) => {
      if (node && node.kind === 'preset') {
        await policiesView.createFromPreset(node.presetName);
      } else {
        // Prompt user to pick a preset
        const presets = [
          'safety', 'pii-detect', 'pii-redact', 'no-secrets',
          'injection-guard', 'cost-limit', 'model-allowlist',
          'gdpr', 'hipaa', 'sox',
        ];
        const selected = await vscode.window.showQuickPick(presets, {
          title: 'Create Policy from Preset',
          placeHolder: 'Select a policy preset',
        });
        if (selected) {
          await policiesView.createFromPreset(selected);
        }
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('rana.refreshPolicies', () => {
      policiesView.refreshPolicies();
    })
  );

  // -----------------------------------------------------------------------
  // Apply initial configuration
  // -----------------------------------------------------------------------
  const config = vscode.workspace.getConfiguration('rana');
  const enableInlineScan = config.get<boolean>('enableInlineScan', true);
  inlineScanner.setEnabled(enableInlineScan);
  statusBar.setActive(enableInlineScan);

  // -----------------------------------------------------------------------
  // Done
  // -----------------------------------------------------------------------
  console.log('RANA Guardrails extension activated');
}

/**
 * Deactivates the extension. Cleanup is handled by subscriptions.
 */
export function deactivate(): void {
  console.log('RANA Guardrails extension deactivated');
}
