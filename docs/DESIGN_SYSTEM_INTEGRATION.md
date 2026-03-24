# Design System Integration with CoFounder

**How to enforce your design system with CoFounder quality gates**

---

## Quick Start

### 1. Configure Your Design System in `.cofounder.yml`

```yaml
standards:
  design_system:
    enabled: true
    name: "YourUI"
    components:
      path: "src/components/ui"
      required_imports:
        - "Button"
        - "Card"
        - "Input"
```

### 2. Run Design System Checks

```bash
# Check compliance
cofounder check-design-system

# See coverage report
cofounder design-coverage

# Auto-fix violations
cofounder design-violations --fix
```

### 3. Enforce in CI/CD

```yaml
# .github/workflows/ci.yml
- name: Design System Compliance
  run: |
    cofounder check-design-system
    cofounder design-coverage --threshold 90
```

---

## Configuration Options

### Full `.cofounder.yml` Design System Block

```yaml
design_system:
  # Enable/disable design system enforcement
  enabled: true

  # Your design system name
  name: "YourUI"
  version: "1.0.0"

  # Component library type
  library:
    type: "custom"  # or "shadcn", "chakra", "mantine", "mui"
    cli_command: "npx your-ui add"
    documentation: "https://ui.yoursite.com"

  # Where components live
  components:
    path: "src/components/ui"
    required_usage: true  # Enforce across entire project

    # Components that MUST be used
    required_imports:
      - "Button"
      - "Input"
      - "Card"
      - "Dialog"

  # Design tokens (your brand)
  style_tokens:
    colors:
      primary: "hsl(var(--primary))"
      secondary: "hsl(var(--secondary))"

    spacing:
      unit: "0.25rem"  # 4px grid

    typography:
      font_family:
        sans: "var(--font-sans)"

  # Accessibility requirements
  accessibility:
    wcag_level: "AA"
    contrast_ratio:
      normal_text: 4.5
      large_text: 3
```

---

## Quality Gates for Design Systems

### Pre-Implementation Gate

```yaml
quality_gates:
  pre_implementation:
    - name: "Check design system components"
      description: "Search design system before creating custom component"
      required: true
      check_command: |
        # Search for existing component
        find src/components/ui -name "*.tsx" | grep -i "$COMPONENT_NAME"
```

**What it does:**
- Forces devs/AI to check if component already exists
- Prevents duplicate components
- Encourages design system reuse

### Implementation Gate

```yaml
quality_gates:
  implementation:
    - name: "Use design system components only"
      description: "All UI must import from @/components/ui/*"
      required: true
      validation:
        - "No direct <button> with className"
        - "No direct <input> with className"
        - "No inline styles (style={{}})"
        - "All colors use CSS variables"
```

**What it does:**
- Blocks direct HTML elements with styling
- Enforces design system imports
- Prevents inline styles
- Requires CSS variables for colors

### Testing Gate

```yaml
quality_gates:
  testing:
    - name: "Accessibility audit"
      description: "Run axe-core accessibility tests"
      required: true
      tool: "jest-axe"
      command: "npm run a11y-audit"
```

**What it does:**
- Runs automated accessibility tests
- Ensures WCAG 2.1 compliance
- Checks color contrast, ARIA labels, keyboard nav

---

## Enforcement Rules

### Rule 1: No Direct HTML Elements

**❌ Blocked:**
```tsx
<button className="px-4 py-2 bg-blue-500">
  Click me
</button>
```

**✅ Required:**
```tsx
import { Button } from '@/components/ui/button';

<Button variant="default">
  Click me
</Button>
```

**How CoFounder enforces:**
- Searches code for `<button className=`
- Blocks commit if found
- Suggests design system component

---

### Rule 2: No Inline Styles

**❌ Blocked:**
```tsx
<div style={{ padding: '16px', backgroundColor: '#3B82F6' }}>
  Content
</div>
```

**✅ Required:**
```tsx
import { Card } from '@/components/ui/card';

<Card className="p-4 bg-primary">
  Content
</Card>
```

**How CoFounder enforces:**
- Regex search for `style={{`
- Blocks commit if found
- Suggests Tailwind classes or design system

---

### Rule 3: CSS Variables for Colors

**❌ Blocked:**
```tsx
className="bg-blue-500 text-white"
style={{ color: '#EF4444' }}
```

**✅ Required:**
```tsx
className="bg-primary text-primary-foreground"
className="text-destructive"
```

**How CoFounder enforces:**
- Searches for hex colors (#...), rgb(), hsl()
- Blocks hardcoded colors
- Requires `var(--color-name)` or Tailwind semantic classes

---

### Rule 4: 4px Grid Spacing

**❌ Blocked:**
```tsx
className="p-[15px]"  // Not multiple of 4
style={{ padding: '13px' }}
```

**✅ Required:**
```tsx
className="p-4"  // 16px (4 * 4)
className="p-3"  // 12px (3 * 4)
```

**How CoFounder enforces:**
- Checks spacing values
- Ensures multiples of 4 (4px grid)
- Suggests nearest valid value

---

## Coverage Tracking

### Coverage Report

```bash
cofounder design-coverage
```

**Output:**
```
Design System Coverage Report
=============================

Components Covered: 47/52 (90%)
Files Using Design System: 94%

Not Covered:
  - src/features/legacy/OldDashboard.tsx
  - src/features/admin/CustomButton.tsx
  - src/components/marketing/Hero.tsx

Violations:
  - 12 hardcoded colors
  - 5 inline styles
  - 3 direct <button> elements

Run 'cofounder design-violations' for details
```

### Set Coverage Threshold

```yaml
# .cofounder.yml
design_system:
  coverage:
    minimum: 90  # Require 90% coverage
    fail_below: true  # Fail CI if below threshold
```

---

## Auto-Fixing Violations

### Run Auto-Fix

```bash
# Show violations
cofounder design-violations

# Auto-fix what's possible
cofounder design-violations --fix
```

### What Gets Auto-Fixed

1. **Direct HTML → Design System**
   ```tsx
   // Before
   <button className="...">Click</button>

   // After (auto-fix adds import and converts)
   import { Button } from '@/components/ui/button';
   <Button>Click</Button>
   ```

2. **Hardcoded Colors → CSS Variables**
   ```tsx
   // Before
   className="bg-blue-500"

   // After
   className="bg-primary"
   ```

3. **Inline Styles → Tailwind**
   ```tsx
   // Before
   style={{ padding: '16px', margin: '8px' }}

   // After
   className="p-4 m-2"
   ```

### What Needs Manual Fix

- Complex custom components
- Non-standard spacing values
- Custom color requirements
- Third-party component wrappers

---

## Integration with Existing Design Systems

### Shadcn/ui

```yaml
design_system:
  library:
    type: "shadcn"
    cli_command: "npx shadcn-ui add"

  components:
    path: "src/components/ui"
    registry: "https://ui.shadcn.com/registry"
```

### Chakra UI

```yaml
design_system:
  library:
    type: "chakra"
    cli_command: "npm install @chakra-ui/react"

  components:
    path: "src/components"
    import_pattern: "@chakra-ui/react"
```

### Material UI (MUI)

```yaml
design_system:
  library:
    type: "mui"
    cli_command: "npm install @mui/material"

  components:
    import_pattern: "@mui/material"
```

### Custom Library

```yaml
design_system:
  library:
    type: "custom"
    name: "YourUI"
    cli_command: "npx your-ui add"
    documentation: "https://ui.yoursite.com"

  components:
    path: "src/components/ui"
```

---

## AI Assistant Integration

### Configure AI to Enforce Design System

Add to `.cofounder.yml`:

```yaml
ai_assistant:
  design_system_rules:
    - "ALWAYS search src/components/ui/ before creating new component"
    - "NEVER use <button>, <input>, <select> directly"
    - "ALWAYS import from @/components/ui/"
    - "NEVER use hardcoded colors (#..., rgb(), hsl())"
    - "ALWAYS use CSS variables (var(--...))"
    - "CHECK design system docs before building UI"

  example_correct_usage:
    button: |
      import { Button } from '@/components/ui/button';
      <Button variant="outline">Click</Button>

    form: |
      import { Input } from '@/components/ui/input';
      import { Label } from '@/components/ui/label';

      <div>
        <Label>Email</Label>
        <Input type="email" />
      </div>
```

**Result:** AI assistants (Claude, ChatGPT, etc.) will follow these rules automatically.

---

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/design-system.yml
name: Design System Compliance

on: [push, pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Dependencies
        run: pnpm install

      - name: Design System Check
        run: |
          cofounder check-design-system
          cofounder design-coverage --threshold 90
          cofounder design-violations

      - name: Accessibility Audit
        run: npm run a11y-audit
```

### Pre-Commit Hook

```bash
# .husky/pre-commit
#!/bin/sh

# Check design system compliance
cofounder check-design-system || exit 1

# Check coverage threshold
cofounder design-coverage --threshold 85 || exit 1
```

### Pre-Push Hook

```bash
# .husky/pre-push
#!/bin/sh

# Full design system audit
cofounder check-design-system --strict

# Accessibility tests
npm run a11y-audit
```

---

## Examples

### Example 1: Enforcing Button Usage

**`.cofounder.yml`:**
```yaml
design_system:
  components:
    required_imports:
      - "Button"

quality_gates:
  implementation:
    - name: "Use design system Button"
      validation:
        - "No <button> with className"
```

**Blocked code:**
```tsx
<button className="px-4 py-2 bg-primary">
  Click
</button>
```

**CoFounder output:**
```
❌ Design System Violation

File: src/features/Dashboard.tsx:42
Rule: no-direct-html-button
Message: Use <Button> from '@/components/ui/button' instead

Autofix:
  import { Button } from '@/components/ui/button';
  <Button>Click</Button>
```

---

### Example 2: Color Consistency

**`.cofounder.yml`:**
```yaml
design_system:
  style_tokens:
    colors:
      primary: "hsl(var(--primary))"
      success: "hsl(var(--success))"

quality_gates:
  implementation:
    - name: "No hardcoded colors"
      validation:
        - "All colors use CSS variables"
```

**Blocked code:**
```tsx
<div className="bg-blue-500 text-white">
  Success!
</div>
```

**CoFounder output:**
```
❌ Design System Violation

File: src/features/Success.tsx:12
Rule: no-hardcoded-colors
Message: Use semantic color: bg-success text-success-foreground

Autofix:
  <div className="bg-success text-success-foreground">
    Success!
  </div>
```

---

### Example 3: Spacing Grid

**`.cofounder.yml`:**
```yaml
design_system:
  style_tokens:
    spacing:
      unit: "0.25rem"  # 4px grid

quality_gates:
  implementation:
    - name: "4px spacing grid"
      validation:
        - "Spacing must be multiples of 4"
```

**Blocked code:**
```tsx
<div className="p-[15px] m-[13px]">
  Content
</div>
```

**CoFounder output:**
```
❌ Design System Violation

File: src/components/Card.tsx:8
Rule: spacing-consistency
Message: 15px is not a multiple of 4. Use 16px (p-4) or 12px (p-3)

Autofix:
  <div className="p-4 m-3">  # 16px padding, 12px margin
    Content
  </div>
```

---

## Advanced: Custom Rules

### Create Custom Design System Rule

```typescript
// packages/core/src/design-system/rules/no-magic-numbers.ts
import type { DesignSystemRule } from '../types';

export const noMagicNumbers: DesignSystemRule = {
  name: 'no-magic-numbers',
  description: 'Use design token constants instead of magic numbers',
  severity: 'error',

  check(file, content) {
    const violations = [];
    const lines = content.split('\n');

    lines.forEach((line, i) => {
      // Check for hardcoded pixel values
      const match = line.match(/(\d+)px/g);
      if (match) {
        violations.push({
          file,
          line: i + 1,
          message: `Use design token instead of ${match[0]}`,
          autofix: suggestDesignToken(match[0]),
        });
      }
    });

    return violations;
  },
};

function suggestDesignToken(value: string): string {
  const num = parseInt(value);
  const spacing = Math.round(num / 4);  // Convert to 4px grid
  return `spacing.${spacing}`;  // e.g., "spacing.4" for 16px
}
```

### Register Custom Rule

```typescript
// .cofounder/custom-rules.ts
import { DesignSystemChecker } from '@waymakerai/aicofounder-core';
import { noMagicNumbers } from './rules/no-magic-numbers';

const checker = new DesignSystemChecker(config);
checker.addRule(noMagicNumbers);
```

---

## Summary

### What You Get

✅ **Automated enforcement** - No manual code reviews for design system
✅ **Consistency** - 100% design system coverage
✅ **Auto-fixing** - Many violations auto-fix
✅ **Coverage tracking** - See exactly what's not compliant
✅ **CI/CD integration** - Block bad code before merge
✅ **AI assistant support** - Claude/ChatGPT follow rules

### Next Steps

1. **Configure**: Copy `templates/cofounder-custom-design-system.yml`
2. **Enable**: Set `design_system.enabled: true`
3. **Run check**: `cofounder check-design-system`
4. **Fix violations**: `cofounder design-violations --fix`
5. **Add to CI**: GitHub Actions workflow
6. **Monitor coverage**: Track over time

---

**Questions?**
- **Docs**: https://cofounder.cx/docs/design-systems
- **Email**: support@waymaker.cx
- **Discord**: https://discord.gg/cofounder

---

**Built with CoFounder** 🚀
