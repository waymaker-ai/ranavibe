import { describe, it, expect } from 'vitest';
import { noExposedAssets } from './no-exposed-assets.js';
import type { ScanConfig } from '../types.js';

const config: ScanConfig = {
  scanPath: '.',
  rules: 'all',
  failOn: 'high',
  format: 'console',
  commentOnPr: false,
  ignorePatterns: [],
};

describe('noExposedAssets', () => {
  // ── Source map exposure ─────────────────────────────────────────────────────

  describe('source map exposure', () => {
    it('should detect sourceMappingURL in JS files', () => {
      const content = 'var a=1;\n//# sourceMappingURL=app.bundle.js.map';
      const result = noExposedAssets.run('dist/app.bundle.js', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
      expect(result.findings[0].severity).toBe('high');
      expect(result.findings[0].message).toContain('Source map reference');
    });

    it('should detect CSS sourceMappingURL', () => {
      const content = 'body{color:red}\n/*# sourceMappingURL=styles.css.map */';
      const result = noExposedAssets.run('public/styles.css', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
    });

    it('should detect webpack source-map devtool', () => {
      const content = `module.exports = {\n  devtool: 'source-map',\n};`;
      const result = noExposedAssets.run('webpack.config.js', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
      expect(result.findings[0].message).toContain('Webpack');
    });

    it('should detect Vue productionSourceMap', () => {
      const content = `module.exports = {\n  productionSourceMap: true,\n};`;
      const result = noExposedAssets.run('vue.config.js', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
    });

    it('should detect sourcemap in vite config', () => {
      const content = `export default {\n  build: { sourcemap: true }\n};`;
      const result = noExposedAssets.run('vite.config.ts', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Vite-specific exposure ────────────────────────────────────────────────

  describe('Vite exposure', () => {
    it('should detect VITE_ secret env vars', () => {
      const content = 'VITE_API_SECRET=mysupersecretkey123';
      const result = noExposedAssets.run('.env', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
      expect(result.findings[0].severity).toBe('critical');
    });

    it('should detect VITE_ token env vars', () => {
      const content = 'VITE_AUTH_TOKEN=abc123xyz';
      const result = noExposedAssets.run('.env.production', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
      expect(result.findings[0].severity).toBe('critical');
    });

    it('should detect VITE_ database env vars', () => {
      const content = 'VITE_DB_URL=postgres://user:pass@host/db';
      const result = noExposedAssets.run('.env', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
      expect(result.findings[0].severity).toBe('critical');
    });

    it('should not flag non-sensitive VITE_ vars', () => {
      const content = 'VITE_APP_TITLE=My App\nVITE_API_URL=https://api.example.com';
      const result = noExposedAssets.run('.env', content, config);
      expect(result.findings.length).toBe(0);
    });

    it('should detect Vite dev server bound to 0.0.0.0', () => {
      const content = `export default {\n  server: {\n    host: '0.0.0.0'\n  }\n};`;
      const result = noExposedAssets.run('vite.config.ts', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Next.js exposure ──────────────────────────────────────────────────────

  describe('Next.js exposure', () => {
    it('should detect NEXT_PUBLIC_ secret env vars', () => {
      const content = 'NEXT_PUBLIC_SECRET_KEY=supersecret123';
      const result = noExposedAssets.run('.env.local', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
      expect(result.findings[0].severity).toBe('critical');
    });

    it('should detect NEXT_PUBLIC_ database env vars', () => {
      const content = 'NEXT_PUBLIC_DATABASE_URL=postgres://user:pass@host/db';
      const result = noExposedAssets.run('.env', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
    });

    it('should not flag non-sensitive NEXT_PUBLIC_ vars', () => {
      const content = 'NEXT_PUBLIC_APP_URL=https://example.com';
      const result = noExposedAssets.run('.env', content, config);
      expect(result.findings.length).toBe(0);
    });
  });

  // ── Debug / dev mode ──────────────────────────────────────────────────────

  describe('debug and dev mode', () => {
    it('should detect DEBUG=true in .env', () => {
      const content = 'DEBUG=true';
      const result = noExposedAssets.run('.env', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
      expect(result.findings[0].severity).toBe('high');
    });

    it('should detect DEBUG=* in .env', () => {
      const content = 'DEBUG=*';
      const result = noExposedAssets.run('.env', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
    });

    it('should detect Flask debug mode', () => {
      const content = 'FLASK_DEBUG=1';
      const result = noExposedAssets.run('.env', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
      expect(result.findings[0].severity).toBe('critical');
    });

    it('should detect Django debug mode', () => {
      const content = 'DJANGO_DEBUG=True';
      const result = noExposedAssets.run('.env.production', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
      expect(result.findings[0].severity).toBe('critical');
    });

    it('should detect Flask app.run with debug=True', () => {
      const content = 'app.run(host="0.0.0.0", debug=True, port=5000)';
      const result = noExposedAssets.run('app.py', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
      expect(result.findings[0].severity).toBe('critical');
    });

    it('should detect Python DEBUG = True', () => {
      const content = 'DEBUG = True';
      const result = noExposedAssets.run('settings.py', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
    });

    it('should detect ACTIONS_STEP_DEBUG in workflow', () => {
      const content = 'env:\n  ACTIONS_STEP_DEBUG: true';
      const result = noExposedAssets.run('.github/workflows/ci.yml', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
    });

    it('should detect PHP display_errors', () => {
      const content = 'display_errors = On';
      const result = noExposedAssets.run('php.conf', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Sensitive file patterns ───────────────────────────────────────────────

  describe('sensitive file patterns', () => {
    it('should detect NPM registry auth token', () => {
      const content = '//registry.npmjs.org/:_authToken=npm_abc123def456';
      const result = noExposedAssets.run('.npmrc', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
      expect(result.findings[0].severity).toBe('critical');
    });

    it('should detect credentials in URL', () => {
      const content = 'const db = "https://admin:password123@db.internal.company.com/prod"';
      const result = noExposedAssets.run('config.ts', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
      expect(result.findings[0].severity).toBe('critical');
    });

    it('should not flag example URLs with credentials', () => {
      const content = 'const db = "https://user:pass@example.com/db"';
      const result = noExposedAssets.run('config.ts', content, config);
      expect(result.findings.length).toBe(0);
    });
  });

  // ── API exposure ──────────────────────────────────────────────────────────

  describe('API exposure', () => {
    it('should detect GraphQL introspection enabled', () => {
      const content = 'const server = new ApolloServer({ schema, introspection: true });';
      const result = noExposedAssets.run('server.ts', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
      expect(result.findings[0].severity).toBe('high');
    });

    it('should not flag introspection with NODE_ENV guard', () => {
      const content = 'introspection: process.env.NODE_ENV !== "production" ? true : false';
      const result = noExposedAssets.run('server.ts', content, config);
      expect(result.findings.length).toBe(0);
    });

    it('should detect GraphiQL enabled', () => {
      const content = 'app.use("/graphql", graphqlHTTP({ schema, graphiql: true }));';
      const result = noExposedAssets.run('server.ts', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
    });

    it('should detect Swagger setup', () => {
      const content = 'SwaggerModule.setup("api", app, document);';
      const result = noExposedAssets.run('main.ts', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
    });

    it('should detect CORS wildcard origin', () => {
      const content = `app.use(cors({ origin: '*' }));`;
      const result = noExposedAssets.run('server.ts', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
      expect(result.findings[0].severity).toBe('high');
    });

    it('should detect API docs route', () => {
      const content = `app.use('/swagger', swaggerUi.serve);`;
      const result = noExposedAssets.run('app.ts', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Server config ─────────────────────────────────────────────────────────

  describe('server misconfiguration', () => {
    it('should detect nginx autoindex on', () => {
      const content = 'location /files {\n  autoindex on;\n}';
      const result = noExposedAssets.run('nginx.conf', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
      expect(result.findings[0].severity).toBe('high');
    });

    it('should detect Apache Options Indexes', () => {
      const content = '<Directory /var/www>\n  Options Indexes FollowSymLinks\n</Directory>';
      const result = noExposedAssets.run('.htaccess', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── CI/CD exposure ────────────────────────────────────────────────────────

  describe('CI/CD secrets exposure', () => {
    it('should detect secrets echoed in GitHub Actions', () => {
      const content = '- run: echo ${{ secrets.API_KEY }}';
      const result = noExposedAssets.run('.github/workflows/deploy.yml', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
      expect(result.findings[0].severity).toBe('critical');
    });

    it('should detect secrets written to output', () => {
      const content = '- run: echo "token=${{ secrets.NPM_TOKEN }}" >> $GITHUB_OUTPUT';
      const result = noExposedAssets.run('.github/workflows/ci.yml', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
    });

    it('should detect printenv in CI', () => {
      const content = '- run: printenv';
      const result = noExposedAssets.run('.github/workflows/debug.yml', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Database / admin tools ────────────────────────────────────────────────

  describe('database and admin tool exposure', () => {
    it('should detect phpmyadmin route', () => {
      const content = `app.use('/phpmyadmin', proxy({ target: 'http://localhost:8080' }));`;
      const result = noExposedAssets.run('server.ts', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
      expect(result.findings[0].severity).toBe('critical');
    });

    it('should detect adminer route', () => {
      const content = `location: '/adminer'`;
      const result = noExposedAssets.run('docker-compose.yml', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
    });

    it('should detect SQL dumps with real data', () => {
      const content = `INSERT INTO users VALUES ('john@real.com', 'hashed_pw_123');`;
      const result = noExposedAssets.run('backup.ts', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
    });

    it('should not flag SQL in test/seed files', () => {
      const content = `INSERT INTO users VALUES ('test@example.com', 'password'); // seed data`;
      const result = noExposedAssets.run('seed.ts', content, config);
      expect(result.findings.length).toBe(0);
    });
  });

  // ── Internal URLs / infrastructure ────────────────────────────────────────

  describe('infrastructure exposure', () => {
    it('should detect internal corporate URLs', () => {
      const content = `const api = "https://payments.internal.acme.com/v1";`;
      const result = noExposedAssets.run('config.ts', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
    });

    it('should not flag internal URLs in test files', () => {
      const content = `const api = "https://api.internal.example.com"; // test endpoint`;
      const result = noExposedAssets.run('config.ts', content, config);
      expect(result.findings.length).toBe(0);
    });

    it('should detect hardcoded non-private IPs', () => {
      const content = `const host = "http://54.32.100.5:8080";`;
      const result = noExposedAssets.run('config.ts', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
    });

    it('should not flag private/localhost IPs', () => {
      const content = `const host = "http://127.0.0.1:3000";`;
      const result = noExposedAssets.run('config.ts', content, config);
      expect(result.findings.length).toBe(0);
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('should return no findings for clean files', () => {
      const content = `const app = express();\napp.listen(3000);`;
      const result = noExposedAssets.run('server.ts', content, config);
      expect(result.findings.length).toBe(0);
    });

    it('should handle empty files', () => {
      const result = noExposedAssets.run('empty.ts', '', config);
      expect(result.findings.length).toBe(0);
    });

    it('should report correct line numbers', () => {
      const content = 'line1\nline2\nDEBUG=true\nline4';
      const result = noExposedAssets.run('.env', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(1);
      expect(result.findings[0].line).toBe(3);
    });

    it('should detect multiple issues in one file', () => {
      const content = [
        'VITE_SECRET_KEY=abc123',
        'VITE_DB_URL=postgres://localhost/db',
        'DEBUG=true',
      ].join('\n');
      const result = noExposedAssets.run('.env', content, config);
      expect(result.findings.length).toBeGreaterThanOrEqual(3);
    });
  });
});
