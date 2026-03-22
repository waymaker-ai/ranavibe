import * as vscode from 'vscode';
import { detectModels, estimateTokens, estimateCost, getModelCost } from '../detectors';

/**
 * Command handler: estimate LLM cost from code in the current file.
 * Finds model strings, estimates token counts, and shows cost breakdown.
 */
export function registerEstimateCostCommand(
  context: vscode.ExtensionContext
): vscode.Disposable {
  return vscode.commands.registerCommand('cofounder.estimateCost', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('CoFounder: No active editor for cost estimation.');
      return;
    }

    const document = editor.document;
    const text = document.getText();
    const lines = text.split('\n');

    // Find all model references in the file
    const modelDetections: { model: string; line: number }[] = [];
    for (let i = 0; i < lines.length; i++) {
      const detections = detectModels(lines[i], i);
      for (const d of detections) {
        if (d.category) {
          modelDetections.push({ model: d.category, line: i + 1 });
        }
      }
    }

    // Deduplicate model names
    const uniqueModels = [...new Set(modelDetections.map((d) => d.model))];

    if (uniqueModels.length === 0) {
      vscode.window.showInformationMessage(
        'CoFounder: No LLM model references found in this file.'
      );
      return;
    }

    // Estimate tokens for the file content (rough approximation)
    const totalTokens = estimateTokens(text);

    // Build cost breakdown
    const items: vscode.QuickPickItem[] = [];

    items.push({
      label: '--- Cost Estimation Report ---',
      kind: vscode.QuickPickItemKind.Separator,
    } as vscode.QuickPickItem);

    items.push({
      label: `$(file) File: ${document.fileName.split('/').pop()}`,
      description: `~${totalTokens.toLocaleString()} tokens`,
    });

    items.push({
      label: '',
      kind: vscode.QuickPickItemKind.Separator,
    } as vscode.QuickPickItem);

    let totalCost = 0;

    for (const model of uniqueModels) {
      const cost = getModelCost(model);
      const lines = modelDetections
        .filter((d) => d.model === model)
        .map((d) => d.line);

      if (cost) {
        // Estimate: assume the file content is the prompt (input tokens)
        // and estimate output as roughly half the input
        const inputTokens = totalTokens;
        const outputTokens = Math.ceil(totalTokens / 2);
        const estimatedCost = estimateCost(model, inputTokens, outputTokens);

        if (estimatedCost !== undefined) {
          totalCost += estimatedCost;
          items.push({
            label: `$(symbol-method) ${model}`,
            description: `$${estimatedCost.toFixed(6)} per call`,
            detail: `Input: $${cost.input}/M tokens, Output: $${cost.output}/M tokens | Lines: ${lines.join(', ')}`,
          });
        }
      } else {
        items.push({
          label: `$(symbol-method) ${model}`,
          description: 'Unknown pricing',
          detail: `Lines: ${lines.join(', ')}`,
        });
      }
    }

    items.push({
      label: '',
      kind: vscode.QuickPickItemKind.Separator,
    } as vscode.QuickPickItem);

    items.push({
      label: `Total Estimated Cost Per Call`,
      description: `$${totalCost.toFixed(6)}`,
      detail: `Based on ~${totalTokens.toLocaleString()} input tokens + ~${Math.ceil(totalTokens / 2).toLocaleString()} output tokens`,
    });

    // Show the report
    await vscode.window.showQuickPick(items, {
      title: 'CoFounder Cost Estimation',
      placeHolder: 'LLM cost breakdown',
    });

    return totalCost;
  });
}
