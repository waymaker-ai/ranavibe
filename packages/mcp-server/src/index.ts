#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { ConfigParser, QualityGateChecker, REPMValidator, TemplateManager } from '@rana/core';
import * as path from 'path';
import * as fs from 'fs';

const server = new Server({
  name: 'rana-mcp',
  version: '0.1.0',
});

// Tool: Validate RANA Configuration
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'validate_rana_config',
      description: 'Validate .rana.yml configuration file and check for syntax/schema errors',
      inputSchema: {
        type: 'object',
        properties: {
          config_path: {
            type: 'string',
            description: 'Path to .rana.yml file (optional, will search current directory if not provided)',
          },
        },
      },
    },
    {
      name: 'check_quality_gates',
      description: 'Check quality gates for a specific phase (pre_implementation, implementation, testing, deployment)',
      inputSchema: {
        type: 'object',
        properties: {
          phase: {
            type: 'string',
            enum: ['pre_implementation', 'implementation', 'testing', 'deployment'],
            description: 'Quality gate phase to check',
          },
          config_path: {
            type: 'string',
            description: 'Path to .rana.yml file (optional)',
          },
        },
        required: ['phase'],
      },
    },
    {
      name: 'repm_validate',
      description: 'Run REPM (Reverse Engineering Product Methodology) validation for major features',
      inputSchema: {
        type: 'object',
        properties: {
          phase: {
            type: 'string',
            enum: ['outcome', 'monetization', 'gtm', 'ux', 'product', 'build', 'idea'],
            description: 'REPM phase to validate (or omit for full checklist)',
          },
        },
      },
    },
    {
      name: 'is_major_feature',
      description: 'Check if a feature qualifies as "major" and requires REPM validation',
      inputSchema: {
        type: 'object',
        properties: {
          description: {
            type: 'string',
            description: 'Description of the feature being built',
          },
          config_path: {
            type: 'string',
            description: 'Path to .rana.yml file (optional)',
          },
        },
        required: ['description'],
      },
    },
    {
      name: 'generate_compliance_report',
      description: 'Generate a complete RANA compliance report showing all quality gates and their status',
      inputSchema: {
        type: 'object',
        properties: {
          config_path: {
            type: 'string',
            description: 'Path to .rana.yml file (optional)',
          },
        },
      },
    },
    {
      name: 'init_rana_project',
      description: 'Initialize a new RANA project with default or custom configuration',
      inputSchema: {
        type: 'object',
        properties: {
          project_type: {
            type: 'string',
            enum: ['nextjs', 'react', 'python', 'default'],
            description: 'Type of project to initialize',
          },
          output_path: {
            type: 'string',
            description: 'Path where .rana.yml should be created (defaults to current directory)',
          },
        },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'validate_rana_config': {
        const configPath = (args as any)?.config_path || ConfigParser.findConfig();
        if (!configPath) {
          return {
            content: [
              {
                type: 'text',
                text: 'Error: No .rana.yml file found. Use init_rana_project tool to create one.',
              },
            ],
          };
        }

        try {
          const config = ConfigParser.parse(configPath);
          return {
            content: [
              {
                type: 'text',
                text: `✅ Configuration valid!\n\nProject: ${config.project.name}\nType: ${config.project.type}\nLanguages: ${config.project.languages.join(', ')}\n\nQuality Gates:\n- Pre-implementation: ${config.quality_gates.pre_implementation.length} gates\n- Implementation: ${config.quality_gates.implementation.length} gates\n- Testing: ${config.quality_gates.testing.length} gates\n- Deployment: ${config.quality_gates.deployment.length} gates`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Configuration validation failed:\n\n${error instanceof Error ? error.message : String(error)}`,
              },
            ],
          };
        }
      }

      case 'check_quality_gates': {
        const toolArgs = args as any;
        const configPath = toolArgs?.config_path || ConfigParser.findConfig();
        if (!configPath) {
          return {
            content: [
              {
                type: 'text',
                text: 'Error: No .rana.yml file found.',
              },
            ],
          };
        }

        const config = ConfigParser.parse(configPath);
        const checker = new QualityGateChecker(config);
        const results = checker.checkPhase(toolArgs.phase);

        let output = `# Quality Gates: ${toolArgs.phase}\n\n`;
        for (const result of results.gates) {
          const icon = result.passed ? '✅' : '⚠️';
          output += `${icon} ${result.gate.name}\n`;
          output += `   ${result.gate.description}\n`;
          if (!result.passed) {
            output += `   Status: ${result.message}\n`;
          }
          output += '\n';
        }

        output += `\nOverall: ${results.allPassed ? '✅ All gates passed' : '⚠️ Some gates need attention'}`;

        return {
          content: [
            {
              type: 'text',
              text: output,
            },
          ],
        };
      }

      case 'repm_validate': {
        const toolArgs = args as any;
        const validator = new REPMValidator();

        if (toolArgs?.phase) {
          const phase = validator.getPhase(toolArgs.phase);
          if (!phase) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Error: Invalid REPM phase "${toolArgs.phase}"`,
                },
              ],
            };
          }

          let output = `# REPM Phase: ${phase.description}\n\n`;
          output += `## Key Questions:\n`;
          for (const question of phase.questions) {
            output += `- ${question}\n`;
          }
          output += `\n## Template:\n\`\`\`\n${phase.template}\n\`\`\``;

          return {
            content: [
              {
                type: 'text',
                text: output,
              },
            ],
          };
        } else {
          // Return full checklist
          const checklist = validator.generateChecklist();
          return {
            content: [
              {
                type: 'text',
                text: `# REPM Validation Checklist\n\n${checklist}`,
              },
            ],
          };
        }
      }

      case 'is_major_feature': {
        const toolArgs = args as any;
        const configPath = toolArgs?.config_path || ConfigParser.findConfig();
        if (!configPath) {
          return {
            content: [
              {
                type: 'text',
                text: 'Error: No .rana.yml file found.',
              },
            ],
          };
        }

        const config = ConfigParser.parse(configPath);
        const isMajor = ConfigParser.isMajorFeature(config, toolArgs.description);

        return {
          content: [
            {
              type: 'text',
              text: isMajor
                ? `✅ This is a MAJOR FEATURE - REPM validation required\n\nReason: Feature involves revenue streams, new products, pricing changes, or market segments.\n\nNext step: Run repm_validate tool to start strategic validation.`
                : `ℹ️ This is a standard feature - proceed with regular quality gates\n\nNo REPM validation needed. Follow quality_gates from .rana.yml.`,
            },
          ],
        };
      }

      case 'generate_compliance_report': {
        const toolArgs = args as any;
        const configPath = toolArgs?.config_path || ConfigParser.findConfig();
        if (!configPath) {
          return {
            content: [
              {
                type: 'text',
                text: 'Error: No .rana.yml file found.',
              },
            ],
          };
        }

        const config = ConfigParser.parse(configPath);
        const checker = new QualityGateChecker(config);

        let report = `# RANA Compliance Report\n\n`;
        report += `**Project**: ${config.project.name}\n`;
        report += `**Type**: ${config.project.type}\n\n`;

        const phases = ['pre_implementation', 'implementation', 'testing', 'deployment'] as const;
        for (const phase of phases) {
          const results = checker.checkPhase(phase);
          report += `## ${phase.replace('_', ' ').toUpperCase()}\n\n`;

          for (const result of results.gates) {
            const icon = result.passed ? '✅' : '⚠️';
            report += `${icon} **${result.gate.name}**\n`;
            report += `   ${result.gate.description}\n\n`;
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: report,
            },
          ],
        };
      }

      case 'init_rana_project': {
        const toolArgs = args as any;
        const templateManager = new TemplateManager();
        const projectType = toolArgs?.project_type || 'default';
        const outputPath = toolArgs?.output_path || process.cwd();

        let config: string;
        if (projectType === 'default') {
          config = templateManager.getDefaultConfig();
        } else {
          config = templateManager.generateConfig(projectType as 'nextjs' | 'react' | 'python');
        }

        const configFile = path.join(outputPath, '.rana.yml');

        try {
          fs.writeFileSync(configFile, config, 'utf8');
          return {
            content: [
              {
                type: 'text',
                text: `✅ Created .rana.yml at ${configFile}\n\nProject type: ${projectType}\n\nNext steps:\n1. Customize .rana.yml for your project\n2. Run validate_rana_config to verify\n3. Start building with RANA quality gates!`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Failed to create .rana.yml:\n\n${error instanceof Error ? error.message : String(error)}`,
              },
            ],
          };
        }
      }

      default:
        return {
          content: [
            {
              type: 'text',
              text: `Error: Unknown tool "${name}"`,
            },
          ],
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error executing tool: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Resources: Documentation and templates
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: 'rana://docs/quality-gates',
      name: 'Quality Gates Documentation',
      description: 'Complete guide to RANA quality gates',
      mimeType: 'text/markdown',
    },
    {
      uri: 'rana://docs/repm',
      name: 'REPM Methodology',
      description: 'Reverse Engineering Product Methodology guide',
      mimeType: 'text/markdown',
    },
    {
      uri: 'rana://templates/default',
      name: 'Default Configuration Template',
      description: 'Default .rana.yml template',
      mimeType: 'text/yaml',
    },
  ],
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  const templateManager = new TemplateManager();
  const validator = new REPMValidator();

  switch (uri) {
    case 'rana://docs/quality-gates':
      return {
        contents: [
          {
            uri,
            mimeType: 'text/markdown',
            text: `# RANA Quality Gates

Quality gates ensure production-quality code at every phase:

## Pre-Implementation
- Search for existing implementations
- Validate approach with tech lead
- Check design system compliance

## Implementation
- TypeScript strict mode compliance
- No 'any' types
- Proper error handling
- Design system usage

## Testing
- Manual testing completed
- Edge cases covered
- Performance validated

## Deployment
- Deploy to production
- Verify feature works
- Monitor for errors

Run \`check_quality_gates\` tool for your project-specific gates.`,
          },
        ],
      };

    case 'rana://docs/repm':
      return {
        contents: [
          {
            uri,
            mimeType: 'text/markdown',
            text: `# REPM - Reverse Engineering Product Methodology

Strategic validation framework for major features:

${validator.generateChecklist()}

Run \`repm_validate\` tool for phase-specific guidance.`,
          },
        ],
      };

    case 'rana://templates/default':
      return {
        contents: [
          {
            uri,
            mimeType: 'text/yaml',
            text: templateManager.getDefaultConfig(),
          },
        ],
      };

    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
});

// Prompts: Common workflows
server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: [
    {
      name: 'init_project',
      description: 'Initialize a new project with RANA',
      arguments: [
        {
          name: 'project_name',
          description: 'Name of the project',
          required: true,
        },
        {
          name: 'project_type',
          description: 'Type of project (nextjs, react, python)',
          required: false,
        },
      ],
    },
    {
      name: 'validate_major_feature',
      description: 'Guide through REPM validation for a major feature',
      arguments: [
        {
          name: 'feature_description',
          description: 'Description of the feature to validate',
          required: true,
        },
      ],
    },
    {
      name: 'implement_feature',
      description: 'Guide through implementing a feature with quality gates',
      arguments: [
        {
          name: 'feature_description',
          description: 'Description of the feature to implement',
          required: true,
        },
      ],
    },
  ],
}));

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'init_project':
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Initialize a new RANA project named "${args?.project_name}" (type: ${args?.project_type || 'default'}).\n\nSteps:\n1. Create .rana.yml configuration\n2. Set up quality gates\n3. Configure project metadata\n4. Validate configuration\n\nPlease use the init_rana_project tool.`,
            },
          },
        ],
      };

    case 'validate_major_feature':
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `I'm planning to build: ${args?.feature_description}\n\nBefore implementation, let's validate this feature using REPM:\n\n1. First, check if this is a major feature using is_major_feature tool\n2. If yes, run through REPM phases:\n   - Outcome: Define success metrics\n   - Monetization: Validate unit economics\n   - GTM: Design distribution strategy\n   - UX: Map user journey\n   - Product: Prioritize features\n   - Build: Plan technical approach\n   - Idea: Make GO/NO-GO decision\n\nUse repm_validate tool for each phase.`,
            },
          },
        ],
      };

    case 'implement_feature':
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Implement feature: ${args?.feature_description}\n\nFollow RANA quality gates:\n\n1. PRE-IMPLEMENTATION\n   - Run check_quality_gates for pre_implementation phase\n   - Search for existing implementations\n   - Validate approach\n\n2. IMPLEMENTATION\n   - Follow TypeScript strict mode\n   - Use design system components\n   - Implement with quality gates\n   - Run check_quality_gates for implementation phase\n\n3. TESTING\n   - Manual testing\n   - Edge cases\n   - Run check_quality_gates for testing phase\n\n4. DEPLOYMENT\n   - Deploy to production\n   - Verify functionality\n   - Run check_quality_gates for deployment phase\n\nUse check_quality_gates tool throughout.`,
            },
          },
        ],
      };

    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('RANA MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
