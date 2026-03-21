import * as vscode from 'vscode';
import { InlineScanner } from '../scanners/inline-scanner';

/**
 * Command handler: scan the currently active file and populate diagnostics.
 */
export function registerScanFileCommand(
  context: vscode.ExtensionContext,
  inlineScanner: InlineScanner
): vscode.Disposable {
  return vscode.commands.registerCommand('rana.scan', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('RANA: No active editor to scan.');
      return;
    }

    const document = editor.document;
    const detections = inlineScanner.scanDocument(document);

    const errorCount = detections.filter((d) => d.severity === 'error').length;
    const warningCount = detections.filter((d) => d.severity === 'warning').length;
    const infoCount = detections.filter((d) => d.severity === 'info').length;

    if (detections.length === 0) {
      vscode.window.showInformationMessage(
        `RANA: No issues found in ${document.fileName.split('/').pop()}.`
      );
    } else {
      vscode.window.showWarningMessage(
        `RANA: Found ${detections.length} issues in ${document.fileName.split('/').pop()} ` +
        `(${errorCount} errors, ${warningCount} warnings, ${infoCount} info).`
      );
    }
  });
}
