# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**CoFounder Framework** (Rapid AI Native Architecture) - A universal framework that ensures AI coding assistants produce production-quality code. This is a documentation and tooling project that provides standards, workflows, quality gates, and CLI tools for AI-assisted development.

## Repository Structure

```
cofounder/
├── tools/
│   ├── cli/                      # Core CoFounder CLI tool (@cofounder/cli)
│   └── waymaker-cofounder-pro/        # Enhanced version with team features
├── examples/
│   └── react-typescript/         # Example React+TS project using CoFounder
├── docs/
│   └── SPECIFICATION.md          # Complete CoFounder specification
├── marketing/                    # Marketing materials and launch content
└── .cofounder.yml                     # This repo's own CoFounder configuration
```

## Common Commands

### CLI Tool Development

```bash
# Build the CLI tool
cd tools/cli
npm run build

# Run CLI in development mode (watch for changes)
npm run dev

# Test the CLI locally (run individual commands)
npm run start -- init
npm run start -- check
npm run start -- deploy
npm run start -- validate
npm run start -- config
npm run start -- status

# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Build Waymaker Pro version
cd tools/waymaker-cofounder-pro
npm run build
```

### Working with the CLI

```bash
# From project root, test CLI in another project
cd /path/to/test-project
node /Users/ashleykays/projects/cofounder/tools/cli/dist/cli.js init
node /Users/ashleykays/projects/cofounder/tools/cli/dist/cli.js check
```

### Example Projects

```bash
# Run React TypeScript example
cd examples/react-typescript
npm install
npm run dev
npm run build

# Run tests in example project
npm test

# Run tests with UI
npm run test:ui

# Generate test coverage
npm run coverage

# Lint the example project
npm run lint

# Type-check without emitting files
npm run type-check
```

## Architecture

### CLI Tool Structure (`tools/cli/`)

The CLI is built with TypeScript and uses:
- **Commander.js**: CLI framework for command routing and argument parsing
- **Inquirer**: Interactive prompts for user input
- **Chalk**: Terminal output coloring
- **js-yaml**: YAML parsing for `.cofounder.yml` configuration
- **Ora**: Loading spinners and progress indicators

**Main commands:**
- `init` - Creates `.cofounder.yml` and documentation structure (supports --template and --force flags)
- `check` - Validates compliance with CoFounder standards (supports --verbose and --fix flags)
- `deploy` - Handles deployment with verification workflow (supports --verify and --skip-tests flags)
- `validate` - Validates `.cofounder.yml` configuration
- `config` - Shows current configuration
- `status` - Shows project CoFounder status

**Command implementation pattern:**
Each command is in `src/commands/` and exports an async function that takes options. The main CLI file (`src/cli.ts`) registers these commands with Commander.

**Check command specifics:**
The `check` command scans for:
- Configuration validity
- Mock data patterns (mockData, dummyData, fakeData)
- TypeScript strict mode compliance
- Usage of `any` types
- Console.log statements in production code
- Git status (uncommitted changes)

### Configuration System

The `.cofounder.yml` file defines:
- **Project metadata**: name, type, languages, frameworks
- **Standards**: principles, code quality rules, testing requirements
- **Quality gates**: Checkpoints for pre-implementation, implementation, testing, deployment
- **AI assistant rules**: Behavioral guidelines for AI coding assistants
- **Deployment config**: Platform-specific deployment settings

### Quality Gates

CoFounder enforces quality through four gate categories:
1. **Pre-implementation**: Search existing code, review docs, plan architecture
2. **Implementation**: Error handling, loading states, real data (no mocks), type safety
3. **Testing**: Manual testing, automated tests, coverage thresholds
4. **Deployment**: Git commits, production verification

## Core Principles

When working on this codebase, follow these CoFounder principles (defined in `.cofounder.yml`):

1. **search_before_create** - Always check existing code before adding new functionality
2. **real_data_only** - Never create mock data; use real implementations
3. **test_everything** - Manual and automated testing required
4. **deploy_to_production** - Features aren't done until deployed
5. **documentation_required** - Keep docs updated

## TypeScript Configuration

- **Strict mode enabled**: No `any` types allowed
- **Target**: ES2022 (CLI tools), ES2020 (documentation)
- **Module**: ESNext
- **Module resolution**: Node
- **ESM compatibility**: All imports use `.js` extensions (TypeScript ESM requirement)
- **Engines**: Node.js >= 18.0.0
- **Declaration files**: Generated with source maps for better IDE support

## Testing

The project uses **Vitest** for testing.
- Tests should be placed alongside source files with `.test.ts` or `.spec.ts` extension
- Test files are automatically excluded from builds
- Run `npm test` in the CLI tool directory or example project
- React example includes Vitest UI support: `npm run test:ui`
- Coverage reports available via `npm run coverage` in examples

## Package Management

- Both CLI tools use **npm** (not yarn or pnpm)
- Use `npm install` to add dependencies
- Use `prepublishOnly` script to ensure builds before publishing

## Documentation Standards

When updating docs:
- Main specification lives in `docs/SPECIFICATION.md`
- Example READMEs demonstrate CoFounder principles in practice
- CLI generates documentation templates in `docs/cofounder/` directory
- Keep IMPLEMENTATION_STATUS.md updated with progress

## CLI Development Workflow

When adding a new CLI command:
1. Create command file in `tools/cli/src/commands/[name].ts`
2. Export async function that accepts options object (typed interface)
3. Import and register command in `src/cli.ts` with Commander
4. Add command options and flags (e.g., `--verbose`, `--fix`)
5. Use Ora for spinners, Chalk for colors, Inquirer for prompts
6. Test manually: `npm run start -- [command]` from tools/cli
7. Add error handling with descriptive messages
8. Update this WARP.md file with new command details
9. Build with `npm run build` before publishing

## Package Publishing

**@cofounder/cli** package:
- Scoped package under `@cofounder` organization
- Binary name: `cofounder`
- Entry point: `dist/cli.js` (must be executable)
- Always run `npm run build` before publishing
- Version follows semver

## Git Workflow

- Main branch contains production code
- Commit messages should be descriptive
- This project follows its own CoFounder standards (self-referential)
- Use `git --no-pager` commands when running git via CLI

## Key Files to Know

- `.cofounder.yml` - This repository's own configuration (meta-example)
- `docs/SPECIFICATION.md` - Complete CoFounder spec (200+ lines)
- `tools/cli/src/cli.ts` - CLI entry point with all commands
- `tools/cli/src/commands/init.ts` - Template generation logic
- `examples/react-typescript/.cofounder.yml` - Well-documented example config

## Important Constraints

- **No mock data**: Always use real implementations, even in examples
- **TypeScript strict mode**: No `any` types, proper type definitions required
- **Error handling**: All async operations must have try-catch blocks with user-friendly messages
- **Loading states**: UI components must show loading indicators; CLI uses Ora spinners
- **ESM modules**: Use `.js` extensions in imports for ESM compatibility (e.g., `import { foo } from './bar.js'`)
- **File operations**: Use `fs/promises` for async file operations, check existence with try-catch on `fs.access()`
- **User feedback**: CLI must provide clear, colored output using Chalk (cyan for info, yellow for warnings, red for errors, green for success)

## Project Status

This is a framework/tooling project currently in MVP phase:
- ✅ Core CLI structure complete
- ✅ Configuration schema defined
- ✅ Example projects created
- ⬜ Full CLI implementation in progress
- ⬜ Not yet published to npm
- ⬜ Documentation website planned

See `IMPLEMENTATION_STATUS.md` for detailed progress tracking.
