import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fail, ok } from "@/lib/http";
import { st } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const serverFile = () => path.join(process.cwd(), "mcp", "dist", "neuron-mcp.mjs");
const nodeCmd = () => (/node(\.exe)?$/i.test(process.execPath) ? process.execPath : "node");

/** The Claude Desktop config for this PC, with real paths filled in. */
export async function GET() {
  const file = serverFile();
  const config = { mcpServers: { neuron: { command: nodeCmd(), args: [file] } } };
  const appData = process.env.APPDATA ? path.join(process.env.APPDATA, "Claude", "claude_desktop_config.json") : null;
  return ok({ built: fs.existsSync(file), file, node: nodeCmd(), config: JSON.stringify(config, null, 2), configPath: appData, platform: process.platform });
}

/** Start the server the way Claude Desktop would and ask for its tools. */
export async function POST() {
  const file = serverFile();
  if (!fs.existsSync(file)) return fail(new Error(st("The server file is missing. Run “bun run mcp:build” in the project folder.", "File server tidak ada. Jalankan “bun run mcp:build” di folder proyek.")));
  try {
    const result = await new Promise<{ tools: string[]; ms: number }>((resolve, reject) => {
      const started = Date.now();
      const child = spawn(nodeCmd(), [file], { cwd: path.dirname(file), stdio: ["pipe", "pipe", "pipe"] });
      let out = "", errOut = "";
      const timer = setTimeout(() => { child.kill(); reject(new Error(st("The server didn’t answer within 15 seconds.", "Server tidak menjawab dalam 15 detik.") + (errOut ? ` ${errOut.slice(0, 300)}` : ""))); }, 15000);
      child.stdout.on("data", (d) => {
        out += d;
        for (const line of out.split("\n")) {
          try { const m = JSON.parse(line); if (m.id === 2) { clearTimeout(timer); child.kill(); resolve({ tools: (m.result?.tools || []).map((t: { name: string }) => t.name), ms: Date.now() - started }); } } catch { /* partial line */ }
        }
      });
      child.stderr.on("data", (d) => { errOut += d; });
      child.on("error", (e) => { clearTimeout(timer); reject(e); });
      child.on("exit", (code) => { if (code && code !== 0) { clearTimeout(timer); reject(new Error(`exit ${code}: ${errOut.slice(0, 400)}`)); } });
      child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "neuron-test", version: "1" } } }) + "\n");
      child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list" }) + "\n");
    });
    return ok(result);
  } catch (e) {
    return fail(e);
  }
}
