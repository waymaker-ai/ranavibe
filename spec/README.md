# CoFounder Open Spec — `cofounder.cx/v1`

Portable declarative formats for AI-assisted development:

- **[VibeSpec](./vibespec.v1.schema.json)** — how agents should behave
- **[FlowSpec](./flowspec.v1.schema.json)** — how work is broken into steps with gates

Read the full [SPEC.md](./SPEC.md) for conformance requirements, field reference, and examples.

## Files

- `vibespec.v1.schema.json` — JSON Schema for VibeSpec documents
- `flowspec.v1.schema.json` — JSON Schema for FlowSpec documents
- `SPEC.md` — human-readable specification

## Validate a document

```bash
# Using ajv-cli
npx ajv-cli validate -s spec/vibespec.v1.schema.json -d my-vibe.yml --spec=draft2020

# Using cofounder CLI
aicofounder vibe:validate my-vibe.yml
```

## IDE integration

Add this to the top of your YAML file for schema-aware autocomplete in VS Code (with the YAML extension) and JetBrains IDEs:

```yaml
# yaml-language-server: $schema=https://cofounder.cx/spec/vibespec.v1.schema.json
apiVersion: cofounder.cx/v1
id: my_vibe
name: "My Vibe"
```

## License

- Spec text (`SPEC.md`, `README.md`): **CC-BY 4.0**
- JSON Schemas: **MIT**
