# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**RANA Framework** (AI-Assisted Development Standard) - A universal framework that ensures AI coding assistants produce production-quality code. This is a documentation and tooling project that provides standards, workflows, quality gates, and CLI tools for AI-assisted development.

## Repository Structure

```
ranavibe/
├── tools/
│   ├── cli/                      # Core RANA CLI tool (@rana/cli)
│   └── waymaker-rana-pro/        # Enhanced version with team features
├── examples/
│   └── react-typescript/         # Example React+TS project using RANA
├── docs/
│   └── SPECIFICATION.md          # Complete RANA specification
├── marketing/                    # Marketing materials and launch content
└── .rana.yml                     # This repo's own RANA configuration
```

## Common Commands

### CLI Tool Development

```bash
# Build the CLI tool
cd tools/cli
npm run build

# Run CLI in development mode (watch for changes)
npm run dev

# Test the CLI locally
npm run start -- init
npm run start -- check
npm run start -- deploy

# Run tests
npm test

# Build Waymaker Pro version
cd tools/waymaker-rana-pro
npm run build
```

### Working with the CLI

```bash
# From project root, test CLI in another project
cd /path/to/test-project
node /Users/ashleykays/projects/ranavibe/tools/cli/dist/cli.js init
node /Users/ashleykays/projects/ranavibe/tools/cli/dist/cli.js check
```

### Example Projects

```bash
# Run React TypeScript example
cd examples/react-typescript
npm install
npm run dev
npm run build
```

## Architecture

### CLI Tool Structure (`tools/cli/`)

The CLI is built with TypeScript and uses:
- **Commander.js**: CLI framework for command routing and argument parsing
- **Inquirer**: Interactive prompts for user input
- **Chalk**: Terminal output coloring
- **js-yaml**: YAML parsing for `.rana.yml` configuration
- **Ora**: Loading spinners and progress indicators

**Main commands:**
- `init` - Creates `.rana.yml` and documentation structure
- `check` - Validates compliance with RANA standards
- `deploy` - Handles deployment with verification workflow
- `validate` - Validates `.rana.yml` configuration
- `config` - Shows current configuration
- `status` - Shows project RANA status

**Command implementation pattern:**
Each command is in `src/commands/` and exports an async function that takes options. The main CLI file (`src/cli.ts`) registers these commands with Commander.

### Configuration System

The `.rana.yml` file defines:
- **Project metadata**: name, type, languages, frameworks
- **Standards**: principles, code quality rules, testing requirements
- **Quality gates**: Checkpoints for pre-implementation, implementation, testing, deployment
- **AI assistant rules**: Behavioral guidelines for AI coding assistants
- **Deployment config**: Platform-specific deployment settings

### Quality Gates

RANA enforces quality through four gate categories:
1. **Pre-implementation**: Search existing code, review docs, plan architecture
2. **Implementation**: Error handling, loading states, real data (no mocks), type safety
3. **Testing**: Manual testing, automated tests, coverage thresholds
4. **Deployment**: Git commits, production verification

## Core Principles

When working on this codebase, follow these RANA principles (defined in `.rana.yml`):

1. **search_before_create** - Always check existing code before adding new functionality
2. **real_data_only** - Never create mock data; use real implementations
3. **test_everything** - Manual and automated testing required
4. **deploy_to_production** - Features aren't done until deployed
5. **documentation_required** - Keep docs updated

## TypeScript Configuration

- **Strict mode enabled**: No `any` types allowed
- **Target**: ES2020
- **Module**: ESNext with `.js` extensions (for ESM compatibility)
- **Engines**: Node.js >= 18.0.0

## Testing

The project uses **Vitest** for testing. Tests should be placed alongside source files with `.test.ts` extension.

## Package Management

- Both CLI tools use **npm** (not yarn or pnpm)
- Use `npm install` to add dependencies
- Use `prepublishOnly` script to ensure builds before publishing

## Documentation Standards

When updating docs:
- Main specification lives in `docs/SPECIFICATION.md`
- Example READMEs demonstrate RANA principles in practice
- CLI generates documentation templates in `docs/rana/` directory
- Keep IMPLEMENTATION_STATUS.md updated with progress

## CLI Development Workflow

When adding a new CLI command:
1. Create command file in `src/commands/[name].ts`
2. Export async function that accepts options object
3. Register command in `src/cli.ts` with description and options
4. Add command to help text and documentation
5. Test manually with `npm run start -- [command]`
6. Build with `npm run build` before publishing

## Package Publishing

**@rana/cli** package:
- Scoped package under `@rana` organization
- Binary name: `rana`
- Entry point: `dist/cli.js` (must be executable)
- Always run `npm run build` before publishing
- Version follows semver

## Git Workflow

- Main branch contains production code
- Commit messages should be descriptive
- This project follows its own RANA standards (self-referential)
- Use `git --no-pager` commands when running git via CLI

## Key Files to Know

- `.rana.yml` - This repository's own configuration (meta-example)
- `docs/SPECIFICATION.md` - Complete RANA spec (200+ lines)
- `tools/cli/src/cli.ts` - CLI entry point with all commands
- `tools/cli/src/commands/init.ts` - Template generation logic
- `examples/react-typescript/.rana.yml` - Well-documented example config

## Important Constraints

- **No mock data**: Always use real implementations, even in examples
- **TypeScript strict mode**: No `any` types, proper type definitions required
- **Error handling**: All async operations must have try-catch blocks
- **Loading states**: UI components must show loading indicators
- **ESM modules**: Use `.js` extensions in imports for ESM compatibility

## Project Status

This is a framework/tooling project currently in MVP phase:
- ✅ Core CLI structure complete
- ✅ Configuration schema defined
- ✅ Example projects created
- ⬜ Full CLI implementation in progress
- ⬜ Not yet published to npm
- ⬜ Documentation website planned

See `IMPLEMENTATION_STATUS.md` for detailed progress tracking.
