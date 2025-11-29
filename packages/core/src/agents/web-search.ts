/**
 * Web Search Tools
 * Real implementations for web search using various providers
 */

import { Tool } from './base.js';

// ============================================================================
// Types
// ============================================================================

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  score?: number;
  content?: string;
  publishedDate?: string;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  answer?: string;
  followUpQuestions?: string[];
}

export interface WebSearchConfig {
  provider: 'tavily' | 'brave' | 'serper' | 'mock';
  apiKey: string;
  maxResults?: number;
  searchDepth?: 'basic' | 'advanced';
  includeAnswer?: boolean;
  includeRawContent?: boolean;
}

// ============================================================================
// Tavily Search
// ============================================================================

interface TavilyResponse {
  query: string;
  answer?: string;
  results: Array<{
    title: string;
    url: string;
    content: string;
    score: number;
    raw_content?: string;
    published_date?: string;
  }>;
  follow_up_questions?: string[];
}

export async function tavilySearch(
  query: string,
  config: { apiKey: string; maxResults?: number; searchDepth?: 'basic' | 'advanced'; includeAnswer?: boolean }
): Promise<SearchResponse> {
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: config.apiKey,
      query,
      max_results: config.maxResults || 5,
      search_depth: config.searchDepth || 'basic',
      include_answer: config.includeAnswer ?? true,
      include_raw_content: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Tavily search failed: ${error}`);
  }

  const data = await response.json() as TavilyResponse;

  return {
    query: data.query,
    answer: data.answer,
    results: data.results.map(r => ({
      title: r.title,
      url: r.url,
      snippet: r.content,
      score: r.score,
      content: r.raw_content,
      publishedDate: r.published_date,
    })),
    followUpQuestions: data.follow_up_questions,
  };
}

// ============================================================================
// Brave Search
// ============================================================================

interface BraveResponse {
  query: {
    original: string;
  };
  web: {
    results: Array<{
      title: string;
      url: string;
      description: string;
      age?: string;
      extra_snippets?: string[];
    }>;
  };
  news?: {
    results: Array<{
      title: string;
      url: string;
      description: string;
      age?: string;
    }>;
  };
}

export async function braveSearch(
  query: string,
  config: { apiKey: string; maxResults?: number; freshness?: 'day' | 'week' | 'month' | 'year' }
): Promise<SearchResponse> {
  const params = new URLSearchParams({
    q: query,
    count: String(config.maxResults || 5),
  });

  if (config.freshness) {
    params.append('freshness', config.freshness);
  }

  const response = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'X-Subscription-Token': config.apiKey,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Brave search failed: ${error}`);
  }

  const data = await response.json() as BraveResponse;

  const results: SearchResult[] = data.web.results.map(r => ({
    title: r.title,
    url: r.url,
    snippet: r.description,
    publishedDate: r.age,
  }));

  // Optionally include news results
  if (data.news?.results) {
    for (const n of data.news.results.slice(0, 3)) {
      results.push({
        title: `[News] ${n.title}`,
        url: n.url,
        snippet: n.description,
        publishedDate: n.age,
      });
    }
  }

  return {
    query: data.query.original,
    results,
  };
}

// ============================================================================
// Serper Search (Google Search API)
// ============================================================================

interface SerperResponse {
  searchParameters: {
    q: string;
  };
  organic: Array<{
    title: string;
    link: string;
    snippet: string;
    date?: string;
    position: number;
  }>;
  answerBox?: {
    answer?: string;
    title?: string;
    snippet?: string;
  };
  relatedSearches?: Array<{ query: string }>;
}

export async function serperSearch(
  query: string,
  config: { apiKey: string; maxResults?: number; gl?: string; hl?: string }
): Promise<SearchResponse> {
  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': config.apiKey,
    },
    body: JSON.stringify({
      q: query,
      num: config.maxResults || 5,
      gl: config.gl || 'us',
      hl: config.hl || 'en',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Serper search failed: ${error}`);
  }

  const data = await response.json() as SerperResponse;

  return {
    query: data.searchParameters.q,
    answer: data.answerBox?.answer || data.answerBox?.snippet,
    results: data.organic.map(r => ({
      title: r.title,
      url: r.link,
      snippet: r.snippet,
      publishedDate: r.date,
      score: 1 - (r.position - 1) / 10, // Convert position to score
    })),
    followUpQuestions: data.relatedSearches?.map(r => r.query),
  };
}

// ============================================================================
// Mock Search (for testing)
// ============================================================================

export async function mockSearch(query: string): Promise<SearchResponse> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));

  return {
    query,
    answer: `This is a mock answer for: "${query}"`,
    results: [
      {
        title: `Result 1 for ${query}`,
        url: 'https://example.com/result1',
        snippet: `This is a mock search result about ${query}. It contains relevant information.`,
        score: 0.95,
      },
      {
        title: `Result 2 for ${query}`,
        url: 'https://example.com/result2',
        snippet: `Another mock result discussing ${query} with additional context.`,
        score: 0.88,
      },
      {
        title: `Result 3 for ${query}`,
        url: 'https://example.com/result3',
        snippet: `More information related to ${query} from a different perspective.`,
        score: 0.82,
      },
    ],
    followUpQuestions: [
      `What are the latest developments in ${query}?`,
      `How does ${query} compare to alternatives?`,
    ],
  };
}

// ============================================================================
// Unified Search Function
// ============================================================================

export async function webSearch(query: string, config: WebSearchConfig): Promise<SearchResponse> {
  switch (config.provider) {
    case 'tavily':
      return tavilySearch(query, {
        apiKey: config.apiKey,
        maxResults: config.maxResults,
        searchDepth: config.searchDepth,
        includeAnswer: config.includeAnswer,
      });

    case 'brave':
      return braveSearch(query, {
        apiKey: config.apiKey,
        maxResults: config.maxResults,
      });

    case 'serper':
      return serperSearch(query, {
        apiKey: config.apiKey,
        maxResults: config.maxResults,
      });

    case 'mock':
    default:
      return mockSearch(query);
  }
}

// ============================================================================
// Web Search Tool Factory
// ============================================================================

let defaultSearchConfig: WebSearchConfig | null = null;

/**
 * Configure the default web search provider
 */
export function configureWebSearch(config: WebSearchConfig): void {
  defaultSearchConfig = config;
}

/**
 * Create a web search tool with specific configuration
 */
export function createWebSearchTool(config?: Partial<WebSearchConfig>): Tool {
  return {
    name: 'web_search',
    description: 'Search the web for current information. Use for questions about recent events, facts, current prices, weather, news, or anything that might be outdated.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query - be specific and include relevant keywords',
        },
        num_results: {
          type: 'number',
          description: 'Number of results to return (default: 5, max: 10)',
        },
      },
      required: ['query'],
    },
    execute: async (args) => {
      const query = args.query as string;
      const numResults = Math.min((args.num_results as number) || 5, 10);

      // Use provided config, default config, or mock
      const searchConfig: WebSearchConfig = {
        provider: config?.provider || defaultSearchConfig?.provider || 'mock',
        apiKey: config?.apiKey || defaultSearchConfig?.apiKey || '',
        maxResults: numResults,
        searchDepth: config?.searchDepth || defaultSearchConfig?.searchDepth,
        includeAnswer: config?.includeAnswer ?? defaultSearchConfig?.includeAnswer ?? true,
      };

      try {
        const response = await webSearch(query, searchConfig);

        // Format results for the agent
        const formattedResults = response.results.map((r, i) => ({
          rank: i + 1,
          title: r.title,
          url: r.url,
          snippet: r.snippet,
          ...(r.publishedDate && { date: r.publishedDate }),
        }));

        return {
          success: true,
          query: response.query,
          ...(response.answer && { answer: response.answer }),
          results: formattedResults,
          ...(response.followUpQuestions && { suggested_queries: response.followUpQuestions }),
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          success: false,
          error: errorMessage,
          query,
        };
      }
    },
  };
}

/**
 * Pre-configured web search tool (requires configureWebSearch to be called first)
 */
export const webSearchTool = createWebSearchTool();
