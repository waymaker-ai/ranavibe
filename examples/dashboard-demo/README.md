# dashboard-demo

Demonstrates the core features of `@ranavibe/dashboard`:

- **Event collection** for cost, security, compliance, and performance events
- **Dashboard summary** aggregating all metrics into a single view
- **Individual metric queries** for cost-by-model, security-by-category, etc.
- **Alert system** with automatic budget, security, compliance, and anomaly detection
- **Data export** in CSV, JSON, and Prometheus formats
- **HTTP API server** for integration with external monitoring tools

## Run

```bash
pnpm install
pnpm start
```

To also start the HTTP API server on port 3456:

```bash
pnpm start:serve
```

## What it shows

The demo simulates realistic LLM usage events (cost tracking across multiple models, injection attempts, PII detection, compliance checks, and latency measurements), then shows how the dashboard aggregates, alerts on, and exports that data. Zero external dependencies -- built on Node.js built-ins only.
