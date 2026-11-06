// Bundles the MCP server into one file Claude Desktop can run with plain Node.
// Run with: bun run mcp:build
import { build } from "esbuild";
import path from "node:path";

const root = path.resolve(__dirname, "..");
build({
  entryPoints: [path.join(root, "mcp/server.ts")],
  outfile: path.join(root, "mcp/dist/neuron-mcp.mjs"),
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  external: ["better-sqlite3"],
  legalComments: "none",
  banner: {
    js: [
      "// Built by scripts/build-mcp.ts. Do not edit; edit mcp/server.ts and rebuild.",
      "import { createRequire as __cr } from 'node:module'; import { fileURLToPath as __fu } from 'node:url'; import __p from 'node:path';",
      "const require = __cr(import.meta.url);",
      // the database lives two folders up from this file: <project>/data
      "process.env.NEURON_DATA_DIR ||= __p.join(__p.dirname(__fu(import.meta.url)), '..', '..', 'data');",
    ].join("\n"),
  },
}).then(() => console.log("Built mcp/dist/neuron-mcp.mjs"));
