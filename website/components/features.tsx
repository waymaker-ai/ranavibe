'use client';

import { motion } from 'framer-motion';
import {
  Zap,
  Shield,
  Code2,
  Database,
  Smartphone,
  Search,
  Lock,
  Gauge,
  Scale,
  Layers,
  FileCheck,
  AlertTriangle,
  Cpu,
  Eye,
  GitBranch,
  Activity,
  Fingerprint,
  ServerCrash,
  Box,
  Radio,
  BarChart3,
  MonitorSmartphone,
} from 'lucide-react';

const features = [
  {
    icon: Cpu,
    title: 'Agent SDK Guardrails',
    description: 'Wrap Anthropic Agent SDK with 7 composable interceptors. Pre-built HIPAA, GDPR, Financial, and Safe agent factories. Works with or without the SDK installed.',
    highlight: true,
    isNew: true,
  },
  {
    icon: Lock,
    title: 'Zero-Dep Runtime Guard',
    description: 'One import, zero dependencies. Proxy-wraps Anthropic, OpenAI, and Google clients. PII redaction, injection blocking, cost tracking, and rate limiting in a single createGuard() call.',
    isNew: true,
  },
  {
    icon: FileCheck,
    title: 'Declarative Policy Engine',
    description: '9 compliance presets (HIPAA, GDPR, CCPA, SEC, PCI, FERPA, SOX, Safety, Enterprise) in YAML. Policy composition with strictest/first/last conflict resolution.',
    isNew: true,
  },
  {
    icon: GitBranch,
    title: 'CI/CD Security Scanning',
    description: 'GitHub Action that scans PRs for hardcoded API keys, PII in prompts, injection vulnerabilities, unapproved models. SARIF output for GitHub Security tab.',
    isNew: true,
  },
  {
    icon: Activity,
    title: 'Observability Dashboard',
    description: 'Real-time cost tracking, security incident monitoring, compliance scoring, performance metrics. Anomaly detection, Prometheus export, and HTTP API server.',
    isNew: true,
  },
  {
    icon: Eye,
    title: '15+ MCP Tools',
    description: 'Use CoFounder guardrails from Claude Desktop, Claude Code, or Cursor without writing code. PII scanning, injection detection, cost estimation, and code safety analysis via MCP.',
    isNew: true,
  },
  {
    icon: Fingerprint,
    title: 'PII Detection & Redaction',
    description: 'Detect and redact emails, SSNs, credit cards (with Luhn validation), phones, IPs, DOB, addresses, medical records, passports. 20+ patterns across all packages.',
    isNew: true,
  },
  {
    icon: ServerCrash,
    title: 'Prompt Injection Blocking',
    description: '25+ attack patterns: direct injection, system prompt leaking, jailbreaks, role manipulation, delimiter injection, encoding attacks, multi-language attempts. Scoring with configurable sensitivity.',
    isNew: true,
  },
  {
    icon: Shield,
    title: '9 Compliance Frameworks',
    description: 'HIPAA (18 PHI identifiers), GDPR (data minimization, consent), SEC (disclaimers), PCI-DSS (card data), SOX (financial records), FERPA (student records), CCPA, and more.',
  },
  {
    icon: Gauge,
    title: 'Works With Everything',
    description: 'Wraps Anthropic Agent SDK, OpenClaw agents, LangChain, CrewAI. Use with Cursor, Windsurf, Claude Code, or any IDE. Complementary guardrail layer, not a replacement.',
  },
  {
    icon: Smartphone,
    title: '70% Cost Savings',
    description: 'Real-time cost tracking with pricing for 25+ models. Budget enforcement, model routing, caching, and prompt optimization. Projected monthly cost reports.',
  },
  {
    icon: Box,
    title: 'Sandboxed Execution',
    description: 'Run untrusted AI-generated code safely with @aicofounder/sandbox. Process isolation, resource limits, timeout enforcement, and output capture. Evaluate agent tool calls without risk.',
    isNew: true,
  },
  {
    icon: Radio,
    title: 'Streaming Guards',
    description: 'Real-time guardrail evaluation on streaming LLM responses with @aicofounder/streaming. Token-by-token PII detection, injection scanning, and policy enforcement without buffering the full response.',
    isNew: true,
  },
  {
    icon: BarChart3,
    title: 'Detection Benchmarks',
    description: 'Measure detection accuracy with @aicofounder/benchmark. 252 curated test cases across PII, injection, and toxicity. Per-category metrics, confusion matrices, and NeMo Guardrails comparison.',
    isNew: true,
  },
  {
    icon: MonitorSmartphone,
    title: 'VS Code Extension',
    description: 'Inline guardrail warnings, PII highlighting, injection detection, and compliance checks directly in your editor. One-click redaction and policy violation quickfixes.',
    isNew: true,
  },
  {
    icon: Scale,
    title: 'Like NeMo Guardrails, But Better',
    description: 'Everything NVIDIA NeMo Guardrails does — PII, injection, topical control, content safety — plus compliance frameworks, cost tracking, CI/CD, dashboard, sandbox, streaming, and MCP. TypeScript-first with 35 packages.',
  },
];

export function Features() {
  return (
    <section className="py-20 md:py-32 border-t border-border">
      <div className="container-wide">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-5xl font-bold mb-4"
          >
            Enterprise-Grade AI Framework
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-foreground-secondary max-w-2xl mx-auto"
          >
            35 packages covering detection, compliance, sandbox, streaming, benchmarks, CI/CD, MCP, and VS Code integration
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="card hover:border-foreground/10 group relative"
            >
              {feature.isNew && (
                <div className="absolute top-4 right-4">
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gradient-to-r from-gradient-from to-gradient-to text-white">
                    NEW
                  </span>
                </div>
              )}
              <div className="mb-4 p-3 rounded-lg bg-background w-fit group-hover:bg-gradient-subtle transition-colors">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-foreground-secondary">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
