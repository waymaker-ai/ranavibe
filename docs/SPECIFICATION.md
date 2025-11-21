# RANA Specification v1.0.0

**Status:** Draft
**Version:** 1.0.0
**Last Updated:** 2025-11-05
**Authors:** [Your Name]

---

## Abstract

This document defines the AI-Assisted Development Standard (RANA), a comprehensive framework for ensuring production-quality code from AI coding assistants. RANA provides standards, workflows, quality gates, and tooling that work universally across tech stacks, IDEs, and AI assistants.

---

## 1. Introduction

### 1.1 Purpose

RANA addresses the critical gap in AI-assisted development: while AI assistants can generate code quickly, they often produce:
- Mock data instead of real implementations
- Code that breaks existing functionality
- Code without proper testing
- Code that never reaches production

RANA provides a comprehensive standard that ensures AI-generated code meets production-quality requirements.

### 1.2 Scope

RANA covers the entire development lifecycle:
- Research and planning
- Implementation standards
- Testing requirements
- Deployment workflows
- Production verification

### 1.3 Goals

1. **Universal:** Work with any tech stack, IDE, or AI assistant
2. **Actionable:** Provide concrete, checkable requirements
3. **Production-focused:** Ensure code ships to production
4. **Community-driven:** Open standard with community input

### 1.4 Non-Goals

- Replace existing linters/formatters (complementary)
- Dictate specific technologies (technology-agnostic)
- Replace human judgment (augment, not replace)

---

## 2. Core Concepts

### 2.1 Configuration File

RANA uses `.rana.yml` as the standard configuration file location.

**Rationale:** Follows established patterns (.gitignore, .eslintrc, etc.)

**Structure:**
```yaml
version: string          # RANA version (semver)
project: object          # Project metadata
standards: object        # Development standards
quality_gates: object    # Quality requirements
deployment: object       # Deployment configuration
ai_assistant: object     # AI assistant configuration
```

### 2.2 Quality Gates

Quality gates are checkpoints that must pass before proceeding to the next phase.

**Types:**
- **Pre-implementation:** Research and planning
- **Implementation:** Code quality requirements
- **Testing:** Test coverage and quality
- **Deployment:** Production readiness

### 2.3 Development Phases

RANA defines seven development phases:

1. **Understanding:** Clarify requirements
2. **Research:** Find existing implementations
3. **Planning:** Design the approach
4. **Implementation:** Write the code
5. **Testing:** Verify functionality
6. **Deployment:** Ship to production
7. **Verification:** Confirm production success

---

## 3. Configuration Schema

### 3.1 File Format

**Format:** YAML
**File name:** `.rana.yml`
**Location:** Project root

### 3.2 Schema Definition

```yaml
# RANA Configuration Schema v1.0.0

version: string
  # Required
  # RANA specification version
  # Format: semver (e.g., "1.0.0")
  # Example: "1.0.0"

project: object
  # Required
  # Project metadata

  name: string
    # Required
    # Project name
    # Example: "My Awesome App"

  type: string
    # Required
    # Project type
    # Values: "frontend" | "backend" | "fullstack" | "mobile" | "cli" | "library" | "tooling"
    # Example: "fullstack"

  description: string
    # Optional
    # Project description
    # Example: "A productivity app"

  languages: array<string>
    # Optional
    # Programming languages used
    # Example: ["typescript", "python"]

  frameworks: array<string>
    # Optional
    # Frameworks used
    # Example: ["react", "fastapi"]

standards: object
  # Required
  # Development standards

  principles: array<string>
    # Required
    # Core development principles
    # Values:
    #   - search_before_create
    #   - real_data_only
    #   - test_everything
    #   - deploy_to_production
    #   - documentation_required
    #   - design_system_compliance
    # Example: ["search_before_create", "real_data_only"]

  code_quality: object
    # Optional
    # Code quality requirements

    typescript_strict: boolean
      # TypeScript strict mode required

    no_any_types: boolean
      # Disallow 'any' types

    meaningful_names: boolean
      # Require meaningful variable names

    comments_for_complex_logic: boolean
      # Require comments for complex code

  testing: object
    # Optional
    # Testing requirements

    manual_testing_required: boolean
      # Manual testing required

    unit_tests_required: boolean
      # Unit tests required

    integration_tests_required: boolean
      # Integration tests required

    e2e_tests_required: boolean
      # End-to-end tests required

    coverage_threshold: number
      # Minimum test coverage percentage (0-100)

  design_system: object
    # Optional
    # Design system configuration

    enabled: boolean
      # Design system enforcement enabled

    path: string
      # Path to design system documentation
      # Example: "docs/DESIGN_SYSTEM.md"

    components_library: string
      # Design system components import path
      # Example: "@/components/design-system"

quality_gates: object
  # Required
  # Quality gate definitions

  pre_implementation: array<string>
    # Required
    # Pre-implementation checks
    # Values:
    #   - check_existing_code
    #   - review_documentation
    #   - understand_requirements
    #   - plan_architecture
    # Example: ["check_existing_code", "review_documentation"]

  implementation: array<string>
    # Required
    # Implementation checks
    # Values:
    #   - typescript_strict_mode
    #   - no_any_types
    #   - no_mock_data
    #   - error_handling_required
    #   - loading_states_required
    #   - design_system_compliance
    #   - meaningful_variable_names
    #   - dry_principle
    # Example: ["no_mock_data", "error_handling_required"]

  testing: array<string>
    # Required
    # Testing checks
    # Values:
    #   - manual_testing_complete
    #   - unit_tests_passing
    #   - integration_tests_passing
    #   - e2e_tests_passing
    #   - coverage_meets_threshold
    # Example: ["manual_testing_complete", "unit_tests_passing"]

  deployment: array<string>
    # Required
    # Deployment checks
    # Values:
    #   - database_migration_check
    #   - git_commit_required
    #   - git_push_verified
    #   - frontend_deploy_verified
    #   - backend_deploy_verified
    #   - production_verification
    # Example: ["git_commit_required", "production_verification"]

deployment: object
  # Optional
  # Deployment configuration

  frontend: object
    # Optional
    # Frontend deployment config

    platform: string
      # Deployment platform
      # Example: "vercel" | "netlify" | "cloudflare"

    auto_deploy: boolean
      # Auto-deploy on git push

    url: string
      # Production URL
      # Example: "https://app.example.com"

  backend: object
    # Optional
    # Backend deployment config

    platform: string
      # Deployment platform
      # Example: "railway" | "render" | "fly.io"

    auto_deploy: boolean
      # Auto-deploy on git push

    url: string
      # API URL
      # Example: "https://api.example.com"

  database: object
    # Optional
    # Database configuration

    platform: string
      # Database platform
      # Example: "supabase" | "planetscale" | "neon"

    migrations_path: string
      # Path to migration files
      # Example: "backend/migrations"

ai_assistant: object
  # Optional
  # AI assistant configuration

  model: string
    # Preferred AI model
    # Example: "claude-sonnet-4" | "gpt-4" | "copilot"

  instructions_path: string
    # Path to agent instructions
    # Example: "docs/AGENT_INSTRUCTIONS.md"

  checklist_path: string
    # Path to development checklist
    # Example: "docs/DEVELOPMENT_CHECKLIST.md"

  enforce: array<string>
    # Rules to enforce
    # Values:
    #   - no_mock_data
    #   - real_implementations_only
    #   - existing_patterns_first
    #   - test_before_commit
    #   - deploy_after_test
    # Example: ["no_mock_data", "deploy_after_test"]

tools: object
  # Optional
  # Tooling configuration

  cli: object
    # CLI tool configuration

    name: string
      # CLI package name
      # Example: "@rana/cli"

    version: string
      # CLI version
      # Example: "0.1.0"

  integrations: array<string>
    # Enabled integrations
    # Example: ["cursor", "github", "vercel"]
```

---

## 4. Development Principles

### 4.1 Search Before Creating

**Requirement:** Before implementing any feature, search for existing implementations.

**Locations to search:**
- Service layer (`src/services/`, `lib/`, etc.)
- Component library (`src/components/`, `components/`, etc.)
- API routes (`api/`, `routes/`, etc.)
- Documentation (`docs/`, `README.md`, etc.)

**Rationale:** Reduces code duplication and maintains consistency.

**Validation:** Check `git blame` or search history to verify research was done.

### 4.2 Real Data Only

**Requirement:** Never use mock data in production code.

**Prohibited:**
```typescript
// ❌ Mock data
const mockUsers = [
  { id: 1, name: 'John Doe' },
  { id: 2, name: 'Jane Smith' }
];
```

**Required:**
```typescript
// ✅ Real data
const users = await userService.getUsers();
```

**Exceptions:** Test files only (must be in `__tests__/`, `*.test.ts`, `*.spec.ts`)

**Rationale:** Mock data hides integration issues and doesn't reflect production behavior.

**Validation:** Grep for common mock patterns, verify API calls exist.

### 4.3 Test Everything

**Requirement:** All code must have appropriate test coverage.

**Testing levels:**
- **Manual:** Developer tests feature in browser/app
- **Unit:** Test individual functions/components
- **Integration:** Test API endpoints with real database
- **E2E:** Test user flows end-to-end

**Minimum coverage:** As specified in `.rana.yml` (default: 80%)

**Rationale:** Tests prevent regressions and document behavior.

**Validation:** Run coverage reports, verify tests pass.

### 4.4 Deploy to Production

**Requirement:** Features are not "done" until deployed and verified in production.

**Deployment steps:**
1. Run database migrations (if applicable)
2. Commit to git
3. Push to remote
4. Deploy frontend (if applicable)
5. Deploy backend (if applicable)
6. Verify in production
7. Monitor for errors

**Rationale:** Code that doesn't ship provides no value.

**Validation:** Production URL works, feature is live, no errors in logs.

---

## 5. Quality Gates

### 5.1 Pre-Implementation Gates

Must pass before writing code:

| Gate | Description | Verification |
|------|-------------|--------------|
| `check_existing_code` | Searched for existing implementations | Git search history or manual confirmation |
| `review_documentation` | Read relevant docs | Can explain relevant patterns |
| `understand_requirements` | Clear on what to build | Can articulate requirements |
| `plan_architecture` | Designed the approach | Has written plan or can explain approach |

### 5.2 Implementation Gates

Must pass during coding:

| Gate | Description | Verification |
|------|-------------|--------------|
| `no_mock_data` | No mock data arrays/objects | Grep for common patterns |
| `error_handling_required` | All async code has try-catch | AST analysis or manual review |
| `loading_states_required` | UI shows loading indicators | Manual testing |
| `design_system_compliance` | Uses design system components | Import analysis |
| `typescript_strict_mode` | TypeScript strict mode enabled | tsconfig.json check |
| `no_any_types` | No `any` types used | TypeScript compiler check |

### 5.3 Testing Gates

Must pass before deployment:

| Gate | Description | Verification |
|------|-------------|--------------|
| `manual_testing_complete` | Manually tested in browser/app | Developer confirmation |
| `unit_tests_passing` | All unit tests pass | Test runner output |
| `integration_tests_passing` | All integration tests pass | Test runner output |
| `e2e_tests_passing` | All E2E tests pass | Test runner output |
| `coverage_meets_threshold` | Coverage above threshold | Coverage report |

### 5.4 Deployment Gates

Must pass for production:

| Gate | Description | Verification |
|------|-------------|--------------|
| `database_migration_check` | Migrations run successfully | Migration logs |
| `git_commit_required` | Changes committed | Git log |
| `git_push_verified` | Changes pushed to remote | Remote branch check |
| `frontend_deploy_verified` | Frontend deployed successfully | Deployment logs |
| `backend_deploy_verified` | Backend deployed successfully | Deployment logs |
| `production_verification` | Feature works in production | Manual production test |

---

## 6. Workflow

### 6.1 Standard Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. UNDERSTANDING                                            │
│    - Clarify requirements                                   │
│    - Ask questions if unclear                               │
│    - Define success criteria                                │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. RESEARCH                                                 │
│    - Search for existing implementations                    │
│    - Review existing patterns                               │
│    - Identify reusable code                                 │
│    - Read relevant documentation                            │
│    Quality Gate: pre_implementation                         │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. PLANNING                                                 │
│    - Design the approach                                    │
│    - Identify edge cases                                    │
│    - Plan testing strategy                                  │
│    - Consider deployment needs                              │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. IMPLEMENTATION                                           │
│    - Write code following standards                         │
│    - Use real data (no mocks)                              │
│    - Add error handling                                     │
│    - Add loading states                                     │
│    - Follow design system                                   │
│    Quality Gate: implementation                             │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. TESTING                                                  │
│    - Test manually                                          │
│    - Write automated tests                                  │
│    - Verify coverage threshold                              │
│    - Test error scenarios                                   │
│    - Test responsive design                                 │
│    - Test dark mode (if applicable)                         │
│    Quality Gate: testing                                    │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. DEPLOYMENT                                               │
│    - Run database migrations                                │
│    - Commit to git                                          │
│    - Push to remote                                         │
│    - Deploy frontend                                        │
│    - Deploy backend                                         │
│    Quality Gate: deployment                                 │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. VERIFICATION                                             │
│    - Test in production                                     │
│    - Verify all links work                                  │
│    - Monitor error logs                                     │
│    - Confirm feature is live                                │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
                      COMPLETE ✅
```

### 6.2 Workflow Phases

Each phase has:
- **Input:** What's needed to start
- **Activities:** What happens during the phase
- **Output:** What's produced
- **Quality Gate:** What must pass to proceed

Detailed phase specifications in separate document: `WORKFLOW_GUIDE.md`

---

## 7. Tooling

### 7.1 CLI Tool

RANA provides an official CLI tool: `@rana/cli`

**Commands:**
- `rana init` - Initialize RANA in a project
- `rana check` - Check compliance with standards
- `rana validate` - Validate `.rana.yml` configuration
- `rana flow <type> <name>` - Start a workflow
- `rana deploy` - Deploy with verification

**Installation:**
```bash
npm install -g @rana/cli
```

### 7.2 IDE Extensions

Official IDE extensions available for:
- VS Code: `rana-vscode`
- JetBrains IDEs: `rana-jetbrains`

**Features:**
- Real-time compliance checking
- Checklist sidebar
- Design system autocomplete
- Pattern suggestions
- Deployment shortcuts

### 7.3 CI/CD Integration

**GitHub Action:**
```yaml
- uses: rana/check-compliance@v1
  with:
    config: .rana.yml
```

**GitLab CI:**
```yaml
rana-check:
  script:
    - npx @rana/cli check
```

---

## 8. Integration with AI Assistants

### 8.1 How AI Assistants Use RANA

1. **Read Configuration:** AI reads `.rana.yml` at project start
2. **Follow Standards:** AI follows defined principles and quality gates
3. **Use Instructions:** AI references `instructions_path` document
4. **Check Compliance:** AI verifies quality gates before marking tasks complete

### 8.2 AI Assistant Prompt Template

```
You are assisting with development on a project that follows RANA.

Configuration: [contents of .rana.yml]
Instructions: [contents of instructions_path]
Checklist: [contents of checklist_path]

For every task:
1. Search for existing implementations first
2. Use real data only (no mocks)
3. Follow the design system
4. Add error handling
5. Write tests
6. Deploy to production
7. Verify in production

Mark task complete only when all quality gates pass.
```

### 8.3 Supported AI Assistants

RANA is designed to work with any AI assistant:
- Claude (Anthropic)
- ChatGPT (OpenAI)
- GitHub Copilot
- Cursor
- Replit AI
- Any LLM-based assistant

---

## 9. Compliance

### 9.1 Compliance Levels

**Level 1: Minimal**
- `.rana.yml` file present
- Core principles defined
- Basic quality gates

**Level 2: Standard**
- All Level 1 requirements
- Testing configuration
- Deployment configuration
- AI assistant integration

**Level 3: Strict**
- All Level 2 requirements
- All quality gates enforced
- CI/CD integration
- Regular compliance audits

### 9.2 Compliance Verification

**Automated:**
- `rana check` command
- CI/CD integration
- Pre-commit hooks

**Manual:**
- Code reviews
- Deployment checklists
- Production verification

---

## 10. Extensibility

### 10.1 Custom Quality Gates

Projects can define custom quality gates:

```yaml
quality_gates:
  custom:
    - custom_gate_name
```

### 10.2 Language-Specific Extensions

Language-specific guides can extend RANA:
- RANA for React
- RANA for Python/Django
- RANA for Ruby/Rails

### 10.3 Industry-Specific Extensions

Industry-specific extensions can add requirements:
- RANA for E-commerce (PCI compliance)
- RANA for Healthcare (HIPAA compliance)
- RANA for Finance (SOC 2 compliance)

---

## 11. Versioning

### 11.1 Semantic Versioning

RANA follows semantic versioning (semver):
- **Major:** Breaking changes to schema or workflow
- **Minor:** New features, backward compatible
- **Patch:** Bug fixes, clarifications

### 11.2 Version Compatibility

Projects specify RANA version in `.rana.yml`:

```yaml
version: "1.0.0"
```

Tools check version compatibility and warn if mismatch.

---

## 12. Migration

### 12.1 Adopting RANA

For existing projects:

1. Run `rana init`
2. Review generated `.rana.yml`
3. Customize for your project
4. Start using with new features
5. Gradually adopt for existing code

### 12.2 Migrating Between Versions

When RANA versions change:

1. Read migration guide
2. Update `.rana.yml` version
3. Run `rana validate`
4. Fix any compatibility issues
5. Update tooling (CLI, extensions)

---

## 13. Community

### 13.1 Governance

RANA is community-driven:
- **RFC Process:** Major changes require RFC
- **Core Team:** Maintainers guide direction
- **Community Input:** Anyone can propose changes

### 13.2 Contributing

See `CONTRIBUTING.md` for guidelines.

**Ways to contribute:**
- Improve documentation
- Report issues
- Suggest features
- Submit PRs
- Create extensions
- Share examples

---

## 14. License

RANA specification is licensed under CC BY 4.0.

RANA tooling is licensed under MIT.

---

## 15. References

- RANA Website: https://rana.dev
- GitHub Repository: https://github.com/yourusername/rana-framework
- Discord Community: https://discord.gg/rana
- Twitter: @rana_dev

---

## Appendix A: Example .rana.yml

See `templates/react-typescript/.rana.yml` for React example.

See `templates/nextjs-supabase/.rana.yml` for Next.js example.

See `templates/vue-firebase/.rana.yml` for Vue example.

---

## Appendix B: Quality Gate Catalog

Full catalog of available quality gates with descriptions and validation methods.

See `docs/QUALITY_GATES.md`

---

## Appendix C: Workflow Details

Detailed workflow documentation with phase-by-phase guide.

See `docs/WORKFLOW_GUIDE.md`

---

**RANA Specification v1.0.0**
**Status:** Draft
**Last Updated:** 2025-11-05

---

*This specification is a living document and will evolve based on community feedback.*
