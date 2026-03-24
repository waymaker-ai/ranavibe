# @waymakerai/aicofounder-multi-tenant

Multi-tenant policy server for teams. HTTP API for managing CoFounder guardrail policies per-project with tenant isolation, API key authentication, rate limiting, and usage tracking.

## Installation

```bash
npm install @waymakerai/aicofounder-multi-tenant
```

## Quick Start

```typescript
import { TenantServer } from '@waymakerai/aicofounder-multi-tenant';

const server = new TenantServer({ storage: 'file', dataDir: './tenants' });
await server.start({ port: 3457 });

console.log('Multi-tenant server running on http://localhost:3457');
```

## API Endpoints

### Tenants

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/tenants` | Create a new tenant | No |
| GET | `/api/tenants/:id` | Get tenant details | Yes |

### Projects

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/tenants/:id/projects` | Create a project | Yes (write) |
| GET | `/api/tenants/:id/projects` | List projects | Yes (read) |

### Policies

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| PUT | `/api/projects/:id/policies` | Assign policies to project | Yes (write) |
| GET | `/api/projects/:id/policies` | Get project policies | Yes (read) |

### Evaluation

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/projects/:id/evaluate` | Evaluate content against policies | Yes (evaluate) |

### API Keys

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/keys` | Generate API key | Yes (admin) |

### Usage

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/usage/:tenantId` | Get usage report | Yes (read) |

### Health

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/health` | Health check | No |

## Usage Examples

### Create a Tenant

```bash
curl -X POST http://localhost:3457/api/tenants \
  -H "Content-Type: application/json" \
  -d '{"name": "Acme Corp", "email": "admin@acme.com", "plan": "pro"}'
```

### Generate an API Key

```bash
curl -X POST http://localhost:3457/api/keys \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <admin-key>" \
  -d '{"tenantId": "<tenant-id>", "name": "Production Key", "permissions": ["read", "write", "evaluate"]}'
```

### Create a Project

```bash
curl -X POST http://localhost:3457/api/tenants/<tenant-id>/projects \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <api-key>" \
  -d '{"name": "Customer Chatbot", "description": "Production chatbot"}'
```

### Assign Policies

```bash
curl -X PUT http://localhost:3457/api/projects/<project-id>/policies \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <api-key>" \
  -d '{
    "policies": [
      {
        "policyId": "pii-detection",
        "policyName": "PII Detection",
        "config": {
          "blockedPatterns": ["\\b\\d{3}-\\d{2}-\\d{4}\\b"],
          "severity": "critical"
        }
      },
      {
        "policyId": "content-filter",
        "policyName": "Content Filter",
        "config": {
          "blockedPatterns": ["hack", "exploit"],
          "maxLength": 10000
        }
      }
    ]
  }'
```

### Evaluate Content

```bash
curl -X POST http://localhost:3457/api/projects/<project-id>/evaluate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <api-key>" \
  -d '{"content": "My SSN is 123-45-6789"}'
```

### Get Usage Report

```bash
curl http://localhost:3457/api/usage/<tenant-id> \
  -H "X-API-Key: <api-key>"
```

## Storage Backends

### Memory (Development)

```typescript
const server = new TenantServer({ storage: 'memory' });
```

Data is stored in-memory and lost on restart. Best for development and testing.

### File (Production without DB)

```typescript
const server = new TenantServer({ storage: 'file', dataDir: './data/tenants' });
```

Data is persisted as JSON files. Suitable for single-server production deployments.

## Plan Limits

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Projects | 3 | 20 | 100 |
| Evaluations/month | 1,000 | 50,000 | 1,000,000 |
| API Keys | 2 | 10 | 50 |
| Rate Limit (req/min) | 30 | 300 | 3,000 |

## Configuration

```typescript
interface ServerConfig {
  storage: 'memory' | 'file';
  dataDir?: string;           // Required for 'file' storage
  corsOrigins?: string[];     // Default: ['*']
  defaultRateLimit?: number;  // Default: 60 req/min
}
```

## Programmatic Access

Access the tenant manager directly for use without the HTTP server:

```typescript
import { TenantManager, MemoryStorage } from '@waymakerai/aicofounder-multi-tenant';

const storage = new MemoryStorage();
const manager = new TenantManager(storage);

const tenant = await manager.createTenant({ name: 'Test', email: 'test@test.com' });
const project = await manager.createProject(tenant.id, { name: 'My Project' });
```

## Security

- **API Key Authentication**: All mutating endpoints require an API key via `X-API-Key` header or `Authorization: Bearer <key>`
- **Tenant Isolation**: Tenants can only access their own data
- **Rate Limiting**: Per-tenant rate limiting with configurable limits
- **CORS**: Configurable CORS origins
- **Permission Model**: Fine-grained permissions (read, write, evaluate, admin)

## License

MIT
