import type { RuleDefinition, RuleResult, Finding, ScanConfig, Severity } from '../types.js';

/**
 * Detects web application exposure vulnerabilities:
 * - Source map files leaking to production
 * - Vite/webpack/Next.js misconfigurations
 * - Debug/dev mode left on in production
 * - Sensitive files committed to repo
 * - API introspection/docs exposed in production
 * - Directory listing enabled in server configs
 * - CI/CD secrets leaked in workflow files
 * - Database dumps and admin tools in repo
 */

// ─── Pattern categories ────────────────────────────────────────────────────────

interface ExposurePattern {
  pattern: RegExp;
  label: string;
  severity: Severity;
  suggestion: string;
  /** Only match in these file basenames/extensions (empty = all) */
  fileFilter?: RegExp;
  /** Skip if this pattern also matches the line (false-positive guard) */
  unless?: RegExp;
}

// ── 1. Source map exposure ──────────────────────────────────────────────────────

const SOURCE_MAP_PATTERNS: ExposurePattern[] = [
  {
    pattern: /\/[/*]#\s*sourceMappingURL=\S+\.map/g,
    label: 'Source map reference in bundled file',
    severity: 'high',
    suggestion: 'Remove sourceMappingURL comments from production bundles. Set devtool to false or "hidden-source-map" in your bundler config.',
  },
  {
    pattern: /devtool\s*:\s*['"]source-map['"]/g,
    label: 'Webpack devtool set to "source-map" (publicly accessible maps)',
    severity: 'high',
    suggestion: 'Use "hidden-source-map" or false for production builds to prevent .map file exposure.',
    fileFilter: /webpack\.config|next\.config|rspack\.config/,
  },
  {
    pattern: /productionSourceMap\s*:\s*true/g,
    label: 'Vue CLI productionSourceMap enabled',
    severity: 'high',
    suggestion: 'Set productionSourceMap: false in vue.config.js to prevent source map exposure.',
    fileFilter: /vue\.config/,
  },
  {
    pattern: /sourcemap\s*:\s*true/gi,
    label: 'Source maps enabled in build config',
    severity: 'medium',
    suggestion: 'Disable source maps for production builds or use "hidden" mode so .map files are not publicly served.',
    fileFilter: /vite\.config|rollup\.config|esbuild|tsconfig/,
  },
];

// ── 2. Vite-specific exposure ───────────────────────────────────────────────────

const VITE_PATTERNS: ExposurePattern[] = [
  {
    pattern: /VITE_[A-Z_]*(SECRET|PASSWORD|PRIVATE|TOKEN|AUTH|SIGNING)[A-Z_]*\s*=/gi,
    label: 'Sensitive value in VITE_ env var (embedded in client bundle)',
    severity: 'critical',
    suggestion: 'VITE_ prefixed variables are embedded in the frontend bundle and visible to anyone. Move secrets to server-side only env vars without the VITE_ prefix.',
    fileFilter: /\.env/,
  },
  {
    pattern: /VITE_[A-Z_]*(DB_|DATABASE|MONGO|POSTGRES|MYSQL|REDIS|SUPABASE_SERVICE)[A-Z_]*\s*=/gi,
    label: 'Database connection info in VITE_ env var (exposed to client)',
    severity: 'critical',
    suggestion: 'Database credentials must never be prefixed with VITE_. Remove the prefix and access via server-side API routes only.',
    fileFilter: /\.env/,
  },
  {
    pattern: /host\s*:\s*['"]0\.0\.0\.0['"]/g,
    label: 'Vite dev server / HMR bound to all interfaces',
    severity: 'medium',
    suggestion: 'Bind the dev server to localhost unless you specifically need LAN access. Exposing HMR allows remote code injection.',
    fileFilter: /vite\.config/,
  },
];

// ── 3. Next.js specific exposure ────────────────────────────────────────────────

const NEXTJS_PATTERNS: ExposurePattern[] = [
  {
    pattern: /NEXT_PUBLIC_[A-Z_]*(SECRET|PASSWORD|PRIVATE|TOKEN|AUTH|SIGNING)[A-Z_]*\s*=/gi,
    label: 'Sensitive value in NEXT_PUBLIC_ env var (exposed to browser)',
    severity: 'critical',
    suggestion: 'NEXT_PUBLIC_ variables are embedded in the client bundle. Move secrets to server-side env vars without the NEXT_PUBLIC_ prefix.',
    fileFilter: /\.env/,
  },
  {
    pattern: /NEXT_PUBLIC_[A-Z_]*(DB_|DATABASE|MONGO|POSTGRES|MYSQL|REDIS|SUPABASE_SERVICE)[A-Z_]*\s*=/gi,
    label: 'Database connection info in NEXT_PUBLIC_ env var',
    severity: 'critical',
    suggestion: 'Database credentials must never use the NEXT_PUBLIC_ prefix. Access them only in server-side code (API routes, getServerSideProps).',
    fileFilter: /\.env/,
  },
];

// ── 4. Debug / dev mode in production ───────────────────────────────────────────

const DEBUG_PATTERNS: ExposurePattern[] = [
  {
    pattern: /FLASK_DEBUG\s*=\s*(1|true|True)/g,
    label: 'Flask debug mode enabled (interactive debugger exposed)',
    severity: 'critical',
    suggestion: 'Flask debug mode exposes an interactive Python console to anyone. Never enable in production.',
    fileFilter: /\.env|docker-compose|Dockerfile/,
  },
  {
    pattern: /(?<!FLASK_|DJANGO_)DEBUG\s*=\s*(['"]?\*['"]?|true|1)/g,
    label: 'DEBUG mode enabled (exposes internal details)',
    severity: 'high',
    suggestion: 'Remove DEBUG=true from production configs. Use conditional logging that is stripped in production builds.',
    fileFilter: /\.env|docker-compose|Dockerfile/,
  },
  {
    pattern: /DJANGO_DEBUG\s*=\s*(1|true|True)/g,
    label: 'Django debug mode enabled (full stack traces and settings exposed)',
    severity: 'critical',
    suggestion: 'Django DEBUG=True shows full stack traces, settings, and database queries to anyone. Set DEBUG=False for production.',
    fileFilter: /\.env|docker-compose|Dockerfile/,
  },
  {
    pattern: /DEBUG\s*=\s*True/g,
    label: 'Python DEBUG = True in settings',
    severity: 'high',
    suggestion: 'Set DEBUG = False for production. Use environment variables to control debug mode.',
    fileFilter: /settings\.py|config\.py/,
  },
  {
    pattern: /app\.run\s*\([^)]*debug\s*=\s*True/g,
    label: 'Flask app.run() with debug=True',
    severity: 'critical',
    suggestion: 'Remove debug=True from app.run(). Use a WSGI server (gunicorn, uvicorn) for production.',
  },
  {
    pattern: /error_reporting\s*\(\s*E_ALL\s*\)/g,
    label: 'PHP E_ALL error reporting (verbose errors exposed)',
    severity: 'high',
    suggestion: 'Set error_reporting to E_ERROR | E_WARNING in production. Disable display_errors.',
  },
  {
    pattern: /display_errors\s*=\s*['"]?(On|1|true)/gi,
    label: 'PHP display_errors enabled',
    severity: 'high',
    suggestion: 'Set display_errors = Off in production. Log errors to file instead.',
  },
  {
    pattern: /ACTIONS_STEP_DEBUG\s*[:=]\s*true/gi,
    label: 'GitHub Actions step debug enabled (logs all secrets context)',
    severity: 'high',
    suggestion: 'ACTIONS_STEP_DEBUG logs environment variables and secret context. Remove from workflow files.',
    fileFilter: /\.yml|\.yaml/,
  },
];

// ── 5. Sensitive file patterns ──────────────────────────────────────────────────

const SENSITIVE_FILE_PATTERNS: ExposurePattern[] = [
  {
    pattern: /\/\/[^/\s]+\/:_authToken\s*=/g,
    label: 'NPM registry auth token in .npmrc',
    severity: 'critical',
    suggestion: 'Never commit .npmrc with auth tokens. Use NPM_TOKEN environment variable and add .npmrc to .gitignore.',
    fileFilter: /\.npmrc/,
  },
  {
    pattern: /_auth\s*=\s*[A-Za-z0-9+/=]{10,}/g,
    label: 'Base64 encoded auth in .npmrc',
    severity: 'critical',
    suggestion: 'Remove hardcoded _auth from .npmrc. Use environment variable substitution: _auth=${NPM_AUTH}',
    fileFilter: /\.npmrc/,
  },
  {
    pattern: /https?:\/\/[^@\s]+:[^@\s]+@[^/\s]+/g,
    label: 'Credentials embedded in URL',
    severity: 'critical',
    suggestion: 'Remove inline credentials from URLs. Use environment variables or credential helpers.',
    unless: /example\.com|localhost|127\.0\.0\.1|placeholder|TODO/i,
  },
  {
    pattern: /-----BEGIN\s+(EC\s+|DSA\s+|OPENSSH\s+)?PRIVATE\s+KEY-----/g,
    label: 'Private key file committed to repository',
    severity: 'critical',
    suggestion: 'Never commit private keys. Add *.pem, *.key to .gitignore and use a secrets manager.',
  },
];

// ── 6. API / service exposure ───────────────────────────────────────────────────

const API_EXPOSURE_PATTERNS: ExposurePattern[] = [
  {
    pattern: /introspection\s*:\s*true/g,
    label: 'GraphQL introspection enabled (full schema exposed)',
    severity: 'high',
    suggestion: 'Disable GraphQL introspection in production. It reveals your entire API schema, types, and relationships to attackers.',
    unless: /development|dev|test|NODE_ENV/i,
  },
  {
    pattern: /graphiql\s*:\s*true/g,
    label: 'GraphiQL IDE enabled (interactive API explorer exposed)',
    severity: 'high',
    suggestion: 'Disable GraphiQL in production. It provides an interactive query interface anyone can use.',
    unless: /development|dev|test|NODE_ENV/i,
  },
  {
    pattern: /playground\s*:\s*true/g,
    label: 'GraphQL Playground enabled in config',
    severity: 'medium',
    suggestion: 'Disable GraphQL Playground in production. Gate it behind authentication or environment checks.',
    fileFilter: /apollo|graphql|server/,
    unless: /development|dev|test|NODE_ENV/i,
  },
  {
    pattern: /SwaggerModule\.setup\s*\(/g,
    label: 'Swagger UI setup (API docs may be publicly accessible)',
    severity: 'medium',
    suggestion: 'Gate Swagger UI behind authentication or disable in production. It reveals all API endpoints, parameters, and schemas.',
    unless: /if\s*\(.*prod|NODE_ENV/i,
  },
  {
    pattern: /app\.(use|get)\s*\(\s*['"]\/?(swagger|api-docs|openapi|redoc)['"]/g,
    label: 'API documentation route exposed',
    severity: 'medium',
    suggestion: 'Gate API documentation routes behind authentication in production. They reveal your full API surface.',
    unless: /if\s*\(.*prod|NODE_ENV|auth|guard|middleware/i,
  },
  {
    pattern: /cors\s*\(\s*\{\s*origin\s*:\s*['"]\*['"]/g,
    label: 'CORS allows all origins',
    severity: 'high',
    suggestion: 'Restrict CORS origin to specific domains. Wildcard (*) allows any website to make authenticated requests to your API.',
  },
  {
    pattern: /Access-Control-Allow-Origin['"]\s*,\s*['"]\*/g,
    label: 'CORS Access-Control-Allow-Origin set to wildcard',
    severity: 'high',
    suggestion: 'Set Access-Control-Allow-Origin to specific trusted domains, not *.',
  },
];

// ── 7. Directory listing / server misconfiguration ──────────────────────────────

const SERVER_CONFIG_PATTERNS: ExposurePattern[] = [
  {
    pattern: /autoindex\s+on/gi,
    label: 'Nginx directory listing enabled (autoindex on)',
    severity: 'high',
    suggestion: 'Set autoindex off in nginx config. Directory listing exposes all files and paths.',
    fileFilter: /nginx|\.conf/,
  },
  {
    pattern: /Options\s+.*\bIndexes\b/g,
    label: 'Apache directory listing enabled (Options Indexes)',
    severity: 'high',
    suggestion: 'Remove Indexes from Options directive. Use "Options -Indexes" to prevent directory listing.',
    fileFilter: /\.htaccess|apache|httpd|\.conf/,
  },
  {
    pattern: /directory_listing\s*[:=]\s*true/gi,
    label: 'Directory listing enabled in server config',
    severity: 'high',
    suggestion: 'Disable directory listing. It exposes your entire file tree to attackers.',
  },
];

// ── 8. CI/CD secrets exposure ───────────────────────────────────────────────────

const CICD_PATTERNS: ExposurePattern[] = [
  {
    pattern: /echo\s+.*\$\{\{\s*secrets\.[^}]+\}\}/g,
    label: 'GitHub Actions secret echoed to logs',
    severity: 'critical',
    suggestion: 'Never echo secrets in CI logs. GitHub masks known secrets but custom outputs can leak. Use environment variables directly.',
    fileFilter: /\.yml|\.yaml/,
  },
  {
    pattern: /run\s*:\s*.*\$\{\{\s*secrets\.[^}]+\}\}.*>>/g,
    label: 'GitHub Actions secret written to file or output',
    severity: 'high',
    suggestion: 'Avoid writing secrets to files or outputs in CI. Use them directly in the step that needs them.',
    fileFilter: /\.yml|\.yaml/,
  },
  {
    pattern: /printenv|env\s*$|set\s*$/gm,
    label: 'CI step dumps all environment variables (may include secrets)',
    severity: 'high',
    suggestion: 'Remove printenv/env/set from CI steps. These commands dump all environment variables including injected secrets.',
    fileFilter: /\.yml|\.yaml/,
  },
];

// ── 9. Database / admin tool exposure ───────────────────────────────────────────

const DB_ADMIN_PATTERNS: ExposurePattern[] = [
  {
    pattern: /['"]\/?(phpmyadmin|pma|adminer|pgadmin|mongo-express|redis-commander)['"]/gi,
    label: 'Database admin tool route configured',
    severity: 'critical',
    suggestion: 'Never expose database admin tools publicly. Use SSH tunnels or VPN-restricted access.',
  },
  {
    pattern: /INSERT\s+INTO\s+.*VALUES\s*\(/gi,
    label: 'SQL INSERT statement with data (possible database dump in repo)',
    severity: 'medium',
    suggestion: 'Database dumps with real data should not be in the repository. Use seed scripts with synthetic data.',
    unless: /example|sample|seed|test|fixture|mock|fake/i,
  },
  {
    pattern: /CREATE\s+TABLE\s+.*\buser(s)?\b.*\bpassword\b/gi,
    label: 'Database schema with user/password table (may contain real data)',
    severity: 'low',
    suggestion: 'Verify this SQL file does not contain real user data. Use migration tools instead of raw SQL dumps.',
  },
];

// ── 10. Exposed internal URLs / infrastructure ──────────────────────────────────

const INFRA_PATTERNS: ExposurePattern[] = [
  {
    pattern: /https?:\/\/[a-z0-9-]+\.(internal|local|corp|intra|private)\.[a-z]+/gi,
    label: 'Internal/corporate URL in code (information disclosure)',
    severity: 'medium',
    suggestion: 'Internal URLs reveal infrastructure topology. Use environment variables for internal service addresses.',
    unless: /example|localhost|test|spec|mock/i,
  },
  {
    pattern: /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?/g,
    label: 'Hardcoded IP address in code',
    severity: 'low',
    suggestion: 'Hardcoded IPs reveal infrastructure. Use DNS names or environment variables.',
    unless: /127\.0\.0\.1|0\.0\.0\.0|localhost|example|test|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\./,
  },
];

// ─── All pattern groups ────────────────────────────────────────────────────────

const ALL_PATTERN_GROUPS: ExposurePattern[][] = [
  SOURCE_MAP_PATTERNS,
  VITE_PATTERNS,
  NEXTJS_PATTERNS,
  DEBUG_PATTERNS,
  SENSITIVE_FILE_PATTERNS,
  API_EXPOSURE_PATTERNS,
  SERVER_CONFIG_PATTERNS,
  CICD_PATTERNS,
  DB_ADMIN_PATTERNS,
  INFRA_PATTERNS,
];

// ─── Rule implementation ───────────────────────────────────────────────────────

function matchesFileFilter(filePath: string, filter?: RegExp): boolean {
  if (!filter) return true;
  const basename = filePath.split('/').pop() || '';
  return filter.test(basename) || filter.test(filePath);
}

export const noExposedAssets: RuleDefinition = {
  id: 'no-exposed-assets',
  name: 'No Exposed Assets',
  description: 'Detect source map exposure, build misconfigurations, debug modes, sensitive files, API introspection, directory listing, CI/CD secret leaks, and other common web application exposure vulnerabilities.',
  severity: 'high',
  fileExtensions: [
    '.ts', '.js', '.tsx', '.jsx', '.py',
    '.yml', '.yaml', '.json', '.env',
    '.cfg', '.conf', '.toml',
    '.html', '.php', '.rb',
  ],

  run(filePath: string, content: string, _config: ScanConfig): RuleResult {
    const findings: Finding[] = [];
    const lines = content.split('\n');

    for (const group of ALL_PATTERN_GROUPS) {
      for (const entry of group) {
        // Skip if file doesn't match the filter
        if (!matchesFileFilter(filePath, entry.fileFilter)) continue;

        for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
          const line = lines[lineIdx];
          const trimmed = line.trim();

          // Skip pure comment lines (but not //registry... in .npmrc or sourceMappingURL)
          const isNpmrc = filePath.endsWith('.npmrc');
          if (trimmed.startsWith('//') && !trimmed.includes('sourceMappingURL') && !isNpmrc) continue;
          if (trimmed.startsWith('#') && !trimmed.includes('sourceMappingURL')) continue;

          entry.pattern.lastIndex = 0;
          let match: RegExpExecArray | null;

          while ((match = entry.pattern.exec(line)) !== null) {
            // Check false-positive guard
            if (entry.unless && entry.unless.test(line)) break;

            findings.push({
              file: filePath,
              line: lineIdx + 1,
              column: match.index + 1,
              rule: 'no-exposed-assets',
              severity: entry.severity,
              message: entry.label,
              suggestion: entry.suggestion,
              source: trimmed,
            });
          }
        }
      }
    }

    return { findings };
  },
};

export default noExposedAssets;
