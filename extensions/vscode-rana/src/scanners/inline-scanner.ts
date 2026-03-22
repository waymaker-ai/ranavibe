import * as vscode from 'vscode';
import { scanDocument, Detection } from '../detectors';

/**
 * Real-time inline scanner that watches open documents and produces
 * VS Code diagnostics (squiggly underlines) for PII, API keys,
 * injection risks, and model usage.
 */
export class InlineScanner implements vscode.Disposable {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  private disposables: vscode.Disposable[] = [];
  private enabled = true;

  /** Callback invoked whenever diagnostics change so the status bar can update. */
  onDiagnosticsChanged?: (uri: vscode.Uri, diagnostics: vscode.Diagnostic[]) => void;

  constructor() {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('cofounder');

    // Scan on document open
    this.disposables.push(
      vscode.workspace.onDidOpenTextDocument((doc) => {
        if (this.enabled) {
          this.scheduleDocumentScan(doc);
        }
      })
    );

    // Scan on document change (debounced)
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument((event) => {
        if (this.enabled) {
          this.scheduleDocumentScan(event.document);
        }
      })
    );

    // Clear diagnostics when a document is closed
    this.disposables.push(
      vscode.workspace.onDidCloseTextDocument((doc) => {
        this.diagnosticCollection.delete(doc.uri);
        const timer = this.debounceTimers.get(doc.uri.toString());
        if (timer) {
          clearTimeout(timer);
          this.debounceTimers.delete(doc.uri.toString());
        }
      })
    );

    // Scan all already-open documents
    for (const doc of vscode.workspace.textDocuments) {
      this.scheduleDocumentScan(doc);
    }
  }

  /**
   * Enable or disable the inline scanner at runtime.
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.diagnosticCollection.clear();
    } else {
      // Re-scan all open documents
      for (const doc of vscode.workspace.textDocuments) {
        this.scheduleDocumentScan(doc);
      }
    }
  }

  /**
   * Manually scan a document and return the detections.
   */
  scanDocument(document: vscode.TextDocument): Detection[] {
    const config = vscode.workspace.getConfiguration('cofounder');
    const sensitivity = config.get<'low' | 'medium' | 'high'>('injectionSensitivity', 'medium');
    const text = document.getText();

    const detections = scanDocument(text, { sensitivity });
    const diagnostics = detections.map((d) => this.detectionToDiagnostic(document, d));

    this.diagnosticCollection.set(document.uri, diagnostics);
    this.onDiagnosticsChanged?.(document.uri, diagnostics);

    return detections;
  }

  /**
   * Get the diagnostic collection so other components can read it.
   */
  getDiagnosticCollection(): vscode.DiagnosticCollection {
    return this.diagnosticCollection;
  }

  /**
   * Get total counts across all open documents.
   */
  getCounts(): { total: number; errors: number; warnings: number } {
    let total = 0;
    let errors = 0;
    let warnings = 0;

    this.diagnosticCollection.forEach((uri, diags) => {
      total += diags.length;
      errors += diags.filter((d) => d.severity === vscode.DiagnosticSeverity.Error).length;
      warnings += diags.filter((d) => d.severity === vscode.DiagnosticSeverity.Warning).length;
    });

    return { total, errors, warnings };
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  private scheduleDocumentScan(document: vscode.TextDocument): void {
    // Only scan supported languages
    const supportedLanguages = [
      'typescript', 'javascript', 'typescriptreact', 'javascriptreact',
      'python', 'json', 'yaml', 'markdown', 'plaintext',
    ];
    if (!supportedLanguages.includes(document.languageId)) {
      return;
    }

    // Skip very large files (> 1MB)
    if (document.getText().length > 1_000_000) {
      return;
    }

    const key = document.uri.toString();
    const existing = this.debounceTimers.get(key);
    if (existing) {
      clearTimeout(existing);
    }

    const timer = setTimeout(() => {
      this.debounceTimers.delete(key);
      this.scanDocument(document);
    }, 500);

    this.debounceTimers.set(key, timer);
  }

  private detectionToDiagnostic(
    document: vscode.TextDocument,
    detection: Detection
  ): vscode.Diagnostic {
    const line = Math.min(detection.line, document.lineCount - 1);
    const lineText = document.lineAt(line).text;
    const startCol = Math.min(detection.startCol, lineText.length);
    const endCol = Math.min(detection.endCol, lineText.length);

    const range = new vscode.Range(line, startCol, line, endCol);

    let severity: vscode.DiagnosticSeverity;
    switch (detection.severity) {
      case 'error':
        severity = vscode.DiagnosticSeverity.Error;
        break;
      case 'warning':
        severity = vscode.DiagnosticSeverity.Warning;
        break;
      default:
        severity = vscode.DiagnosticSeverity.Information;
    }

    const diagnostic = new vscode.Diagnostic(range, detection.message, severity);
    diagnostic.source = 'CoFounder';
    diagnostic.code = detection.type;

    // Add tags for deprecated-style rendering of PII
    if (detection.type === 'pii') {
      diagnostic.tags = [vscode.DiagnosticTag.Unnecessary];
    }

    return diagnostic;
  }

  dispose(): void {
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
    this.diagnosticCollection.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}
