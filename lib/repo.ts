import { and, eq, inArray, or } from "drizzle-orm";
import { getDb, schema as S } from "./db";
import { seedDemo, clearMap as clearMapDb } from "./db/seed";
import { normalizeBlog, type BlogSettings } from "./blog";
import { OFFLINE, SAMPLE_TITLE } from "./seed-data";
import { clampMastery, essayDelta, LINK_TYPES, mcqDelta, slug } from "./logic";
import { bestChunk, chunkText } from "./extract";
import { reviewInfo, scheduleReview, rateMcq, rateEssay } from "./review";
import type {
  Bi, Calibration, Concept, Confidence, Depth, Domain, Graph, GlossaryItem, ImportReport, Link, LinkType,
  McqQuestion, Prefs, SourceRow, Writing, Profile, PostFields, Lesson, LessonStep, ProbeItem, LessonResult, Study, StudyItem, StudyMode, StudyPassage, Claim, ClaimStatus,
} from "./types";

const db = () => getDb();
const now = () => Date.now();

/* ---------------- settings ---------------- */
export function getSetting<T>(key: string, fallback: T): T {
  const r = db().select().from(S.settings).where(eq(S.settings.key, key)).get();
  if (!r) return fallback;
  try { return JSON.parse(r.value) as T; } catch { return fallback; }
}
export function setSetting(key: string, value: unknown) {
  db().insert(S.settings).values({ key, value: JSON.stringify(value) })
    .onConflictDoUpdate({ target: S.settings.key, set: { value: JSON.stringify(value) } }).run();
}
const DEFAULT_PREFS: Prefs = { lang: "en", view: "domains", depth: "balanced", theme: "system" };
export function getPrefs(): Prefs {
  const p = { ...DEFAULT_PREFS, ...getSetting<Partial<Prefs>>("prefs", {}) };
  if (p.lang !== "en" && p.lang !== "id") p.lang = "en"; // older versions had "both"
  return p;
}
export function setPrefs(p: Partial<Prefs>) {
  const cur = getPrefs();
  const next: Prefs = { ...cur };
  if (p.lang && ["en", "id"].includes(p.lang)) next.lang = p.lang;
  if (p.view && ["network", "domains"].includes(p.view)) next.view = p.view;
  if (p.depth && ["quick", "balanced", "deep"].includes(p.depth)) next.depth = p.depth;
  if (p.theme && ["system", "light", "dark"].includes(p.theme)) next.theme = p.theme;
  setSetting("prefs", next);
  return next;
}
export const DEFAULT_PROFILE: Profile = { name: "", about: "", interests: "", examples: "" };
const clean = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
export function getProfile(): Profile { return { ...DEFAULT_PROFILE, ...getSetting<Partial<Profile>>("profile", {}) }; }
export function setProfile(p: Partial<Profile>) {
  const cur = getProfile();
  setSetting("profile", { name: clean(p.name ?? cur.name, 80), about: clean(p.about ?? cur.about, 400), interests: clean(p.interests ?? cur.interests, 400), examples: clean(p.examples ?? cur.examples, 300) });
}
export function getBlog(): BlogSettings { return normalizeBlog(getSetting<Record<string, unknown> | null>("blog", null)); }
export function setBlog(b: Partial<BlogSettings>) { setSetting("blog", normalizeBlog({ ...getBlog(), ...b })); }
export function getTiers(): Record<Depth, number | null> {
  return { quick: null, balanced: null, deep: null, ...getSetting<Record<string, number | null>>("tiers", {}) } as Record<Depth, number | null>;
}

/* ---------------- graph ---------------- */
export function getGraph(): Graph {
  const d = db();
  const domains: Domain[] = d.select().from(S.domains).all()
    .sort((a, b) => a.colorIndex - b.colorIndex)
    .map((r) => ({ key: r.key, name: { en: r.nameEn, id: r.nameId }, color: r.colorIndex }));
  const cds = d.select().from(S.conceptDomains).all().sort((a, b) => a.position - b.position);
  const srcs = d.select().from(S.sources).all();
  const srcTitle = new Map(srcs.map((s) => [s.id, s.title]));
  const cs = d.select().from(S.conceptSources).all();
  const chunkPage = new Map(d.select({ id: S.chunks.id, page: S.chunks.page }).from(S.chunks).all().map((x) => [x.id, x.page]));
  const cards = reviewInfo();
  const vs = d.select().from(S.vocab).all();
  const qs = d.select().from(S.questions).where(eq(S.questions.kind, "mcq")).all();
  const att = d.select({ conceptId: S.attempts.conceptId, correct: S.attempts.correct, confidence: S.attempts.confidence }).from(S.attempts).all();

  const attCount = new Map<string, number>();
  const calibration: Calibration = { total: att.length, sure: { n: 0, right: 0 }, fair: { n: 0, right: 0 }, guess: { n: 0, right: 0 } };
  for (const a of att) {
    attCount.set(a.conceptId, (attCount.get(a.conceptId) || 0) + 1);
    const b = calibration[a.confidence as Confidence];
    if (b) { b.n++; if (a.correct) b.right++; }
  }

  const concepts: Concept[] = d.select().from(S.concepts).all()
    .sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id))
    .map((c) => ({
      id: c.id,
      label: { en: c.labelEn, id: c.labelId || c.labelEn },
      summary: { en: c.summaryEn, id: c.summaryId || c.summaryEn },
      userDef: c.userDefinition || null,
      mastery: c.mastery,
      miscon: !!c.misconception,
      auto: !!c.auto,
      origin: c.originSourceId ? srcTitle.get(c.originSourceId) || null : null,
      domains: cds.filter((x) => x.conceptId === c.id).map((x) => x.domainKey),
      sources: cs.filter((x) => x.conceptId === c.id).map((x) => ({ sourceId: x.sourceId, title: srcTitle.get(x.sourceId) || "Source", note: x.note, quote: x.quote || null, chunkId: x.chunkId || null, page: x.chunkId ? chunkPage.get(x.chunkId) ?? null : null })),
      vocab: vs.filter((x) => x.conceptId === c.id).map((x) => ({ vid: x.id, en: x.termEn, ind: x.termId, ex: x.example })),
      quiz: qs.filter((x) => x.conceptId === c.id).map(toMcq).filter(Boolean) as McqQuestion[],
      attempts: attCount.get(c.id) || 0,
      review: cards.get(c.id) || null,
    }));
  const ids = new Set(concepts.map((c) => c.id));
  for (const c of concepts) if (!c.domains.length && domains[0]) c.domains = [domains[0].key];

  const links: Link[] = d.select().from(S.links).all()
    .filter((l) => ids.has(l.fromId) && ids.has(l.toId))
    .map((l) => ({
      lid: l.id, from: l.fromId, to: l.toId, type: l.type as LinkType, status: l.status as Link["status"],
      why: l.whyEn || l.whyId ? { en: l.whyEn || "", id: l.whyId || l.whyEn || "" } : null,
    }));
  const glossary: GlossaryItem[] = d.select().from(S.glossary).all().sort((a, b) => a.createdAt - b.createdAt).map((g) => ({ term: g.term, definition: g.definition }));

  const tiers = getTiers();
  const modelRows = d.select().from(S.models).all();
  const tierLabel = (id: number | null) => (id ? modelRows.find((m) => m.id === id)?.label || null : null);

  return {
    domains, concepts, links, glossary,
    lastImport: getSetting<ImportReport | null>("last_import", null),
    prefs: getPrefs(),
    calibration,
    ai: { ready: Object.values(tiers).some(Boolean), tiers: { quick: tierLabel(tiers.quick), balanced: tierLabel(tiers.balanced), deep: tierLabel(tiers.deep) } },
    demoOffline: getSetting<boolean>("demo_offline", false),
    profile: getProfile(), blog: getBlog(),
  };
}

function toMcq(r: typeof S.questions.$inferSelect): McqQuestion | null {
  try {
    const p = JSON.parse(r.payloadJson);
    return { qid: r.id, q: p.q, o: p.o, a: p.a, why: p.why, bridge: r.bridgeConceptId, ai: !!r.aiGenerated };
  } catch { return null; }
}

export function getConcept(id: string) {
  return getGraph().concepts.find((c) => c.id === id) || null;
}

/* ---------------- concept edits ---------------- */
export function setDefinition(id: string, def: string | null) {
  db().update(S.concepts).set({ userDefinition: def && def.trim() ? def.trim() : null, updatedAt: now() }).where(eq(S.concepts.id, id)).run();
}
export function addVocab(conceptId: string, items: { en: string; ind: string; ex?: string }[]) {
  for (const v of items) {
    if (!v.en?.trim() || !v.ind?.trim()) continue;
    db().insert(S.vocab).values({ conceptId, termEn: v.en.trim(), termId: v.ind.trim(), example: (v.ex || "").trim() }).run();
  }
}
export function deleteVocab(vid: number) { db().delete(S.vocab).where(eq(S.vocab.id, vid)).run(); }

export function decideLink(lid: number, ok: boolean) {
  if (ok) db().update(S.links).set({ status: "approved" }).where(eq(S.links.id, lid)).run();
  else db().delete(S.links).where(eq(S.links.id, lid)).run();
}
export function approveLinks(lids: number[]) {
  if (lids.length) db().update(S.links).set({ status: "approved" }).where(and(inArray(S.links.id, lids), eq(S.links.status, "suggested"))).run();
}
export function addLink(from: string, to: string, type: LinkType, status: "suggested" | "approved", why?: Bi | null, sourceId?: number | null) {
  if (from === to || !LINK_TYPES.includes(type)) return null;
  const exists = db().select().from(S.links).where(or(and(eq(S.links.fromId, from), eq(S.links.toId, to)), and(eq(S.links.fromId, to), eq(S.links.toId, from)))).get();
  if (exists) return null;
  return db().insert(S.links).values({ fromId: from, toId: to, type, status, whyEn: why?.en || null, whyId: why?.id || null, sourceId: sourceId || null, createdAt: now() }).returning({ id: S.links.id }).get().id;
}

/* ---------------- glossary ---------------- */
export function upsertGlossary(term: string, definition: string) {
  term = term.trim(); definition = definition.trim();
  if (!term || !definition) return;
  const all = db().select().from(S.glossary).all();
  const hit = all.find((g) => g.term.toLowerCase() === term.toLowerCase());
  if (hit) db().update(S.glossary).set({ definition }).where(eq(S.glossary.term, hit.term)).run();
  else db().insert(S.glossary).values({ term, definition, createdAt: now() }).run();
}
export function deleteGlossary(term: string) { db().delete(S.glossary).where(eq(S.glossary.term, term)).run(); }

/* ---------------- tests ---------------- */
function applyMastery(conceptId: string, delta: number, misconception?: boolean) {
  const c = db().select().from(S.concepts).where(eq(S.concepts.id, conceptId)).get();
  if (!c) return 0;
  const mastery = clampMastery(c.mastery + delta);
  db().update(S.concepts).set({ mastery, updatedAt: now(), ...(misconception === undefined ? {} : { misconception }) }).where(eq(S.concepts.id, conceptId)).run();
  return mastery;
}

export function answerMcq(conceptId: string, qid: number, choice: number, conf: Confidence) {
  const row = db().select().from(S.questions).where(eq(S.questions.id, qid)).get();
  if (!row) throw new Error("Question not found");
  const q = toMcq(row)!;
  const right = choice === q.a;
  const bridge = !!(q.bridge && db().select().from(S.concepts).where(eq(S.concepts.id, q.bridge)).get());
  const delta = mcqDelta(right, conf, bridge);
  const miscon = !right && conf === "sure" ? true : right && conf === "sure" ? false : undefined;
  const mastery = applyMastery(conceptId, delta, miscon);
  if (right && bridge && conf !== "guess") applyMastery(q.bridge!, 5);
  db().insert(S.attempts).values({ conceptId, questionId: qid, kind: "mcq", correct: right, confidence: conf, masteryDelta: delta, answerText: String(choice), createdAt: now() }).run();
  const next = scheduleReview(conceptId, rateMcq(right, conf));
  return { right, delta, mastery, answer: q.a, nextReview: next };
}

export interface EssayResult {
  score: number; verdict: string; got: string[]; missing: string[]; misconceptions: string[];
  feedback_en: string; feedback_id: string; model_answer_en: string; model_answer_id: string; unknown_terms: string[];
}
export function recordEssay(conceptId: string, question: { q: Bi; rubric: string[] }, answer: string, conf: Confidence, r: EssayResult) {
  const delta = essayDelta(r.score, conf);
  const right = r.score >= 70;
  let miscon: boolean | undefined = !right && conf === "sure" ? true : right && conf === "sure" ? false : undefined;
  if (r.misconceptions.length && conf === "sure") miscon = true;
  const mastery = applyMastery(conceptId, delta, miscon);
  const qid = db().insert(S.questions).values({ conceptId, kind: "essay", payloadJson: JSON.stringify(question), aiGenerated: true, createdAt: now() }).returning({ id: S.questions.id }).get().id;
  db().insert(S.attempts).values({ conceptId, questionId: qid, kind: "essay", correct: right, score: r.score, confidence: conf, masteryDelta: delta, answerText: answer, feedbackJson: JSON.stringify(r), createdAt: now() }).run();
  const next = scheduleReview(conceptId, rateEssay(r.score, conf));
  return { delta, mastery, nextReview: next };
}

/** A result from outside the app (e.g. Claude Desktop quizzing you through MCP). Same scoring and schedule as in-app tests. */
export function recordExternal(conceptId: string, r: { kind: "quiz" | "essay"; correct?: boolean; score?: number; confidence: Confidence; note?: string }) {
  const essay = r.kind === "essay";
  const score = essay ? Math.max(0, Math.min(100, Math.round(Number(r.score) || 0))) : null;
  const right = essay ? (score as number) >= 70 : !!r.correct;
  const delta = essay ? essayDelta(score as number, r.confidence) : mcqDelta(right, r.confidence, false);
  const miscon = !right && r.confidence === "sure" ? true : right && r.confidence === "sure" ? false : undefined;
  const mastery = applyMastery(conceptId, delta, miscon);
  db().insert(S.attempts).values({ conceptId, kind: essay ? "essay" : "mcq", correct: right, score, confidence: r.confidence, masteryDelta: delta, answerText: r.note ? `[Claude] ${r.note}` : "[Claude]", createdAt: now() }).run();
  const nextReview = scheduleReview(conceptId, essay ? rateEssay(score as number, r.confidence) : rateMcq(right, r.confidence));
  return { right, delta, mastery, nextReview };
}

export function addMcq(conceptId: string, p: { q: Bi; o: Bi[]; a: number; why: Bi }, bridge: string | null) {
  return db().insert(S.questions).values({ conceptId, kind: "mcq", payloadJson: JSON.stringify(p), bridgeConceptId: bridge, aiGenerated: true, createdAt: now() }).returning({ id: S.questions.id }).get().id;
}
export function deleteQuestion(qid: number) { db().delete(S.questions).where(eq(S.questions.id, qid)).run(); }

export function recentAttempts(limit = 30) {
  const rows = db().select().from(S.attempts).all().sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  return rows.map((r) => ({ id: r.id, conceptId: r.conceptId, kind: r.kind, correct: !!r.correct, score: r.score, confidence: r.confidence, delta: r.masteryDelta, at: r.createdAt }));
}

/* ---------------- chats ---------------- */
export function getChats(conceptId: string) {
  return db().select().from(S.chats).where(eq(S.chats.conceptId, conceptId)).all().sort((a, b) => a.id - b.id).map((c) => ({ role: c.role as "user" | "assistant", content: c.content }));
}
export function addChat(conceptId: string, role: "user" | "assistant", content: string) {
  db().insert(S.chats).values({ conceptId, role, content, createdAt: now() }).run();
}
export function clearChats(conceptId: string) { db().delete(S.chats).where(eq(S.chats.conceptId, conceptId)).run(); }

/* ---------------- sources ---------------- */
export function listSources(): SourceRow[] {
  const d = db();
  const srcs = d.select().from(S.sources).all().sort((a, b) => b.createdAt - a.createdAt || b.id - a.id);
  const cs = d.select().from(S.conceptSources).all();
  const cons = d.select().from(S.concepts).all();
  const chunkCount = new Map((d.$client.prepare("SELECT source_id AS s, COUNT(*) AS n FROM chunks GROUP BY source_id").all() as { s: number; n: number }[]).map((x) => [x.s, x.n]));
  return srcs.map((s) => ({
    id: s.id, title: s.title, kind: s.kind, urlOrPath: s.urlOrPath, createdAt: s.createdAt, chunks: chunkCount.get(s.id) || 0,
    words: s.text ? s.text.trim().split(/\s+/).length : 0,
    concepts: [...new Set(cs.filter((x) => x.sourceId === s.id).map((x) => x.conceptId))]
      .map((id) => cons.find((c) => c.id === id)).filter(Boolean)
      .map((c) => ({ id: c!.id, label: { en: c!.labelEn, id: c!.labelId } })),
  }));
}
export function getSource(id: number) { return db().select().from(S.sources).where(eq(S.sources.id, id)).get() || null; }
export function getChunk(id: number) {
  const c = db().select().from(S.chunks).where(eq(S.chunks.id, id)).get();
  if (!c) return null;
  const src = getSource(c.sourceId);
  return { id: c.id, page: c.page, text: c.text, sourceTitle: src?.title || "", urlOrPath: src?.urlOrPath || null };
}
export function deleteSource(id: number) {
  const d = db();
  d.$client.prepare("DELETE FROM study_items WHERE source_id = ?").run(id);
  d.$client.prepare("DELETE FROM study_adapt WHERE source_id = ?").run(id);
  d.delete(S.conceptSources).where(eq(S.conceptSources.sourceId, id)).run();
  d.delete(S.chunks).where(eq(S.chunks.sourceId, id)).run();
  d.delete(S.sources).where(eq(S.sources.id, id)).run();
}

/* ---------------- import ---------------- */
export interface ImportJson {
  new_domains?: { key?: string; en?: string; id?: string }[];
  concepts?: { key?: string; existing_id?: string | null; label_en?: string; label_id?: string; summary_en?: string; summary_id?: string; domains?: string[]; source_note?: string; quote?: string; vocab?: { en?: string; id?: string; ex?: string }[] }[];
  links?: { from?: string; to?: string; type?: string; why_en?: string; why_id?: string }[];
  unknown_terms?: string[];
}

export interface ImportMeta { kind?: string; urlOrPath?: string | null; sourceId?: number | null; pageStart?: number; paged?: boolean }

/** Apply the model's reply. With meta.sourceId, adds another part of a long document to the same source. */
export function applyImport(title: string, text: string, r: ImportJson, meta: ImportMeta = {}, similar: ImportReport["similar"] = []): ImportReport {
  if (!r || !Array.isArray(r.concepts)) throw new Error("invalid_json");
  const d = db();
  const report: ImportReport = { title, sourceId: null, added: [], merged: [], domains: [], links: [], unknown: (r.unknown_terms || []).map(String).filter(Boolean).slice(0, 6), at: now() };
  const tx = d.$client.transaction(() => {
    let sourceId: number;
    const existing = meta.sourceId ? d.select().from(S.sources).where(eq(S.sources.id, meta.sourceId)).get() : undefined;
    if (existing) {
      sourceId = existing.id;
      d.update(S.sources).set({ text: existing.text + "\f" + text }).where(eq(S.sources.id, sourceId)).run();
    } else {
      sourceId = d.insert(S.sources).values({ title, kind: meta.kind || "text", urlOrPath: meta.urlOrPath || null, text, createdAt: now() }).returning({ id: S.sources.id }).get().id;
    }
    report.sourceId = sourceId;
    // passages, so each concept can cite the exact part of the source it came from
    const startIdx = (d.$client.prepare("SELECT COALESCE(MAX(idx), -1) + 1 AS n FROM chunks WHERE source_id = ?").get(sourceId) as { n: number }).n;
    chunkText(text, meta.pageStart || 1, !!meta.paged || meta.kind === "pdf").forEach((c, i) => d.insert(S.chunks).values({ sourceId, idx: startIdx + i, page: c.page, text: c.text }).run());
    const partChunks = d.select({ id: S.chunks.id, idx: S.chunks.idx, text: S.chunks.text }).from(S.chunks).where(eq(S.chunks.sourceId, sourceId)).all().filter((c) => c.idx >= startIdx);
    const cite = (q?: string) => (q ? bestChunk(q, partChunks) : null);

    const domainRows = () => d.select().from(S.domains).all();
    const hasDomain = (k: string) => domainRows().some((x) => x.key === k);
    for (const nd of r.new_domains || []) {
      if (!nd || !nd.en) continue;
      const key = slug(nd.key || nd.en);
      if (hasDomain(key)) continue;
      d.insert(S.domains).values({ key, nameEn: String(nd.en), nameId: String(nd.id || nd.en), colorIndex: domainRows().length }).run();
      report.domains.push(key);
    }
    const firstDomain = domainRows().sort((a, b) => a.colorIndex - b.colorIndex)[0]?.key;
    const keyMap: Record<string, string> = {};
    const allConcepts = () => d.select().from(S.concepts).all();

    for (const c of r.concepts!) {
      if (!c || !c.label_en) continue;
      const doms = (c.domains || []).map((k) => (hasDomain(k) ? k : hasDomain(slug(k)) ? slug(k) : null)).filter(Boolean) as string[];
      const note = String(c.source_note || "Mentioned in this source.");
      const quote = c.quote ? String(c.quote).slice(0, 400) : null;
      const chunkId = cite(c.quote);
      const vocab = (c.vocab || []).filter((v) => v && v.en && v.id).map((v) => ({ en: String(v.en), ind: String(v.id), ex: String(v.ex || "") }));
      let ex = c.existing_id ? allConcepts().find((x) => x.id === c.existing_id) : undefined;
      if (!ex) ex = allConcepts().find((x) => x.labelEn.toLowerCase() === String(c.label_en).toLowerCase());
      if (ex) {
        const id = ex.id;
        const already = d.select().from(S.conceptSources).where(and(eq(S.conceptSources.conceptId, id), eq(S.conceptSources.sourceId, sourceId))).get();
        if (!already) d.insert(S.conceptSources).values({ conceptId: id, sourceId, note, quote, chunkId }).run();
        const cur = d.select().from(S.conceptDomains).where(eq(S.conceptDomains.conceptId, id)).all();
        let pos = cur.length;
        for (const k of doms) if (!cur.some((x) => x.domainKey === k) && pos < 3) d.insert(S.conceptDomains).values({ conceptId: id, domainKey: k, position: pos++ }).run();
        const curV = d.select().from(S.vocab).where(eq(S.vocab.conceptId, id)).all();
        addVocab(id, vocab.filter((v) => !curV.some((x) => x.termEn.toLowerCase() === v.en.toLowerCase())));
        d.update(S.concepts).set({ updatedAt: now() }).where(eq(S.concepts.id, id)).run();
        keyMap[c.key || c.label_en] = id;
        if (c.existing_id) keyMap[c.existing_id] = id;
        if (!report.merged.includes(id)) report.merged.push(id);
      } else {
        let id = slug(c.label_en), i = 2;
        const base = id;
        while (allConcepts().some((x) => x.id === id)) id = `${base}_${i++}`;
        d.insert(S.concepts).values({
          id, labelEn: String(c.label_en), labelId: String(c.label_id || c.label_en), summaryEn: String(c.summary_en || ""), summaryId: String(c.summary_id || c.summary_en || ""),
          mastery: 0, misconception: false, auto: true, originSourceId: sourceId, createdAt: now(), updatedAt: now(),
        }).run();
        const topics = doms.length ? doms.slice(0, 3) : [report.domains[0] || firstDomain].filter(Boolean) as string[];
        topics.forEach((k, pos) => d.insert(S.conceptDomains).values({ conceptId: id, domainKey: k, position: pos }).run());
        d.insert(S.conceptSources).values({ conceptId: id, sourceId, note, quote, chunkId }).run();
        addVocab(id, vocab);
        keyMap[c.key || c.label_en] = id;
        report.added.push(id);
      }
    }
    const ids = new Set(allConcepts().map((x) => x.id));
    const resolve = (k?: string) => (k ? keyMap[k] || (ids.has(k) ? k : null) : null);
    for (const l of r.links || []) {
      if (!l) continue;
      const s = resolve(l.from), t = resolve(l.to);
      if (!s || !t || s === t || !LINK_TYPES.includes(l.type as LinkType)) continue;
      const lid = addLink(s, t, l.type as LinkType, "suggested", { en: String(l.why_en || ""), id: String(l.why_id || "") }, sourceId);
      if (lid) report.links.push(lid);
    }
    // parts of one long document add up to one report
    const prev = getSetting<ImportReport | null>("last_import", null);
    if (existing && prev && prev.sourceId === sourceId) {
      const uniq = (a: (string | number)[]) => [...new Set(a)];
      report.added = uniq([...prev.added, ...report.added]) as string[];
      report.merged = (uniq([...prev.merged, ...report.merged]) as string[]).filter((x) => !report.added.includes(x));
      report.domains = uniq([...prev.domains, ...report.domains]) as string[];
      report.links = uniq([...prev.links, ...report.links]) as number[];
      report.unknown = (uniq([...prev.unknown, ...report.unknown]) as string[]).slice(0, 10);
    }
    report.similar = [...(existing && prev && prev.sourceId === sourceId ? prev.similar || [] : []), ...(similar || [])];
    report.title = existing ? existing.title : title;
    setSetting("last_import", report);
  });
  tx();
  return report;
}

export function applyOffline() {
  if (getSetting("demo_offline", false)) return null;
  const d = db();
  const report: ImportReport = { title: SAMPLE_TITLE, sourceId: null, added: [], merged: [], domains: [], links: [], unknown: [], at: now() };
  d.$client.transaction(() => {
    const sourceId = d.insert(S.sources).values({ title: SAMPLE_TITLE, kind: "text", text: "", createdAt: now() }).returning({ id: S.sources.id }).get().id;
    report.sourceId = sourceId;
    for (const n of OFFLINE.nodes) {
      if (d.select().from(S.concepts).where(eq(S.concepts.id, n.id)).get()) continue;
      d.insert(S.concepts).values({ id: n.id, labelEn: n.label.en, labelId: n.label.id, summaryEn: n.summary.en, summaryId: n.summary.id, mastery: 0, auto: true, originSourceId: sourceId, createdAt: now(), updatedAt: now() }).run();
      n.topics.forEach((k: string, i: number) => d.insert(S.conceptDomains).values({ conceptId: n.id, domainKey: k, position: i }).run());
      d.insert(S.conceptSources).values({ conceptId: n.id, sourceId, note: n.sources[0].n }).run();
      addVocab(n.id, n.vocab.map((v: { en: string; id: string; ex: string }) => ({ en: v.en, ind: v.id, ex: v.ex })));
      report.added.push(n.id);
    }
    if (d.select().from(S.concepts).where(eq(S.concepts.id, OFFLINE.merge.id)).get()) {
      d.insert(S.conceptSources).values({ conceptId: OFFLINE.merge.id, sourceId, note: OFFLINE.merge.source.n }).run();
      report.merged.push(OFFLINE.merge.id);
    }
    for (const l of OFFLINE.links) {
      const lid = addLink(l.source, l.target, l.type, "suggested", { en: l.why.en, id: "" }, sourceId);
      if (lid) report.links.push(lid);
    }
    setSetting("last_import", report);
    setSetting("demo_offline", true);
  })();
  return report;
}

export function addToLastImport(lid: number) {
  const r = getSetting<ImportReport | null>("last_import", null);
  if (r && !r.links.includes(lid)) { r.links.push(lid); setSetting("last_import", r); }
}
export function dismissImport() { d0().prepare("DELETE FROM settings WHERE key='last_import'").run(); }
const d0 = () => db().$client;

export function resetDemo() { seedDemo(db()); }
export function clearMap() { clearMapDb(db()); }

/* ---------------- export ---------------- */
export function exportAll() {
  const s = d0();
  const tables = ["domains", "concepts", "concept_domains", "sources", "chunks", "concept_sources", "links", "vocab", "questions", "attempts", "glossary", "chats", "settings", "models", "usage_log"];
  const out: Record<string, unknown> = { app: "neuron", exportedAt: new Date().toISOString() };
  for (const t of tables) out[t] = s.prepare(`SELECT * FROM ${t}`).all();
  out.providers = s.prepare("SELECT id, kind, name, base_url, enabled, created_at FROM providers").all(); // keys left out on purpose
  return out;
}

/* ---------------- progress over time ---------------- */
/** Mastery per day, rebuilt from answers: mastery at a moment = today's mastery minus the changes since. */
export function progress(days: number) {
  const d = db();
  const cons = d.select({ id: S.concepts.id, labelEn: S.concepts.labelEn, labelId: S.concepts.labelId, mastery: S.concepts.mastery, createdAt: S.concepts.createdAt, miscon: S.concepts.misconception }).from(S.concepts).all();
  const att = d.select({ conceptId: S.attempts.conceptId, delta: S.attempts.masteryDelta, correct: S.attempts.correct, at: S.attempts.createdAt }).from(S.attempts).all();
  const dayStart = (t: number) => { const x = new Date(t); x.setHours(0, 0, 0, 0); return x.getTime(); };
  const today = dayStart(Date.now());
  const starts = Array.from({ length: days }, (_, i) => today - (days - 1 - i) * 86_400_000);
  const masteryAt = (cid: string, current: number, t: number) => Math.max(0, Math.min(100, current - att.filter((a) => a.conceptId === cid && a.at > t).reduce((s, a) => s + a.delta, 0)));
  const daily = starts.map((s) => {
    const end = s + 86_400_000;
    const alive = cons.filter((c) => c.createdAt < end);
    const avg = alive.length ? alive.reduce((sum, c) => sum + masteryAt(c.id, c.mastery, Math.min(end, Date.now())), 0) / alive.length : null;
    const dayAtt = att.filter((a) => a.at >= s && a.at < end);
    return { day: s, avg: avg == null ? null : Math.round(avg * 10) / 10, answers: dayAtt.length, right: dayAtt.filter((a) => a.correct).length, solid: alive.filter((c) => masteryAt(c.id, c.mastery, Math.min(end, Date.now())) >= 60).length, concepts: alive.length };
  });
  const from = starts[0];
  const change = cons.map((c) => ({ id: c.id, label: { en: c.labelEn, id: c.labelId || c.labelEn }, now: c.mastery, before: masteryAt(c.id, c.mastery, Math.max(from, c.createdAt)), miscon: !!c.miscon, answers: att.filter((a) => a.conceptId === c.id && a.at >= from).length }))
    .map((x) => ({ ...x, gain: x.now - x.before }));
  let streak = 0;
  for (let s = today; ; s -= 86_400_000) { if (att.some((a) => a.at >= s && a.at < s + 86_400_000)) streak++; else if (s === today) continue; else break; if (streak > 3650) break; }
  return {
    days, daily, streak,
    improved: change.filter((x) => x.gain > 0 && !x.miscon).sort((a, b) => b.gain - a.gain).slice(0, 6),
    slipping: change.filter((x) => x.gain < 0 || x.miscon).sort((a, b) => Number(b.miscon) - Number(a.miscon) || a.gain - b.gain).slice(0, 6),
    totals: { answers: att.filter((a) => a.at >= from).length, right: att.filter((a) => a.at >= from && a.correct).length, activeDays: daily.filter((x) => x.answers > 0).length },
  };
}

/* ---------------- writing and discussion notes ---------------- */
type WritingRow = { id: number; kind: string; title: string; body: string; brief_json: string; concept_ids: string; lang: string | null; post_json: string | null; created_at: number; updated_at: number };
const toWriting = (r: WritingRow): Writing => {
  let brief: Record<string, string> = {}, ids: string[] = [];
  try { brief = JSON.parse(r.brief_json) || {}; } catch {}
  try { ids = JSON.parse(r.concept_ids) || []; } catch {}
  let post: PostFields | null = null;
  try { post = r.post_json ? JSON.parse(r.post_json) : null; } catch {}
  return { id: r.id, kind: r.kind === "note" ? "note" : "writing", title: r.title, body: r.body, brief, conceptIds: ids, lang: r.lang, post, createdAt: r.created_at, updatedAt: r.updated_at };
};
export function listWritings(opts: { kind?: string; query?: string; concept?: string } = {}): Writing[] {
  let rows = (db().$client.prepare("SELECT * FROM writings ORDER BY updated_at DESC").all() as WritingRow[]).map(toWriting);
  if (opts.kind) rows = rows.filter((w) => w.kind === opts.kind);
  if (opts.concept) rows = rows.filter((w) => w.conceptIds.includes(opts.concept!));
  if (opts.query) { const q = opts.query.toLowerCase(); rows = rows.filter((w) => `${w.title} ${w.body} ${Object.values(w.brief).join(" ")}`.toLowerCase().includes(q)); }
  return rows;
}
export function getWriting(id: number): Writing | null {
  const r = db().$client.prepare("SELECT * FROM writings WHERE id = ?").get(id) as WritingRow | undefined;
  return r ? toWriting(r) : null;
}
/** A URL slug: lowercase words joined by hyphens. */
export const slugify = (s: string, max = 80) => s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, max).replace(/-+$/, "");
export function saveWriting(w: { id?: number | null; kind: "writing" | "note"; title: string; body: string; brief?: Record<string, string>; conceptIds?: string[]; lang?: string | null; post?: PostFields | null }): number {
  const s = db().$client, now = Date.now();
  const brief = JSON.stringify(Object.fromEntries(Object.entries(w.brief || {}).filter(([, v]) => v != null && String(v).trim()).map(([k, v]) => [k, String(v).trim()])));
  const ids = JSON.stringify([...new Set(w.conceptIds || [])]);
  const post = w.post ? JSON.stringify(w.post) : null;
  if (w.id) {
    const r = s.prepare("UPDATE writings SET kind = ?, title = ?, body = ?, brief_json = ?, concept_ids = ?, lang = ?, post_json = COALESCE(?, post_json), updated_at = ? WHERE id = ?").run(w.kind, w.title, w.body, brief, ids, w.lang ?? null, post, now, w.id);
    if (r.changes) return w.id;
  }
  return Number(s.prepare("INSERT INTO writings (kind, title, body, brief_json, concept_ids, lang, post_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(w.kind, w.title, w.body, brief, ids, w.lang ?? null, post, now, now).lastInsertRowid);
}
export function updateWritingText(id: number, title: string, body: string, post?: PostFields | null) {
  db().$client.prepare("UPDATE writings SET title = ?, body = ?, post_json = COALESCE(?, post_json), updated_at = ? WHERE id = ?").run(title, body, post ? JSON.stringify(post) : null, Date.now(), id);
}
export function deleteWriting(id: number) { db().$client.prepare("DELETE FROM writings WHERE id = ?").run(id); }

/* ---------------- lessons ("Teach me") ---------------- */
type LessonRow = { id: number; goal: string; status: string; start_summary: string | null; probe_json: string; steps_json: string; current: number; summary: string | null; next_json: string; lang: string | null; created_at: number; updated_at: number };
const pj = <T,>(s: string | null, d: T): T => { try { return s ? (JSON.parse(s) as T) : d; } catch { return d; } };
const toLesson = (r: LessonRow): Lesson => ({ id: r.id, goal: r.goal, status: (["probing", "active", "done"].includes(r.status) ? r.status : "active") as Lesson["status"], startSummary: r.start_summary, probe: pj<ProbeItem[]>(r.probe_json, []), steps: pj<LessonStep[]>(r.steps_json, []), current: r.current, summary: r.summary, next: pj<string[]>(r.next_json, []), lang: r.lang, createdAt: r.created_at, updatedAt: r.updated_at });
export function listLessons(): Lesson[] { return (db().$client.prepare("SELECT * FROM lessons ORDER BY updated_at DESC").all() as LessonRow[]).map(toLesson); }
export function getLesson(id: number): Lesson | null { const r = db().$client.prepare("SELECT * FROM lessons WHERE id = ?").get(id) as LessonRow | undefined; return r ? toLesson(r) : null; }
export function createLesson(goal: string, lang: string | null): number {
  const t = now();
  return Number(db().$client.prepare("INSERT INTO lessons (goal, status, lang, created_at, updated_at) VALUES (?, 'probing', ?, ?, ?)").run(goal.slice(0, 300), lang, t, t).lastInsertRowid);
}
export function saveLesson(l: Lesson) {
  db().$client.prepare("UPDATE lessons SET goal = ?, status = ?, start_summary = ?, probe_json = ?, steps_json = ?, current = ?, summary = ?, next_json = ?, updated_at = ? WHERE id = ?")
    .run(l.goal, l.status, l.startSummary, JSON.stringify(l.probe), JSON.stringify(l.steps), l.current, l.summary, JSON.stringify(l.next), now(), l.id);
}
export function deleteLesson(id: number) { db().$client.prepare("DELETE FROM lessons WHERE id = ?").run(id); }
/** Record a lesson check: updates the step and, when it is about a concept on the map, mastery and the review schedule. */
export function answerLessonCheck(id: number, idx: number, r: Omit<LessonResult, "at">) {
  const l = getLesson(id); if (!l) throw new Error(`No lesson with id ${id}`);
  const s = l.steps[idx]; if (!s) throw new Error(`Lesson ${id} has no step ${idx + 1}`);
  s.result = { ...r, at: now() };
  s.status = r.correct ? "passed" : "needs_review";
  let mastery: ReturnType<typeof recordExternal> | null = null;
  const exists = s.concept && db().select().from(S.concepts).where(eq(S.concepts.id, s.concept)).get();
  if (exists) mastery = recordExternal(s.concept!, { kind: "quiz", correct: r.correct, confidence: r.confidence, note: `Lesson: ${l.goal} · ${s.title}${r.misconception ? ` · confusion: ${r.misconception}` : ""}`.slice(0, 300) });
  if (r.correct && l.current === idx && idx < l.steps.length - 1) l.current = idx + 1;
  saveLesson(l);
  return { lesson: getLesson(id)!, mastery };
}

/* ---------------- study a source ---------------- */
type StudyRow = { id: number; source_id: number; chunk_id: number; concept_id: string | null; lang: string | null; question: string; options_json: string; answer: number; why: string | null; by: string; choice: number | null; correct: number | null; confidence: string | null; answered_at: number | null; created_at: number };
const toItem = (r: StudyRow): StudyItem => ({ id: r.id, chunkId: r.chunk_id, conceptId: r.concept_id, question: r.question, options: pj<string[]>(r.options_json, []), answer: r.answer, why: r.why, by: r.by === "claude" ? "claude" : "app", choice: r.choice, correct: r.correct == null ? null : !!r.correct, confidence: (r.confidence as Confidence) || null, answeredAt: r.answered_at });
export function getStudy(sourceId: number, lang: "en" | "id"): Study | null {
  const src = getSource(sourceId); if (!src) return null;
  const c = db().$client;
  const chunks = c.prepare("SELECT id, idx, page, text FROM chunks WHERE source_id = ? ORDER BY idx").all(sourceId) as { id: number; idx: number; page: number | null; text: string }[];
  const cites = c.prepare("SELECT chunk_id AS ch, concept_id AS co FROM concept_sources WHERE source_id = ? AND chunk_id IS NOT NULL").all(sourceId) as { ch: number; co: string }[];
  const items = (c.prepare("SELECT * FROM study_items WHERE source_id = ? AND (lang = ? OR lang IS NULL) ORDER BY id").all(sourceId, lang) as StudyRow[]).map(toItem);
  const adapts = c.prepare("SELECT chunk_id AS ch, mode, text FROM study_adapt WHERE source_id = ? AND lang = ?").all(sourceId, lang) as { ch: number; mode: string; text: string }[];
  const passages: StudyPassage[] = chunks.map((k) => ({
    chunkId: k.id, idx: k.idx, page: k.page, text: k.text,
    concepts: [...new Set(cites.filter((x) => x.ch === k.id).map((x) => x.co))],
    items: items.filter((i) => i.chunkId === k.id),
    adapted: Object.fromEntries(adapts.filter((a) => a.ch === k.id).map((a) => [a.mode, a.text])),
  }));
  const pos = getSetting<Record<string, number>>("study_pos", {})[String(sourceId)] ?? 0;
  return { source: { id: src.id, title: src.title, url: src.urlOrPath && /^https?:/.test(src.urlOrPath) ? src.urlOrPath : null }, lang, passages, pos };
}
export function addStudyItems(sourceId: number, lang: string | null, items: { chunkId: number; conceptId?: string | null; question: string; options: string[]; answer: number; why?: string | null }[], by: "app" | "claude") {
  const c = db().$client, t = now();
  const okChunk = new Set((c.prepare("SELECT id FROM chunks WHERE source_id = ?").all(sourceId) as { id: number }[]).map((x) => x.id));
  const okConcept = new Set(db().select({ id: S.concepts.id }).from(S.concepts).all().map((x) => x.id));
  const ins = c.prepare("INSERT INTO study_items (source_id, chunk_id, concept_id, lang, question, options_json, answer, why, by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  // a question about a passage that cites exactly one concept is about that concept
  const cites = c.prepare("SELECT chunk_id AS ch, concept_id AS co FROM concept_sources WHERE source_id = ? AND chunk_id IS NOT NULL").all(sourceId) as { ch: number; co: string }[];
  const only = (ch: number) => { const cs = [...new Set(cites.filter((x) => x.ch === ch).map((x) => x.co))]; return cs.length === 1 ? cs[0] : null; };
  let n = 0;
  for (const it of items) {
    if (!okChunk.has(it.chunkId) || !it.question || !Array.isArray(it.options) || it.options.length < 2 || !(it.answer >= 0 && it.answer < it.options.length)) continue;
    ins.run(sourceId, it.chunkId, it.conceptId && okConcept.has(it.conceptId) ? it.conceptId : only(it.chunkId), lang, it.question.slice(0, 600), JSON.stringify(it.options.map((o) => String(o).slice(0, 300))), it.answer, it.why ? String(it.why).slice(0, 800) : null, by, t);
    n++;
  }
  return n;
}
export function saveStudyAdapt(sourceId: number, chunkId: number, mode: Exclude<StudyMode, "original">, lang: string, text: string, by: "app" | "claude") {
  db().$client.prepare("INSERT OR REPLACE INTO study_adapt (chunk_id, mode, lang, source_id, text, by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(chunkId, mode, lang, sourceId, text.slice(0, 6000), by, now());
}
/** Answer a question placed in the reader: marks it and, when it is about a concept on the map, updates mastery and review. */
export function answerStudyItem(id: number, choice: number, confidence: Confidence) {
  const c = db().$client;
  const r = c.prepare("SELECT * FROM study_items WHERE id = ?").get(id) as StudyRow | undefined;
  if (!r) throw new Error("Question not found");
  const correct = choice === r.answer;
  c.prepare("UPDATE study_items SET choice = ?, correct = ?, confidence = ?, answered_at = ? WHERE id = ?").run(choice, correct ? 1 : 0, confidence, now(), id);
  let mastery: ReturnType<typeof recordExternal> | null = null;
  if (r.concept_id && db().select().from(S.concepts).where(eq(S.concepts.id, r.concept_id)).get()) {
    const src = getSource(r.source_id);
    mastery = recordExternal(r.concept_id, { kind: "quiz", correct, confidence, note: `Study: ${src?.title || "source"} · ${r.question}`.slice(0, 300) });
  }
  return { correct, mastery };
}
export function resetStudy(sourceId: number) {
  db().$client.prepare("UPDATE study_items SET choice = NULL, correct = NULL, confidence = NULL, answered_at = NULL WHERE source_id = ?").run(sourceId);
  setStudyPos(sourceId, 0);
}
export function deleteStudyItems(sourceId: number, chunkId?: number) {
  if (chunkId) db().$client.prepare("DELETE FROM study_items WHERE source_id = ? AND chunk_id = ?").run(sourceId, chunkId);
  else db().$client.prepare("DELETE FROM study_items WHERE source_id = ?").run(sourceId);
}
export function setStudyPos(sourceId: number, pos: number) {
  const m = getSetting<Record<string, number>>("study_pos", {}); m[String(sourceId)] = Math.max(0, Math.round(pos)); setSetting("study_pos", m);
}
export function studySummaries(): Record<number, { questions: number; answered: number; right: number }> {
  const rows = db().$client.prepare("SELECT source_id AS s, COUNT(*) AS q, SUM(CASE WHEN answered_at IS NOT NULL THEN 1 ELSE 0 END) AS a, SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END) AS r FROM study_items GROUP BY source_id").all() as { s: number; q: number; a: number; r: number }[];
  return Object.fromEntries(rows.map((x) => [x.s, { questions: x.q, answered: x.a || 0, right: x.r || 0 }]));
}

/* ---------------- claims and fact-checking ---------------- */
export const CLAIM_STATUSES: ClaimStatus[] = ["unchecked", "supported", "partly", "unsupported", "contradicted", "disputed"];
type ClaimRow = { id: number; concept_id: string; text: string; because_json: string; source_id: number | null; chunk_id: number | null; quote: string | null; status: string; note: string | null; evidence: string | null; checked_by: string | null; checked_at: number | null; by: string; created_at: number; updated_at: number; title?: string | null; page?: number | null };
const toClaim = (r: ClaimRow): Claim => ({
  id: r.id, conceptId: r.concept_id, text: r.text, because: pj<string[]>(r.because_json, []),
  sourceId: r.source_id, sourceTitle: r.title ?? null, chunkId: r.chunk_id, page: r.page ?? null, quote: r.quote,
  status: (CLAIM_STATUSES.includes(r.status as ClaimStatus) ? r.status : "unchecked") as ClaimStatus, note: r.note, evidence: r.evidence,
  checkedBy: (r.checked_by as Claim["checkedBy"]) || null, checkedAt: r.checked_at, by: (r.by as Claim["by"]) || "ai", createdAt: r.created_at, updatedAt: r.updated_at,
});
const CLAIM_SELECT = "SELECT c.*, s.title AS title, k.page AS page FROM claims c LEFT JOIN sources s ON s.id = c.source_id LEFT JOIN chunks k ON k.id = c.chunk_id";
export function listClaims(opts: { concept?: string; status?: ClaimStatus } = {}): Claim[] {
  const where: string[] = [], args: unknown[] = [];
  if (opts.concept) { where.push("c.concept_id = ?"); args.push(opts.concept); }
  if (opts.status) { where.push("c.status = ?"); args.push(opts.status); }
  return (db().$client.prepare(`${CLAIM_SELECT}${where.length ? " WHERE " + where.join(" AND ") : ""} ORDER BY c.concept_id, c.position, c.id`).all(...args) as ClaimRow[]).map(toClaim);
}
export function getClaim(id: number): Claim | null { const r = db().$client.prepare(`${CLAIM_SELECT} WHERE c.id = ?`).get(id) as ClaimRow | undefined; return r ? toClaim(r) : null; }
/** The passages a concept was extracted from (what its claims should be grounded in). */
export function conceptPassages(conceptId: string) {
  const c = db().$client;
  const rows = c.prepare("SELECT DISTINCT k.id AS chunkId, k.source_id AS sourceId, s.title AS title, k.page AS page, k.text AS text FROM concept_sources cs JOIN chunks k ON k.id = cs.chunk_id JOIN sources s ON s.id = k.source_id WHERE cs.concept_id = ? ORDER BY k.source_id, k.idx").all(conceptId) as { chunkId: number; sourceId: number; title: string; page: number | null; text: string }[];
  const notes = c.prepare("SELECT s.id AS sourceId, s.title AS title, cs.note AS note, cs.quote AS quote FROM concept_sources cs JOIN sources s ON s.id = cs.source_id WHERE cs.concept_id = ? AND cs.chunk_id IS NULL").all(conceptId) as { sourceId: number; title: string; note: string; quote: string | null }[];
  return { passages: rows, notes };
}
export function addClaims(conceptId: string, items: { text: string; because?: string[]; quote?: string | null; chunkId?: number | null; sourceId?: number | null }[], by: Claim["by"], lang: string | null, replace = false) {
  const c = db().$client, t = now();
  if (!db().select().from(S.concepts).where(eq(S.concepts.id, conceptId)).get()) throw new Error(`No concept ${conceptId}`);
  if (replace) c.prepare("DELETE FROM claims WHERE concept_id = ? AND by != 'you'").run(conceptId);
  const chunkSrc = (id: number) => (c.prepare("SELECT source_id AS s FROM chunks WHERE id = ?").get(id) as { s: number } | undefined)?.s ?? null;
  let pos = (c.prepare("SELECT COALESCE(MAX(position), -1) + 1 AS n FROM claims WHERE concept_id = ?").get(conceptId) as { n: number }).n;
  const ins = c.prepare("INSERT INTO claims (concept_id, text, because_json, source_id, chunk_id, quote, by, lang, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  const ids: number[] = [];
  for (const it of items) {
    const text = String(it.text || "").trim(); if (!text) continue;
    const chunk = it.chunkId && chunkSrc(Number(it.chunkId)) != null ? Number(it.chunkId) : null;
    const src = chunk ? chunkSrc(chunk) : it.sourceId ?? null;
    ids.push(Number(ins.run(conceptId, text.slice(0, 500), JSON.stringify((it.because || []).map((b) => String(b).trim()).filter(Boolean).slice(0, 5).map((b) => b.slice(0, 400))), src, chunk, it.quote ? String(it.quote).slice(0, 600) : null, by, lang, pos++, t, t).lastInsertRowid));
  }
  return ids;
}
export function updateClaim(id: number, p: { text?: string; because?: string[] }) {
  const cur = getClaim(id); if (!cur) throw new Error("Claim not found");
  const text = p.text != null ? String(p.text).trim().slice(0, 500) : cur.text;
  const because = p.because ? p.because.map((b) => String(b).trim()).filter(Boolean).slice(0, 5) : cur.because;
  // an edited claim has to be checked again
  const changed = text !== cur.text || JSON.stringify(because) !== JSON.stringify(cur.because);
  db().$client.prepare(`UPDATE claims SET text = ?, because_json = ?, ${changed ? "status = 'unchecked', note = NULL, checked_by = NULL, checked_at = NULL," : ""} updated_at = ? WHERE id = ?`).run(text, JSON.stringify(because), now(), id);
}
export function setClaimCheck(id: number, status: ClaimStatus, note: string | null, by: "ai" | "claude" | "you", evidence?: string | null) {
  if (!CLAIM_STATUSES.includes(status)) throw new Error(`status must be one of ${CLAIM_STATUSES.join(", ")}`);
  db().$client.prepare("UPDATE claims SET status = ?, note = ?, evidence = COALESCE(?, evidence), checked_by = ?, checked_at = ?, updated_at = ? WHERE id = ?").run(status, note ? String(note).slice(0, 800) : null, evidence ? String(evidence).slice(0, 500) : null, status === "unchecked" ? null : by, status === "unchecked" ? null : now(), now(), id);
}
export function deleteClaim(id: number) { db().$client.prepare("DELETE FROM claims WHERE id = ?").run(id); }
export function claimCounts(): { total: number; byStatus: Record<ClaimStatus, number>; concepts: number } {
  const rows = db().$client.prepare("SELECT status, COUNT(*) AS n FROM claims GROUP BY status").all() as { status: ClaimStatus; n: number }[];
  const byStatus = Object.fromEntries(CLAIM_STATUSES.map((s) => [s, 0])) as Record<ClaimStatus, number>;
  rows.forEach((r) => { if (r.status in byStatus) byStatus[r.status] = r.n; });
  const concepts = (db().$client.prepare("SELECT COUNT(DISTINCT concept_id) AS n FROM claims").get() as { n: number }).n;
  return { total: rows.reduce((s, r) => s + r.n, 0), byStatus, concepts };
}
