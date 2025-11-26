# RANA Publishing Guide

Complete step-by-step guide to publishing RANA packages to npm.

---

## ✅ Pre-Publish Checklist

### 1. Verify Builds
```bash
# Build core package
cd /Users/ashleykays/projects/ranavibe/packages/core
npm run build
# ✅ Should complete without errors

# Build React package
cd /Users/ashleykays/projects/ranavibe/packages/react
npm run build
# ✅ Should complete without errors
```

### 2. Check package.json Files

**packages/core/package.json:**
- [ ] Version: 2.0.0
- [ ] Name: @rana/core
- [ ] Description filled
- [ ] Keywords added
- [ ] Repository URL correct
- [ ] License: MIT

**packages/react/package.json:**
- [ ] Version: 2.0.0
- [ ] Name: @rana/react
- [ ] Description filled
- [ ] Keywords added
- [ ] Repository URL correct
- [ ] License: MIT

### 3. Verify README Files
- [ ] packages/core/README.md exists and is comprehensive
- [ ] packages/react/README.md exists
- [ ] Root README.md updated with SDK usage

### 4. Test Locally

Create a test project:
```bash
mkdir /tmp/test-rana
cd /tmp/test-rana
npm init -y

# Link local packages
npm link /Users/ashleykays/projects/ranavibe/packages/core
npm link /Users/ashleykays/projects/ranavibe/packages/react

# Test imports
node -e "const rana = require('@rana/core'); console.log('Core works!');"
```

---

## 📦 Publishing to npm

### Step 1: Create npm Account (if needed)

1. Go to https://npmjs.com
2. Sign up for account
3. Verify email

### Step 2: Login to npm

```bash
npm login
```

Enter:
- Username
- Password
- Email
- 2FA code (if enabled)

Verify:
```bash
npm whoami
# Should show your username
```

### Step 3: Create Organization (if needed)

```bash
# Check if @rana org exists
npm org ls rana

# If not, create it at:
# https://www.npmjs.com/org/create
```

### Step 4: Publish Core Package

```bash
cd /Users/ashleykays/projects/ranavibe/packages/core

# Verify package contents
npm pack --dry-run

# Publish
npm publish --access public

# Verify
npm view @rana/core
```

Expected output:
```
+ @rana/core@2.0.0
```

### Step 5: Publish React Package

```bash
cd /Users/ashleykays/projects/ranavibe/packages/react

# Update dependency to use published core
# (Optional - can wait until after both are published)

# Publish
npm publish --access public

# Verify
npm view @rana/react
```

Expected output:
```
+ @rana/react@2.0.0
```

### Step 6: Test Published Packages

```bash
# Create fresh test project
mkdir /tmp/test-published
cd /tmp/test-published
npm init -y

# Install from npm
npm install @rana/core @rana/react

# Test
node -e "const { createRana } = require('@rana/core'); console.log('Works!');"
```

---

## 🔄 Updating Packages

### For Patch Updates (2.0.0 → 2.0.1)

```bash
cd packages/core

# Update version
npm version patch

# Build
npm run build

# Publish
npm publish

# Same for React
cd ../react
npm version patch
npm run build
npm publish
```

### For Minor Updates (2.0.0 → 2.1.0)

```bash
npm version minor
npm run build
npm publish
```

### For Major Updates (2.0.0 → 3.0.0)

```bash
npm version major
npm run build
npm publish
```

---

## 📝 Post-Publish Tasks

### 1. Update Root README

```markdown
## Installation

```bash
npm install @rana/core @rana/react
```

## Quick Start

```typescript
import { createRana } from '@rana/core';

const rana = createRana({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY
  }
});

const response = await rana.chat('Hello!');
```
```

### 2. Create GitHub Release

```bash
# Tag the release
git tag v2.0.0
git push origin v2.0.0

# Create release on GitHub
# Go to: https://github.com/waymaker/rana/releases/new
# Tag: v2.0.0
# Title: RANA v2.0.0 - Full SDK Release
# Description: Copy from RELEASE_NOTES_V2.md
```

### 3. Update Documentation Site

- Add installation instructions
- Update examples
- Add API reference
- Update getting started guide

### 4. Announce on Social Media

Use materials from `LAUNCH_MATERIALS.md`:
- [ ] Twitter thread
- [ ] Product Hunt
- [ ] HackerNews
- [ ] Reddit
- [ ] Dev.to article
- [ ] Discord announcement

---

## 🐛 Troubleshooting

### Problem: "You do not have permission to publish"

**Solution:**
```bash
# Make sure you're logged in
npm whoami

# Make sure package is scoped correctly
# package.json should have: "name": "@rana/core"

# Publish with --access public
npm publish --access public
```

### Problem: "Version already exists"

**Solution:**
```bash
# Bump version
npm version patch

# Or manually edit package.json
# Then publish
```

### Problem: "Package name too similar to existing package"

**Solution:**
- Check if @rana org is claimed
- If not, claim it at https://www.npmjs.com/org/create
- Or use different scope: @rana-framework/core

### Problem: Build fails

**Solution:**
```bash
# Clear dist and node_modules
rm -rf dist node_modules

# Reinstall
npm install

# Rebuild
npm run build
```

---

## 📊 Package Analytics

After publishing, monitor:

### npm Stats
```
https://www.npmjs.com/package/@rana/core
https://www.npmjs.com/package/@rana/react
```

Track:
- Downloads per day/week/month
- Versions being used
- Dependents

### Useful Commands
```bash
# Check downloads
npm view @rana/core downloads

# Check version info
npm view @rana/core versions

# Check latest version
npm view @rana/core version
```

---

## 🔐 Security

### Enable 2FA

1. Go to https://www.npmjs.com/settings/account
2. Enable 2FA for:
   - Login
   - Publishing

### Audit Packages

```bash
cd packages/core
npm audit

cd packages/react
npm audit
```

Fix vulnerabilities:
```bash
npm audit fix
```

---

## 📋 Publishing Checklist

Use this before each publish:

```
Pre-Publish:
- [ ] All tests passing
- [ ] Build successful
- [ ] Version bumped
- [ ] CHANGELOG.md updated
- [ ] README.md updated
- [ ] No uncommitted changes

Publish:
- [ ] npm login verified
- [ ] npm publish --access public
- [ ] Verify on npmjs.com
- [ ] Test installation

Post-Publish:
- [ ] Git tag created
- [ ] GitHub release created
- [ ] Documentation updated
- [ ] Announcement posted
- [ ] Discord notification
```

---

## 🎯 First Time Publishing

If this is your first time publishing @rana packages:

```bash
# 1. Build both packages
cd packages/core && npm run build
cd ../react && npm run build

# 2. Publish core first
cd packages/core
npm publish --access public

# 3. Publish React
cd ../react
npm publish --access public

# 4. Test installation
mkdir /tmp/test && cd /tmp/test
npm install @rana/core @rana/react

# 5. Create GitHub release
git tag v2.0.0
git push origin v2.0.0

# 6. Announce!
# Use LAUNCH_MATERIALS.md
```

---

## ✅ Success Criteria

Your publish was successful if:

- ✅ Packages visible on npmjs.com
- ✅ `npm install @rana/core` works
- ✅ `npm install @rana/react` works
- ✅ TypeScript types resolve
- ✅ Examples run without errors
- ✅ No critical bugs reported in first 24 hours

---

## 📞 Support

If you run into issues:

1. Check npm status: https://status.npmjs.org
2. npm support docs: https://docs.npmjs.com
3. npm support: https://www.npmjs.com/support

---

**You're ready to publish! 🚀**

The packages are built, tested, and ready to go. Just follow the steps above and RANA will be live on npm!
