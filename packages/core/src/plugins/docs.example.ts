/**
 * DocsPlugin Example
 * Demonstrates how to use the documentation chatbot plugin
 */

import { createRana } from '../client';
import { DocsPlugin } from './docs';

async function main() {
  // Create RANA client
  const rana = createRana({
    providers: {
      openai: process.env.OPENAI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
    },
    defaults: {
      provider: 'openai',
      model: 'gpt-4o-mini',
    },
  });

  // Create docs plugin
  const docs = new DocsPlugin({
    rana,
    sources: [
      // Markdown files
      {
        type: 'markdown',
        location: './README.md',
      },
      // GitHub repository
      {
        type: 'github',
        location: 'waymaker-ai/ranavibe',
      },
    ],
    chunkSize: 1000,
    maxSources: 3,
    enableFollowUps: true,
  });

  console.log('Initializing documentation chatbot...');

  // Initialize and ingest documentation
  await docs.initialize((progress) => {
    console.log(
      `Ingesting docs: ${progress.processed}/${progress.total} ` +
      `(${progress.totalChunks} chunks created)`
    );
  });

  const stats = await docs.getStats();
  console.log('\nDocumentation indexed:');
  console.log(`- ${stats.totalChunks} chunks`);
  console.log(`- ${stats.totalSources} sources\n`);

  // Example 1: Simple question
  console.log('=== Example 1: Simple Question ===');
  const answer1 = await docs.ask('How do I install RANA?');
  console.log('Q: How do I install RANA?');
  console.log(`A: ${answer1.answer}\n`);
  console.log(`Confidence: ${(answer1.confidence * 100).toFixed(1)}%`);
  console.log(`Sources: ${answer1.sources.length}`);
  answer1.sources.forEach((source, i) => {
    console.log(`  [${i + 1}] ${source.source.location} (score: ${source.score.toFixed(2)})`);
  });

  if (answer1.followUpQuestions && answer1.followUpQuestions.length > 0) {
    console.log('\nFollow-up questions:');
    answer1.followUpQuestions.forEach((q, i) => {
      console.log(`  ${i + 1}. ${q}`);
    });
  }

  console.log('\n=== Example 2: Technical Question ===');
  const answer2 = await docs.ask('What providers does RANA support?');
  console.log('Q: What providers does RANA support?');
  console.log(`A: ${answer2.answer}\n`);

  // Example 3: Search without answering
  console.log('=== Example 3: Direct Search ===');
  const searchResults = await docs.search('configuration', 5);
  console.log('Search: "configuration"');
  console.log(`Found ${searchResults.length} results:`);
  searchResults.forEach((result, i) => {
    console.log(`  ${i + 1}. ${result.entry.content.slice(0, 100)}... (score: ${result.score.toFixed(2)})`);
  });

  // Example 4: Conversational context
  console.log('\n=== Example 4: Conversational Context ===');
  await docs.ask('What is RANA?');
  const answer4 = await docs.ask('How much does it cost?', {
    useContext: true,
  });
  console.log('Q: How much does it cost? (with context)');
  console.log(`A: ${answer4.answer}\n`);

  // Clean up
  await docs.close();
  console.log('Documentation chatbot closed.');
}

// Example with custom embedding provider
async function exampleWithCustomEmbedding() {
  const rana = createRana({
    providers: {
      openai: process.env.OPENAI_API_KEY,
    },
  });

  // You could use OpenAI embeddings or another provider
  // This is a placeholder - implement actual embedding API
  const embeddingProvider = {
    dimensions: 1536,
    async embed(text: string): Promise<number[]> {
      // Call OpenAI embeddings API
      // const response = await openai.embeddings.create({ input: text, model: 'text-embedding-3-small' });
      // return response.data[0].embedding;
      return new Array(1536).fill(0); // Placeholder
    },
  };

  const docs = new DocsPlugin({
    rana,
    embeddingProvider,
    sources: [
      { type: 'markdown', location: './docs' },
    ],
    persistencePath: './docs-index.json', // Persist to file
  });

  await docs.initialize();

  const answer = await docs.ask('How do I get started?');
  console.log(answer.answer);

  await docs.close();
}

// Example with file persistence
async function exampleWithPersistence() {
  const rana = createRana({
    providers: {
      openai: process.env.OPENAI_API_KEY,
    },
  });

  const docs = new DocsPlugin({
    rana,
    sources: [
      { type: 'markdown', location: './docs' },
    ],
    persistencePath: './docs-vector-index.json',
    chunkSize: 800,
    maxSources: 5,
  });

  // First run: will ingest and save to file
  await docs.initialize();

  // Subsequent runs: will load from file (much faster)
  // await docs.initialize(); // Loads from docs-vector-index.json

  const answer = await docs.ask('What is the pricing model?');
  console.log(answer.answer);

  await docs.close();
}

// Run examples
if (require.main === module) {
  main().catch(console.error);
}

export { main, exampleWithCustomEmbedding, exampleWithPersistence };
