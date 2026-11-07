import * as R from "@/lib/repo";
import * as P from "@/lib/ai/prompts";
import { generateJson, capDepth, AIError } from "@/lib/ai/generate";
import { body, fail, ok } from "@/lib/http";
import type { ClaimStatus } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const concept = sp.get("concept") || undefined, status = (sp.get("status") || undefined) as ClaimStatus | undefined;
  return ok({ claims: R.listClaims({ concept, status }), counts: R.claimCounts() });
}

export async function POST(req: Request) {
  const b = await body(req), g = R.getGraph(), lang = b.lang === "id" || b.lang === "en" ? b.lang : g.prefs.lang;
  const depth = capDepth(g.prefs.depth, "balanced");
  const concept = () => { const c = g.concepts.find((x) => x.id === String(b.conceptId)); if (!c) throw new Error("Concept not found"); return c; };
  const reply = (extra: Record<string, unknown> = {}) => ok({ claims: b.conceptId ? R.listClaims({ concept: String(b.conceptId) }) : R.listClaims(), counts: R.claimCounts(), ...extra });
  try {
    switch (b.action) {
      case "extract": {
        const c = concept(), { passages, notes } = R.conceptPassages(c.id);
        if (!passages.length && !notes.length) throw new Error(lang === "id" ? "Konsep ini belum punya bagian sumber untuk diambil klaimnya." : "This concept has no source passages to take claims from yet.");
        const r = await generateJson<{ claims: any[] }>({ messages: [{ role: "user", content: P.claimsPrompt(g, c, lang, passages, notes.map((x) => `${x.title}: ${x.note}${x.quote ? ` ("${x.quote}")` : ""}`)) }], depth, signal: req.signal, feature: "claims", conceptId: c.id, maxTokens: 2500 });
        if (!r || !Array.isArray(r.claims)) throw new AIError("invalid_json");
        const ids = R.addClaims(c.id, r.claims.map((x) => ({ text: String(x.text || ""), because: Array.isArray(x.because) ? x.because.map(String) : [], quote: x.quote ? String(x.quote) : null, chunkId: Number(x.chunk_id) || null })), "ai", lang, !!b.replace);
        return reply({ added: ids.length });
      }
      case "check": {
        const c = concept(), { passages } = R.conceptPassages(c.id);
        const all = R.listClaims({ concept: c.id });
        const todo = Array.isArray(b.ids) && b.ids.length ? all.filter((x) => b.ids.map(Number).includes(x.id)) : all.filter((x) => x.status === "unchecked");
        if (!todo.length) return reply({ checked: 0 });
        const r = await generateJson<{ results: any[] }>({ messages: [{ role: "user", content: P.checkClaimsPrompt(g, c, todo.map((x) => ({ id: x.id, text: x.text, because: x.because, quote: x.quote, chunkId: x.chunkId })), passages, lang) }], depth, signal: req.signal, feature: "fact_check", conceptId: c.id, maxTokens: 2000 });
        if (!r || !Array.isArray(r.results)) throw new AIError("invalid_json");
        let n = 0;
        for (const x of r.results) {
          const id = Number(x.id); if (!todo.some((t) => t.id === id)) continue;
          let status = String(x.status) as ClaimStatus; if (!["supported", "partly", "unsupported", "contradicted"].includes(status)) continue;
          let note = x.note ? String(x.note) : null;
          // "disputed" means the source says it but wider knowledge disagrees; a claim that isn't in the source stays "unsupported"
          if (x.doubt) { if (status === "supported" || status === "partly") status = "disputed"; note = [note, String(x.doubt)].filter(Boolean).join(" "); }
          R.setClaimCheck(id, status, note, "ai"); n++;
        }
        return reply({ checked: n });
      }
      case "add": { R.addClaims(String(b.conceptId), [{ text: String(b.text || ""), because: Array.isArray(b.because) ? b.because : [] }], "you", lang); return reply(); }
      case "update": R.updateClaim(Number(b.id), { text: b.text, because: b.because }); return reply();
      case "status": R.setClaimCheck(Number(b.id), b.status, b.note ?? null, "you"); return reply();
      case "delete": R.deleteClaim(Number(b.id)); return reply();
      default: throw new Error(`Unknown action: ${b.action}`);
    }
  } catch (e) { return fail(e); }
}
