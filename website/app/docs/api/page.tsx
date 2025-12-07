'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';

const apiSections = [
  {
    package: '@rana/helpers',
    exports: [
      {
        name: 'summarize',
        signature: 'summarize(text: string, options?: SummarizeOptions): Promise<string>',
        description: 'Summarize text with customizable output style',
        options: [
          { name: 'style', type: "'brief' | 'detailed' | 'bullet'", default: "'brief'" },
          { name: 'maxLength', type: 'number', default: 'undefined' },
          { name: 'model', type: 'string', default: "'claude-sonnet-4'" },
        ],
      },
      {
        name: 'translate',
        signature: 'translate(text: string, options: TranslateOptions): Promise<string>',
        description: 'Translate text to any language',
        options: [
          { name: 'to', type: 'string', default: 'required' },
          { name: 'from', type: 'string', default: "'auto'" },
          { name: 'preserveFormatting', type: 'boolean', default: 'true' },
        ],
      },
      {
        name: 'classify',
        signature: 'classify(text: string, categories: string[], options?: ClassifyOptions): Promise<string>',
        description: 'Classify text into predefined categories',
        options: [
          { name: 'multiLabel', type: 'boolean', default: 'false' },
          { name: 'confidence', type: 'boolean', default: 'false' },
        ],
      },
      {
        name: 'extract',
        signature: 'extract<T>(text: string, schema: T, options?: ExtractOptions): Promise<T>',
        description: 'Extract structured data from unstructured text',
        options: [
          { name: 'strict', type: 'boolean', default: 'true' },
          { name: 'examples', type: 'array', default: '[]' },
        ],
      },
    ],
  },
  {
    package: '@rana/prompts',
    exports: [
      {
        name: 'PromptManager',
        signature: 'new PromptManager(config: PromptManagerConfig)',
        description: 'Main class for managing prompts with versioning and analytics',
        options: [
          { name: 'workspace', type: 'string', default: 'required' },
          { name: 'storage', type: "'memory' | 'redis' | 'postgres'", default: "'memory'" },
          { name: 'analytics', type: 'boolean', default: 'true' },
        ],
      },
      {
        name: 'pm.register',
        signature: 'register(id: string, config: PromptConfig): Promise<void>',
        description: 'Register a new prompt with template and variables',
        options: [
          { name: 'template', type: 'string', default: 'required' },
          { name: 'variables', type: 'string[]', default: '[]' },
          { name: 'model', type: 'string', default: "'claude-sonnet-4'" },
        ],
      },
      {
        name: 'pm.execute',
        signature: 'execute(id: string, options: ExecuteOptions): Promise<ExecutionResult>',
        description: 'Execute a registered prompt with tracking',
        options: [
          { name: 'variables', type: 'Record<string, string>', default: '{}' },
          { name: 'userId', type: 'string', default: 'undefined' },
        ],
      },
    ],
  },
  {
    package: '@rana/rag',
    exports: [
      {
        name: 'RAGPresets',
        signature: 'RAGPresets.balanced() | .fast() | .accurate() | .code()',
        description: 'Pre-configured RAG pipelines for common use cases',
        options: [
          { name: 'balanced()', type: 'RAGPipeline', default: 'Good speed/quality tradeoff' },
          { name: 'fast()', type: 'RAGPipeline', default: 'Optimized for speed' },
          { name: 'accurate()', type: 'RAGPipeline', default: 'Optimized for quality' },
          { name: 'code(lang)', type: 'RAGPipeline', default: 'For code search' },
        ],
      },
      {
        name: 'createRAGPipeline',
        signature: 'createRAGPipeline(config: RAGPipelineConfig): RAGPipeline',
        description: 'Create a custom RAG pipeline with full configuration',
        options: [
          { name: 'chunker', type: 'ChunkerConfig', default: "{ type: 'semantic' }" },
          { name: 'retriever', type: 'RetrieverConfig', default: "{ type: 'hybrid' }" },
          { name: 'reranker', type: 'RerankerConfig', default: 'undefined' },
          { name: 'synthesizer', type: 'SynthesizerConfig', default: "{ type: 'refine' }" },
        ],
      },
      {
        name: 'pipeline.query',
        signature: 'query(options: QueryOptions): Promise<RAGResult>',
        description: 'Query the pipeline and get an answer with citations',
        options: [
          { name: 'query', type: 'string', default: 'required' },
          { name: 'topK', type: 'number', default: '5' },
          { name: 'filters', type: 'object', default: '{}' },
        ],
      },
    ],
  },
];

export default function APIPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="container-wide max-w-5xl">
        <Link
          href="/docs"
          className="inline-flex items-center text-sm text-foreground-secondary hover:text-foreground mb-8"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Docs
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">API Reference</h1>
          <p className="text-lg text-foreground-secondary mb-12">
            Complete API documentation for all RANA packages
          </p>
        </motion.div>

        <div className="space-y-16">
          {apiSections.map((section, sectionIndex) => (
            <motion.section
              key={section.package}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIndex * 0.1 }}
            >
              <h2 className="text-2xl font-bold font-mono mb-6 pb-2 border-b border-border">
                {section.package}
              </h2>

              <div className="space-y-8">
                {section.exports.map((exp) => (
                  <div key={exp.name} className="card">
                    <h3 className="text-lg font-bold font-mono mb-2">{exp.name}</h3>
                    <div className="code-block font-mono text-sm mb-4 overflow-x-auto">
                      {exp.signature}
                    </div>
                    <p className="text-foreground-secondary mb-4">{exp.description}</p>

                    <h4 className="text-sm font-semibold mb-2">Options</h4>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 font-medium">Name</th>
                          <th className="text-left py-2 font-medium">Type</th>
                          <th className="text-left py-2 font-medium">Default</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exp.options.map((opt) => (
                          <tr key={opt.name} className="border-b border-border last:border-0">
                            <td className="py-2 font-mono text-gradient-from">{opt.name}</td>
                            <td className="py-2 font-mono text-foreground-secondary">{opt.type}</td>
                            <td className="py-2 text-foreground-secondary">{opt.default}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </motion.section>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <Link
            href="https://github.com/waymaker-ai/ranavibe"
            target="_blank"
            className="btn-secondary px-6 py-3 inline-flex items-center"
          >
            View Full Source on GitHub
            <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
