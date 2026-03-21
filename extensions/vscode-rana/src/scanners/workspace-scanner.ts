import * as vscode from 'vscode';
import { scanDocument, Detection } from '../detectors';

/**
 * A single finding from the workspace scan, enriched with file location info.
 */
export interface WorkspaceFinding {
  uri: vscode.Uri;
  relativePath: string;
  detection: Detection;
}

/**
 * Scans an entire workspace for guardrail violations.
 * Reports progress via VS Code's withProgress API and populates
 * a findings list that can be displayed in the tree view.
 */
export class WorkspaceScanner {
  private _findings: WorkspaceFinding[] = [];
  private _onDidScanComplete = new vscode.EventEmitter<WorkspaceFinding[]>();

  /** Fired when a full workspace scan completes. */
  readonly onDidScanComplete = this._onDidScanComplete.event;

  /** All findings from the last scan. */
  get findings(): readonly WorkspaceFinding[] {
    return this._findings;
  }

  /**
   * Run a full workspace scan with progress UI.
   */
  async scan(): Promise<WorkspaceFinding[]> {
    this._findings = [];

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'RANA: Scanning workspace...',
        cancellable: true,
      },
      async (progress, token) => {
        const config = vscode.workspace.getConfiguration('rana');
        const sensitivity = config.get<'low' | 'medium' | 'high'>(
          'injectionSensitivity',
          'medium'
        );

        // Find all relevant files
        const filePatterns = '**/*.{ts,tsx,js,jsx,py,json,yaml,yml,md,txt,env}';
        const excludePatterns = '**/node_modules/**,**/dist/**,**/.git/**,**/build/**,**/.next/**';
        const files = await vscode.workspace.findFiles(filePatterns, excludePatterns, 5000);

        if (token.isCancellationRequested) {
          return;
        }

        const total = files.length;
        let processed = 0;

        for (const file of files) {
          if (token.isCancellationRequested) {
            break;
          }

          try {
            const doc = await vscode.workspace.openTextDocument(file);
            const text = doc.getText();

            // Skip very large files
            if (text.length > 1_000_000) {
              processed++;
              continue;
            }

            const detections = scanDocument(text, { sensitivity });
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(file);
            const relativePath = workspaceFolder
              ? vscode.workspace.asRelativePath(file, false)
              : file.fsPath;

            for (const detection of detections) {
              this._findings.push({
                uri: file,
                relativePath,
                detection,
              });
            }
          } catch {
            // Skip files that cannot be read (binary, permission issues, etc.)
          }

          processed++;
          progress.report({
            message: `${processed}/${total} files`,
            increment: (1 / total) * 100,
          });
        }
      }
    );

    // Sort findings: errors first, then warnings, then info
    const severityOrder = { error: 0, warning: 1, info: 2 };
    this._findings.sort(
      (a, b) =>
        severityOrder[a.detection.severity] - severityOrder[b.detection.severity] ||
        a.relativePath.localeCompare(b.relativePath) ||
        a.detection.line - b.detection.line
    );

    this._onDidScanComplete.fire(this._findings);

    const errorCount = this._findings.filter((f) => f.detection.severity === 'error').length;
    const warningCount = this._findings.filter((f) => f.detection.severity === 'warning').length;
    const infoCount = this._findings.filter((f) => f.detection.severity === 'info').length;

    vscode.window.showInformationMessage(
      `RANA: Scan complete. Found ${this._findings.length} issues ` +
      `(${errorCount} errors, ${warningCount} warnings, ${infoCount} info).`
    );

    return this._findings;
  }

  /**
   * Clear all findings.
   */
  clear(): void {
    this._findings = [];
    this._onDidScanComplete.fire([]);
  }
}
