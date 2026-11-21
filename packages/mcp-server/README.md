# CoFounder MCP server

This package starts a local MCP server over standard input and output. The published 2.1.0 package includes a workspace dependency that prevents installation in a clean npm project. Use the checked source and confirm a successful consumer build before deploying a new package version.

## Check a candidate

From the repository root with its pinned pnpm version, run these commands in a disposable checkout.

```sh
pnpm install --frozen-lockfile
pnpm --filter @waymakerai/aicofounder-core build
pnpm --filter @waymakerai/aicofounder-mcp-server build
cd packages/mcp-server
pnpm pack
```

Install the resulting tarball in an empty directory. Configure an MCP client to run the local `aicofounder-mcp` executable in that directory. Initialize, list tools and read a public template before giving the server access to a real project. Keep the exact package version, tool list and any failed check with the pilot results.
