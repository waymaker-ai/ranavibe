import { Template } from '../types';

// ============================================================================
// Template Registry - 20+ code generation templates
// ============================================================================

const templates: Map<string, Template> = new Map();

// ============================================================================
// REACT COMPONENT TEMPLATES
// ============================================================================

/**
 * React Form Component with validation
 */
templates.set('react-form', {
  id: 'react-form',
  name: 'React Form Component',
  description: 'Accessible form with react-hook-form and Zod validation',
  category: 'component',
  framework: ['react', 'next'],
  tags: ['form', 'validation', 'accessibility', 'react-hook-form'],
  code: `'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';

const {{schemaName}}Schema = z.object({
  // Define your schema fields here
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
});

type {{formType}} = z.infer<typeof {{schemaName}}Schema>;

export interface {{componentName}}Props {
  onSubmit?: (data: {{formType}}) => Promise<void>;
  className?: string;
}

export function {{componentName}}({ onSubmit, className }: {{componentName}}Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<{{formType}}>({
    resolver: zodResolver({{schemaName}}Schema),
  });

  const handleFormSubmit = async (data: {{formType}}) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit?.(data);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className={className}
      noValidate
    >
      {error && (
        <div role="alert" className="mb-4 p-4 bg-red-50 text-red-600 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Name
          </label>
          <input
            id="name"
            type="text"
            {...register('name')}
            aria-invalid={errors.name ? 'true' : 'false'}
            aria-describedby={errors.name ? 'name-error' : undefined}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          />
          {errors.name && (
            <p id="name-error" className="mt-1 text-sm text-red-600">
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          />
          {errors.email && (
            <p id="email-error" className="mt-1 text-sm text-red-600">
              {errors.email.message}
            </p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-4 w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}

export default {{componentName}};
`,
  tests: `import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { {{componentName}} } from './{{componentName}}';

describe('{{componentName}}', () => {
  it('renders form fields', () => {
    render(<{{componentName}} />);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();
    render(<{{componentName}} />);

    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<{{componentName}} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
      });
    });
  });
});
`,
  documentation: '# {{componentName}}\n\nA form component with validation.',
  variables: [
    { name: 'componentName', type: 'string', description: 'Component name', required: true },
    { name: 'schemaName', type: 'string', description: 'Schema name', required: true },
    { name: 'formType', type: 'string', description: 'Form type name', required: true },
  ],
  examples: [
    {
      description: 'Contact form',
      variables: { componentName: 'ContactForm', schemaName: 'Contact', formType: 'ContactFormData' },
    },
  ],
});

/**
 * React Data Table Component
 */
templates.set('react-table', {
  id: 'react-table',
  name: 'React Data Table',
  description: 'Accessible data table with sorting, filtering, and pagination',
  category: 'component',
  framework: ['react', 'next'],
  tags: ['table', 'data', 'sorting', 'pagination', 'accessibility'],
  code: `'use client';

import { useState, useMemo } from 'react';

export interface Column<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

export interface {{componentName}}Props<T> {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  className?: string;
}

export function {{componentName}}<T extends { id: string | number }>({
  data,
  columns,
  pageSize = 10,
  className,
}: {{componentName}}Props<T>) {
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('');

  const filteredData = useMemo(() => {
    if (!filter) return data;
    return data.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(filter.toLowerCase())
      )
    );
  }, [data, filter]);

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortKey, sortDirection]);

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  return (
    <div className={className}>
      <div className="mb-4">
        <label htmlFor="table-filter" className="sr-only">
          Filter table
        </label>
        <input
          id="table-filter"
          type="search"
          placeholder="Filter..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse" role="grid">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  scope="col"
                  className="px-4 py-3 text-left bg-gray-50 border-b font-semibold"
                >
                  {column.sortable ? (
                    <button
                      onClick={() => handleSort(column.key)}
                      className="flex items-center gap-1 hover:text-blue-600"
                      aria-sort={
                        sortKey === column.key
                          ? sortDirection === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                    >
                      {column.header}
                      {sortKey === column.key && (
                        <span aria-hidden="true">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className="px-4 py-3 border-b"
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : String(row[column.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <nav
        className="mt-4 flex items-center justify-between"
        aria-label="Table pagination"
      >
        <span className="text-sm text-gray-600">
          Showing {(currentPage - 1) * pageSize + 1} to{' '}
          {Math.min(currentPage * pageSize, sortedData.length)} of{' '}
          {sortedData.length}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </nav>
    </div>
  );
}

export default {{componentName}};
`,
  tests: `import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { {{componentName}} } from './{{componentName}}';

const mockData = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
];

const columns = [
  { key: 'name' as const, header: 'Name', sortable: true },
  { key: 'email' as const, header: 'Email' },
];

describe('{{componentName}}', () => {
  it('renders table with data', () => {
    render(<{{componentName}} data={mockData} columns={columns} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('filters data', async () => {
    const user = userEvent.setup();
    render(<{{componentName}} data={mockData} columns={columns} />);

    await user.type(screen.getByPlaceholderText(/filter/i), 'alice');
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
  });

  it('sorts data when clicking sortable column', async () => {
    const user = userEvent.setup();
    render(<{{componentName}} data={mockData} columns={columns} />);

    await user.click(screen.getByRole('button', { name: /name/i }));
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Alice');
  });
});
`,
  documentation: '# {{componentName}}\n\nA data table with sorting and filtering.',
  variables: [
    { name: 'componentName', type: 'string', description: 'Component name', required: true },
  ],
  examples: [
    { description: 'User table', variables: { componentName: 'UserTable' } },
  ],
});

/**
 * React Modal Component
 */
templates.set('react-modal', {
  id: 'react-modal',
  name: 'React Modal Dialog',
  description: 'Accessible modal with focus trap and keyboard navigation',
  category: 'component',
  framework: ['react', 'next'],
  tags: ['modal', 'dialog', 'accessibility', 'overlay'],
  code: `'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

export interface {{componentName}}Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function {{componentName}}({
  isOpen,
  onClose,
  title,
  children,
  className,
}: {{componentName}}Props) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  // Focus trap
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      modalRef.current?.focus();
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
        (previousActiveElement.current as HTMLElement)?.focus();
      };
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        className={\`relative z-10 w-full max-w-md bg-white rounded-lg shadow-xl \${className}\`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 id="modal-title" className="text-lg font-semibold">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100"
            aria-label="Close modal"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-4">{children}</div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modal, document.body)
    : null;
}

export default {{componentName}};
`,
  tests: `import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { {{componentName}} } from './{{componentName}}';

describe('{{componentName}}', () => {
  it('renders when open', () => {
    render(
      <{{componentName}} isOpen onClose={() => {}} title="Test">
        Content
      </{{componentName}}>
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <{{componentName}} isOpen={false} onClose={() => {}} title="Test">
        Content
      </{{componentName}}>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onClose when clicking backdrop', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <{{componentName}} isOpen onClose={onClose} title="Test">
        Content
      </{{componentName}}>
    );

    await user.click(screen.getByRole('presentation').firstChild as Element);
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when pressing Escape', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <{{componentName}} isOpen onClose={onClose} title="Test">
        Content
      </{{componentName}}>
    );

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});
`,
  documentation: '# {{componentName}}\n\nAn accessible modal dialog.',
  variables: [
    { name: 'componentName', type: 'string', description: 'Component name', required: true },
  ],
  examples: [
    { description: 'Confirm dialog', variables: { componentName: 'ConfirmModal' } },
  ],
});

/**
 * React Button Component
 */
templates.set('react-button', {
  id: 'react-button',
  name: 'React Button Component',
  description: 'Accessible button with variants and loading state',
  category: 'component',
  framework: ['react', 'next'],
  tags: ['button', 'ui', 'accessibility'],
  code: `import { forwardRef } from 'react';

export interface {{componentName}}Props
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
  secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
  outline: 'border-2 border-gray-300 hover:bg-gray-50 focus:ring-gray-500',
  ghost: 'hover:bg-gray-100 focus:ring-gray-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export const {{componentName}} = forwardRef<HTMLButtonElement, {{componentName}}Props>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={\`inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed \${variantStyles[variant]} \${sizeStyles[size]} \${className}\`}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : leftIcon ? (
          <span className="mr-2">{leftIcon}</span>
        ) : null}
        {children}
        {rightIcon && !loading && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);

{{componentName}}.displayName = '{{componentName}}';

export default {{componentName}};
`,
  tests: `import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { {{componentName}} } from './{{componentName}}';

describe('{{componentName}}', () => {
  it('renders with children', () => {
    render(<{{componentName}}>Click me</{{componentName}}>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('shows loading spinner when loading', () => {
    render(<{{componentName}} loading>Click me</{{componentName}}>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<{{componentName}} onClick={onClick}>Click me</{{componentName}}>);

    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });

  it('applies variant styles', () => {
    render(<{{componentName}} variant="danger">Delete</{{componentName}}>);
    expect(screen.getByRole('button')).toHaveClass('bg-red-600');
  });
});
`,
  documentation: '# {{componentName}}\n\nA button component with variants.',
  variables: [
    { name: 'componentName', type: 'string', description: 'Component name', required: true },
  ],
  examples: [
    { description: 'Primary button', variables: { componentName: 'Button' } },
  ],
});

/**
 * React Card Component
 */
templates.set('react-card', {
  id: 'react-card',
  name: 'React Card Component',
  description: 'Flexible card component with header, body, and footer',
  category: 'component',
  framework: ['react', 'next'],
  tags: ['card', 'ui', 'container'],
  code: `import { forwardRef } from 'react';

export interface {{componentName}}Props extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export interface {{componentName}}HeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface {{componentName}}BodyProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface {{componentName}}FooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const variantStyles = {
  default: 'bg-white shadow-sm',
  elevated: 'bg-white shadow-lg',
  outlined: 'bg-white border border-gray-200',
};

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export const {{componentName}} = forwardRef<HTMLDivElement, {{componentName}}Props>(
  ({ variant = 'default', padding = 'md', className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={\`rounded-lg \${variantStyles[variant]} \${paddingStyles[padding]} \${className}\`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

export const {{componentName}}Header = forwardRef<HTMLDivElement, {{componentName}}HeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={\`pb-4 border-b border-gray-100 \${className}\`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

export const {{componentName}}Body = forwardRef<HTMLDivElement, {{componentName}}BodyProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={\`py-4 \${className}\`} {...props}>
        {children}
      </div>
    );
  }
);

export const {{componentName}}Footer = forwardRef<HTMLDivElement, {{componentName}}FooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={\`pt-4 border-t border-gray-100 \${className}\`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

{{componentName}}.displayName = '{{componentName}}';
{{componentName}}Header.displayName = '{{componentName}}Header';
{{componentName}}Body.displayName = '{{componentName}}Body';
{{componentName}}Footer.displayName = '{{componentName}}Footer';

export default {{componentName}};
`,
  tests: `import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { {{componentName}}, {{componentName}}Header, {{componentName}}Body, {{componentName}}Footer } from './{{componentName}}';

describe('{{componentName}}', () => {
  it('renders with children', () => {
    render(<{{componentName}}>Content</{{componentName}}>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders with header, body, and footer', () => {
    render(
      <{{componentName}}>
        <{{componentName}}Header>Header</{{componentName}}Header>
        <{{componentName}}Body>Body</{{componentName}}Body>
        <{{componentName}}Footer>Footer</{{componentName}}Footer>
      </{{componentName}}>
    );
    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });
});
`,
  documentation: '# {{componentName}}\n\nA card component with header and footer.',
  variables: [
    { name: 'componentName', type: 'string', description: 'Component name', required: true },
  ],
  examples: [
    { description: 'Product card', variables: { componentName: 'Card' } },
  ],
});

// ============================================================================
// API TEMPLATES
// ============================================================================

/**
 * Next.js App Router CRUD API
 */
templates.set('api-crud', {
  id: 'api-crud',
  name: 'Next.js CRUD API Route',
  description: 'Full CRUD API with validation and error handling',
  category: 'api',
  framework: ['next'],
  tags: ['api', 'crud', 'validation', 'next.js'],
  code: `import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Validation schemas
const CreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  // Add more fields
});

const UpdateSchema = CreateSchema.partial();

// GET - List all or get by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id?: string } }
) {
  try {
    if (params?.id) {
      const item = await prisma.{{modelName}}.findUnique({
        where: { id: params.id },
      });

      if (!item) {
        return NextResponse.json(
          { error: '{{modelName}} not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(item);
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.{{modelName}}.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.{{modelName}}.count(),
    ]);

    return NextResponse.json({
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreateSchema.parse(body);

    const item = await prisma.{{modelName}}.create({
      data: validated,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('POST Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validated = UpdateSchema.parse(body);

    const item = await prisma.{{modelName}}.update({
      where: { id: params.id },
      data: validated,
    });

    return NextResponse.json(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('PUT Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.{{modelName}}.delete({
      where: { id: params.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
`,
  tests: `import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST, PUT, DELETE } from './route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    {{modelName}}: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe('{{modelName}} API', () => {
  describe('GET', () => {
    it('returns paginated list', async () => {
      const request = new NextRequest('http://localhost/api/{{modelName}}');
      const response = await GET(request, {});

      expect(response.status).toBe(200);
    });
  });

  describe('POST', () => {
    it('creates new item with valid data', async () => {
      const request = new NextRequest('http://localhost/api/{{modelName}}', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
    });

    it('returns 400 for invalid data', async () => {
      const request = new NextRequest('http://localhost/api/{{modelName}}', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });
});
`,
  documentation: '# {{modelName}} API\n\nCRUD operations for {{modelName}}.',
  variables: [
    { name: 'modelName', type: 'string', description: 'Prisma model name', required: true },
  ],
  examples: [
    { description: 'User API', variables: { modelName: 'user' } },
  ],
});

/**
 * Authentication API Route
 */
templates.set('api-auth', {
  id: 'api-auth',
  name: 'Authentication API',
  description: 'Login, register, and session management',
  category: 'auth',
  framework: ['next'],
  tags: ['auth', 'api', 'session', 'security'],
  code: `import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signJWT, verifyJWT } from '@/lib/jwt';

const LoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const RegisterSchema = LoginSchema.extend({
  name: z.string().min(1, 'Name is required'),
});

// POST /api/auth/login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = LoginSchema.parse(body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate token
    const token = await signJWT({
      sub: user.id,
      email: user.email,
    });

    // Set cookie
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/auth/me - Get current user
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub as string },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/auth/logout
export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('token');
  return response;
}
`,
  tests: `import { describe, it, expect, vi } from 'vitest';
import { POST, GET, DELETE } from './route';
import { NextRequest } from 'next/server';

describe('Auth API', () => {
  describe('POST /login', () => {
    it('returns 401 for invalid credentials', async () => {
      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });
  });

  describe('GET /me', () => {
    it('returns 401 when not authenticated', async () => {
      const request = new NextRequest('http://localhost/api/auth/me');
      const response = await GET(request);
      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /logout', () => {
    it('clears the auth cookie', async () => {
      const request = new NextRequest('http://localhost/api/auth/logout', {
        method: 'DELETE',
      });
      const response = await DELETE(request);
      expect(response.status).toBe(200);
    });
  });
});
`,
  documentation: '# Authentication API\n\nUser authentication endpoints.',
  variables: [],
  examples: [],
});

/**
 * File Upload API
 */
templates.set('api-upload', {
  id: 'api-upload',
  name: 'File Upload API',
  description: 'Secure file upload with validation',
  category: 'api',
  framework: ['next'],
  tags: ['upload', 'file', 'api', 's3'],
  code: `import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// POST - Get presigned URL for upload
export async function POST(request: NextRequest) {
  try {
    const { filename, contentType, size } = await request.json();

    // Validate file type
    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      );
    }

    // Validate file size
    if (size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB' },
        { status: 400 }
      );
    }

    // Generate unique key
    const ext = filename.split('.').pop();
    const key = \`uploads/\${crypto.randomUUID()}.\${ext}\`;

    // Create presigned URL
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      ContentType: contentType,
    });

    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    return NextResponse.json({
      uploadUrl: presignedUrl,
      key,
      publicUrl: \`https://\${process.env.AWS_S3_BUCKET}.s3.\${process.env.AWS_REGION}.amazonaws.com/\${key}\`,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
`,
  tests: `import { describe, it, expect, vi } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

describe('Upload API', () => {
  it('rejects invalid file types', async () => {
    const request = new NextRequest('http://localhost/api/upload', {
      method: 'POST',
      body: JSON.stringify({
        filename: 'test.exe',
        contentType: 'application/x-executable',
        size: 1000,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('rejects files that are too large', async () => {
    const request = new NextRequest('http://localhost/api/upload', {
      method: 'POST',
      body: JSON.stringify({
        filename: 'test.jpg',
        contentType: 'image/jpeg',
        size: 10 * 1024 * 1024, // 10MB
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
`,
  documentation: '# File Upload API\n\nSecure file upload with S3.',
  variables: [],
  examples: [],
});

// ============================================================================
// UTILITY TEMPLATES
// ============================================================================

/**
 * API Client Utility
 */
templates.set('util-api-client', {
  id: 'util-api-client',
  name: 'API Client',
  description: 'Type-safe API client with error handling',
  category: 'utility',
  framework: ['react', 'next', 'node'],
  tags: ['api', 'fetch', 'typescript'],
  code: `export interface ApiResponse<T> {
  data: T;
  error?: never;
}

export interface ApiError {
  data?: never;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

export interface RequestConfig extends RequestInit {
  params?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResult<T>> {
    const { params, ...init } = config;

    let url = \`\${this.baseUrl}\${endpoint}\`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += \`?\${searchParams.toString()}\`;
    }

    try {
      const response = await fetch(url, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: {
            message: data.error || 'Request failed',
            code: String(response.status),
            details: data.details,
          },
        };
      }

      return { data };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Network error',
          code: 'NETWORK_ERROR',
        },
      };
    }
  }

  async get<T>(endpoint: string, params?: Record<string, string>) {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  async post<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient(process.env.NEXT_PUBLIC_API_URL || '/api');
export default api;
`,
  tests: `import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from './api-client';

describe('ApiClient', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns data on successful request', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 1 }),
    });

    const result = await api.get('/users/1');
    expect(result.data).toEqual({ id: 1 });
  });

  it('returns error on failed request', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'Not found' }),
    });

    const result = await api.get('/users/999');
    expect(result.error?.message).toBe('Not found');
  });
});
`,
  documentation: '# API Client\n\nType-safe HTTP client.',
  variables: [],
  examples: [],
});

/**
 * Validation Utilities
 */
templates.set('util-validation', {
  id: 'util-validation',
  name: 'Validation Utilities',
  description: 'Common validation schemas and helpers',
  category: 'utility',
  framework: ['react', 'next', 'node'],
  tags: ['validation', 'zod', 'schema'],
  code: `import { z } from 'zod';

// Common field validators
export const email = z.string().email('Invalid email address');
export const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[0-9]/, 'Password must contain a number');
export const phone = z.string().regex(/^\\+?[1-9]\\d{1,14}$/, 'Invalid phone number');
export const url = z.string().url('Invalid URL');
export const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug');
export const uuid = z.string().uuid('Invalid UUID');

// Common schemas
export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const DateRangeSchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
}).refine(
  (data) => data.from <= data.to,
  { message: 'End date must be after start date' }
);

// Utility functions
export function validateSync<T>(schema: z.Schema<T>, data: unknown): T {
  return schema.parse(data);
}

export function validateAsync<T>(
  schema: z.Schema<T>,
  data: unknown
): Promise<T> {
  return schema.parseAsync(data);
}

export function safeParse<T>(
  schema: z.Schema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

// Custom refinements
export const positiveNumber = z.number().positive('Must be a positive number');
export const nonEmptyString = z.string().min(1, 'This field is required');
export const optionalString = z.string().optional().or(z.literal(''));

// Export type helpers
export type Pagination = z.infer<typeof PaginationSchema>;
export type DateRange = z.infer<typeof DateRangeSchema>;
`,
  tests: `import { describe, it, expect } from 'vitest';
import { email, password, PaginationSchema, safeParse } from './validation';

describe('Validation', () => {
  describe('email', () => {
    it('accepts valid email', () => {
      expect(() => email.parse('test@example.com')).not.toThrow();
    });

    it('rejects invalid email', () => {
      expect(() => email.parse('invalid')).toThrow();
    });
  });

  describe('password', () => {
    it('accepts strong password', () => {
      expect(() => password.parse('Password123')).not.toThrow();
    });

    it('rejects weak password', () => {
      expect(() => password.parse('weak')).toThrow();
    });
  });

  describe('safeParse', () => {
    it('returns success for valid data', () => {
      const result = safeParse(PaginationSchema, { page: 1 });
      expect(result.success).toBe(true);
    });
  });
});
`,
  documentation: '# Validation Utilities\n\nCommon validation schemas.',
  variables: [],
  examples: [],
});

// ============================================================================
// DATABASE TEMPLATES
// ============================================================================

/**
 * Prisma Schema Template
 */
templates.set('db-prisma-schema', {
  id: 'db-prisma-schema',
  name: 'Prisma Schema',
  description: 'Common Prisma models with relations',
  category: 'database',
  framework: ['next', 'node'],
  tags: ['prisma', 'database', 'schema'],
  code: `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  password      String?
  emailVerified DateTime?
  image         String?
  role          Role      @default(USER)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts      Account[]
  sessions      Session[]
  posts         Post[]

  @@map("users")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model Post {
  id          String    @id @default(cuid())
  title       String
  slug        String    @unique
  content     String?   @db.Text
  excerpt     String?
  published   Boolean   @default(false)
  publishedAt DateTime?
  authorId    String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  author      User      @relation(fields: [authorId], references: [id])
  categories  Category[]
  tags        Tag[]

  @@index([authorId])
  @@index([slug])
  @@map("posts")
}

model Category {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("categories")
}

model Tag {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("tags")
}

enum Role {
  USER
  ADMIN
  MODERATOR
}
`,
  tests: '',
  documentation: '# Prisma Schema\n\nDatabase models.',
  variables: [],
  examples: [],
});

// ============================================================================
// SECURITY TEMPLATES
// ============================================================================

/**
 * Rate Limiter
 */
templates.set('security-rate-limiter', {
  id: 'security-rate-limiter',
  name: 'Rate Limiter',
  description: 'Request rate limiting middleware',
  category: 'security',
  framework: ['next', 'express', 'node'],
  tags: ['security', 'rate-limit', 'middleware'],
  code: `import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number;     // Time window in milliseconds
  max: number;          // Max requests per window
  message?: string;
}

const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(config: RateLimitConfig) {
  const { windowMs, max, message = 'Too many requests' } = config;

  return async function rateLimitMiddleware(
    request: NextRequest
  ): Promise<NextResponse | null> {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const key = \`\${ip}:\${request.nextUrl.pathname}\`;
    const now = Date.now();

    const record = ipRequestCounts.get(key);

    if (!record || now > record.resetTime) {
      ipRequestCounts.set(key, { count: 1, resetTime: now + windowMs });
      return null; // Continue to next middleware
    }

    if (record.count >= max) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      return NextResponse.json(
        { error: message },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(max),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(record.resetTime),
          },
        }
      );
    }

    record.count++;
    return null;
  };
}

// Presets
export const strictRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: 'Too many requests, please try again later',
});

export const standardRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many login attempts, please try again later',
});
`,
  tests: `import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rateLimit } from './rate-limiter';
import { NextRequest } from 'next/server';

describe('Rate Limiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('allows requests under limit', async () => {
    const limiter = rateLimit({ windowMs: 1000, max: 5 });
    const request = new NextRequest('http://localhost/api/test');

    for (let i = 0; i < 5; i++) {
      const result = await limiter(request);
      expect(result).toBeNull();
    }
  });

  it('blocks requests over limit', async () => {
    const limiter = rateLimit({ windowMs: 1000, max: 2 });
    const request = new NextRequest('http://localhost/api/test');

    await limiter(request);
    await limiter(request);
    const result = await limiter(request);

    expect(result?.status).toBe(429);
  });
});
`,
  documentation: '# Rate Limiter\n\nProtect endpoints from abuse.',
  variables: [],
  examples: [],
});

// ============================================================================
// HOOK TEMPLATES
// ============================================================================

/**
 * useDebounce Hook
 */
templates.set('hook-debounce', {
  id: 'hook-debounce',
  name: 'useDebounce Hook',
  description: 'Debounce values for search and input',
  category: 'utility',
  framework: ['react', 'next'],
  tags: ['hook', 'debounce', 'performance'],
  code: `import { useState, useEffect } from 'react';

/**
 * Debounce a value by the specified delay
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
`,
  tests: `import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('debounces value changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'changed' });
    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe('changed');
  });
});
`,
  documentation: '# useDebounce\n\nDebounce hook for performance.',
  variables: [],
  examples: [],
});

/**
 * useLocalStorage Hook
 */
templates.set('hook-local-storage', {
  id: 'hook-local-storage',
  name: 'useLocalStorage Hook',
  description: 'Persist state in localStorage',
  category: 'utility',
  framework: ['react', 'next'],
  tags: ['hook', 'storage', 'persistence'],
  code: `import { useState, useEffect, useCallback } from 'react';

/**
 * Sync state with localStorage
 * @param key - localStorage key
 * @param initialValue - Default value if not in storage
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  // Get initial value from storage or use default
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(\`Error reading localStorage key "\${key}":\`, error);
      return initialValue;
    }
  });

  // Update localStorage when value changes
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.warn(\`Error setting localStorage key "\${key}":\`, error);
      }
    },
    [key, storedValue]
  );

  // Remove from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(\`Error removing localStorage key "\${key}":\`, error);
    }
  }, [key, initialValue]);

  // Sync with other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch {
          setStoredValue(initialValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

export default useLocalStorage;
`,
  tests: `import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns initial value when storage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('test', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('returns stored value when available', () => {
    localStorage.setItem('test', JSON.stringify('stored'));
    const { result } = renderHook(() => useLocalStorage('test', 'default'));
    expect(result.current[0]).toBe('stored');
  });

  it('updates localStorage when value changes', () => {
    const { result } = renderHook(() => useLocalStorage('test', 'initial'));

    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
    expect(localStorage.getItem('test')).toBe(JSON.stringify('updated'));
  });
});
`,
  documentation: '# useLocalStorage\n\nPersist state in localStorage.',
  variables: [],
  examples: [],
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get template by ID
 */
export function getTemplate(id: string): Template | null {
  return templates.get(id) || null;
}

/**
 * Get all templates
 */
export function getAllTemplates(): Template[] {
  return Array.from(templates.values());
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: Template['category']): Template[] {
  return getAllTemplates().filter(t => t.category === category);
}

/**
 * Get templates by framework
 */
export function getTemplatesByFramework(framework: string): Template[] {
  return getAllTemplates().filter(t => t.framework.includes(framework as any));
}

/**
 * Get templates by tags
 */
export function getTemplatesByTags(tags: string[]): Template[] {
  return getAllTemplates().filter(t =>
    tags.some(tag => t.tags.includes(tag))
  );
}

/**
 * Search templates
 */
export function searchTemplates(query: string): Template[] {
  const lower = query.toLowerCase();
  return getAllTemplates().filter(t =>
    t.name.toLowerCase().includes(lower) ||
    t.description.toLowerCase().includes(lower) ||
    t.tags.some(tag => tag.toLowerCase().includes(lower))
  );
}

export { templates };
export type { Template };
