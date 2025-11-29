/**
 * RANA Ollama Command
 *
 * Local-first AI development with Ollama
 *
 * @example
 * ```bash
 * # Check Ollama status
 * rana ollama
 *
 * # List available models
 * rana ollama:models
 *
 * # Pull a model
 * rana ollama:pull llama3.2
 *
 * # Test a model
 * rana ollama:test llama3.2
 * ```
 */

import chalk from 'chalk';

interface OllamaModel {
  name: string;
  size: number;
  modified_at: string;
}

/**
 * Check Ollama status
 */
export async function ollamaCommand(): Promise<void> {
  console.log(chalk.bold.cyan('\n🦙 RANA Ollama Integration\n'));

  const baseUrl = process.env.OLLAMA_HOST || 'http://localhost:11434';

  try {
    const response = await fetch(`${baseUrl}/api/tags`);

    if (!response.ok) {
      throw new Error('Ollama not responding');
    }

    const data = await response.json() as { models?: OllamaModel[] };
    const models = data.models || [];

    console.log(chalk.green('✓ Ollama is running at ' + baseUrl));
    console.log(chalk.gray(`\n${models.length} model(s) installed:\n`));

    if (models.length === 0) {
      console.log(chalk.yellow('  No models installed.'));
      console.log(chalk.gray('  Run: rana ollama:pull llama3.2'));
    } else {
      for (const model of models) {
        const size = formatSize(model.size);
        console.log(`  ${chalk.white(model.name)} ${chalk.gray(`(${size})`)}`);
      }
    }

    console.log(chalk.gray('\nUsage with RANA:'));
    console.log(chalk.gray('  const rana = createRana({'));
    console.log(chalk.gray('    providers: { ollama: "http://localhost:11434" }'));
    console.log(chalk.gray('  });'));
    console.log(chalk.gray(`  await rana.chat({ provider: 'ollama', model: '${models[0]?.name || 'llama3.2'}', ... });`));
    console.log('');
  } catch (error) {
    console.log(chalk.red('✗ Ollama is not running'));
    console.log(chalk.gray('\nTo install Ollama:'));
    console.log(chalk.gray('  macOS:   brew install ollama'));
    console.log(chalk.gray('  Linux:   curl -fsSL https://ollama.com/install.sh | sh'));
    console.log(chalk.gray('  Windows: Download from https://ollama.com/download'));
    console.log(chalk.gray('\nThen start the server:'));
    console.log(chalk.gray('  ollama serve'));
    console.log('');
  }
}

/**
 * List Ollama models
 */
export async function ollamaModelsCommand(): Promise<void> {
  console.log(chalk.bold.cyan('\n🦙 Ollama Models\n'));

  const baseUrl = process.env.OLLAMA_HOST || 'http://localhost:11434';

  try {
    const response = await fetch(`${baseUrl}/api/tags`);

    if (!response.ok) {
      throw new Error('Ollama not responding');
    }

    const data = await response.json() as { models?: OllamaModel[] };
    const models: OllamaModel[] = data.models || [];

    if (models.length === 0) {
      console.log(chalk.yellow('No models installed.\n'));
      console.log('Popular models to try:');
      console.log(chalk.gray('  rana ollama:pull llama3.2      # Fast, small (2GB)'));
      console.log(chalk.gray('  rana ollama:pull llama3.2:1b   # Tiny (1.3GB)'));
      console.log(chalk.gray('  rana ollama:pull codellama     # Code generation'));
      console.log(chalk.gray('  rana ollama:pull mistral       # Good balance'));
      console.log(chalk.gray('  rana ollama:pull mixtral       # Large, powerful'));
      console.log('');
      return;
    }

    console.log(chalk.gray('Installed models:\n'));

    // Table header
    console.log(
      chalk.gray('  ') +
      chalk.bold('Model'.padEnd(30)) +
      chalk.bold('Size'.padEnd(12)) +
      chalk.bold('Modified')
    );
    console.log(chalk.gray('  ' + '-'.repeat(60)));

    for (const model of models) {
      const size = formatSize(model.size);
      const modified = new Date(model.modified_at).toLocaleDateString();
      console.log(
        chalk.gray('  ') +
        chalk.white(model.name.padEnd(30)) +
        chalk.cyan(size.padEnd(12)) +
        chalk.gray(modified)
      );
    }

    console.log('');
  } catch {
    console.log(chalk.red('✗ Cannot connect to Ollama'));
    console.log(chalk.gray('Make sure Ollama is running: ollama serve\n'));
  }
}

/**
 * Pull an Ollama model
 */
export async function ollamaPullCommand(model: string): Promise<void> {
  if (!model) {
    console.log(chalk.yellow('\nUsage: rana ollama:pull <model>\n'));
    console.log('Popular models:');
    console.log(chalk.gray('  llama3.2      # Latest Llama, fast'));
    console.log(chalk.gray('  llama3.2:1b   # Tiny version'));
    console.log(chalk.gray('  codellama     # Code generation'));
    console.log(chalk.gray('  mistral       # Good balance'));
    console.log(chalk.gray('  qwen2.5       # Multilingual'));
    console.log('');
    return;
  }

  console.log(chalk.cyan(`\n🦙 Pulling ${model}...\n`));

  const baseUrl = process.env.OLLAMA_HOST || 'http://localhost:11434';

  try {
    const response = await fetch(`${baseUrl}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: model, stream: false }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }

    console.log(chalk.green(`✓ Successfully pulled ${model}`));
    console.log(chalk.gray('\nUse with RANA:'));
    console.log(chalk.gray(`  await rana.chat({ provider: 'ollama', model: '${model}', ... });`));
    console.log('');
  } catch (error: any) {
    console.log(chalk.red(`✗ Failed to pull ${model}`));
    console.log(chalk.gray(error.message || 'Unknown error'));
    console.log('');
  }
}

/**
 * Test an Ollama model
 */
export async function ollamaTestCommand(model?: string): Promise<void> {
  const baseUrl = process.env.OLLAMA_HOST || 'http://localhost:11434';

  // Get default model if not specified
  if (!model) {
    try {
      const response = await fetch(`${baseUrl}/api/tags`);
      const data = await response.json() as { models?: OllamaModel[] };
      model = data.models?.[0]?.name;
    } catch {
      // ignore
    }
  }

  if (!model) {
    console.log(chalk.yellow('\nNo model specified and no models installed.'));
    console.log(chalk.gray('Run: rana ollama:pull llama3.2\n'));
    return;
  }

  console.log(chalk.cyan(`\n🦙 Testing ${model}...\n`));

  const startTime = Date.now();

  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Say "Hello from RANA!" in exactly 5 words.' }],
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = await response.json() as { message?: { content: string }; eval_count?: number };
    const latency = Date.now() - startTime;

    console.log(chalk.green('✓ Model is working!'));
    console.log(chalk.gray(`\nResponse: "${data.message?.content}"`));
    console.log(chalk.gray(`Latency: ${latency}ms`));
    console.log(chalk.gray(`Tokens: ${data.eval_count || 'N/A'}`));
    console.log('');
  } catch (error: any) {
    console.log(chalk.red(`✗ Test failed`));
    console.log(chalk.gray(error.message || 'Unknown error'));
    console.log('');
  }
}

/**
 * Format bytes to human readable
 */
function formatSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}
