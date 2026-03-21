import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Represents a policy item in the tree view.
 */
type PolicyNode = PolicyFileNode | PresetPolicyNode | PolicyCategoryNode;

class PolicyCategoryNode extends vscode.TreeItem {
  readonly kind = 'category' as const;
  constructor(
    public readonly categoryLabel: string,
    public readonly children: PolicyNode[],
    expanded = true
  ) {
    super(
      categoryLabel,
      expanded
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.Collapsed
    );
    this.iconPath = new vscode.ThemeIcon('folder');
  }
}

class PolicyFileNode extends vscode.TreeItem {
  readonly kind = 'file' as const;
  constructor(
    public readonly uri: vscode.Uri,
    public readonly policyName: string,
    public readonly isEnabled: boolean
  ) {
    super(policyName, vscode.TreeItemCollapsibleState.None);
    this.description = isEnabled ? 'enabled' : 'disabled';
    this.iconPath = new vscode.ThemeIcon(
      isEnabled ? 'check' : 'circle-slash',
      isEnabled
        ? new vscode.ThemeColor('testing.iconPassed')
        : new vscode.ThemeColor('testing.iconSkipped')
    );
    this.tooltip = `Policy: ${policyName}\nPath: ${uri.fsPath}\nStatus: ${isEnabled ? 'Enabled' : 'Disabled'}`;
    this.command = {
      command: 'vscode.open',
      title: 'Open Policy',
      arguments: [uri],
    };
    this.contextValue = isEnabled ? 'policyEnabled' : 'policyDisabled';
  }
}

class PresetPolicyNode extends vscode.TreeItem {
  readonly kind = 'preset' as const;
  constructor(
    public readonly presetName: string,
    public readonly presetDescription: string
  ) {
    super(presetName, vscode.TreeItemCollapsibleState.None);
    this.description = presetDescription;
    this.iconPath = new vscode.ThemeIcon('package');
    this.tooltip = `Preset policy: ${presetName}\n${presetDescription}`;
    this.contextValue = 'policyPreset';
  }
}

/**
 * Preset policies available out of the box.
 */
const PRESET_POLICIES = [
  { name: 'safety', description: 'Block harmful content generation' },
  { name: 'pii-detect', description: 'Detect PII in prompts and responses' },
  { name: 'pii-redact', description: 'Auto-redact PII before sending to LLM' },
  { name: 'no-secrets', description: 'Block API keys and credentials' },
  { name: 'injection-guard', description: 'Detect prompt injection attempts' },
  { name: 'cost-limit', description: 'Enforce per-request cost limits' },
  { name: 'model-allowlist', description: 'Restrict to approved models only' },
  { name: 'gdpr', description: 'GDPR compliance checks' },
  { name: 'hipaa', description: 'HIPAA compliance checks' },
  { name: 'sox', description: 'SOX compliance checks' },
];

/**
 * TreeDataProvider for the RANA Policies sidebar panel.
 * Shows active workspace policies and available presets.
 */
export class PoliciesViewProvider implements vscode.TreeDataProvider<PolicyNode> {
  private _onDidChangeTreeData = new vscode.EventEmitter<PolicyNode | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private policyFiles: { uri: vscode.Uri; name: string; enabled: boolean }[] = [];

  constructor() {
    this.refreshPolicies();
  }

  /**
   * Refresh the list of policy files from the workspace.
   */
  async refreshPolicies(): Promise<void> {
    this.policyFiles = [];

    try {
      // Look for .rana/policies/*.yml in all workspace folders
      const policyGlob = '**/.rana/policies/*.{yml,yaml}';
      const files = await vscode.workspace.findFiles(policyGlob, '**/node_modules/**', 100);

      for (const file of files) {
        const basename = path.basename(file.fsPath, path.extname(file.fsPath));
        // Check if policy is disabled (convention: filename starts with _)
        const enabled = !basename.startsWith('_');
        const name = enabled ? basename : basename.slice(1);
        this.policyFiles.push({ uri: file, name, enabled });
      }

      this.policyFiles.sort((a, b) => a.name.localeCompare(b.name));
    } catch {
      // Workspace may not be available
    }

    this._onDidChangeTreeData.fire();
  }

  /**
   * Toggle a policy's enabled/disabled state by renaming the file.
   */
  async togglePolicy(node: PolicyFileNode): Promise<void> {
    const dir = path.dirname(node.uri.fsPath);
    const ext = path.extname(node.uri.fsPath);
    const basename = path.basename(node.uri.fsPath, ext);

    let newName: string;
    if (node.isEnabled) {
      // Disable: prefix with _
      newName = `_${basename}${ext}`;
    } else {
      // Enable: remove _ prefix
      newName = basename.startsWith('_') ? `${basename.slice(1)}${ext}` : `${basename}${ext}`;
    }

    const newUri = vscode.Uri.file(path.join(dir, newName));

    try {
      await vscode.workspace.fs.rename(node.uri, newUri);
      await this.refreshPolicies();
      vscode.window.showInformationMessage(
        `RANA: Policy "${node.policyName}" ${node.isEnabled ? 'disabled' : 'enabled'}.`
      );
    } catch (err) {
      vscode.window.showErrorMessage(`RANA: Failed to toggle policy: ${err}`);
    }
  }

  /**
   * Create a new policy from a preset template.
   */
  async createFromPreset(presetName: string): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showWarningMessage('RANA: No workspace folder open.');
      return;
    }

    const root = workspaceFolders[0].uri;
    const policiesDir = vscode.Uri.joinPath(root, '.rana', 'policies');

    // Ensure the directory exists
    try {
      await vscode.workspace.fs.createDirectory(policiesDir);
    } catch {
      // Directory may already exist
    }

    const policyUri = vscode.Uri.joinPath(policiesDir, `${presetName}.yml`);

    const template = [
      `# RANA Policy: ${presetName}`,
      `# Generated by RANA Guardrails extension`,
      ``,
      `name: ${presetName}`,
      `enabled: true`,
      ``,
      `rules:`,
      `  - type: ${presetName}`,
      `    severity: warning`,
      `    action: flag`,
      ``,
      `# Customize this policy for your needs.`,
      `# See https://docs.ranavibe.dev/policies for full reference.`,
    ].join('\n');

    try {
      await vscode.workspace.fs.writeFile(policyUri, Buffer.from(template, 'utf-8'));
      await this.refreshPolicies();
      const doc = await vscode.workspace.openTextDocument(policyUri);
      await vscode.window.showTextDocument(doc);
      vscode.window.showInformationMessage(`RANA: Created policy "${presetName}".`);
    } catch (err) {
      vscode.window.showErrorMessage(`RANA: Failed to create policy: ${err}`);
    }
  }

  getTreeItem(element: PolicyNode): vscode.TreeItem {
    return element;
  }

  getChildren(element?: PolicyNode): PolicyNode[] {
    if (!element) {
      // Root: show categories
      const activePolicies = this.policyFiles.map(
        (p) => new PolicyFileNode(p.uri, p.name, p.enabled)
      );

      const presetPolicies = PRESET_POLICIES.map(
        (p) => new PresetPolicyNode(p.name, p.description)
      );

      const nodes: PolicyNode[] = [];
      nodes.push(
        new PolicyCategoryNode(
          `Active Policies (${activePolicies.length})`,
          activePolicies,
          true
        )
      );
      nodes.push(
        new PolicyCategoryNode('Available Presets', presetPolicies, false)
      );

      return nodes;
    }

    if (element instanceof PolicyCategoryNode) {
      return element.children;
    }

    return [];
  }
}
