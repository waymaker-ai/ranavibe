/**
 * RANA CLI Auto-Completion
 *
 * Generates shell completion scripts for bash, zsh, and fish
 *
 * @example
 * ```bash
 * # Setup completions (interactive)
 * rana completion
 *
 * # Generate for specific shell
 * rana completion:bash >> ~/.bashrc
 * rana completion:zsh >> ~/.zshrc
 * rana completion:fish > ~/.config/fish/completions/rana.fish
 *
 * # Install completions automatically
 * rana completion:install
 * ```
 */

import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// All RANA CLI commands with descriptions
const COMMANDS = [
  // Core commands
  { name: 'init', desc: 'Initialize RANA in your project' },
  { name: 'check', desc: 'Check compliance with RANA standards' },
  { name: 'deploy', desc: 'Deploy with RANA verification workflow' },
  { name: 'deploy:status', desc: 'Show deployment history' },
  { name: 'deploy:rollback', desc: 'Rollback to previous deployment' },
  { name: 'validate', desc: 'Validate .rana.yml configuration' },
  { name: 'status', desc: 'Show RANA project status' },

  // One-word shortcuts
  { name: 'playground', desc: 'Interactive playground' },
  { name: 'play', desc: 'Alias for playground' },
  { name: 'dashboard', desc: 'Real-time cost dashboard' },
  { name: 'dash', desc: 'Alias for dashboard' },
  { name: 'analyze', desc: 'Analyze project' },
  { name: 'optimize', desc: 'Apply optimizations' },
  { name: 'fix', desc: 'Auto-fix issues' },
  { name: 'test', desc: 'Run AI-native tests' },
  { name: 'test:generate', desc: 'Generate test file' },
  { name: 'test:gen', desc: 'Alias for test:generate' },
  { name: 'test:baselines', desc: 'List test baselines' },
  { name: 'migrate', desc: 'Run database migrations' },
  { name: 'audit', desc: 'Run security audit' },

  // Config commands
  { name: 'config', desc: 'Show configuration' },
  { name: 'config:set', desc: 'Set API key' },
  { name: 'config:list', desc: 'List API keys' },
  { name: 'config:keys', desc: 'Alias for config:list' },
  { name: 'config:validate', desc: 'Validate API keys' },
  { name: 'config:remove', desc: 'Remove API key' },
  { name: 'config:export', desc: 'Export keys to .env' },
  { name: 'config:import', desc: 'Import keys from .env' },

  // Database commands
  { name: 'db:setup', desc: 'Database setup wizard' },
  { name: 'db:migrate', desc: 'Run migrations' },
  { name: 'db:seed', desc: 'Seed database' },
  { name: 'db:reset', desc: 'Reset database' },
  { name: 'db:studio', desc: 'Open Prisma Studio' },
  { name: 'db:status', desc: 'Database status' },

  // Security commands
  { name: 'security:audit', desc: 'Security audit' },
  { name: 'security:setup', desc: 'Security setup wizard' },

  // LLM commands
  { name: 'llm:analyze', desc: 'Analyze LLM usage' },
  { name: 'llm:optimize', desc: 'Optimize LLM costs' },
  { name: 'llm:compare', desc: 'Compare LLM models' },
  { name: 'llm:setup', desc: 'Setup LLM providers' },

  // SEO commands
  { name: 'seo:check', desc: 'Validate SEO' },
  { name: 'seo:generate', desc: 'Generate SEO files' },
  { name: 'seo:analyze', desc: 'Analyze pages for SEO' },
  { name: 'seo:setup', desc: 'SEO setup wizard' },

  // Mobile commands
  { name: 'mobile:validate', desc: 'Validate mobile-first' },
  { name: 'mobile:test', desc: 'Test mobile viewports' },
  { name: 'mobile:setup', desc: 'Mobile setup wizard' },

  // Process intelligence
  { name: 'analyze:velocity', desc: 'Development velocity' },
  { name: 'velocity', desc: 'Alias for analyze:velocity' },
  { name: 'analyze:legacy', desc: 'Legacy code analysis' },
  { name: 'legacy', desc: 'Alias for analyze:legacy' },
  { name: 'velocity:setup', desc: 'Setup velocity tracking' },

  // Cost commands
  { name: 'cost:estimate', desc: 'Estimate LLM costs' },
  { name: 'cost', desc: 'Alias for cost:estimate' },
  { name: 'cost:compare', desc: 'Compare provider pricing' },

  // Budget commands
  { name: 'budget', desc: 'View budget status' },
  { name: 'budget:set', desc: 'Set spending budget' },
  { name: 'budget:clear', desc: 'Remove budget' },
  { name: 'budget:reset', desc: 'Reset spending to $0' },
  { name: 'budget:preset', desc: 'Apply budget preset' },

  // Benchmark commands
  { name: 'benchmark:run', desc: 'Benchmark providers' },
  { name: 'benchmark', desc: 'Alias for benchmark:run' },
  { name: 'benchmark:quick', desc: 'Quick latency check' },

  // Ollama commands
  { name: 'ollama', desc: 'Check Ollama status' },
  { name: 'ollama:models', desc: 'List Ollama models' },
  { name: 'ollama:pull', desc: 'Pull Ollama model' },
  { name: 'ollama:test', desc: 'Test Ollama model' },

  // Diagnostic commands
  { name: 'doctor', desc: 'Diagnose project' },

  // Generate commands
  { name: 'generate', desc: 'Generate code from prompt' },
  { name: 'gen', desc: 'Alias for generate' },
  { name: 'generate:templates', desc: 'List templates' },
  { name: 'gen:list', desc: 'Alias for generate:templates' },
  { name: 'generate:interactive', desc: 'Interactive generator' },
  { name: 'gen:i', desc: 'Alias for generate:interactive' },

  // Prompt commands
  { name: 'prompt:create', desc: 'Create prompt template' },
  { name: 'prompt:list', desc: 'List prompts' },
  { name: 'prompts', desc: 'Alias for prompt:list' },
  { name: 'prompt:test', desc: 'Test a prompt' },
  { name: 'prompt:protect', desc: 'Configure protection' },
  { name: 'prompt:delete', desc: 'Delete a prompt' },
  { name: 'prompt:export', desc: 'Export prompts' },
  { name: 'prompt:import', desc: 'Import prompts' },
  { name: 'prompt:templates', desc: 'Show templates' },

  // Wizard commands
  { name: 'wizard', desc: 'Guided setup wizard' },
  { name: 'wizard:quick', desc: 'Quick setup' },
  { name: 'quick-start', desc: 'Alias for wizard:quick' },

  // Health commands
  { name: 'health:check', desc: 'Check health endpoints' },
  { name: 'health:setup', desc: 'Add health endpoint' },
  { name: 'monitor:setup', desc: 'Setup monitoring' },
  { name: 'monitor:status', desc: 'Monitoring status' },

  // Learning commands
  { name: 'learn', desc: 'Interactive tutorials' },
  { name: 'learn:list', desc: 'List lessons' },
  { name: 'new', desc: 'Generate components' },

  // Docker commands
  { name: 'docker:build', desc: 'Build Docker image' },
  { name: 'docker:push', desc: 'Push to registry' },
  { name: 'docker:run', desc: 'Run in Docker' },

  // Completion commands
  { name: 'completion', desc: 'Setup shell completions' },
  { name: 'completion:bash', desc: 'Generate bash completions' },
  { name: 'completion:zsh', desc: 'Generate zsh completions' },
  { name: 'completion:fish', desc: 'Generate fish completions' },
  { name: 'completion:install', desc: 'Auto-install completions' },
];

// Common option flags
const COMMON_OPTIONS = [
  { flag: '--help', short: '-h', desc: 'Show help' },
  { flag: '--version', short: '-V', desc: 'Show version' },
];

// Provider names for completion
const PROVIDERS = ['openai', 'anthropic', 'google', 'cohere', 'mistral', 'ollama', 'groq', 'together', 'replicate'];

// Ollama models for completion
const OLLAMA_MODELS = ['llama3.2', 'llama3.2:1b', 'codellama', 'mistral', 'mixtral', 'qwen2.5', 'phi3', 'gemma2'];

// Budget presets
const BUDGET_PRESETS = ['testing', 'development', 'staging', 'production'];

// New command types
const NEW_TYPES = ['chatbot', 'rag', 'agent', 'api', 'mcp'];

// Learn topics
const LEARN_TOPICS = ['basics', 'prompts', 'testing', 'cost', 'providers', 'security', 'memory', 'mcp'];

/**
 * Main completion command - show setup instructions
 */
export async function completionCommand(): Promise<void> {
  console.log(chalk.bold.cyan('\n🎯 RANA CLI Auto-Completion\n'));

  const shell = detectShell();
  console.log(`Detected shell: ${chalk.white(shell)}\n`);

  console.log(chalk.gray('Setup completions for your shell:\n'));

  console.log(chalk.bold('Bash:'));
  console.log(chalk.gray('  rana completion:bash >> ~/.bashrc'));
  console.log(chalk.gray('  source ~/.bashrc\n'));

  console.log(chalk.bold('Zsh:'));
  console.log(chalk.gray('  rana completion:zsh >> ~/.zshrc'));
  console.log(chalk.gray('  source ~/.zshrc\n'));

  console.log(chalk.bold('Fish:'));
  console.log(chalk.gray('  rana completion:fish > ~/.config/fish/completions/rana.fish\n'));

  console.log(chalk.bold('Or auto-install for your shell:'));
  console.log(chalk.cyan('  rana completion:install\n'));
}

/**
 * Generate Bash completion script
 */
export async function completionBashCommand(): Promise<void> {
  const script = generateBashCompletion();
  console.log(script);
}

/**
 * Generate Zsh completion script
 */
export async function completionZshCommand(): Promise<void> {
  const script = generateZshCompletion();
  console.log(script);
}

/**
 * Generate Fish completion script
 */
export async function completionFishCommand(): Promise<void> {
  const script = generateFishCompletion();
  console.log(script);
}

/**
 * Auto-install completion for detected shell
 */
export async function completionInstallCommand(): Promise<void> {
  const shell = detectShell();
  console.log(chalk.bold.cyan('\n🎯 Installing RANA Completions\n'));
  console.log(`Detected shell: ${chalk.white(shell)}\n`);

  try {
    switch (shell) {
      case 'bash':
        await installBashCompletion();
        break;
      case 'zsh':
        await installZshCompletion();
        break;
      case 'fish':
        await installFishCompletion();
        break;
      default:
        console.log(chalk.yellow(`Unknown shell: ${shell}`));
        console.log(chalk.gray('Please manually install using:'));
        console.log(chalk.gray('  rana completion:bash   # for bash'));
        console.log(chalk.gray('  rana completion:zsh    # for zsh'));
        console.log(chalk.gray('  rana completion:fish   # for fish'));
    }
  } catch (error: any) {
    console.log(chalk.red('Failed to install completions:'));
    console.log(chalk.gray(error.message));
  }
}

/**
 * Detect the current shell
 */
function detectShell(): string {
  const shell = process.env.SHELL || '';
  if (shell.includes('zsh')) return 'zsh';
  if (shell.includes('fish')) return 'fish';
  if (shell.includes('bash')) return 'bash';
  return path.basename(shell) || 'unknown';
}

/**
 * Generate Bash completion script
 */
function generateBashCompletion(): string {
  const commandNames = COMMANDS.map(c => c.name).join(' ');

  return `# RANA CLI Bash Completion
# Generated by: rana completion:bash
# Add to ~/.bashrc: source <(rana completion:bash)

_rana_completions() {
    local cur prev commands
    COMPREPLY=()
    cur="\${COMP_WORDS[COMP_CWORD]}"
    prev="\${COMP_WORDS[COMP_CWORD-1]}"

    # All commands
    commands="${commandNames}"

    # Provider names
    providers="${PROVIDERS.join(' ')}"

    # Ollama models
    ollama_models="${OLLAMA_MODELS.join(' ')}"

    # Budget presets
    budget_presets="${BUDGET_PRESETS.join(' ')}"

    # New types
    new_types="${NEW_TYPES.join(' ')}"

    # Learn topics
    learn_topics="${LEARN_TOPICS.join(' ')}"

    case "\${prev}" in
        rana)
            COMPREPLY=( $(compgen -W "\${commands}" -- "\${cur}") )
            return 0
            ;;
        config:set|config:validate|config:remove|-p|--provider)
            COMPREPLY=( $(compgen -W "\${providers}" -- "\${cur}") )
            return 0
            ;;
        ollama:pull|ollama:test)
            COMPREPLY=( $(compgen -W "\${ollama_models}" -- "\${cur}") )
            return 0
            ;;
        budget:preset)
            COMPREPLY=( $(compgen -W "\${budget_presets}" -- "\${cur}") )
            return 0
            ;;
        new)
            COMPREPLY=( $(compgen -W "\${new_types}" -- "\${cur}") )
            return 0
            ;;
        learn)
            COMPREPLY=( $(compgen -W "\${learn_topics}" -- "\${cur}") )
            return 0
            ;;
        *)
            # Option completion
            case "\${COMP_WORDS[1]}" in
                init)
                    COMPREPLY=( $(compgen -W "-t --template -f --force" -- "\${cur}") )
                    ;;
                deploy)
                    COMPREPLY=( $(compgen -W "--verify --skip-tests --skip-build --skip-security --prod -p --platform" -- "\${cur}") )
                    ;;
                test)
                    COMPREPLY=( $(compgen -W "-c --coverage -w --watch -v --verbose --update-baselines --update-snapshots --max-cost --parallel" -- "\${cur}") )
                    ;;
                budget:set)
                    COMPREPLY=( $(compgen -W "-l --limit -p --period -a --action -w --warning -b --bypass -i --interactive" -- "\${cur}") )
                    ;;
                *)
                    COMPREPLY=( $(compgen -W "--help -h" -- "\${cur}") )
                    ;;
            esac
            return 0
            ;;
    esac
}

complete -F _rana_completions rana
`;
}

/**
 * Generate Zsh completion script
 */
function generateZshCompletion(): string {
  const commandDescriptions = COMMANDS.map(c => `'${c.name}:${c.desc}'`).join('\n    ');

  return `#compdef rana
# RANA CLI Zsh Completion
# Generated by: rana completion:zsh
# Add to ~/.zshrc: source <(rana completion:zsh)

_rana() {
    local -a commands providers ollama_models budget_presets new_types learn_topics

    commands=(
    ${commandDescriptions}
    )

    providers=(${PROVIDERS.map(p => `'${p}'`).join(' ')})
    ollama_models=(${OLLAMA_MODELS.map(m => `'${m}'`).join(' ')})
    budget_presets=(${BUDGET_PRESETS.map(p => `'${p}'`).join(' ')})
    new_types=(${NEW_TYPES.map(t => `'${t}'`).join(' ')})
    learn_topics=(${LEARN_TOPICS.map(t => `'${t}'`).join(' ')})

    _arguments -C \\
        '1: :->command' \\
        '*: :->args'

    case \$state in
        command)
            _describe -t commands 'rana commands' commands
            ;;
        args)
            case \$words[2] in
                config:set|config:validate|config:remove)
                    _arguments '-p[Provider]:provider:(\$providers)'
                    ;;
                ollama:pull|ollama:test)
                    _describe -t models 'ollama models' ollama_models
                    ;;
                budget:preset)
                    _describe -t presets 'budget presets' budget_presets
                    ;;
                new)
                    _describe -t types 'component types' new_types
                    ;;
                learn)
                    _describe -t topics 'learn topics' learn_topics
                    ;;
                init)
                    _arguments \\
                        '-t[Template]:template:(default react nextjs vue)' \\
                        '-f[Force overwrite]'
                    ;;
                deploy)
                    _arguments \\
                        '--verify[Verify deployment]' \\
                        '--skip-tests[Skip testing]' \\
                        '--skip-build[Skip build]' \\
                        '--skip-security[Skip security audit]' \\
                        '--prod[Deploy to production]' \\
                        '-p[Platform]:platform:(vercel railway docker)'
                    ;;
                test)
                    _arguments \\
                        '-c[Coverage report]' \\
                        '-w[Watch mode]' \\
                        '-v[Verbose output]' \\
                        '--update-baselines[Update baselines]' \\
                        '--update-snapshots[Update snapshots]' \\
                        '--max-cost[Max cost]:cost:' \\
                        '--parallel[Run parallel]'
                    ;;
                budget:set)
                    _arguments \\
                        '-l[Limit amount]:amount:' \\
                        '-p[Period]:period:(hourly daily weekly monthly total)' \\
                        '-a[Action]:action:(block warn log)' \\
                        '-w[Warning %]:percent:' \\
                        '-b[Bypass critical]' \\
                        '-i[Interactive mode]'
                    ;;
            esac
            ;;
    esac
}

_rana "\$@"
`;
}

/**
 * Generate Fish completion script
 */
function generateFishCompletion(): string {
  const commandCompletions = COMMANDS.map(
    c => `complete -c rana -n "__fish_use_subcommand" -a "${c.name}" -d "${c.desc}"`
  ).join('\n');

  const providerCompletions = PROVIDERS.map(
    p => `complete -c rana -n "__fish_seen_subcommand_from config:set config:validate config:remove" -a "${p}"`
  ).join('\n');

  const ollamaCompletions = OLLAMA_MODELS.map(
    m => `complete -c rana -n "__fish_seen_subcommand_from ollama:pull ollama:test" -a "${m}"`
  ).join('\n');

  const presetCompletions = BUDGET_PRESETS.map(
    p => `complete -c rana -n "__fish_seen_subcommand_from budget:preset" -a "${p}"`
  ).join('\n');

  const newCompletions = NEW_TYPES.map(
    t => `complete -c rana -n "__fish_seen_subcommand_from new" -a "${t}"`
  ).join('\n');

  const learnCompletions = LEARN_TOPICS.map(
    t => `complete -c rana -n "__fish_seen_subcommand_from learn" -a "${t}"`
  ).join('\n');

  return `# RANA CLI Fish Completion
# Generated by: rana completion:fish
# Save to: ~/.config/fish/completions/rana.fish

# Disable file completion
complete -c rana -f

# Commands
${commandCompletions}

# Providers
${providerCompletions}

# Ollama models
${ollamaCompletions}

# Budget presets
${presetCompletions}

# New types
${newCompletions}

# Learn topics
${learnCompletions}

# Common options
complete -c rana -s h -l help -d "Show help"
complete -c rana -s V -l version -d "Show version"

# init options
complete -c rana -n "__fish_seen_subcommand_from init" -s t -l template -d "Template" -a "default react nextjs vue"
complete -c rana -n "__fish_seen_subcommand_from init" -s f -l force -d "Force overwrite"

# deploy options
complete -c rana -n "__fish_seen_subcommand_from deploy" -l verify -d "Verify deployment"
complete -c rana -n "__fish_seen_subcommand_from deploy" -l skip-tests -d "Skip testing"
complete -c rana -n "__fish_seen_subcommand_from deploy" -l skip-build -d "Skip build"
complete -c rana -n "__fish_seen_subcommand_from deploy" -l prod -d "Deploy to production"
complete -c rana -n "__fish_seen_subcommand_from deploy" -s p -l platform -d "Platform" -a "vercel railway docker"

# test options
complete -c rana -n "__fish_seen_subcommand_from test" -s c -l coverage -d "Coverage report"
complete -c rana -n "__fish_seen_subcommand_from test" -s w -l watch -d "Watch mode"
complete -c rana -n "__fish_seen_subcommand_from test" -s v -l verbose -d "Verbose output"
complete -c rana -n "__fish_seen_subcommand_from test" -l update-baselines -d "Update baselines"
complete -c rana -n "__fish_seen_subcommand_from test" -l update-snapshots -d "Update snapshots"
complete -c rana -n "__fish_seen_subcommand_from test" -l parallel -d "Run parallel"

# budget:set options
complete -c rana -n "__fish_seen_subcommand_from budget:set" -s l -l limit -d "Limit amount"
complete -c rana -n "__fish_seen_subcommand_from budget:set" -s p -l period -d "Period" -a "hourly daily weekly monthly total"
complete -c rana -n "__fish_seen_subcommand_from budget:set" -s a -l action -d "Action" -a "block warn log"
complete -c rana -n "__fish_seen_subcommand_from budget:set" -s i -l interactive -d "Interactive mode"
`;
}

/**
 * Install Bash completion
 */
async function installBashCompletion(): Promise<void> {
  const script = generateBashCompletion();
  const bashrc = path.join(os.homedir(), '.bashrc');

  // Check if already installed
  if (fs.existsSync(bashrc)) {
    const content = fs.readFileSync(bashrc, 'utf-8');
    if (content.includes('_rana_completions')) {
      console.log(chalk.yellow('Bash completion already installed.'));
      console.log(chalk.gray('To reinstall, remove the RANA completion block from ~/.bashrc'));
      return;
    }
  }

  // Append to .bashrc
  fs.appendFileSync(bashrc, '\n' + script + '\n');
  console.log(chalk.green('✓ Bash completion installed!'));
  console.log(chalk.gray('Restart your terminal or run: source ~/.bashrc'));
}

/**
 * Install Zsh completion
 */
async function installZshCompletion(): Promise<void> {
  const script = generateZshCompletion();
  const zshrc = path.join(os.homedir(), '.zshrc');

  // Check if already installed
  if (fs.existsSync(zshrc)) {
    const content = fs.readFileSync(zshrc, 'utf-8');
    if (content.includes('#compdef rana') || content.includes('_rana')) {
      console.log(chalk.yellow('Zsh completion already installed.'));
      console.log(chalk.gray('To reinstall, remove the RANA completion block from ~/.zshrc'));
      return;
    }
  }

  // Append to .zshrc
  fs.appendFileSync(zshrc, '\n' + script + '\n');
  console.log(chalk.green('✓ Zsh completion installed!'));
  console.log(chalk.gray('Restart your terminal or run: source ~/.zshrc'));
}

/**
 * Install Fish completion
 */
async function installFishCompletion(): Promise<void> {
  const script = generateFishCompletion();
  const fishDir = path.join(os.homedir(), '.config', 'fish', 'completions');
  const fishFile = path.join(fishDir, 'rana.fish');

  // Create directory if needed
  if (!fs.existsSync(fishDir)) {
    fs.mkdirSync(fishDir, { recursive: true });
  }

  // Write completion file
  fs.writeFileSync(fishFile, script);
  console.log(chalk.green('✓ Fish completion installed!'));
  console.log(chalk.gray('Completions will be available in new fish sessions.'));
}
