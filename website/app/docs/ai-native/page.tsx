'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Brain, Shield, CheckCircle, Search, Star, Sparkles } from 'lucide-react';

const features = [
  {
    icon: Sparkles,
    title: 'Prompt Optimization',
    description: 'Automatically optimize prompts for better results and lower costs',
    code: `import { optimizePrompt, compressPrompt } from '@rana/core';

// Compress a verbose prompt
const compressed = compressPrompt(longPrompt);
// Result: 40% fewer tokens, same meaning

// Optimize for a specific goal
const optimized = await optimizePrompt(prompt, {
  goal: 'quality',
  strategy: 'chain-of-thought'
});`,
  },
  {
    icon: Shield,
    title: 'Hallucination Detection',
    description: 'Detect fabricated facts, fake citations, and logical inconsistencies',
    code: `import { detectHallucinations } from '@rana/core';

const result = detectHallucinations(response, {
  knownFacts: [...],
  context: sourceDocument
});

if (result.hasHallucinations) {
  console.log('Issues found:', result.instances);
  // Types: fabricated_citation, overconfidence,
  //        temporal_error, logical_inconsistency
}`,
  },
  {
    icon: CheckCircle,
    title: 'Confidence Scoring',
    description: 'Measure response confidence through linguistic and consistency analysis',
    code: `import { scoreConfidence, isConfident } from '@rana/core';

const score = scoreConfidence(response, {
  context: originalQuery,
  samples: [response1, response2, response3] // for consistency
});

console.log(score.overall);      // 0.85
console.log(score.level);        // 'high'
console.log(score.breakdown);    // { linguistic, consistency, specificity, grounding }
console.log(score.recommendations);`,
  },
  {
    icon: Search,
    title: 'Fact Verification',
    description: 'Extract claims and verify them against knowledge bases',
    code: `import { verifyFacts, extractClaims } from '@rana/core';

// Extract factual claims from text
const claims = await extractClaims(response);
// [{ text: "Paris is the capital of France", type: "factual" }]

// Verify claims
const result = await verifyFacts(response);
console.log(result.verifiedClaims);   // Claims with evidence
console.log(result.falseClaims);      // Number of false claims
console.log(result.overallReliability); // 0-1 score`,
  },
  {
    icon: Star,
    title: 'Quality Scoring',
    description: 'Multi-dimensional quality evaluation for LLM responses',
    code: `import { scoreQuality, getQualityLevel } from '@rana/core';

const quality = scoreQuality(response, query);

console.log(quality.overall);    // 0.87
console.log(quality.dimensions); // { relevance, completeness, clarity,
                                 //   accuracy, helpfulness, conciseness }
console.log(quality.suggestions); // Improvement recommendations`,
  },
  {
    icon: Brain,
    title: 'Comprehensive Analysis',
    description: 'Run all checks at once for complete response validation',
    code: `import { analyzeResponse, isTrustworthy } from '@rana/core';

// Quick check
if (isTrustworthy(response)) {
  // Safe to use
}

// Full analysis
const analysis = await analyzeResponse(response, {
  query: originalQuery,
  context: { knownFacts: [...] }
});

console.log(analysis.overallScore);     // 0.82
console.log(analysis.hallucinations);   // Hallucination results
console.log(analysis.confidence);       // Confidence results
console.log(analysis.verification);     // Fact verification
console.log(analysis.quality);          // Quality scores
console.log(analysis.recommendations);  // Combined recommendations`,
  },
];

export default function AINativePage() {
  return (
    <div className="py-16 md:py-24">
      <div className="container-wide">
        <Link
          href="/docs"
          className="inline-flex items-center text-sm text-foreground-secondary hover:text-foreground mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Documentation
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-gradient-subtle">
              <Brain className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">AI-Native Features</h1>
          </div>
          <p className="text-lg text-foreground-secondary">
            Built-in capabilities for production AI applications: detect hallucinations,
            verify facts, score confidence, and optimize prompts automatically.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="space-y-12">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-lg bg-gradient-subtle">
                  <feature.icon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">{feature.title}</h2>
                  <p className="text-foreground-secondary">{feature.description}</p>
                </div>
              </div>
              <div className="code-block font-mono text-sm overflow-x-auto">
                <pre>{feature.code}</pre>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Best Practices */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 card bg-gradient-subtle"
        >
          <h2 className="text-2xl font-bold mb-4">Best Practices</h2>
          <ul className="space-y-3 text-foreground-secondary">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Always verify critical information before presenting to users</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Use confidence scoring to add uncertainty indicators in UI</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Compress prompts in production to reduce costs by 30-50%</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Log quality scores for monitoring and improvement tracking</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Combine hallucination detection with fact verification for critical apps</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
