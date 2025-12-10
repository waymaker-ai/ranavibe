/**
 * Advanced Code Generation Templates
 * Additional templates for common patterns
 */

import { Template } from '../types';

// ============================================================================
// API & BACKEND TEMPLATES
// ============================================================================

export const apiRouteTemplate: Template = {
  id: 'next-api-route',
  name: 'Next.js API Route Handler',
  description: 'Type-safe API route with Zod validation and error handling',
  category: 'api',
  framework: ['next'],
  tags: ['api', 'rest', 'validation', 'error-handling'],
  code: `import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Request validation schema
const {{requestSchema}}Schema = z.object({
  // Define your request body schema
  {{fields}}
});

// Response type
interface {{responseType}} {
  success: boolean;
  data?: unknown;
  error?: string;
}

// Validation helper
function validateRequest<T extends z.ZodSchema>(
  schema: T,
  data: unknown
): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(result.error.issues[0].message);
  }
  return result.data;
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

// GET handler
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Your logic here
    const data = { id, message: 'Success' };

    return NextResponse.json<{{responseType}}>({
      success: true,
      data,
    });
  } catch (error) {
    return handleError(error);
  }
}

// POST handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = validateRequest({{requestSchema}}Schema, body);

    // Your logic here
    const result = { ...validated, createdAt: new Date() };

    return NextResponse.json<{{responseType}}>(
      { success: true, data: result },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}

// Error handler
function handleError(error: unknown): NextResponse<{{responseType}}> {
  console.error('API Error:', error);

  if (error instanceof ValidationError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }

  if (error instanceof NotFoundError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 404 }
    );
  }

  return NextResponse.json(
    { success: false, error: 'Internal server error' },
    { status: 500 }
  );
}
`,
  variables: ['requestSchema', 'responseType', 'fields'],
  dependencies: ['zod'],
};

export const serverActionTemplate: Template = {
  id: 'next-server-action',
  name: 'Next.js Server Action',
  description: 'Type-safe server action with form validation',
  category: 'api',
  framework: ['next'],
  tags: ['server-action', 'form', 'validation'],
  code: `'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Validation schema
const {{actionName}}Schema = z.object({
  {{fields}}
});

// Action state type
export interface {{actionName}}State {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  data?: unknown;
}

export async function {{actionName}}(
  prevState: {{actionName}}State | null,
  formData: FormData
): Promise<{{actionName}}State> {
  // Parse form data
  const rawData = Object.fromEntries(formData);

  // Validate
  const validation = {{actionName}}Schema.safeParse(rawData);

  if (!validation.success) {
    return {
      success: false,
      message: 'Validation failed',
      errors: validation.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    // Your logic here
    const result = await process{{actionName}}(validation.data);

    // Revalidate and redirect if needed
    revalidatePath('/{{path}}');

    return {
      success: true,
      message: '{{successMessage}}',
      data: result,
    };
  } catch (error) {
    console.error('Action error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}

// Internal processing function
async function process{{actionName}}(data: z.infer<typeof {{actionName}}Schema>) {
  // Implement your business logic here
  return data;
}
`,
  variables: ['actionName', 'fields', 'path', 'successMessage'],
  dependencies: ['zod'],
};

// ============================================================================
// STATE MANAGEMENT TEMPLATES
// ============================================================================

export const zustandStoreTemplate: Template = {
  id: 'zustand-store',
  name: 'Zustand Store',
  description: 'Type-safe Zustand store with persist and devtools',
  category: 'state',
  framework: ['react', 'next'],
  tags: ['zustand', 'state-management', 'persist'],
  code: `import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// State interface
interface {{storeName}}State {
  // State properties
  {{stateProperties}}
  isLoading: boolean;
  error: string | null;
}

// Actions interface
interface {{storeName}}Actions {
  // Action methods
  {{actionMethods}}
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// Combined store type
type {{storeName}}Store = {{storeName}}State & {{storeName}}Actions;

// Initial state
const initial{{storeName}}State: {{storeName}}State = {
  {{initialState}}
  isLoading: false,
  error: null,
};

// Create store
export const use{{storeName}}Store = create<{{storeName}}Store>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initial{{storeName}}State,

        // Action implementations
        {{actionImplementations}}

        setLoading: (loading) => set({ isLoading: loading }),

        setError: (error) => set({ error }),

        reset: () => set(initial{{storeName}}State),
      })),
      {
        name: '{{storeName}}-storage',
        partialize: (state) => ({
          // Only persist specific fields
          {{persistFields}}
        }),
      }
    ),
    { name: '{{storeName}}' }
  )
);

// Selector hooks for optimized re-renders
export const use{{storeName}}Loading = () =>
  use{{storeName}}Store((state) => state.isLoading);

export const use{{storeName}}Error = () =>
  use{{storeName}}Store((state) => state.error);
`,
  variables: [
    'storeName',
    'stateProperties',
    'actionMethods',
    'initialState',
    'actionImplementations',
    'persistFields',
  ],
  dependencies: ['zustand', 'immer'],
};

export const contextProviderTemplate: Template = {
  id: 'react-context',
  name: 'React Context Provider',
  description: 'Type-safe context with provider and custom hook',
  category: 'state',
  framework: ['react', 'next'],
  tags: ['context', 'provider', 'hooks'],
  code: `'use client';

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';

// State type
interface {{contextName}}State {
  {{stateFields}}
}

// Action types
type {{contextName}}Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' }
  {{additionalActions}};

// Context value type
interface {{contextName}}ContextValue {
  state: {{contextName}}State;
  // Action dispatchers
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  {{additionalMethods}}
}

// Initial state
const initial{{contextName}}State: {{contextName}}State = {
  {{initialState}}
};

// Create context
const {{contextName}}Context = createContext<{{contextName}}ContextValue | null>(null);

// Reducer
function {{contextName}}Reducer(
  state: {{contextName}}State,
  action: {{contextName}}Action
): {{contextName}}State {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'RESET':
      return initial{{contextName}}State;
    {{additionalCases}}
    default:
      return state;
  }
}

// Provider component
interface {{contextName}}ProviderProps {
  children: ReactNode;
  initialValue?: Partial<{{contextName}}State>;
}

export function {{contextName}}Provider({
  children,
  initialValue,
}: {{contextName}}ProviderProps) {
  const [state, dispatch] = useReducer(
    {{contextName}}Reducer,
    { ...initial{{contextName}}State, ...initialValue }
  );

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  {{additionalMethodImplementations}}

  const value = useMemo<{{contextName}}ContextValue>(
    () => ({
      state,
      setLoading,
      setError,
      reset,
      {{additionalMethodsInValue}}
    }),
    [state]
  );

  return (
    <{{contextName}}Context.Provider value={value}>
      {children}
    </{{contextName}}Context.Provider>
  );
}

// Custom hook
export function use{{contextName}}() {
  const context = useContext({{contextName}}Context);

  if (!context) {
    throw new Error(
      'use{{contextName}} must be used within a {{contextName}}Provider'
    );
  }

  return context;
}

// Selector hooks for optimized components
export function use{{contextName}}State<T>(
  selector: (state: {{contextName}}State) => T
): T {
  const { state } = use{{contextName}}();
  return selector(state);
}
`,
  variables: [
    'contextName',
    'stateFields',
    'initialState',
    'additionalActions',
    'additionalMethods',
    'additionalCases',
    'additionalMethodImplementations',
    'additionalMethodsInValue',
  ],
  dependencies: [],
};

// ============================================================================
// DATA FETCHING TEMPLATES
// ============================================================================

export const tanstackQueryTemplate: Template = {
  id: 'tanstack-query',
  name: 'TanStack Query Hook',
  description: 'Custom hook with TanStack Query for data fetching',
  category: 'data',
  framework: ['react', 'next'],
  tags: ['tanstack-query', 'data-fetching', 'hooks', 'cache'],
  code: `import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from '@tanstack/react-query';

// Types
interface {{entityName}} {
  id: string;
  {{entityFields}}
}

interface Create{{entityName}}Input {
  {{createFields}}
}

interface Update{{entityName}}Input {
  id: string;
  {{updateFields}}
}

// Query keys
export const {{entityName}}Keys = {
  all: ['{{entityName}}'] as const,
  lists: () => [...{{entityName}}Keys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) =>
    [...{{entityName}}Keys.lists(), filters] as const,
  details: () => [...{{entityName}}Keys.all, 'detail'] as const,
  detail: (id: string) => [...{{entityName}}Keys.details(), id] as const,
};

// API functions
const api = {
  async getAll(filters?: Record<string, unknown>): Promise<{{entityName}}[]> {
    const params = new URLSearchParams(filters as Record<string, string>);
    const response = await fetch(\`/api/{{apiPath}}?\${params}\`);
    if (!response.ok) throw new Error('Failed to fetch');
    return response.json();
  },

  async getById(id: string): Promise<{{entityName}}> {
    const response = await fetch(\`/api/{{apiPath}}/\${id}\`);
    if (!response.ok) throw new Error('Failed to fetch');
    return response.json();
  },

  async create(input: Create{{entityName}}Input): Promise<{{entityName}}> {
    const response = await fetch('/api/{{apiPath}}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error('Failed to create');
    return response.json();
  },

  async update({ id, ...input }: Update{{entityName}}Input): Promise<{{entityName}}> {
    const response = await fetch(\`/api/{{apiPath}}/\${id}\`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error('Failed to update');
    return response.json();
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(\`/api/{{apiPath}}/\${id}\`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete');
  },
};

// Hooks
export function use{{entityName}}List(
  filters?: Record<string, unknown>,
  options?: Omit<UseQueryOptions<{{entityName}}[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: {{entityName}}Keys.list(filters || {}),
    queryFn: () => api.getAll(filters),
    ...options,
  });
}

export function use{{entityName}}(
  id: string,
  options?: Omit<UseQueryOptions<{{entityName}}>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: {{entityName}}Keys.detail(id),
    queryFn: () => api.getById(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreate{{entityName}}(
  options?: UseMutationOptions<{{entityName}}, Error, Create{{entityName}}Input>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: {{entityName}}Keys.lists() });
    },
    ...options,
  });
}

export function useUpdate{{entityName}}(
  options?: UseMutationOptions<{{entityName}}, Error, Update{{entityName}}Input>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.update,
    onSuccess: (data) => {
      queryClient.setQueryData({{entityName}}Keys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: {{entityName}}Keys.lists() });
    },
    ...options,
  });
}

export function useDelete{{entityName}}(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.delete,
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: {{entityName}}Keys.detail(id) });
      queryClient.invalidateQueries({ queryKey: {{entityName}}Keys.lists() });
    },
    ...options,
  });
}
`,
  variables: [
    'entityName',
    'entityFields',
    'createFields',
    'updateFields',
    'apiPath',
  ],
  dependencies: ['@tanstack/react-query'],
};

// ============================================================================
// TESTING TEMPLATES
// ============================================================================

export const vitestComponentTemplate: Template = {
  id: 'vitest-component',
  name: 'Vitest Component Test',
  description: 'Component test with Vitest and Testing Library',
  category: 'test',
  framework: ['react', 'next'],
  tags: ['vitest', 'testing-library', 'unit-test'],
  code: `import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { {{componentName}} } from './{{componentName}}';

// Mock dependencies if needed
vi.mock('./hooks/useData', () => ({
  useData: vi.fn(() => ({
    data: mockData,
    isLoading: false,
    error: null,
  })),
}));

// Test data
const mockData = {
  {{mockDataFields}}
};

const defaultProps = {
  {{defaultProps}}
};

describe('{{componentName}}', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<{{componentName}} {...defaultProps} />);
      expect(screen.getByRole('{{primaryRole}}')).toBeInTheDocument();
    });

    it('displays the correct content', () => {
      render(<{{componentName}} {...defaultProps} />);
      expect(screen.getByText('{{expectedText}}')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<{{componentName}} {...defaultProps} className="custom-class" />);
      expect(screen.getByRole('{{primaryRole}}')).toHaveClass('custom-class');
    });
  });

  describe('User Interactions', () => {
    it('handles click events', async () => {
      const onClick = vi.fn();
      render(<{{componentName}} {...defaultProps} onClick={onClick} />);

      await user.click(screen.getByRole('button'));

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('handles form submission', async () => {
      const onSubmit = vi.fn();
      render(<{{componentName}} {...defaultProps} onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText('{{inputLabel}}'), 'test value');
      await user.click(screen.getByRole('button', { name: /submit/i }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({ {{expectedFormData}} })
        );
      });
    });
  });

  describe('Loading State', () => {
    it('shows loading indicator when loading', () => {
      render(<{{componentName}} {...defaultProps} isLoading />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('disables interactions while loading', () => {
      render(<{{componentName}} {...defaultProps} isLoading />);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('Error State', () => {
    it('displays error message', () => {
      render(<{{componentName}} {...defaultProps} error="Something went wrong" />);
      expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<{{componentName}} {...defaultProps} />);
      // Uncomment if using jest-axe
      // expect(await axe(container)).toHaveNoViolations();
    });

    it('supports keyboard navigation', async () => {
      render(<{{componentName}} {...defaultProps} />);

      const button = screen.getByRole('button');
      button.focus();

      expect(button).toHaveFocus();

      await user.keyboard('{Enter}');
      // Assert expected behavior
    });
  });
});
`,
  variables: [
    'componentName',
    'mockDataFields',
    'defaultProps',
    'primaryRole',
    'expectedText',
    'inputLabel',
    'expectedFormData',
  ],
  dependencies: ['vitest', '@testing-library/react', '@testing-library/user-event'],
};

export const playwrightE2ETemplate: Template = {
  id: 'playwright-e2e',
  name: 'Playwright E2E Test',
  description: 'End-to-end test with Playwright',
  category: 'test',
  framework: ['react', 'next'],
  tags: ['playwright', 'e2e', 'integration-test'],
  code: `import { test, expect, type Page } from '@playwright/test';

// Test configuration
test.describe.configure({ mode: 'serial' });

// Page Object Model
class {{pageName}}Page {
  constructor(private page: Page) {}

  // Locators
  get heading() {
    return this.page.getByRole('heading', { name: '{{pageHeading}}' });
  }

  get {{primaryElement}}() {
    return this.page.getByTestId('{{primaryTestId}}');
  }

  get submitButton() {
    return this.page.getByRole('button', { name: /submit/i });
  }

  get errorMessage() {
    return this.page.getByRole('alert');
  }

  // Actions
  async navigate() {
    await this.page.goto('/{{pagePath}}');
  }

  async fillForm(data: Record<string, string>) {
    for (const [field, value] of Object.entries(data)) {
      await this.page.getByLabel(field).fill(value);
    }
  }

  async submit() {
    await this.submitButton.click();
  }

  async waitForSuccess() {
    await expect(this.page.getByText(/success/i)).toBeVisible();
  }
}

test.describe('{{featureName}}', () => {
  let {{pageName}}Page: {{pageName}}Page;

  test.beforeEach(async ({ page }) => {
    {{pageName}}Page = new {{pageName}}Page(page);
    await {{pageName}}Page.navigate();
  });

  test('page loads correctly', async () => {
    await expect({{pageName}}Page.heading).toBeVisible();
  });

  test('displays main content', async () => {
    await expect({{pageName}}Page.{{primaryElement}}).toBeVisible();
  });

  test('form submission works', async ({ page }) => {
    await {{pageName}}Page.fillForm({
      '{{field1}}': '{{value1}}',
      '{{field2}}': '{{value2}}',
    });

    await {{pageName}}Page.submit();
    await {{pageName}}Page.waitForSuccess();

    // Verify the result
    await expect(page).toHaveURL(/.*success/);
  });

  test('validates required fields', async () => {
    await {{pageName}}Page.submit();
    await expect({{pageName}}Page.errorMessage).toBeVisible();
  });

  test('handles server errors gracefully', async ({ page }) => {
    // Mock API to return error
    await page.route('/api/{{apiEndpoint}}', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Server error' }),
      });
    });

    await {{pageName}}Page.fillForm({
      '{{field1}}': '{{value1}}',
    });
    await {{pageName}}Page.submit();

    await expect({{pageName}}Page.errorMessage).toContainText('error');
  });

  test('is accessible', async ({ page }) => {
    // Check for common accessibility issues
    const accessibilitySnapshot = await page.accessibility.snapshot();
    expect(accessibilitySnapshot).not.toBeNull();
  });

  test('works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await {{pageName}}Page.navigate();

    await expect({{pageName}}Page.heading).toBeVisible();
    await expect({{pageName}}Page.{{primaryElement}}).toBeVisible();
  });
});
`,
  variables: [
    'pageName',
    'pageHeading',
    'pagePath',
    'primaryElement',
    'primaryTestId',
    'featureName',
    'field1',
    'value1',
    'field2',
    'value2',
    'apiEndpoint',
  ],
  dependencies: ['@playwright/test'],
};

// ============================================================================
// UTILITY TEMPLATES
// ============================================================================

export const utilityHookTemplate: Template = {
  id: 'utility-hook',
  name: 'Utility Hook',
  description: 'Reusable custom hook with TypeScript',
  category: 'utility',
  framework: ['react', 'next'],
  tags: ['hook', 'utility', 'typescript'],
  code: `import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * {{hookDescription}}
 *
 * @example
 * \`\`\`tsx
 * const { {{returnValues}} } = use{{hookName}}({{exampleParams}});
 * \`\`\`
 */
export function use{{hookName}}({{parameters}}): {{returnType}} {
  // State
  const [{{stateField}}, set{{stateFieldCapital}}] = useState<{{stateType}}>({{initialState}});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Refs for cleanup
  const mountedRef = useRef(true);

  // Main effect
  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      setError(null);

      try {
        {{effectLogic}}

        if (mountedRef.current) {
          set{{stateFieldCapital}}({{resultVariable}});
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    run();

    return () => {
      mountedRef.current = false;
    };
  }, [{{dependencies}}]);

  // Action handlers
  const {{actionName}} = useCallback(async ({{actionParams}}) => {
    setIsLoading(true);
    setError(null);

    try {
      {{actionLogic}}
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [{{actionDependencies}}]);

  const reset = useCallback(() => {
    set{{stateFieldCapital}}({{initialState}});
    setError(null);
  }, []);

  return {
    {{stateField}},
    isLoading,
    error,
    {{actionName}},
    reset,
  };
}
`,
  variables: [
    'hookName',
    'hookDescription',
    'parameters',
    'returnType',
    'returnValues',
    'exampleParams',
    'stateField',
    'stateFieldCapital',
    'stateType',
    'initialState',
    'effectLogic',
    'resultVariable',
    'dependencies',
    'actionName',
    'actionParams',
    'actionLogic',
    'actionDependencies',
  ],
  dependencies: [],
};

export const errorBoundaryTemplate: Template = {
  id: 'error-boundary',
  name: 'Error Boundary',
  description: 'React error boundary with fallback UI',
  category: 'utility',
  framework: ['react', 'next'],
  tags: ['error-boundary', 'error-handling', 'fallback'],
  code: `'use client';

import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class {{componentName}} extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to error reporting service
    console.error('Error caught by boundary:', error, errorInfo);

    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Custom fallback
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div
          role="alert"
          className="min-h-[200px] flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg border border-red-200"
        >
          <svg
            className="w-12 h-12 text-red-500 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>

          <h2 className="text-lg font-semibold text-red-900 mb-2">
            Something went wrong
          </h2>

          <p className="text-sm text-red-700 text-center mb-4 max-w-md">
            {this.state.error.message || 'An unexpected error occurred'}
          </p>

          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700
                       focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                       transition-colors"
          >
            Try again
          </button>

          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 text-xs text-red-600 max-w-full">
              <summary className="cursor-pointer">Error details</summary>
              <pre className="mt-2 p-2 bg-red-100 rounded overflow-auto max-h-40">
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper for use with hooks
export function with{{componentName}}<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ErrorBoundaryProps['fallback']
) {
  return function WithErrorBoundary(props: P) {
    return (
      <{{componentName}} fallback={fallback}>
        <WrappedComponent {...props} />
      </{{componentName}}>
    );
  };
}
`,
  variables: ['componentName'],
  dependencies: [],
};

// ============================================================================
// Export all templates
// ============================================================================

export const advancedTemplates = [
  apiRouteTemplate,
  serverActionTemplate,
  zustandStoreTemplate,
  contextProviderTemplate,
  tanstackQueryTemplate,
  vitestComponentTemplate,
  playwrightE2ETemplate,
  utilityHookTemplate,
  errorBoundaryTemplate,
];

export function registerAdvancedTemplates(
  registry: Map<string, Template>
): void {
  for (const template of advancedTemplates) {
    registry.set(template.id, template);
  }
}
