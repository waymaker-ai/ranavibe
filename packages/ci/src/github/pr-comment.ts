import type { GitHubContext } from '../types.js';

const COMMENT_MARKER = '<!-- aicofounder-ci-scan -->';

/**
 * Make a GitHub API request using native fetch (Node 18+).
 */
async function githubFetch(
  url: string,
  token: string,
  options: {
    method?: string;
    body?: unknown;
  } = {},
): Promise<{ status: number; data: unknown }> {
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return { status: response.status, data };
}

/**
 * Find an existing CoFounder CI comment on a PR.
 */
async function findExistingComment(
  context: GitHubContext,
  prNumber: number,
): Promise<number | null> {
  if (!context.token || !context.owner || !context.repo) return null;

  const url = `${context.apiUrl}/repos/${context.owner}/${context.repo}/issues/${prNumber}/comments?per_page=100`;
  const { status, data } = await githubFetch(url, context.token);

  if (status !== 200 || !Array.isArray(data)) return null;

  for (const comment of data) {
    if (
      typeof comment === 'object' &&
      comment !== null &&
      'body' in comment &&
      typeof (comment as Record<string, unknown>).body === 'string' &&
      ((comment as Record<string, unknown>).body as string).includes(COMMENT_MARKER)
    ) {
      return (comment as Record<string, unknown>).id as number;
    }
  }

  return null;
}

/**
 * Post or update a PR comment with scan results.
 * If a previous CoFounder CI comment exists, it will be updated.
 */
export async function postOrUpdateComment(
  context: GitHubContext,
  prNumber: number,
  body: string,
): Promise<{ success: boolean; url?: string; error?: string }> {
  if (!context.token) {
    return { success: false, error: 'No GitHub token provided' };
  }
  if (!context.owner || !context.repo) {
    return { success: false, error: 'Cannot determine repository owner/name' };
  }

  const commentBody = `${COMMENT_MARKER}\n${body}`;

  try {
    // Try to find and update existing comment
    const existingId = await findExistingComment(context, prNumber);

    if (existingId) {
      const url = `${context.apiUrl}/repos/${context.owner}/${context.repo}/issues/comments/${existingId}`;
      const { status, data } = await githubFetch(url, context.token, {
        method: 'PATCH',
        body: { body: commentBody },
      });

      if (status === 200) {
        const htmlUrl = (data as Record<string, unknown>)?.html_url as string | undefined;
        return { success: true, url: htmlUrl };
      }
      return { success: false, error: `Failed to update comment: HTTP ${status}` };
    }

    // Create new comment
    const url = `${context.apiUrl}/repos/${context.owner}/${context.repo}/issues/${prNumber}/comments`;
    const { status, data } = await githubFetch(url, context.token, {
      method: 'POST',
      body: { body: commentBody },
    });

    if (status === 201) {
      const htmlUrl = (data as Record<string, unknown>)?.html_url as string | undefined;
      return { success: true, url: htmlUrl };
    }
    return { success: false, error: `Failed to create comment: HTTP ${status}` };
  } catch (err) {
    return {
      success: false,
      error: `GitHub API error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Parse PR number from GitHub event payload.
 */
export function parsePrNumber(eventPath: string): number | null {
  try {
    const fs = require('node:fs');
    const content = fs.readFileSync(eventPath, 'utf-8');
    const event = JSON.parse(content);
    return event?.pull_request?.number ?? event?.issue?.number ?? null;
  } catch {
    return null;
  }
}
