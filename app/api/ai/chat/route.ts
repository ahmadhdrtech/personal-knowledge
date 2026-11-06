import * as R from "@/lib/repo";
import { st } from "@/lib/i18n";
import { body, fail, ok } from "@/lib/http";
import { AIError, capDepth, errorText, generate } from "@/lib/ai/generate";
import { DISCUSS_ACK, discussSystem } from "@/lib/ai/prompts";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Marker the client looks for when a streamed answer fails part-way. */
const ERR = "\u0000ERR:";

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("conceptId") || "";
  return ok(R.getChats(id));
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("conceptId") || "";
  R.clearChats(id);
  return ok([]);
}

export async function POST(req: Request) {
  const b = await body(req);
  const g = R.getGraph();
  const n = g.concepts.find((c) => c.id === b.conceptId);
  if (!n) return fail(new Error(st("Concept not found", "Konsep tidak ditemukan")), 404);
  const text = String(b.text || "").trim();
  if (!text) return fail(new Error(st("Type a message first.", "Tulis pesan dulu.")));
  const history = R.getChats(n.id);
  const messages = [
    { role: "user" as const, content: discussSystem(g, n) },
    { role: "assistant" as const, content: DISCUSS_ACK },
    ...history,
    { role: "user" as const, content: text },
  ];
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(ctl) {
      let sent = 0;
      try {
        const answer = await generate({
          messages, depth: capDepth(g.prefs.depth, "balanced"), signal: req.signal, feature: "discuss", conceptId: n.id,
          onText: (t) => { if (t.length > sent) { ctl.enqueue(enc.encode(t.slice(sent))); sent = t.length; } },
        });
        if (answer.length > sent) ctl.enqueue(enc.encode(answer.slice(sent)));
        R.addChat(n.id, "user", text);
        R.addChat(n.id, "assistant", answer);
      } catch (e) {
        const code = e instanceof AIError ? e.code : "provider_error";
        try { ctl.enqueue(enc.encode(`${ERR}${code}:${errorText(code) || String((e as Error).message)}`)); } catch { /* client gone */ }
      }
      try { ctl.close(); } catch { /* already closed */ }
    },
  });
  return new Response(stream, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
}
