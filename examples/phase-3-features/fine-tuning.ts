/**
 * Fine-Tuning Pipeline Example
 * Demonstrates dataset preparation and model fine-tuning
 */

import { FineTuningPipeline, DatasetPreparer, ModelEvaluator } from '@rana/core';

async function main() {
  // Example 1: Basic fine-tuning job
  console.log('=== Basic Fine-Tuning ===');

  const pipeline = new FineTuningPipeline({
    provider: 'openai',
    baseModel: 'gpt-4o-mini',
  });

  // Prepare a simple dataset
  const trainingData = [
    {
      messages: [
        { role: 'system', content: 'You are a helpful customer support agent.' },
        { role: 'user', content: 'How do I reset my password?' },
        { role: 'assistant', content: 'To reset your password, go to Settings > Security > Reset Password.' },
      ],
    },
    {
      messages: [
        { role: 'system', content: 'You are a helpful customer support agent.' },
        { role: 'user', content: 'Where can I find my order history?' },
        { role: 'assistant', content: 'You can find your order history under Account > Orders.' },
      ],
    },
    // ... more examples
  ];

  // Validate and prepare dataset
  const dataset = await pipeline.prepareDataset({
    data: trainingData,
    format: 'chat',
    splitRatio: 0.9,
  });

  console.log('Dataset prepared:');
  console.log(`  Training examples: ${dataset.training.length}`);
  console.log(`  Validation examples: ${dataset.validation.length}`);
  console.log(`  Total tokens: ${dataset.totalTokens}`);
  console.log(`  Estimated cost: $${dataset.estimatedCost.toFixed(2)}`);

  // Start fine-tuning job
  const job = await pipeline.startJob({
    dataset,
    epochs: 3,
    suffix: 'customer-support-v1',
    hyperparameters: {
      batchSize: 'auto',
      learningRateMultiplier: 'auto',
    },
  });

  console.log(`\nJob started: ${job.id}`);

  // Monitor progress
  job.on('progress', (progress) => {
    console.log(`Progress: ${progress.percentage}% - Step ${progress.step}/${progress.totalSteps}`);
    if (progress.metrics) {
      console.log(`  Training loss: ${progress.metrics.trainingLoss.toFixed(4)}`);
      console.log(`  Validation loss: ${progress.metrics.validationLoss?.toFixed(4) || 'N/A'}`);
    }
  });

  job.on('complete', (result) => {
    console.log(`\nFine-tuning complete!`);
    console.log(`  Model: ${result.modelId}`);
    console.log(`  Training time: ${result.duration}ms`);
    console.log(`  Final loss: ${result.metrics.finalLoss.toFixed(4)}`);
  });

  await job.wait();

  // Example 2: Dataset preparation from various sources
  console.log('\n=== Dataset Preparation ===');

  const preparer = new DatasetPreparer();

  // From CSV
  const csvDataset = await preparer.fromCSV({
    path: './data/support-tickets.csv',
    columns: {
      input: 'customer_question',
      output: 'agent_response',
    },
    systemPrompt: 'You are a helpful customer support agent.',
  });
  console.log('CSV dataset:', csvDataset.length, 'examples');

  // From JSON
  const jsonDataset = await preparer.fromJSON({
    path: './data/conversations.json',
    format: 'conversation', // or 'instruction', 'completion'
  });
  console.log('JSON dataset:', jsonDataset.length, 'examples');

  // From existing conversations
  const conversationDataset = await preparer.fromConversations({
    source: 'database',
    query: { status: 'resolved', rating: { $gte: 4 } },
    transform: (conv) => ({
      messages: conv.messages.map((m) => ({
        role: m.sender === 'customer' ? 'user' : 'assistant',
        content: m.text,
      })),
    }),
  });
  console.log('Conversation dataset:', conversationDataset.length, 'examples');

  // Example 3: Dataset validation
  console.log('\n=== Dataset Validation ===');

  const validation = await preparer.validate(csvDataset);
  console.log('Validation results:');
  console.log(`  Valid examples: ${validation.valid}`);
  console.log(`  Invalid examples: ${validation.invalid}`);
  console.log(`  Warnings: ${validation.warnings.length}`);
  console.log(`  Duplicates: ${validation.duplicates}`);
  console.log(`  Token stats: min=${validation.tokenStats.min}, max=${validation.tokenStats.max}, avg=${validation.tokenStats.avg.toFixed(0)}`);

  if (validation.issues.length > 0) {
    console.log('\nIssues found:');
    for (const issue of validation.issues.slice(0, 5)) {
      console.log(`  - ${issue.type}: ${issue.message} (example ${issue.index})`);
    }
  }

  // Example 4: Model evaluation and comparison
  console.log('\n=== Model Evaluation ===');

  const evaluator = new ModelEvaluator({
    testPrompts: [
      'How do I cancel my subscription?',
      'What are your business hours?',
      'Can I get a refund?',
      'How do I update my payment method?',
      'Is my data secure?',
    ],
    metrics: ['accuracy', 'response_quality', 'latency', 'cost'],
  });

  // Compare base model vs fine-tuned
  const comparison = await evaluator.compare([
    { model: 'gpt-4o-mini', name: 'Base Model' },
    { model: job.modelId, name: 'Fine-tuned v1' },
  ]);

  console.log('\nComparison results:');
  console.table(comparison.results);

  console.log('\nWinner by metric:');
  for (const [metric, winner] of Object.entries(comparison.winners)) {
    console.log(`  ${metric}: ${winner}`);
  }

  // Example 5: Multi-provider fine-tuning
  console.log('\n=== Multi-Provider Fine-Tuning ===');

  // OpenAI
  const openaiPipeline = new FineTuningPipeline({
    provider: 'openai',
    baseModel: 'gpt-4o-mini',
  });

  // Together AI (for open-source models)
  const togetherPipeline = new FineTuningPipeline({
    provider: 'together',
    baseModel: 'meta-llama/Llama-2-7b-chat-hf',
  });

  // Start both jobs
  const [openaiJob, togetherJob] = await Promise.all([
    openaiPipeline.startJob({ dataset, epochs: 3 }),
    togetherPipeline.startJob({ dataset, epochs: 3 }),
  ]);

  console.log(`OpenAI job: ${openaiJob.id}`);
  console.log(`Together job: ${togetherJob.id}`);

  // Example 6: Incremental fine-tuning
  console.log('\n=== Incremental Fine-Tuning ===');

  // Fine-tune on additional data
  const additionalData = [
    // New examples collected since last fine-tuning
  ];

  const incrementalJob = await pipeline.continueTraining({
    baseModel: job.modelId, // Use previous fine-tuned model
    additionalData,
    epochs: 1,
    suffix: 'customer-support-v2',
  });

  console.log(`Incremental job started: ${incrementalJob.id}`);

  // Example 7: Dataset augmentation
  console.log('\n=== Dataset Augmentation ===');

  const augmentedDataset = await preparer.augment(csvDataset, {
    methods: [
      {
        type: 'paraphrase',
        count: 2, // Generate 2 paraphrases per example
      },
      {
        type: 'back-translation',
        languages: ['es', 'fr'], // Translate to Spanish/French and back
      },
      {
        type: 'synonym-replacement',
        probability: 0.2,
      },
    ],
  });

  console.log(`Original examples: ${csvDataset.length}`);
  console.log(`Augmented examples: ${augmentedDataset.length}`);

  // Example 8: Export and versioning
  console.log('\n=== Dataset Export ===');

  await pipeline.exportDataset(dataset, {
    path: './exports/customer-support-v1.jsonl',
    format: 'jsonl',
    metadata: {
      version: '1.0',
      createdAt: new Date().toISOString(),
      description: 'Customer support fine-tuning dataset',
    },
  });

  // List all fine-tuned models
  const models = await pipeline.listModels();
  console.log('\nFine-tuned models:');
  for (const model of models) {
    console.log(`  - ${model.id} (${model.status}) - ${model.createdAt}`);
  }
}

main().catch(console.error);
