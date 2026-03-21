# RANA Guardrails for VS Code

AI guardrails for VS Code and Cursor. Scan your code for PII leaks, hardcoded secrets, prompt injection risks, and unapproved model usage -- all in real time.

## Features

- **Real-time inline scanning** -- PII, API keys, and injection patterns are flagged with squiggly underlines as you type.
- **Workspace scanning** -- Scan all files in your project at once with a progress bar.
- **Compliance checking** -- Check files against GDPR, HIPAA, SOX, and safety frameworks.
- **Cost estimation** -- Find LLM model references in your code and estimate per-call costs.
- **Findings sidebar** -- Browse all findings grouped by file and severity.
- **Policy management** -- View, enable, disable, and create guardrail policies from presets.
- **Dashboard** -- At-a-glance compliance score, security summary, and cost overview.
- **Status bar** -- Always-visible guard status, error/warning counts, and cost estimate.

## Installation

### From Marketplace

Search for "RANA Guardrails" in the VS Code or Cursor extensions panel.

### From VSIX

1. Build the extension:
   ```bash
   npm install
   npm run build
   npm run package
   ```
2. Install the generated `.vsix` file:
   - VS Code: `Extensions` > `...` > `Install from VSIX...`
   - Cursor: same flow, or `code --install-extension rana-guardrails-1.0.0.vsix`

## Commands

Open the command palette (`Cmd+Shift+P` / `Ctrl+Shift+P`) and type `RANA`:

| Command | Description |
|---------|-------------|
| `RANA: Scan Current File` | Scan the active editor for issues |
| `RANA: Scan Workspace` | Scan all supported files in the workspace |
| `RANA: Show Dashboard` | Open the guardrails dashboard |
| `RANA: Check Compliance` | Run compliance checks against configured frameworks |
| `RANA: Estimate Cost` | Find model references and estimate LLM costs |

## Configuration

All settings are under the `rana.*` namespace in VS Code settings.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `rana.enableInlineScan` | boolean | `true` | Enable real-time inline scanning |
| `rana.piiMode` | `detect` / `redact` / `block` | `detect` | How to handle PII findings |
| `rana.injectionSensitivity` | `low` / `medium` / `high` | `medium` | Injection detection sensitivity |
| `rana.approvedModels` | string[] | `[]` | Approved model names (empty = all allowed) |
| `rana.complianceFrameworks` | string[] | `["safety"]` | Active compliance frameworks |

## Sidebar Views

The RANA shield icon in the activity bar opens three panels:

- **Findings** -- All detected issues grouped by file. Click any finding to jump to its location.
- **Policies** -- Manage `.rana/policies/*.yml` files. Toggle policies on/off and create new ones from presets.
- **Dashboard** -- Webview showing compliance score, security summary, and cost estimate.

## Policies

Place YAML policy files in `.rana/policies/` at the root of your workspace. Available presets:

- `safety` -- Block harmful content generation
- `pii-detect` -- Detect PII in prompts and responses
- `pii-redact` -- Auto-redact PII before sending to LLM
- `no-secrets` -- Block API keys and credentials
- `injection-guard` -- Detect prompt injection attempts
- `cost-limit` -- Enforce per-request cost limits
- `model-allowlist` -- Restrict to approved models only
- `gdpr` -- GDPR compliance checks
- `hipaa` -- HIPAA compliance checks
- `sox` -- SOX compliance checks

## Supported Languages

The inline scanner activates for TypeScript, JavaScript, Python, JSON, YAML, Markdown, and plain text files.

## Compatibility

Works in both VS Code (1.85+) and Cursor.

## Development

```bash
npm install
npm run watch    # Rebuild on changes
# Press F5 in VS Code to launch Extension Development Host
```

## License

See the root repository license.
