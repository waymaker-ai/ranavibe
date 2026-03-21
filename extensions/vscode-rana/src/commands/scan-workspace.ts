import * as vscode from 'vscode';
import { WorkspaceScanner } from '../scanners/workspace-scanner';
import { FindingsViewProvider } from '../views/findings-view';
import { DashboardViewProvider } from '../views/dashboard-view';
import { RanaStatusBar } from '../status-bar';

/**
 * Command handler: scan the entire workspace with a progress bar.
 */
export function registerScanWorkspaceCommand(
  context: vscode.ExtensionContext,
  workspaceScanner: WorkspaceScanner,
  findingsView: FindingsViewProvider,
  dashboardView: DashboardViewProvider,
  statusBar: RanaStatusBar
): vscode.Disposable {
  return vscode.commands.registerCommand('rana.scanWorkspace', async () => {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showWarningMessage('RANA: No workspace folder open.');
      return;
    }

    const findings = await workspaceScanner.scan();

    // Update findings view
    findingsView.setFindings(findings);

    // Update dashboard
    dashboardView.setFindings(findings);

    // Update status bar
    const errors = findings.filter((f) => f.detection.severity === 'error').length;
    const warnings = findings.filter((f) => f.detection.severity === 'warning').length;
    statusBar.setFindings(findings.length, errors, warnings);
  });
}
