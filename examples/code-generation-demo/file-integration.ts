/**
 * File Integration Examples
 *
 * This example demonstrates how to use @rana/generate to intelligently
 * integrate generated files into an existing codebase.
 */

import {
  generate,
  analyzeCodebase,
  integrateFiles,
  FileIntegrator,
  type GeneratedFile,
} from '@rana/generate';

// ============================================================================
// Example 1: Analyze Existing Codebase
// ============================================================================

console.log('🔍 Example 1: Analyzing Existing Codebase\n');

async function analyzeProject() {
  const context = await analyzeCodebase('./my-next-app');

  console.log('Codebase Analysis:');
  console.log(`Framework: ${context.framework}`);
  console.log(`Dependencies: ${context.dependencies.length} packages`);
  console.log(`Components: ${context.existingComponents.length} found`);
  console.log(`Testing: ${context.testingFramework}`);
  console.log(`State Management: ${context.stateManagement}`);
  console.log(`\nStyle Guide:`);
  console.log(`  Indentation: ${context.styleGuide.indentation}`);
  console.log(`  Quotes: ${context.styleGuide.quotes}`);
  console.log(`  Semicolons: ${context.styleGuide.semicolons ? 'yes' : 'no'}`);
  console.log(`  Component Style: ${context.styleGuide.componentStyle}`);

  return context;
}

// ============================================================================
// Example 2: Smart File Placement
// ============================================================================

console.log('\n\n📁 Example 2: Smart File Placement\n');

async function demonstrateFilePlacement() {
  const context = await analyzeCodebase('./my-next-app');

  // Simulate generated files
  const files: GeneratedFile[] = [
    {
      path: 'UserProfile.tsx',
      content: `
'use client';

import { useState } from 'react';

export interface UserProfileProps {
  userId: string;
}

export function UserProfile({ userId }: UserProfileProps) {
  const [loading, setLoading] = useState(false);

  return (
    <div className="user-profile">
      <h2>User Profile</h2>
    </div>
  );
}

export default UserProfile;
      `.trim(),
      type: 'component',
      language: 'typescript',
    },
    {
      path: 'useAuth.ts',
      content: `
import { useState, useEffect } from 'react';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auth logic here
    setLoading(false);
  }, []);

  return { user, loading };
}
      `.trim(),
      type: 'util',
      language: 'typescript',
    },
    {
      path: 'route.ts',
      content: `
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Hello' });
}
      `.trim(),
      type: 'api',
      language: 'typescript',
    },
  ];

  const integrator = new FileIntegrator({
    framework: context.framework,
    autoImport: true,
    autoExport: true,
    resolveConflicts: 'ask',
  });

  const result = await integrator.integrate(files, context);

  console.log('File Placement Results:\n');
  result.placements.forEach(placement => {
    console.log(`File: ${placement.file.path}`);
    console.log(`  → Suggested Path: ${placement.path}`);
    console.log(`  → Type: ${placement.file.type}`);
    console.log(`  → Imports: ${placement.imports.join(', ')}`);
    console.log(`  → Exports: ${placement.exports.join(', ')}`);
    if (placement.modifications.length > 0) {
      console.log(`  → Modifications:`);
      placement.modifications.forEach(mod => {
        console.log(`     - ${mod.type} in ${mod.file}`);
      });
    }
    console.log('');
  });

  return result;
}

// ============================================================================
// Example 3: Conflict Detection
// ============================================================================

console.log('\n⚠️ Example 3: Conflict Detection\n');

async function detectConflicts() {
  const context = await analyzeCodebase('./my-next-app');

  // Simulate a file that conflicts with existing code
  const files: GeneratedFile[] = [
    {
      path: 'Button.tsx', // Assume this already exists
      content: 'export function Button() { return <button>Click me</button>; }',
      type: 'component',
      language: 'typescript',
    },
  ];

  const integrator = new FileIntegrator({
    resolveConflicts: 'rename', // auto-rename on conflict
  });

  const result = await integrator.integrate(files, context);

  console.log('Conflict Detection Results:\n');
  if (result.conflicts.length > 0) {
    result.conflicts.forEach(conflict => {
      console.log(`Conflict Type: ${conflict.type}`);
      console.log(`Path: ${conflict.path}`);
      console.log(`Resolution: ${conflict.resolution}`);
      console.log(`Message: ${conflict.message}`);
      console.log('');
    });
  } else {
    console.log('No conflicts detected!');
  }

  return result;
}

// ============================================================================
// Example 4: Integration Suggestions
// ============================================================================

console.log('\n💡 Example 4: Integration Suggestions\n');

async function getIntegrationSuggestions() {
  const context = await analyzeCodebase('./my-next-app');

  // Generate files with missing dependencies
  const files: GeneratedFile[] = [
    {
      path: 'DataTable.tsx',
      content: `
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { DataTable as ShadcnTable } from '@/components/ui/data-table';

export function DataTable() {
  const { data } = useQuery({ queryKey: ['data'], queryFn: fetchData });
  return <ShadcnTable data={data} />;
}
      `.trim(),
      type: 'component',
      language: 'typescript',
    },
  ];

  const result = await integrateFiles(files, context);

  console.log('Integration Suggestions:\n');
  result.suggestions.forEach((suggestion, i) => {
    console.log(`${i + 1}. ${suggestion}`);
  });

  return result;
}

// ============================================================================
// Example 5: Complete Integration Workflow
// ============================================================================

console.log('\n\n🚀 Example 5: Complete Integration Workflow\n');

async function completeWorkflow() {
  console.log('Step 1: Analyze codebase...');
  const context = await analyzeCodebase('./my-next-app');
  console.log(`✓ Detected ${context.framework} framework\n`);

  console.log('Step 2: Generate new feature...');
  const result = await generate('user authentication with OAuth', {
    cwd: './my-next-app',
    autoFix: true,
    includeTests: true,
  });
  console.log(`✓ Generated ${result.files.length} files\n`);

  console.log('Step 3: Integrate files...');
  const integration = await integrateFiles(result.files, context, {
    autoImport: true,
    autoExport: true,
    resolveConflicts: 'ask',
  });

  console.log(`✓ ${integration.placements.length} files ready to place`);
  console.log(`✓ ${integration.conflicts.length} conflicts detected`);
  console.log(`✓ ${integration.suggestions.length} suggestions\n`);

  console.log('File Placements:');
  integration.placements.forEach(p => {
    console.log(`  ${p.file.path} → ${p.path}`);
  });

  if (integration.conflicts.length > 0) {
    console.log('\nConflicts:');
    integration.conflicts.forEach(c => {
      console.log(`  ⚠️  ${c.message} (${c.resolution})`);
    });
  }

  if (integration.suggestions.length > 0) {
    console.log('\nSuggestions:');
    integration.suggestions.forEach(s => {
      console.log(`  💡 ${s}`);
    });
  }

  console.log('\n✅ Integration complete!');

  return integration;
}

// ============================================================================
// Example 6: Import Management
// ============================================================================

console.log('\n\n📦 Example 6: Smart Import Management\n');

function demonstrateImportManagement() {
  const messyCode = `
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { fetchData } from '../../../lib/api';
import { Card } from '@/components/ui/card';
import { z } from 'zod';

export function MyComponent() {
  const [state, setState] = useState();
  return <Card><Button>Click</Button></Card>;
}
  `.trim();

  const file: GeneratedFile = {
    path: 'MyComponent.tsx',
    content: messyCode,
    type: 'component',
    language: 'typescript',
  };

  const context = {
    framework: 'next' as const,
    fileStructure: { name: 'src', path: './src', type: 'directory' as const },
  } as any;

  const fixed = FileIntegrator.fixImports(file, context);

  console.log('Before:');
  console.log(messyCode);
  console.log('\nAfter:');
  console.log(fixed.content);
  console.log('\n✓ Removed duplicate imports');
  console.log('✓ Sorted external before internal');
  console.log('✓ Converted deep relative paths to aliases');
}

// ============================================================================
// Run All Examples
// ============================================================================

async function runAllExamples() {
  try {
    await analyzeProject();
    await demonstrateFilePlacement();
    await detectConflicts();
    await getIntegrationSuggestions();
    demonstrateImportManagement();
    await completeWorkflow();

    console.log('\n\n🎉 All examples completed successfully!');
    console.log('\nKey Features Demonstrated:');
    console.log('✅ Codebase analysis');
    console.log('✅ Framework-aware file placement');
    console.log('✅ Conflict detection & resolution');
    console.log('✅ Import/export management');
    console.log('✅ Dependency suggestions');
    console.log('✅ Auto-barrel exports');
    console.log('✅ Path alias conversion');

  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Uncomment to run
// runAllExamples();

export {
  analyzeProject,
  demonstrateFilePlacement,
  detectConflicts,
  getIntegrationSuggestions,
  demonstrateImportManagement,
  completeWorkflow,
};
