# @ranavibe/marketplace

Community policy sharing infrastructure for RANA. Search, browse, import, and publish AI safety policy packages.

## Installation

```bash
npm install @ranavibe/marketplace
```

## Quick Start

```typescript
import { PolicyMarketplace } from '@ranavibe/marketplace';

const marketplace = new PolicyMarketplace();

// Search for healthcare policies
const results = marketplace.search({ query: 'healthcare', category: 'healthcare' });
console.log(`Found ${results.total} packages`);

// Browse by category
const financePackages = marketplace.browse('finance');

// Get package details
const pkg = marketplace.getPackage('@rana-policies/fintech');
console.log(pkg?.description);

// Install from npm
const importResult = await marketplace.install({
  source: 'npm',
  identifier: '@rana-policies/saas-basic',
});

// Publish a custom policy
const publishResult = marketplace.publish(myPolicy, {
  author: 'My Company',
  scope: '@my-org',
});
```

## Built-in Catalog

Ships with 20+ curated policy packages covering:

- **Healthcare**: HIPAA, GDPR medical, state requirements
- **Finance**: SEC, PCI DSS, SOX, AML/KYC
- **Education**: FERPA, COPPA
- **Legal**: Attorney-client privilege, court filings
- **Government**: FISMA, FedRAMP, NIST
- **Insurance**: State regulations, underwriting fairness
- **Real Estate**: Fair housing (FHA, HUD)
- **HR**: Employment law, ADA, EEOC
- **Marketing**: FTC, CAN-SPAM, TCPA
- **SaaS**: Basic safety + GDPR, Enterprise SOC 2
- **AI Safety**: Strict and balanced configurations
- **Child Safety**: COPPA + enhanced protections
- **Content Moderation**: Social media, UGC
- **Customer Support**: Brand safety, escalation
- **Code Generation**: Secure coding, secrets detection
- **Data Analytics**: Anonymization, differential privacy
- **Research**: Academic ethics, IRB compliance

## Import Sources

- `npm` — Fetch from the npm registry
- `url` — Fetch JSON policy from any URL
- `file` — Load from a local file path

## Zero Dependencies

This package has zero runtime dependencies.

## License

MIT
