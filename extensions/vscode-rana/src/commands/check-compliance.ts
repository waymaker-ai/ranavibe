import * as vscode from 'vscode';
import { scanDocument, Detection } from '../detectors';

/**
 * Compliance check result for a single framework.
 */
interface ComplianceResult {
  framework: string;
  passed: boolean;
  violations: Detection[];
  score: number;
}

/**
 * Command handler: run compliance checks on the current file.
 */
export function registerCheckComplianceCommand(
  context: vscode.ExtensionContext
): vscode.Disposable {
  return vscode.commands.registerCommand('aicofounder.checkCompliance', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('CoFounder: No active editor for compliance check.');
      return;
    }

    const config = vscode.workspace.getConfiguration('cofounder');
    const frameworks = config.get<string[]>('complianceFrameworks', ['safety']);
    const sensitivity = config.get<'low' | 'medium' | 'high'>('injectionSensitivity', 'medium');

    const document = editor.document;
    const text = document.getText();
    const detections = scanDocument(text, { sensitivity });

    const results: ComplianceResult[] = [];

    for (const framework of frameworks) {
      const result = checkFramework(framework, detections);
      results.push(result);
    }

    // Show results as a quick pick
    const items: vscode.QuickPickItem[] = results.map((r) => ({
      label: `${r.passed ? '$(check)' : '$(x)'} ${r.framework}`,
      description: `Score: ${r.score}%`,
      detail: r.passed
        ? 'All checks passed'
        : `${r.violations.length} violation(s) found`,
    }));

    items.unshift({
      label: '--- Compliance Report ---',
      kind: vscode.QuickPickItemKind.Separator,
    } as vscode.QuickPickItem);

    const overallScore = results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
      : 100;

    items.push({
      label: '',
      kind: vscode.QuickPickItemKind.Separator,
    } as vscode.QuickPickItem);

    items.push({
      label: `Overall Compliance Score: ${overallScore}%`,
      description: overallScore >= 80 ? 'PASS' : 'NEEDS ATTENTION',
    });

    await vscode.window.showQuickPick(items, {
      title: `CoFounder Compliance Check - ${document.fileName.split('/').pop()}`,
      placeHolder: 'Compliance results',
    });
  });
}

function checkFramework(framework: string, detections: Detection[]): ComplianceResult {
  let violations: Detection[] = [];

  switch (framework.toLowerCase()) {
    case 'safety':
      // Safety: no injection patterns, no hardcoded keys
      violations = detections.filter(
        (d) => d.type === 'injection' || d.type === 'api-key'
      );
      break;

    case 'gdpr':
      // GDPR: no PII exposed
      violations = detections.filter((d) => d.type === 'pii');
      break;

    case 'hipaa':
      // HIPAA: no PII, no hardcoded keys
      violations = detections.filter(
        (d) => d.type === 'pii' || d.type === 'api-key'
      );
      break;

    case 'sox':
      // SOX: no secrets, proper audit trail
      violations = detections.filter((d) => d.type === 'api-key');
      break;

    case 'pii':
      violations = detections.filter((d) => d.type === 'pii');
      break;

    case 'secrets':
      violations = detections.filter((d) => d.type === 'api-key');
      break;

    default:
      // Unknown framework: check all
      violations = detections.filter(
        (d) => d.severity === 'error' || d.severity === 'warning'
      );
  }

  const score = violations.length === 0
    ? 100
    : Math.max(0, 100 - violations.length * 10);

  return {
    framework,
    passed: violations.length === 0,
    violations,
    score,
  };
}
