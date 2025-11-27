# Creating Your Own Component Library (Shadcn-Style)

**A complete guide to building a production-ready, copy-paste component library like shadcn/ui**

---

## Why Build Your Own?

**Shadcn/ui's Success Formula:**
- ✅ You own the code (copy-paste, not installed)
- ✅ Fully customizable (no version lock-in)
- ✅ Built on primitives (Radix UI)
- ✅ Accessible by default (WCAG 2.1)
- ✅ Beautiful defaults (Tailwind)
- ✅ CLI for easy installation

**Your Custom Library Wins:**
- ✅ Perfect for your brand
- ✅ Enforces your design system
- ✅ Your custom utilities/hooks
- ✅ Your business logic patterns
- ✅ Can monetize/white-label

---

## Architecture Overview

```
your-design-system/
├── packages/
│   ├── core/              # Base components (headless)
│   ├── ui/                # Styled components
│   ├── cli/               # Installation CLI
│   ├── primitives/        # Low-level building blocks
│   └── hooks/             # Shared React hooks
├── apps/
│   ├── docs/              # Documentation site (Nextra/Docusaurus)
│   └── playground/        # Interactive component preview
├── templates/
│   └── component.tsx      # Template for new components
└── registry/
    └── components.json    # Component metadata
```

---

## Step 1: Core Architecture (Headless Components)

### Design Principles

1. **Composition over Configuration**
2. **Unstyled Primitives**
3. **Accessibility First**
4. **Minimal Dependencies**

### Example: Base Button Component

```tsx
// packages/core/src/button/button.tsx
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp ref={ref} {...props} />;
  }
);

Button.displayName = 'Button';

export { Button };
```

### Why This Works

- **`asChild`**: Allows composition (merge props with child)
- **`forwardRef`**: Ref forwarding for DOM access
- **Minimal API**: Just extends native HTML attributes
- **No styling**: Pure logic/structure

---

## Step 2: Styled Components (Your Design System)

### Design Tokens System

```tsx
// packages/ui/src/design-tokens.ts
export const tokens = {
  colors: {
    // Semantic colors
    primary: {
      50: '#fef2f2',
      100: '#fee2e2',
      // ... up to 950
      DEFAULT: '#ef4444',
    },
    // Component-specific
    button: {
      primary: 'var(--color-primary-500)',
      secondary: 'var(--color-gray-500)',
    },
  },

  spacing: {
    xs: '0.5rem',    // 8px
    sm: '0.75rem',   // 12px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
  },

  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
    },
  },

  borderRadius: {
    none: '0',
    sm: '0.125rem',
    DEFAULT: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },

  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },

  animation: {
    durations: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easings: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
} as const;
```

### Component Variants with CVA (Class Variance Authority)

```tsx
// packages/ui/src/button/button.tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Button as ButtonPrimitive } from '@yourlib/core';
import { cn } from '../utils';

const buttonVariants = cva(
  // Base styles (always applied)
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary-500 text-white hover:bg-primary-600 focus-visible:ring-primary-500',
        destructive: 'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500',
        outline: 'border-2 border-gray-300 bg-transparent hover:bg-gray-100 focus-visible:ring-gray-500',
        ghost: 'hover:bg-gray-100 focus-visible:ring-gray-500',
        link: 'text-primary-500 underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-11 px-8 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <ButtonPrimitive
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        asChild={asChild}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
```

### Utility: `cn()` (ClassNames Helper)

```tsx
// packages/ui/src/utils/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes properly
 * Handles conflicts (e.g., "p-4 p-2" → "p-2")
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## Step 3: CLI for Installation

### CLI Architecture

```
packages/cli/
├── src/
│   ├── commands/
│   │   ├── init.ts          # Initialize config
│   │   ├── add.ts           # Add components
│   │   └── diff.ts          # Show changes
│   ├── utils/
│   │   ├── registry.ts      # Fetch components
│   │   ├── templates.ts     # Code generation
│   │   └── transformers.ts  # AST manipulation
│   └── index.ts
```

### Component Registry

```json
// registry/components.json
{
  "button": {
    "name": "button",
    "type": "ui",
    "dependencies": ["@radix-ui/react-slot"],
    "devDependencies": ["@types/react"],
    "registryDependencies": [],
    "files": [
      {
        "path": "ui/button.tsx",
        "content": "...",
        "type": "component"
      }
    ]
  },
  "card": {
    "name": "card",
    "type": "ui",
    "dependencies": [],
    "registryDependencies": ["button"],
    "files": [
      {
        "path": "ui/card.tsx",
        "content": "...",
        "type": "component"
      }
    ]
  }
}
```

### CLI Commands

```typescript
// packages/cli/src/commands/add.ts
import { Command } from 'commander';
import prompts from 'prompts';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';

export const add = new Command()
  .name('add')
  .description('Add components to your project')
  .argument('[components...]', 'Components to add')
  .option('-a, --all', 'Add all components')
  .option('-o, --overwrite', 'Overwrite existing files')
  .action(async (components: string[], options) => {
    const spinner = ora();

    // 1. Load project config
    const config = await loadConfig();
    if (!config) {
      console.error('No config found. Run `init` first.');
      return;
    }

    // 2. Resolve components (with dependencies)
    const resolved = await resolveComponents(components);

    // 3. Confirm installation
    const { confirm } = await prompts({
      type: 'confirm',
      name: 'confirm',
      message: `Install ${resolved.length} component(s)?`,
      initial: true,
    });

    if (!confirm) return;

    // 4. Install dependencies
    spinner.start('Installing dependencies...');
    await installDependencies(resolved);
    spinner.succeed();

    // 5. Copy files
    for (const component of resolved) {
      spinner.start(`Installing ${component.name}...`);

      const targetPath = path.join(
        config.componentsPath,
        component.path
      );

      // Transform imports if needed
      const transformed = transformImports(component.content, config);

      await fs.ensureDir(path.dirname(targetPath));
      await fs.writeFile(targetPath, transformed);

      spinner.succeed(`Installed ${component.name}`);
    }

    console.log('\n✅ Components installed successfully!');
  });
```

### Example Usage

```bash
# Initialize
npx your-ui init

# Add single component
npx your-ui add button

# Add multiple
npx your-ui add button card dialog

# Add all
npx your-ui add --all

# Show what changed
npx your-ui diff button
```

---

## Step 4: Accessibility (WCAG 2.1 AA)

### Accessibility Checklist per Component

```tsx
// Example: Accessible Button
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        aria-disabled={disabled}
        // Ensure focus is visible
        className="focus-visible:ring-2"
        // Keyboard support (native <button> handles this)
        {...props}
      >
        {children}
      </button>
    );
  }
);
```

### Use Radix UI Primitives

Radix handles complex accessibility:

```tsx
// Dialog with proper focus management, escape key, etc.
import * as Dialog from '@radix-ui/react-dialog';

const MyDialog = () => (
  <Dialog.Root>
    <Dialog.Trigger>Open</Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay />
      <Dialog.Content>
        <Dialog.Title>Title</Dialog.Title>
        <Dialog.Description>Description</Dialog.Description>
        <Dialog.Close>Close</Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
);
```

### Automated A11y Testing

```typescript
// packages/ui/src/__tests__/button.test.tsx
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Button } from '../button';

describe('Button Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

---

## Step 5: Documentation Site

### Recommended Stack

- **Framework**: Nextra (Next.js + MDX) or Docusaurus
- **Preview**: Live component playground (Sandpack/CodeSandbox)
- **Search**: Algolia DocSearch
- **Hosting**: Vercel

### Documentation Structure

```
apps/docs/
├── pages/
│   ├── docs/
│   │   ├── installation.mdx
│   │   ├── components/
│   │   │   ├── button.mdx
│   │   │   ├── card.mdx
│   │   │   └── dialog.mdx
│   │   ├── hooks/
│   │   │   ├── use-toast.mdx
│   │   │   └── use-media-query.mdx
│   │   └── theming.mdx
│   └── examples/
│       ├── dashboard.mdx
│       └── auth-pages.mdx
```

### Component Page Template

```mdx
---
title: Button
description: Displays a button or a component that looks like a button.
---

import { Button } from '@yourlib/ui';

# Button

<ComponentPreview>
  <Button>Click me</Button>
</ComponentPreview>

## Installation

```bash
npx your-ui add button
```

## Usage

```tsx
import { Button } from '@/components/ui/button';

export default function MyPage() {
  return <Button variant="outline">Click me</Button>;
}
```

## Variants

<ComponentPreview>
  <div className="flex gap-2">
    <Button variant="default">Default</Button>
    <Button variant="destructive">Destructive</Button>
    <Button variant="outline">Outline</Button>
    <Button variant="ghost">Ghost</Button>
    <Button variant="link">Link</Button>
  </div>
</ComponentPreview>

## API Reference

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `default \| destructive \| outline \| ghost \| link` | `default` | Button style variant |
| size | `sm \| md \| lg \| icon` | `md` | Button size |
| asChild | `boolean` | `false` | Render as child element |

## Examples

### With Icon

<ComponentPreview>
  <Button>
    <Mail className="mr-2 h-4 w-4" />
    Send Email
  </Button>
</ComponentPreview>

### Loading State

<ComponentPreview>
  <Button disabled>
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
    Loading...
  </Button>
</ComponentPreview>
```

---

## Step 6: RANA Integration

### Add to `.rana.yml`

```yaml
design_system:
  enabled: true
  library: "your-ui"
  cli_command: "npx your-ui add"

  # Enforce component usage
  components:
    path: "src/components/ui"
    required_usage: true  # Must use from design system

  # Component patterns
  patterns:
    button: "@/components/ui/button"
    card: "@/components/ui/card"
    dialog: "@/components/ui/dialog"

  # Style enforcement
  style_tokens:
    colors:
      primary: "hsl(var(--primary))"
      secondary: "hsl(var(--secondary))"
    spacing:
      unit: "0.25rem"  # 4px
    typography:
      font_family: "var(--font-sans)"

quality_gates:
  pre_implementation:
    - name: "Check design system component exists"
      description: "Verify component is in design system before building custom"
      required: true

  implementation:
    - name: "Use design system components"
      description: "All UI must use @/components/ui/* imports"
      required: true
      check: |
        # No direct Tailwind in business logic components
        grep -r "className=" src/features/ && exit 1 || exit 0
```

### RANA CLI Integration

```typescript
// packages/cli/src/commands/check.ts
import { Command } from 'commander';
import { glob } from 'glob';
import fs from 'fs';

export const check = new Command()
  .name('check')
  .description('Check design system compliance')
  .action(async () => {
    const config = await loadRanaConfig();

    // 1. Check all components are from design system
    const files = await glob('src/**/*.tsx');
    const violations = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');

      // Check for direct <button> instead of <Button>
      if (content.match(/<button[^>]*className=/)) {
        violations.push({
          file,
          message: 'Use <Button> from design system instead of <button>',
        });
      }

      // Check for inline Tailwind in features/
      if (file.includes('features/') && content.includes('className="')) {
        violations.push({
          file,
          message: 'Extract styles to design system component',
        });
      }
    }

    if (violations.length > 0) {
      console.error('❌ Design system violations found:\n');
      violations.forEach(v => {
        console.error(`  ${v.file}: ${v.message}`);
      });
      process.exit(1);
    }

    console.log('✅ All design system checks passed');
  });
```

---

## Step 7: Monetization Strategies

### 1. **Free Core + Paid Premium** (Shadcn Model)

- **Free**: Basic components (MIT)
- **Pro ($29/mo)**: Advanced components, templates, Figma kit
- **Teams ($99/seat/year)**: Private registry, custom themes

### 2. **Free Library + Paid Services**

- **Free**: All components
- **Implementation**: $5K-$25K (we build with your library)
- **Custom Components**: $500-$2K per component
- **Support**: $2K-$10K/year

### 3. **White Label for Agencies**

- **License**: $299-$999/year per agency
- **Unlimited client projects**
- **Remove branding**
- **Priority support**

### 4. **Enterprise**

- **Custom**: $25K-$150K
- **On-premise component registry**
- **Design system consulting**
- **Training for teams**

---

## Timeline & Effort

### MVP (4-6 weeks)

**Week 1-2: Core**
- [ ] 10 base components (button, input, card, dialog, dropdown, etc.)
- [ ] Design tokens system
- [ ] Accessibility testing setup

**Week 3-4: CLI**
- [ ] Component registry
- [ ] `init` and `add` commands
- [ ] Dependency resolution

**Week 5-6: Documentation**
- [ ] Nextra site setup
- [ ] Component documentation
- [ ] Live playground

### Full Production (3-4 months)

**Month 1: Foundation**
- All MVP items
- 20+ components
- Full accessibility audit

**Month 2: Polish**
- Dark mode support
- Animation system
- Advanced components (data table, calendar, etc.)

**Month 3: Ecosystem**
- Figma design kit
- VS Code extension (autocomplete)
- Storybook integration

**Month 4: Distribution**
- NPM packages (optional)
- Template gallery
- Video tutorials

---

## Tech Stack Recommendation

```json
{
  "core": {
    "react": "^18.2.0",
    "@radix-ui/react-*": "latest",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0"
  },
  "cli": {
    "commander": "^11.0.0",
    "prompts": "^2.4.2",
    "ora": "^7.0.0",
    "chalk": "^5.3.0",
    "execa": "^8.0.0"
  },
  "docs": {
    "nextra": "^2.13.0",
    "next": "^14.0.0",
    "sandpack": "^2.13.0"
  },
  "testing": {
    "vitest": "^1.0.0",
    "jest-axe": "^8.0.0",
    "@testing-library/react": "^14.0.0"
  }
}
```

---

## Comparison: Your Library vs Shadcn

| Feature | Shadcn/ui | Your Library |
|---------|-----------|--------------|
| **Ownership** | Users own code | ✅ Users own code |
| **Customization** | Full | ✅ Full |
| **Components** | ~50 | 🎯 Your choice |
| **Design** | Generic | ✅ **Your brand** |
| **Business logic** | Generic | ✅ **Your patterns** |
| **Monetization** | None | ✅ **Unlimited** |
| **RANA integration** | Manual | ✅ **Built-in** |
| **White label** | No | ✅ **Yes** |

---

## Next Steps

### Option 1: Quick Start (Use This Template)

```bash
# Clone RANA component library starter
git clone https://github.com/waymaker-ai/rana-component-library
cd rana-component-library

# Customize
npm run customize

# Build first component
npm run create-component button

# Test
npm run dev
```

### Option 2: From Scratch

1. **Week 1**: Set up monorepo structure
2. **Week 2**: Build 5 core components
3. **Week 3**: Build CLI (init + add)
4. **Week 4**: Documentation site
5. **Month 2**: Scale to 20+ components
6. **Month 3**: Launch beta

### Option 3: RANA Does It For You

If you want RANA to build this for you:

```bash
# Generate complete component library
rana generate:library --name "YourUI" --brand your-brand

# AI builds:
# - All base components
# - CLI tool
# - Documentation site
# - Figma kit
# - RANA integration
```

---

## Resources

### Learn From The Best

- **Shadcn/ui**: https://ui.shadcn.com
- **Radix UI**: https://radix-ui.com
- **Chakra UI**: https://chakra-ui.com
- **Mantine**: https://mantine.dev

### Tools

- **CVA**: https://cva.style
- **Tailwind Merge**: https://github.com/dcastil/tailwind-merge
- **Nextra**: https://nextra.site
- **Changesets**: https://github.com/changesets/changesets

---

## Questions?

Want help building your component library? Let's chat:
- **Email**: support@waymaker.cx
- **Twitter**: @waymaker_ai
- **Discord**: https://discord.gg/rana

---

**Built with RANA** 🚀
