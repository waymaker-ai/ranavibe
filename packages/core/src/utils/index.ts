/**
 * Utility functions for RANA core
 */

export function validateYamlSyntax(content: string): boolean {
  try {
    require('js-yaml').load(content);
    return true;
  } catch {
    return false;
  }
}

export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
