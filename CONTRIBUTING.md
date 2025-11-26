# Contributing to RANA

Thank you for your interest in contributing to RANA! This guide will help you get started.

---

## 🎯 Ways to Contribute

There are many ways to contribute to RANA:

1. **Report bugs** - Found a bug? Let us know!
2. **Suggest features** - Have an idea? We'd love to hear it!
3. **Write code** - Fix bugs or implement features
4. **Improve docs** - Help make our documentation better
5. **Write examples** - Share how you're using RANA
6. **Answer questions** - Help others in Discord/GitHub
7. **Spread the word** - Star us on GitHub, tweet about us

---

## 🚀 Getting Started

### 1. Fork and Clone

```bash
# Fork the repo on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/rana.git
cd rana

# Add upstream remote
git remote add upstream https://github.com/waymaker/rana.git
```

### 2. Install Dependencies

```bash
# Run the setup script
bash setup.sh

# Or manually:
npm install
cd packages/core && npm install && npm run build
cd ../react && npm install && npm run build
cd ../..
```

### 3. Create a Branch

```bash
# Create a branch for your changes
git checkout -b feature/your-feature-name

# Or for bug fixes:
git checkout -b fix/bug-description
```

---

## 💻 Development Workflow

### Project Structure

```
rana/
├── packages/
│   ├── core/          # @rana/core - Main SDK
│   ├── react/         # @rana/react - React hooks
│   └── ...
├── tools/
│   └── cli/           # @rana/cli - CLI tools
├── examples/          # Example projects
├── docs/              # Documentation
└── tests/             # Tests
```

### Building Packages

```bash
# Build all packages
npm run build

# Build specific package
npm run build:core
npm run build:react
npm run build:cli
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific package tests
npm run test:core
npm run test:react
```

### Type Checking

```bash
# Check all packages
npm run typecheck

# Check specific package
npm run typecheck:core
```

---

## 📝 Coding Standards

### TypeScript

- Use TypeScript for all code
- Provide full type annotations
- Export all public types

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Use descriptive variable names
- Add comments for complex logic

### Documentation

- Add JSDoc comments to all public APIs
- Include examples in JSDoc
- Update README when adding features

---

## ✨ Submitting Pull Requests

### PR Checklist

- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] Types check
- [ ] Builds successfully
- [ ] Documentation updated
- [ ] CHANGELOG.md updated

### PR Title Format

```
feat: Add support for new feature
fix: Resolve bug description
docs: Update documentation
```

---

## 📞 Contact

- **Email**: ashley@waymaker.cx
- **Discord**: https://discord.gg/rana
- **GitHub**: https://github.com/waymaker/rana

---

**Happy coding! 🚀**
