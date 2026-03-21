import * as vscode from 'vscode';
import { WorkspaceFinding } from '../scanners/workspace-scanner';

/**
 * Tree item types for the findings hierarchy.
 */
type FindingNode = FileNode | FindingDetailNode;

class FileNode extends vscode.TreeItem {
  readonly kind = 'file' as const;
  constructor(
    public readonly uri: vscode.Uri,
    public readonly relativePath: string,
    public readonly findings: WorkspaceFinding[]
  ) {
    super(relativePath, vscode.TreeItemCollapsibleState.Expanded);
    this.resourceUri = uri;
    this.iconPath = vscode.ThemeIcon.File;

    const errors = findings.filter((f) => f.detection.severity === 'error').length;
    const warnings = findings.filter((f) => f.detection.severity === 'warning').length;
    const parts: string[] = [];
    if (errors > 0) parts.push(`${errors} errors`);
    if (warnings > 0) parts.push(`${warnings} warnings`);
    this.description = parts.join(', ') || `${findings.length} issues`;
  }
}

class FindingDetailNode extends vscode.TreeItem {
  readonly kind = 'finding' as const;
  constructor(public readonly finding: WorkspaceFinding) {
    super(finding.detection.message, vscode.TreeItemCollapsibleState.None);

    const line = finding.detection.line + 1; // Display as 1-based
    this.description = `Line ${line}`;
    this.tooltip = `${finding.detection.type}: ${finding.detection.message} (${finding.relativePath}:${line})`;

    // Icon based on severity
    switch (finding.detection.severity) {
      case 'error':
        this.iconPath = new vscode.ThemeIcon('error', new vscode.ThemeColor('errorForeground'));
        break;
      case 'warning':
        this.iconPath = new vscode.ThemeIcon('warning', new vscode.ThemeColor('editorWarning.foreground'));
        break;
      default:
        this.iconPath = new vscode.ThemeIcon('info', new vscode.ThemeColor('editorInfo.foreground'));
    }

    // Click to navigate to the finding location
    this.command = {
      command: 'vscode.open',
      title: 'Go to Finding',
      arguments: [
        finding.uri,
        {
          selection: new vscode.Range(
            finding.detection.line,
            finding.detection.startCol,
            finding.detection.line,
            finding.detection.endCol
          ),
        },
      ],
    };
  }
}

/**
 * TreeDataProvider for the RANA Findings sidebar panel.
 * Groups findings by file, then shows individual findings with severity icons.
 */
export class FindingsViewProvider implements vscode.TreeDataProvider<FindingNode> {
  private _onDidChangeTreeData = new vscode.EventEmitter<FindingNode | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private findings: WorkspaceFinding[] = [];

  /**
   * Update findings and refresh the tree.
   */
  setFindings(findings: WorkspaceFinding[]): void {
    this.findings = findings;
    this._onDidChangeTreeData.fire();
  }

  /**
   * Refresh the tree view.
   */
  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: FindingNode): vscode.TreeItem {
    return element;
  }

  getChildren(element?: FindingNode): FindingNode[] {
    if (!element) {
      // Root level: group by file
      const fileMap = new Map<string, WorkspaceFinding[]>();
      for (const finding of this.findings) {
        const key = finding.uri.toString();
        if (!fileMap.has(key)) {
          fileMap.set(key, []);
        }
        fileMap.get(key)!.push(finding);
      }

      const fileNodes: FileNode[] = [];
      for (const [, fileFindings] of fileMap) {
        const first = fileFindings[0];
        fileNodes.push(new FileNode(first.uri, first.relativePath, fileFindings));
      }

      // Sort by error count descending
      fileNodes.sort((a, b) => {
        const aErrors = a.findings.filter((f) => f.detection.severity === 'error').length;
        const bErrors = b.findings.filter((f) => f.detection.severity === 'error').length;
        return bErrors - aErrors || a.relativePath.localeCompare(b.relativePath);
      });

      if (fileNodes.length === 0) {
        // Return a placeholder node
        const placeholder = new vscode.TreeItem(
          'No findings. Run RANA: Scan Workspace.',
          vscode.TreeItemCollapsibleState.None
        );
        placeholder.iconPath = new vscode.ThemeIcon('check');
        return [placeholder as FindingNode];
      }

      return fileNodes;
    }

    if (element instanceof FileNode) {
      // File level: show individual findings
      return element.findings.map((f) => new FindingDetailNode(f));
    }

    return [];
  }
}
