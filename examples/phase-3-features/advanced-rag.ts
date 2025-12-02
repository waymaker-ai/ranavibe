/**
 * Advanced RAG Example
 * Demonstrates multi-modal RAG with self-correction and evaluation
 */

import { AdvancedRAG, RAGEvaluator, VectorStore } from '@rana/core';

async function main() {
  // Example 1: Basic RAG setup
  console.log('=== Basic RAG Setup ===');

  const rag = new AdvancedRAG({
    embeddings: {
      model: 'text-embedding-3-small',
      dimensions: 1536,
    },
    vectorStore: {
      type: 'pinecone', // or 'weaviate', 'qdrant', 'chroma', 'memory'
      index: 'documents',
    },
    llm: {
      model: 'gpt-4o',
    },
  });

  // Index documents
  await rag.index({
    source: './docs',
    options: {
      chunker: 'semantic', // or 'recursive', 'markdown', 'sentence'
      chunkSize: 512,
      chunkOverlap: 64,
      metadata: {
        project: 'my-app',
        version: '1.0',
      },
    },
  });

  // Simple query
  const result = await rag.query({
    question: 'How does authentication work?',
    topK: 5,
  });

  console.log('Answer:', result.answer);
  console.log('Sources:', result.sources.map(s => s.path));

  // Example 2: Multi-modal RAG
  console.log('\n=== Multi-Modal RAG ===');

  const multiModalRAG = new AdvancedRAG({
    embeddings: {
      text: 'text-embedding-3-small',
      image: 'clip-vit-large', // For image embeddings
    },
    modalities: ['text', 'image', 'table'],
  });

  // Index documents with different modalities
  await multiModalRAG.index({
    source: './content',
    options: {
      extractImages: true,
      extractTables: true,
      imageDescriptions: true, // Generate descriptions for images
      tableToMarkdown: true, // Convert tables to markdown
    },
  });

  // Query with image context
  const multiModalResult = await multiModalRAG.query({
    question: 'What does the architecture diagram show?',
    includeImages: true,
    topK: 3,
  });

  console.log('Answer:', multiModalResult.answer);
  console.log('Referenced images:', multiModalResult.images?.length || 0);

  // Example 3: Self-correcting RAG
  console.log('\n=== Self-Correcting RAG ===');

  const selfCorrectingRAG = new AdvancedRAG({
    embeddings: { model: 'text-embedding-3-small' },
    selfCorrection: {
      enabled: true,
      verificationModel: 'gpt-4o-mini',
      maxRetries: 3,
      checks: [
        'factual_accuracy',
        'source_attribution',
        'hallucination_detection',
        'completeness',
      ],
    },
  });

  const verifiedResult = await selfCorrectingRAG.query({
    question: 'What are the main features of RANA?',
    verify: true,
  });

  console.log('Answer:', verifiedResult.answer);
  console.log('Verification:', verifiedResult.verification);
  console.log(`  - Factual accuracy: ${verifiedResult.verification.factualAccuracy}`);
  console.log(`  - Hallucination detected: ${verifiedResult.verification.hallucinationDetected}`);
  console.log(`  - Confidence: ${verifiedResult.verification.confidence}%`);

  // Example 4: Hybrid search
  console.log('\n=== Hybrid Search ===');

  const hybridRAG = new AdvancedRAG({
    retriever: {
      type: 'hybrid',
      vectorWeight: 0.7,
      keywordWeight: 0.3,
      fusionMethod: 'rrf', // Reciprocal Rank Fusion
    },
  });

  const hybridResult = await hybridRAG.query({
    question: 'error handling middleware express',
    searchType: 'hybrid',
  });

  console.log('Hybrid search results:', hybridResult.sources.length);

  // Example 5: Query optimization
  console.log('\n=== Query Optimization ===');

  const optimizedRAG = new AdvancedRAG({
    queryOptimization: {
      enabled: true,
      techniques: [
        'expansion', // Expand query with synonyms
        'decomposition', // Break complex queries into sub-queries
        'rewriting', // Rewrite for better retrieval
        'hypothetical_document', // Generate hypothetical answer for matching
      ],
    },
  });

  const complexQuery = 'How do I set up authentication with OAuth2 and handle refresh tokens in a Next.js app?';

  const optimizedResult = await optimizedRAG.query({
    question: complexQuery,
    explain: true,
  });

  console.log('Original query:', complexQuery);
  console.log('Optimized queries:', optimizedResult.optimization?.queries);
  console.log('Answer:', optimizedResult.answer);

  // Example 6: Contextual compression
  console.log('\n=== Contextual Compression ===');

  const compressedRAG = new AdvancedRAG({
    postProcessor: {
      type: 'contextual_compression',
      compressorModel: 'gpt-4o-mini',
      extractRelevantOnly: true,
    },
  });

  const compressedResult = await compressedRAG.query({
    question: 'What is the default port?',
    topK: 10,
  });

  console.log('Retrieved chunks:', compressedResult.rawChunks.length);
  console.log('Compressed chunks:', compressedResult.sources.length);
  console.log('Compression ratio:', (compressedResult.compressionRatio * 100).toFixed(1) + '%');

  // Example 7: Reranking
  console.log('\n=== Reranking ===');

  const rerankedRAG = new AdvancedRAG({
    reranker: {
      type: 'cross-encoder', // or 'llm', 'cohere', 'diversity'
      model: 'cross-encoder/ms-marco-MiniLM-L-12-v2',
      topK: 5,
    },
  });

  const rerankedResult = await rerankedRAG.query({
    question: 'How to configure logging?',
    initialK: 20, // Retrieve 20, rerank to 5
  });

  console.log('Reranked sources:');
  for (const source of rerankedResult.sources) {
    console.log(`  - ${source.path} (score: ${source.rerankedScore.toFixed(3)})`);
  }

  // Example 8: RAG evaluation
  console.log('\n=== RAG Evaluation ===');

  const evaluator = new RAGEvaluator({
    metrics: [
      'context_relevance',
      'answer_faithfulness',
      'answer_correctness',
      'answer_relevance',
      'retrieval_precision',
      'retrieval_recall',
    ],
  });

  // Create test set
  const testSet = [
    {
      question: 'What is RANA?',
      expectedAnswer: 'RANA is a production AI development framework...',
      relevantDocIds: ['doc1', 'doc2'],
    },
    {
      question: 'How do I install RANA?',
      expectedAnswer: 'Run npm install @rana/core...',
      relevantDocIds: ['doc3'],
    },
    // ... more test cases
  ];

  const evaluation = await evaluator.evaluate(rag, testSet);

  console.log('\nEvaluation Results:');
  console.log('─'.repeat(50));
  for (const [metric, value] of Object.entries(evaluation.metrics)) {
    console.log(`  ${metric}: ${(value * 100).toFixed(1)}%`);
  }
  console.log('─'.repeat(50));
  console.log(`  Overall Score: ${(evaluation.overallScore * 100).toFixed(1)}%`);

  // Detailed results per question
  console.log('\nPer-question results:');
  for (const result of evaluation.details) {
    console.log(`  Q: "${result.question.slice(0, 40)}..."`);
    console.log(`     Correctness: ${result.correctness.toFixed(2)}, Faithfulness: ${result.faithfulness.toFixed(2)}`);
  }

  // Example 9: Citation generation
  console.log('\n=== Citation Generation ===');

  const citedResult = await rag.query({
    question: 'What are the security features?',
    citations: {
      enabled: true,
      style: 'inline', // or 'footnotes', 'endnotes'
      format: 'markdown',
    },
  });

  console.log('Answer with citations:');
  console.log(citedResult.citedAnswer);

  console.log('\nReferences:');
  for (const citation of citedResult.citations) {
    console.log(`  [${citation.id}] ${citation.source} - "${citation.excerpt.slice(0, 50)}..."`);
  }

  // Example 10: Streaming RAG
  console.log('\n=== Streaming RAG ===');

  const stream = await rag.queryStream({
    question: 'Explain the architecture in detail',
    topK: 5,
  });

  process.stdout.write('Streaming answer: ');
  for await (const chunk of stream) {
    if (chunk.type === 'text') {
      process.stdout.write(chunk.content);
    } else if (chunk.type === 'source') {
      console.log(`\n  [Source: ${chunk.source.path}]`);
    }
  }
  console.log('\n');

  // Example 11: Custom chunking strategies
  console.log('\n=== Custom Chunking ===');

  await rag.index({
    source: './code',
    options: {
      chunker: 'code', // Code-aware chunking
      languages: ['typescript', 'python'],
      preserveFunctions: true, // Keep functions intact
      includeDocstrings: true,
    },
  });

  const codeResult = await rag.query({
    question: 'Show me the authentication middleware implementation',
    returnCode: true,
  });

  console.log('Code result:', codeResult.codeBlocks?.[0]);
}

main().catch(console.error);
