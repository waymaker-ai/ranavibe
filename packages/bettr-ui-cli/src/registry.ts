/**
 * Component Registry
 * Metadata for all available Bettr UI components
 */

export interface ComponentFile {
  path: string;
  content: string;
  type: 'component' | 'util' | 'type';
}

export interface ComponentMetadata {
  name: string;
  description: string;
  dependencies: string[];
  devDependencies: string[];
  registryDependencies: string[];
  files: ComponentFile[];
}

export const REGISTRY: Record<string, ComponentMetadata> = {
  'glass-card': {
    name: 'glass-card',
    description: 'Beautiful glass morphism card component with multiple variants',
    dependencies: ['class-variance-authority', 'clsx', 'tailwind-merge'],
    devDependencies: [],
    registryDependencies: [],
    files: [
      {
        path: 'components/ui/glass-card.tsx',
        content: '', // Will be populated from actual file
        type: 'component',
      },
    ],
  },
  'gradient-button': {
    name: 'gradient-button',
    description: 'Gradient button with multiple color variants and animations',
    dependencies: ['class-variance-authority', 'clsx', 'tailwind-merge'],
    devDependencies: [],
    registryDependencies: [],
    files: [
      {
        path: 'components/ui/gradient-button.tsx',
        content: '',
        type: 'component',
      },
    ],
  },
  'icon-circle': {
    name: 'icon-circle',
    description: 'Circular icon container with gradient backgrounds',
    dependencies: ['class-variance-authority', 'clsx', 'tailwind-merge'],
    devDependencies: [],
    registryDependencies: [],
    files: [
      {
        path: 'components/ui/icon-circle.tsx',
        content: '',
        type: 'component',
      },
    ],
  },
  'feature-badge': {
    name: 'feature-badge',
    description: 'Badge component for highlighting features',
    dependencies: ['class-variance-authority', 'clsx', 'tailwind-merge'],
    devDependencies: [],
    registryDependencies: [],
    files: [
      {
        path: 'components/ui/feature-badge.tsx',
        content: '',
        type: 'component',
      },
    ],
  },
  'clean-mode-card': {
    name: 'clean-mode-card',
    description: 'Minimal, clean card component for focused interfaces',
    dependencies: ['class-variance-authority', 'clsx', 'tailwind-merge'],
    devDependencies: [],
    registryDependencies: [],
    files: [
      {
        path: 'components/ui/clean-mode-card.tsx',
        content: '',
        type: 'component',
      },
    ],
  },
  utils: {
    name: 'utils',
    description: 'Utility functions (cn helper for merging Tailwind classes)',
    dependencies: ['clsx', 'tailwind-merge'],
    devDependencies: [],
    registryDependencies: [],
    files: [
      {
        path: 'lib/utils.ts',
        content: '',
        type: 'util',
      },
    ],
  },
};

export function getComponent(name: string): ComponentMetadata | undefined {
  return REGISTRY[name];
}

export function getAllComponents(): ComponentMetadata[] {
  return Object.values(REGISTRY);
}

export function resolveComponentDependencies(name: string): string[] {
  const component = getComponent(name);
  if (!component) return [];

  const deps: Set<string> = new Set([name]);

  // Resolve registry dependencies recursively
  for (const dep of component.registryDependencies) {
    const subDeps = resolveComponentDependencies(dep);
    subDeps.forEach((d) => deps.add(d));
  }

  return Array.from(deps);
}
