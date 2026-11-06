import * as R from "@/lib/repo";
import { st } from "@/lib/i18n";
import { body, fail, ok } from "@/lib/http";
import { AIError, capDepth, errorText, generate } from "@/lib/ai/generate";
import { assistantSystem } from "@/lib/ai/prompts";
import { search } from "@/lib/search";
import { due } from "@/lib/logic";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const KEY = "__map__";
const ERR = "\u0000ERR:";
const ACK = "Understood. I’ll use the map, the learner’s definitions and the passages, mark concepts as [[id]], and add action lines only when useful.";

export async function GET() { return ok(R.getChats(KEY)); }
export async function DELETE() { R.clearChats(KEY); return ok([]); }

export async function POST(req: Request) {
  const b = await body(req);
  const g = R.getGraph();
  const text = String(b.text || "").trim();
  if (!text) return fail(new Error(st("Type a message first.", "Tulis pesan dulu.")));
  const mentioned = (Array.isArray(b.mentions) ? b.mentions : []).map((id: string) => g.concepts.find((c) => c.id === id)).filter(Boolean);
  const selected = b.selected ? g.concepts.find((c) => c.id === b.selected) || null : null;
  let passages: { title: string; page: number | null; text: string }[] = [];
  try {
    const q = [text, ...mentioned.map((c: any) => c.label.en)].join(" ");
    const r = await search(q, 4, req.signal);
    passages = r.passages.slice(0, 4).map((p) => ({ title: p.sourceTitle || "", page: p.page ?? null, text: p.text || "" }));
  } catch { /* no search model or offline: answer from the map alone */ }
  const history = R.getChats(KEY).slice(-16);
  const messages = [
    { role: "user" as const, content: assistantSystem(g, { mentioned, selected, passages, due: due(g.concepts) }) },
    { role: "assistant" as const, content: ACK },
    ...history,
    { role: "user" as const, content: text },
  ];
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(ctl) {
      let sent = 0;
      try {
        const answer = await generate({
          messages, depth: capDepth(g.prefs.depth, "balanced"), signal: req.signal, feature: "assistant",
          onText: (t) => { if (t.length > sent) { ctl.enqueue(enc.encode(t.slice(sent))); sent = t.length; } },
        });
        if (answer.length > sent) ctl.enqueue(enc.encode(answer.slice(sent)));
        R.addChat(KEY, "user", text);
        R.addChat(KEY, "assistant", answer);
      } catch (e) {
        const code = e instanceof AIError ? e.code : "provider_error";
        try { ctl.enqueue(enc.encode(`${ERR}${code}:${errorText(code) || String((e as Error).message)}`)); } catch { /* gone */ }
      }
      try { ctl.close(); } catch { /* closed */ }
    },
  });
  return new Response(stream, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
}
