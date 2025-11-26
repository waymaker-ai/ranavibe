# Complete RANA Integration Guide: MCP, ADK, and Vibe Coding

**Version:** 1.0.0
**Last Updated:** 2025-11-09
**Status:** Production Ready

---

## Overview

This comprehensive guide brings together three powerful frameworks to create a complete, production-ready AI development workflow:

1. **RANA** (Rapid AI Native Architecture) - Quality gates and workflows
2. **MCP** (Model Context Protocol) - Standardized AI-to-system connections
3. **Google ADK** (Agent Development Kit) - Multi-agent orchestration
4. **Vibe Coding Standards** - Design distinctiveness and component best practices

Together, these create a unified approach to building production-quality applications with AI assistance.

---

## Table of Contents

1. [The Complete Stack](#the-complete-stack)
2. [Quick Start](#quick-start)
3. [Architecture Overview](#architecture-overview)
4. [Integration Patterns](#integration-patterns)
5. [Complete Workflow Example](#complete-workflow-example)
6. [Configuration](#configuration)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## The Complete Stack

```
┌─────────────────────────────────────────────────────────┐
│                    RANA Framework                       │
│  Quality Gates │ Workflows │ Standards │ Compliance    │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│     MCP      │ │  Google ADK  │ │Vibe Coding   │
│  Protocol    │ │  Agents      │ │  Standards   │
│              │ │              │ │              │
│ • Resources  │ │ • LLM Agents │ │ • Design Sys │
│ • Tools      │ │ • Workflows  │ │ • Components │
│ • Prompts    │ │ • Custom     │ │ • Brand      │
│ • Sampling   │ │ • Multi-     │ │ • Polish     │
│              │ │   Agent      │ │              │
└──────────────┘ └──────────────┘ └──────────────┘
        │            │            │
        └────────────┼────────────┘
                     │
                     ▼
        ┌───────────────────────┐
        │  Production-Quality   │
        │    Application        │
        └───────────────────────┘
```

### What Each Component Does

**RANA (Foundation)**
- Defines quality gates
- Enforces standards (no mocks, error handling, testing)
- Manages deployment workflow
- Ensures production readiness

**MCP (Data & Tools)**
- Connects AI to data sources
- Provides secure tool access
- Enables resource discovery
- Supports sampling workflows

**Google ADK (Orchestration)**
- Orchestrates multiple agents
- Manages workflow execution
- Coordinates specialized tasks
- Handles complex reasoning

**Vibe Coding (Design)**
- Maintains visual distinctiveness
- Ensures brand consistency
- Optimizes component usage
- Creates polished UX

---

## Quick Start

### 1. Install Dependencies

```bash
# RANA CLI
npm install -g @aads/cli

# MCP SDK
npm install @modelcontextprotocol/sdk

# Google ADK (Python)
pip install google-adk

# Design tools
npm install class-variance-authority tailwindcss-animate framer-motion
npx shadcn-ui@latest init
```

### 2. Initialize RANA

```bash
cd your-project
aads init
```

### 3. Configure .rana.yml

```yaml
version: 1.0.0

project:
  name: "My App"
  type: "fullstack"

# RANA Standards
standards:
  principles:
    - search_before_create
    - real_data_only
    - test_everything
    - deploy_to_production
    - design_system_compliance

# MCP Integration
mcp:
  enabled: true
  servers:
    - name: "filesystem"
      command: "npx"
      args: ["-y", "@modelcontextprotocol/server-filesystem", "."]
    - name: "database"
      command: "npx"
      args: ["-y", "@modelcontextprotocol/server-postgres"]
      env:
        DATABASE_URL: "${DATABASE_URL}"

# ADK Agents
agents:
  enabled: true
  orchestration: "sequential"
  agents:
    - name: "researcher"
      type: "llm"
      model: "gemini-2.0-flash"
    - name: "implementer"
      type: "llm"
      model: "gemini-2.0-flash"
    - name: "tester"
      type: "workflow"
    - name: "deployer"
      type: "custom"

# Design System
design_system:
  enabled: true
  path: "docs/DESIGN_SYSTEM.md"
  components_library: "@/components/design-system"
  customization:
    - custom_colors
    - custom_typography
    - custom_animations
    - branded_components

# Quality Gates
quality_gates:
  pre_implementation:
    - check_existing_code
    - review_documentation
    - understand_requirements

  implementation:
    - no_mock_data
    - error_handling_required
    - design_system_compliance
    - mcp_tools_validated

  testing:
    - manual_testing_complete
    - unit_tests_passing
    - agent_workflows_tested

  deployment:
    - git_commit_required
    - production_verification
    - monitoring_configured
```

### 4. Set Up Design System

```bash
# Copy shadcn components (don't install)
npx shadcn-ui@latest add button card input

# Create design system structure
mkdir -p components/design-system/{primitives,brand,compositions}
```

### 5. Start Building

```bash
# Use RANA workflow
aads flow feature "Add user dashboard"

# The workflow will:
# 1. Use MCP to search existing code
# 2. Deploy ADK agents to implement
# 3. Apply design system standards
# 4. Run quality gates
# 5. Deploy to production
```

---

## Architecture Overview

### Layered Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Layer 5: User Interface                                │
│ - Branded components                                    │
│ - Design system compliance                              │
│ - Vibe coding standards                                 │
└─────────────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────────────┐
│ Layer 4: Agent Orchestration (ADK)                     │
│ - Multi-agent workflows                                 │
│ - LLM reasoning                                         │
│ - Custom business logic                                 │
└─────────────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────────────┐
│ Layer 3: Tool & Resource Access (MCP)                  │
│ - Filesystem access                                     │
│ - Database queries                                      │
│ - API integrations                                      │
└─────────────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────────────┐
│ Layer 2: Quality Gates (RANA)                          │
│ - Pre-implementation checks                             │
│ - Implementation standards                              │
│ - Testing requirements                                  │
│ - Deployment verification                               │
└─────────────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────────────┐
│ Layer 1: Infrastructure                                │
│ - Version control (Git)                                 │
│ - CI/CD pipelines                                       │
│ - Deployment platforms                                  │
│ - Monitoring & logging                                  │
└─────────────────────────────────────────────────────────┘
```

---

## Integration Patterns

### Pattern 1: Feature Development with Full Stack

```python
# agents/feature_development.py
from google.adk import LlmAgent, SequentialAgent
from google.adk.tools import MCPToolbox
from aads.quality_gates import AADSComplianceAgent

class FullStackFeatureAgent(SequentialAgent):
    """
    Complete feature development with:
    - RANA quality gates
    - MCP data access
    - ADK orchestration
    - Design standards
    """

    def __init__(self):
        # MCP tools for data access
        mcp_tools = MCPToolbox([
            {
                'name': 'filesystem',
                'command': 'npx',
                'args': ['-y', '@modelcontextprotocol/server-filesystem', '.']
            },
            {
                'name': 'database',
                'command': 'npx',
                'args': ['-y', '@modelcontextprotocol/server-postgres'],
                'env': {'DATABASE_URL': os.getenv('DATABASE_URL')}
            },
        ])

        super().__init__(
            name="fullstack_feature",
            agents=[
                # Phase 1: RANA Understanding & Research
                LlmAgent(
                    name="researcher",
                    instructions="""
                    RANA Phase 1-2: Understanding & Research

                    Use MCP tools to:
                    1. Search existing codebase
                    2. Review documentation
                    3. Find similar patterns
                    4. Identify reusable components

                    Quality Gate: Pre-implementation checks must pass
                    """,
                    tools=mcp_tools
                ),

                # Phase 2: Planning with Design System
                LlmAgent(
                    name="planner",
                    instructions="""
                    RANA Phase 3: Planning

                    Design approach considering:
                    - Existing patterns (from research)
                    - Design system components
                    - Brand guidelines
                    - Performance requirements

                    Must document:
                    - Architecture decisions
                    - Component selection
                    - Data flow
                    - Testing strategy
                    """,
                    tools=mcp_tools
                ),

                # Phase 3: Implementation
                ParallelAgent(
                    name="implementation",
                    agents=[
                        LlmAgent(
                            name="backend",
                            instructions="""
                            RANA Implementation Standards:
                            ✅ Real data only (use MCP database tools)
                            ✅ Error handling on all async operations
                            ✅ Input validation
                            ✅ Proper logging

                            ❌ No mock data
                            ❌ No 'any' types
                            ❌ No missing error handling
                            """,
                            tools=mcp_tools
                        ),
                        LlmAgent(
                            name="frontend",
                            instructions="""
                            RANA + Design Standards:
                            ✅ Use design system components only
                            ✅ Add loading states
                            ✅ Add error states
                            ✅ Custom animations
                            ✅ Brand colors/typography
                            ✅ Responsive design

                            ❌ No inline styles
                            ❌ No default shadcn components
                            ❌ No generic layouts
                            """,
                            tools=mcp_tools
                        ),
                    ]
                ),

                # Phase 4: Quality Assurance
                SequentialAgent(
                    name="qa",
                    agents=[
                        AADSComplianceAgent(),
                        DesignSystemComplianceAgent(),
                        LlmAgent(
                            name="test_writer",
                            instructions="Write comprehensive tests",
                            tools=mcp_tools
                        ),
                    ]
                ),

                # Phase 5: Deployment
                DeploymentWorkflow(),

                # Phase 6: Verification
                LlmAgent(
                    name="verifier",
                    instructions="Verify production deployment",
                    tools=mcp_tools
                ),
            ]
        )
```

### Pattern 2: MCP Server with RANA Compliance

```typescript
// mcp-servers/aads-compliant/src/index.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

class AADSCompliantMCPServer {
  private server: Server;
  private aadsConfig: any;

  constructor() {
    // Load RANA configuration
    this.aadsConfig = this.loadAADSConfig();

    this.server = new Server(
      { name: "aads-compliant-server", version: "1.0.0" },
      { capabilities: { tools: {}, resources: {} } }
    );

    this.setupHandlers();
  }

  private loadAADSConfig() {
    // Load and validate .rana.yml
    const yaml = require('js-yaml');
    const fs = require('fs');
    return yaml.load(fs.readFileSync('.rana.yml', 'utf8'));
  }

  private setupHandlers() {
    // Tool: Check RANA Compliance
    this.server.setRequestHandler("tools/list", async () => ({
      tools: [
        {
          name: "check_aads_compliance",
          description: "Check if code follows RANA standards",
          inputSchema: {
            type: "object",
            properties: {
              file_path: { type: "string" },
            },
            required: ["file_path"],
          },
        },
        {
          name: "get_design_system_component",
          description: "Get design system component template",
          inputSchema: {
            type: "object",
            properties: {
              component_name: { type: "string" },
            },
            required: ["component_name"],
          },
        },
      ],
    }));

    this.server.setRequestHandler("tools/call", async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "check_aads_compliance":
          return this.checkAADSCompliance(args.file_path);

        case "get_design_system_component":
          return this.getDesignSystemComponent(args.component_name);

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });

    // Resource: RANA Configuration
    this.server.setRequestHandler("resources/list", async () => ({
      resources: [
        {
          uri: "aads://config",
          name: "RANA Configuration",
          description: "Current RANA standards and quality gates",
          mimeType: "application/json",
        },
        {
          uri: "aads://design-system",
          name: "Design System",
          description: "Design system documentation and components",
          mimeType: "text/markdown",
        },
      ],
    }));

    this.server.setRequestHandler("resources/read", async (request) => {
      const uri = request.params.uri as string;

      if (uri === "aads://config") {
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(this.aadsConfig, null, 2),
            },
          ],
        };
      }

      if (uri === "aads://design-system") {
        const designDoc = await fs.promises.readFile(
          this.aadsConfig.design_system.path,
          "utf-8"
        );
        return {
          contents: [{ uri, mimeType: "text/markdown", text: designDoc }],
        };
      }
    });
  }

  private async checkAADSCompliance(filePath: string) {
    try {
      const fs = require('fs');
      const content = fs.readFileSync(filePath, 'utf-8');

      const violations = [];

      // Check: No mock data
      if (content.includes('const mock') && !filePath.includes('.test.')) {
        violations.push({
          type: 'mock_data',
          message: 'Mock data found in production code',
          line: this.findLineNumber(content, 'const mock'),
        });
      }

      // Check: Error handling
      if (content.includes('async ') && !content.includes('try')) {
        violations.push({
          type: 'missing_error_handling',
          message: 'Async code without try-catch',
        });
      }

      // Check: Design system usage
      if (content.includes('className=') && !content.includes('@/components/design-system')) {
        violations.push({
          type: 'design_system_violation',
          message: 'Not using design system components',
        });
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              file: filePath,
              compliant: violations.length === 0,
              violations,
              score: 1.0 - (violations.length * 0.2),
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: error.message }),
          },
        ],
        isError: true,
      };
    }
  }

  private async getDesignSystemComponent(componentName: string) {
    try {
      const componentsPath = this.aadsConfig.design_system.components_library.replace('@/', 'src/');
      const componentPath = `${componentsPath}/${componentName}.tsx`;

      const fs = require('fs');
      const template = fs.readFileSync(componentPath, 'utf-8');

      return {
        content: [
          {
            type: "text",
            text: template,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Component '${componentName}' not found in design system`,
          },
        ],
        isError: true,
      };
    }
  }

  private findLineNumber(content: string, searchTerm: string): number {
    const lines = content.split('\n');
    return lines.findIndex(line => line.includes(searchTerm)) + 1;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

const server = new AADSCompliantMCPServer();
server.run().catch(console.error);
```

### Pattern 3: Design System Component with All Standards

```tsx
// components/design-system/brand/FeatureCard.tsx
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardContent } from '../primitives/card';
import { BrandButton } from './BrandButton';
import type { LucideIcon } from 'lucide-react';

/**
 * FeatureCard Component
 *
 * ✅ RANA Compliant:
 * - No mock data (accepts real props)
 * - Error handling (TypeScript types)
 * - Design system component
 * - Loading state support
 *
 * ✅ Design Standards:
 * - Custom animations
 * - Brand colors
 * - Responsive design
 * - Accessibility support
 */

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
  };
  variant?: 'default' | 'highlighted' | 'muted';
  className?: string;
}

export function FeatureCard({
  title,
  description,
  icon: Icon,
  action,
  variant = 'default',
  className,
}: FeatureCardProps) {
  // ✅ RANA: No mock data - all data from props

  const variants = {
    default: 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800',
    highlighted: 'bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20',
    muted: 'bg-gray-50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className={cn('h-full', className)}
    >
      <Card
        className={cn(
          'h-full border-2 transition-all hover:shadow-xl',
          variants[variant]
        )}
      >
        <CardHeader>
          {/* Icon with brand styling */}
          <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
            <Icon className="w-6 h-6 text-primary" aria-hidden="true" />
          </div>

          {/* Title with custom typography */}
          <h3 className="text-2xl font-display font-bold mb-2">
            {title}
          </h3>
        </CardHeader>

        <CardContent>
          {/* Description */}
          <p className="text-muted-foreground leading-relaxed mb-6">
            {description}
          </p>

          {/* ✅ RANA: Conditional rendering with proper state handling */}
          {action && (
            <BrandButton
              onClick={action.onClick}
              variant="primary"
              size="md"
              className="w-full"
              isLoading={action.loading}
              disabled={action.loading}
              aria-label={action.label}
            >
              {action.label}
            </BrandButton>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ✅ RANA: Component has tests
// See: FeatureCard.test.tsx
```

---

## Complete Workflow Example

### End-to-End: "Add User Profile Feature"

```bash
# Step 1: Initialize feature with RANA
aads flow feature "Add user profile page"
```

The workflow executes:

#### Phase 1: Understanding & Research (RANA + MCP)

```python
# Agent uses MCP to search codebase
researcher_agent = LlmAgent(
    name="researcher",
    instructions="Search for existing user-related code",
    tools=MCPToolbox([{'name': 'filesystem', ...}])
)

# Searches:
# - Existing user components
# - Authentication patterns
# - Database schemas
# - API endpoints
# - Design system components

# ✅ Quality Gate: Pre-implementation checks pass
```

#### Phase 2: Planning (RANA + ADK + Design)

```python
# Agent plans implementation
planner_agent = LlmAgent(
    name="planner",
    instructions="""
    Plan user profile implementation:

    RANA Requirements:
    - Use existing user service
    - Real data from database
    - Error handling
    - Loading states

    Design Requirements:
    - Use BrandCard component
    - Custom ProfileHeader composition
    - Animations on load
    - Responsive layout

    Output: Implementation plan
    """
)

# ✅ Quality Gate: Architecture reviewed
```

#### Phase 3: Implementation (All Systems)

```python
# Parallel implementation
implementation_team = ParallelAgent(
    name="implementation",
    agents=[
        # Backend
        LlmAgent(
            name="backend",
            instructions="""
            Implement /api/profile endpoint:

            RANA:
            ✅ Use real database (MCP postgres tool)
            ✅ Add try-catch error handling
            ✅ Validate inputs
            ✅ Return proper status codes

            MCP Tools:
            - database: Query user data
            - filesystem: Update API routes
            """
        ),

        # Frontend
        LlmAgent(
            name="frontend",
            instructions="""
            Implement ProfilePage component:

            Design System:
            ✅ Import from @/components/design-system
            ✅ Use BrandCard for profile card
            ✅ Use BrandButton for actions
            ✅ Add animations (framer-motion)
            ✅ Custom typography

            RANA:
            ✅ Real API calls (no mocks)
            ✅ Loading states
            ✅ Error states
            ✅ Empty states

            MCP Tools:
            - filesystem: Create component file
            - filesystem: Update routing
            """
        ),
    ]
)

# ✅ Quality Gate: Implementation standards met
```

#### Phase 4: Testing (RANA + ADK)

```python
# Sequential testing workflow
testing_workflow = SequentialAgent(
    name="testing",
    agents=[
        # Write tests
        LlmAgent(
            name="test_writer",
            instructions="""
            Write tests for profile feature:

            RANA Requirements:
            - Unit tests for API endpoint
            - Component tests for ProfilePage
            - Integration test for full flow
            - Coverage > 80%
            """
        ),

        # Run tests
        CustomAgent(
            name="test_runner",
            execute=lambda: subprocess.run(['npm', 'test'])
        ),

        # RANA compliance check
        AADSComplianceAgent(),

        # Design compliance check
        DesignSystemComplianceAgent(),
    ]
)

# ✅ Quality Gate: All tests pass, compliance verified
```

#### Phase 5: Deployment (RANA)

```python
# Deployment workflow
deployment = SequentialAgent(
    name="deployment",
    agents=[
        # Git commit
        CustomAgent(name="git_commit"),

        # Deploy frontend
        CustomAgent(name="deploy_frontend"),

        # Deploy backend
        CustomAgent(name="deploy_backend"),

        # Verify deployment
        LlmAgent(
            name="verifier",
            instructions="Verify profile page works in production",
            tools=MCPToolbox([...])
        ),
    ]
)

# ✅ Quality Gate: Production verification complete
```

### Result

```
✅ Feature Complete: User Profile Page

Implementation:
- Backend: /api/profile endpoint
- Frontend: /profile page
- Tests: 87% coverage (15 tests, all passing)
- Design: BrandCard, BrandButton, custom animations
- RANA Compliance: 100%
- Design Compliance: 100%

Deployed:
- Frontend: https://app.example.com/profile
- Backend: https://api.example.com/profile
- Status: ✅ Verified working in production

Quality Gates Passed:
✅ Pre-implementation (searched existing, reviewed docs)
✅ Implementation (real data, error handling, design system)
✅ Testing (manual + automated, coverage met)
✅ Deployment (committed, deployed, verified)

Time: 2 hours (vs 8 hours traditional)
```

---

## Configuration

### Complete .rana.yml Template

```yaml
version: 1.0.0

project:
  name: "Your App Name"
  type: "fullstack"
  description: "Your app description"
  languages:
    - "typescript"
    - "python"
  frameworks:
    - "nextjs"
    - "fastapi"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# RANA STANDARDS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

standards:
  principles:
    - search_before_create
    - real_data_only
    - test_everything
    - deploy_to_production
    - design_system_compliance
    - documentation_required

  code_quality:
    typescript_strict: true
    no_any_types: true
    meaningful_names: true
    comments_for_complex_logic: true

  testing:
    manual_testing_required: true
    unit_tests_required: true
    integration_tests_required: true
    e2e_tests_required: false
    coverage_threshold: 80

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# MCP INTEGRATION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

mcp:
  enabled: true
  servers:
    # Filesystem access
    - name: "filesystem"
      command: "npx"
      args: ["-y", "@modelcontextprotocol/server-filesystem", "."]
      description: "Access project files"

    # Database access
    - name: "postgres"
      command: "npx"
      args: ["-y", "@modelcontextprotocol/server-postgres"]
      env:
        DATABASE_URL: "${POSTGRES_URL}"
      description: "Query database"

    # Custom RANA server
    - name: "aads-compliance"
      command: "node"
      args: ["mcp-servers/aads-compliant/dist/index.js"]
      description: "RANA compliance checking"

  # MCP-specific quality gates
  quality_gates:
    - explicit_user_consent
    - data_minimization
    - secure_tool_execution
    - error_handling_complete
    - connection_lifecycle
    - timeout_configuration
    - logging_and_monitoring

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# GOOGLE ADK AGENTS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

agents:
  enabled: true
  orchestration: "sequential"

  agents:
    # Research agent
    - name: "researcher"
      type: "llm"
      model: "gemini-2.0-flash"
      instructions_path: "agents/instructions/researcher.md"
      tools:
        - mcp:filesystem
        - mcp:database

    # Implementation agents (parallel)
    - name: "implementation_team"
      type: "parallel"
      agents:
        - name: "backend_developer"
          type: "llm"
          model: "gemini-2.0-flash"
        - name: "frontend_developer"
          type: "llm"
          model: "gemini-2.0-flash"

    # Testing workflow
    - name: "testing_workflow"
      type: "sequential"
      agents:
        - name: "test_writer"
          type: "llm"
        - name: "test_runner"
          type: "custom"
        - name: "aads_compliance"
          type: "custom"

    # Deployment
    - name: "deployer"
      type: "custom"

  # Agent-specific quality gates
  quality_gates:
    - agent_purpose_defined
    - tool_requirements_identified
    - workflow_mapped
    - real_data_only
    - error_handling_complete
    - timeout_configured
    - logging_implemented

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# DESIGN SYSTEM & VIBE CODING
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

design_system:
  enabled: true
  path: "docs/DESIGN_SYSTEM.md"
  components_library: "@/components/design-system"

  ownership:
    - copy_dont_import        # Copy shadcn, don't npm install
    - customize_extensively   # Make components unique
    - document_patterns       # Document in design system
    - version_control         # Track changes

  customization:
    colors: "custom"           # Not default Tailwind
    typography: "custom"       # Unique font combination
    animations: "custom"       # Brand-specific animations
    components: "branded"      # Extensively customized

  # Design quality gates
  quality_gates:
    # System compliance
    - design_system_compliance
    - no_inline_styles
    - consistent_spacing
    - consistent_typography

    # Visual polish
    - animations_present
    - loading_states_styled
    - error_states_styled
    - empty_states_designed

    # Accessibility
    - color_contrast_aaa
    - focus_states_visible
    - aria_labels_present
    - keyboard_navigation

    # Responsiveness
    - mobile_first_design
    - tablet_breakpoint_tested
    - desktop_breakpoint_tested
    - touch_targets_sized

    # Distinctiveness
    - custom_color_palette
    - unique_typography
    - branded_components
    - visual_distinctiveness

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# QUALITY GATES (Combined)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

quality_gates:
  # Pre-implementation
  pre_implementation:
    - check_existing_code
    - review_documentation
    - understand_requirements
    - plan_architecture

  # Implementation
  implementation:
    - no_mock_data
    - error_handling_required
    - loading_states_required
    - design_system_compliance
    - typescript_strict_mode
    - no_any_types
    - meaningful_variable_names
    - mcp_tools_validated
    - agent_workflows_tested

  # Testing
  testing:
    - manual_testing_complete
    - unit_tests_passing
    - integration_tests_passing
    - coverage_meets_threshold
    - aads_compliance_verified
    - design_compliance_verified

  # Deployment
  deployment:
    - database_migration_check
    - git_commit_required
    - git_push_verified
    - frontend_deploy_verified
    - backend_deploy_verified
    - production_verification
    - monitoring_configured
    - error_tracking_configured

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# DEPLOYMENT
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

deployment:
  frontend:
    platform: "vercel"
    auto_deploy: true
    url: "https://app.example.com"

  backend:
    platform: "railway"
    auto_deploy: true
    url: "https://api.example.com"

  database:
    platform: "supabase"
    migrations_path: "backend/migrations"

  agents:
    platform: "vertex-ai-agent-engine"
    project_id: "your-project"
    region: "us-central1"
```

---

## Best Practices

### 1. Start with RANA Foundation

Always begin with RANA standards - they're the foundation everything else builds on.

```bash
# ✅ GOOD: Initialize RANA first
aads init
# Then add MCP, ADK, design system

# ❌ BAD: Add tools without standards
npm install everything
# Quality will suffer
```

### 2. Layer Your Integrations

Add capabilities incrementally:

```
Week 1: RANA basics
Week 2: + MCP for data access
Week 3: + ADK for multi-agent
Week 4: + Design system polish
```

### 3. Maintain Single Source of Truth

`.rana.yml` is your configuration hub:

```yaml
# ✅ GOOD: Centralized configuration
# .rana.yml defines everything
# All tools read from this file

# ❌ BAD: Configuration scattered
# MCP config in one place
# ADK config somewhere else
# Design system config elsewhere
```

### 4. Test Each Layer

Verify each integration works before adding the next:

```bash
# Test RANA
aads check

# Test MCP
npx @modelcontextprotocol/inspector

# Test ADK
python -m pytest agents/

# Test design system
npm run test-components
```

### 5. Document Everything

Each layer should have clear documentation:

```
docs/
├── AADS_STANDARDS.md         # RANA quality gates
├── MCP_INTEGRATION.md        # MCP servers and tools
├── AGENT_ARCHITECTURE.md     # ADK agent design
└── DESIGN_SYSTEM.md          # Design standards
```

---

## Troubleshooting

### Common Issues

#### Issue 1: MCP Server Won't Connect

```bash
# Symptom: "Failed to connect to MCP server"

# Solution 1: Check server is executable
chmod +x mcp-servers/your-server/dist/index.js

# Solution 2: Test server directly
node mcp-servers/your-server/dist/index.js

# Solution 3: Check environment variables
echo $DATABASE_URL  # Should be set
```

#### Issue 2: Agents Not Following RANA Standards

```python
# Symptom: Agent generates mock data

# Solution: Update agent instructions
LlmAgent(
    name="developer",
    instructions="""
    CRITICAL: Follow RANA standards strictly.

    ❌ NEVER use mock data
    ✅ ALWAYS use MCP database tools for real data

    Before implementing, check:
    1. Are you using real data? (MCP tools)
    2. Do you have error handling? (try-catch)
    3. Are you using design system? (import from @/components/design-system)

    If any answer is NO, stop and fix.
    """
)
```

#### Issue 3: Design System Components Look Generic

```bash
# Symptom: App looks like every other AI-generated app

# Solution: Deep customization

# 1. Customize Tailwind config
# Edit tailwind.config.ts with brand colors

# 2. Create branded component variants
# components/design-system/brand/BrandButton.tsx

# 3. Add custom animations
# Use framer-motion for micro-interactions

# 4. Use unique typography
# Not just Inter - combine fonts

# 5. Custom color palette
# Generate from brand colors, not Tailwind defaults
```

#### Issue 4: Quality Gates Failing

```bash
# Symptom: aads check reports violations

# Solution: Fix systematically

# 1. List all violations
aads check --verbose

# 2. Fix by category
# - Mock data: Replace with MCP database calls
# - Error handling: Add try-catch blocks
# - Design system: Import from @/components/design-system
# - Tests: Write missing tests

# 3. Verify fix
aads check

# 4. Commit when passing
git commit -m "Fix RANA compliance violations"
```

---

## Conclusion

By integrating RANA, MCP, Google ADK, and vibe coding standards, you create a comprehensive framework for building production-quality applications with AI assistance.

**The Complete System Provides:**

✅ **Quality Assurance** (RANA)
- Enforced standards
- Quality gates
- Production readiness

✅ **Data Access** (MCP)
- Secure connections
- Real data
- Tool integration

✅ **Orchestration** (ADK)
- Multi-agent workflows
- Complex reasoning
- Specialized tasks

✅ **Visual Excellence** (Vibe Coding)
- Brand distinctiveness
- Design consistency
- Polished UX

**The Result:**
Production-quality code, shipped fast, with excellent design.

---

**Next Steps:**

1. **Quick Start**: Follow the [Quick Start](#quick-start) guide
2. **Deep Dive**: Read individual integration guides:
   - [MCP Integration Guide](./MCP_INTEGRATION_GUIDE.md)
   - [ADK Integration Guide](./AGENT_DEVELOPMENT_KIT_GUIDE.md)
   - [Vibe Coding Standards](./VIBE_CODING_DESIGN_STANDARDS.md)
3. **Examples**: Check the `examples/` directory
4. **Community**: Join the RANA Discord for support

---

*Part of the RANA Framework - Production-Quality AI Development*

**Version:** 1.0.0
**Last Updated:** 2025-11-09
**License:** MIT
