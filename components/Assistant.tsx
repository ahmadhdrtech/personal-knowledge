"use client";
import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { api, useGraph } from "./store";
import { ImportReportCard } from "./HomePanel";
import { due, level, TYPES } from "@/lib/logic";
import type { Concept, LinkType, View } from "@/lib/types";

export interface MapControls {
  selected: string | null;
  select: (id: string | null, tab?: string) => void;
  filterDomain: (key: string | null) => void;
  setView: (v: View) => void;
  openAdd: () => void;
}

type Action = { type: string; id?: string; domain?: string; from?: string; to?: string; link?: string; why?: string; term?: string; definition?: string };
type Hit = { kind: "concept" | "chunk"; id: string; score: number; text?: string; sourceTitle?: string; page?: number | null };
type Item =
  | { kind: "user"; text: string }
  | { kind: "ai"; text: string }
  | { kind: "note"; body: ReactNode };

const COMMANDS = ["help", "open", "test", "discuss", "path", "find", "filter", "view", "review", "add", "clear"] as const;

/** Split an AI reply into text and ACTION lines. */
function parseReply(raw: string): { text: string; actions: Action[] } {
  const actions: Action[] = [];
  const lines = raw.split("\n").filter((l) => {
    const m = l.trim().match(/^ACTION:\s*(\{.*\})\s*$/);
    if (!m) return true;
    try { actions.push(JSON.parse(m[1])); } catch { /* ignore a broken line */ }
    return false;
  });
  return { text: lines.join("\n").trim(), actions: actions.slice(0, 4) };
}

export default function Assistant({ ctl }: { ctl: MapControls }) {
  const { graph, T, t, act, toast } = useGraph();
  const g = graph!;
  const [items, setItems] = useState<Item[] | null>(null);
  const [input, setInput] = useState("");
  const [mentions, setMentions] = useState<string[]>([]);
  const [live, setLive] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [pick, setPick] = useState(0);
  const abort = useRef<AbortController | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    api<{ role: string; content: string }[]>("/api/ai/assistant").then((h) => setItems(h.map((m) => (m.role === "user" ? { kind: "user", text: m.content } : { kind: "ai", text: m.content })))).catch(() => setItems([]));
  }, []);
  useEffect(() => { end.current?.scrollIntoView({ block: "nearest" }); }, [items, live]);

  const byId = (id: string) => g.concepts.find((c) => c.id === id);
  const findConcept = (q: string): Concept | undefined => {
    const s = q.replace(/^@/, "").trim().toLowerCase();
    if (!s) return undefined;
    return g.concepts.find((c) => c.id === s) || g.concepts.find((c) => c.label.en.toLowerCase() === s || c.label.id.toLowerCase() === s)
      || g.concepts.find((c) => c.label.en.toLowerCase().startsWith(s) || c.label.id.toLowerCase().startsWith(s))
      || g.concepts.find((c) => `${c.label.en} ${c.label.id}`.toLowerCase().includes(s));
  };

  /* ----- autocomplete for @concepts and /commands ----- */
  const caretToken = () => {
    const el = box.current; const pos = el ? el.selectionStart : input.length;
    const before = input.slice(0, pos);
    const m = before.match(/(^|\s)@([^\s@]*)$/);
    if (m) return { type: "mention" as const, q: m[2], start: pos - m[2].length - 1 };
    const c = input.match(/^\/(\w*)$/);
    if (c) return { type: "command" as const, q: c[1], start: 0 };
    return null;
  };
  const tok = caretToken();
  const suggestions = useMemo(() => {
    if (!tok) return [];
    if (tok.type === "command") return COMMANDS.filter((c) => c.startsWith(tok.q.toLowerCase())).map((c) => ({ key: c, label: `/${c}`, hint: cmdHelp(c, t) }));
    const q = tok.q.toLowerCase();
    return g.concepts.filter((c) => !q || `${c.label.en} ${c.label.id} ${c.id}`.toLowerCase().includes(q)).slice(0, 7).map((c) => ({ key: c.id, label: T(c.label), hint: `${c.mastery}%` }));
  }, [tok?.type, tok?.q, g.concepts, T, t]);

  const choose = (key: string) => {
    if (!tok) return;
    if (tok.type === "command") { setInput(`/${key} `); setPick(0); box.current?.focus(); return; }
    const c = byId(key)!;
    const label = T(c.label);
    setInput(input.slice(0, tok.start) + "@" + label + " " + input.slice((box.current?.selectionStart ?? input.length)));
    setMentions((m) => (m.includes(key) ? m : [...m, key]));
    setPick(0);
    setTimeout(() => box.current?.focus(), 0);
  };

  const note = (body: ReactNode) => setItems((it) => [...(it || []), { kind: "note", body }]);

  /* ----- local commands, no AI needed ----- */
  const runCommand = async (line: string) => {
    const [, cmd, rest = ""] = line.match(/^\/(\w+)\s*(.*)$/) || [];
    const arg = rest.trim();
    const need = (fn: (c: Concept) => void) => { const c = findConcept(arg) || (ctl.selected ? byId(ctl.selected) : undefined); if (c) fn(c); else note(t(`I can’t find a concept called “${arg}”. Try @ to pick one.`, `Konsep “${arg}” tidak ditemukan. Coba ketik @ untuk memilih.`)); };
    switch (cmd) {
      case "help": note(<div><b>{t("Commands", "Perintah")}</b><ul className="cmd-list">{COMMANDS.map((c) => <li key={c}><span className="code">/{c}</span> {cmdHelp(c, t)}</li>)}</ul><p className="muted small">{t("Type @ to pick a concept. Anything else goes to the AI, which can see your whole map.", "Ketik @ untuk memilih konsep. Selain itu dikirim ke AI, yang bisa melihat seluruh petamu.")}</p></div>); break;
      case "open": need((c) => ctl.select(c.id)); break;
      case "test": need((c) => ctl.select(c.id, "test")); break;
      case "discuss": need((c) => ctl.select(c.id, "discuss")); break;
      case "path": need((c) => ctl.select(c.id, "path")); break;
      case "review": { const d = due(g.concepts); if (d.length) { ctl.select(d[0].id, "test"); note(<>{t("Next due:", "Berikutnya:")} <Chip c={d[0]} onClick={() => ctl.select(d[0].id, "test")} /> {t(`(${d.length} due)`, `(${d.length} perlu review)`)} · <Link className="link" href="/review">{t("Open Review", "Buka Review")}</Link></>); } else note(t("Nothing due. Every concept is solid.", "Tidak ada yang perlu direview.")); break; }
      case "add": ctl.openAdd(); break;
      case "clear": await api("/api/ai/assistant", { method: "DELETE" }); setItems([]); break;
      case "view": { const v = arg.startsWith("n") || arg.startsWith("j") ? "network" : "domains"; ctl.setView(v); note(v === "network" ? t("Showing the network view.", "Menampilkan tampilan jaringan.") : t("Showing the domains view.", "Menampilkan tampilan domain.")); break; }
      case "filter": {
        if (!arg || /^(all|semua)$/i.test(arg)) { ctl.filterDomain(null); note(t("Showing all domains.", "Menampilkan semua domain.")); break; }
        const d = g.domains.find((x) => x.key === arg.toLowerCase() || T(x.name).toLowerCase().includes(arg.toLowerCase()) || x.name.en.toLowerCase().includes(arg.toLowerCase()));
        if (d) { ctl.filterDomain(d.key); note(<>{t("Showing only", "Hanya menampilkan")} <b>{T(d.name)}</b>. <span className="code">/filter all</span> {t("to undo.", "untuk kembali.")}</>); }
        else note(t(`No domain matches “${arg}”.`, `Tidak ada domain yang cocok dengan “${arg}”.`));
        break;
      }
      case "find": {
        if (!arg) { note(t("Type what to look for, e.g. /find why ads stop working", "Ketik yang dicari, mis. /find kenapa iklan berhenti efektif")); break; }
        note(<span className="muted">{t("Searching…", "Mencari…")}</span>);
        try {
          const r = await api<{ semantic: boolean; concepts: Hit[]; passages: Hit[] }>(`/api/search?q=${encodeURIComponent(arg)}`);
          setItems((it) => [...(it || []).slice(0, -1), { kind: "note", body: <SearchResult r={r} q={arg} open={(id) => ctl.select(id)} /> }]);
        } catch (e) { setItems((it) => [...(it || []).slice(0, -1), { kind: "note", body: <span className="err">{(e as Error).message}</span> }]); }
        break;
      }
      default: note(t(`Unknown command /${cmd}. Type /help.`, `Perintah /${cmd} tidak dikenal. Ketik /help.`));
    }
  };

  /* ----- ask the AI ----- */
  const ask = async (text: string, ids: string[]) => {
    setErr(""); setLive("");
    abort.current = new AbortController();
    let acc = "";
    try {
      const res = await fetch("/api/ai/assistant", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text, mentions: ids, selected: ctl.selected }), signal: abort.current.signal });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.message || t("Something went wrong. Try again.", "Ada yang salah. Coba lagi.")); }
      const reader = res.body!.getReader(), dec = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read(); if (done) break;
        acc += dec.decode(value, { stream: true });
        const e = acc.indexOf("\u0000ERR:");
        if (e >= 0) { const msg = acc.slice(e + 5).replace(/^[a-z_]+:/, ""); acc = acc.slice(0, e); throw new Error(msg); }
        setLive(acc);
      }
      setItems((it) => [...(it || []), { kind: "ai", text: acc }]);
    } catch (e) {
      setErr((e as Error).name === "AbortError" ? t("Stopped.", "Dihentikan.") : (e as Error).message);
    } finally { setLive(null); abort.current = null; }
  };

  const send = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || live !== null) return;
    setInput("");
    if (text.startsWith("/")) { setItems((it) => [...(it || []), { kind: "user", text }]); await runCommand(text); setMentions([]); return; }
    // concepts named with @ in the text
    const ids = new Set(mentions);
    g.concepts.forEach((c) => { if (text.includes("@" + c.label.en) || text.includes("@" + c.label.id)) ids.add(c.id); });
    setMentions([]);
    setItems((it) => [...(it || []), { kind: "user", text }]);
    if (!g.ai.ready) { note(<>{t("The assistant needs an AI model.", "Asisten butuh model AI.")} <Link className="link" href="/models">{t("Set one up in Models", "Atur di menu Model")}</Link>. {t("Commands like /open, /find and /filter work without it.", "Perintah seperti /open, /find, dan /filter tetap bisa dipakai.")}</>); return; }
    await ask(text, [...ids]);
  };

  const runAction = async (a: Action) => {
    if (["open", "test", "discuss", "path"].includes(a.type) && a.id && byId(a.id)) ctl.select(a.id, a.type === "open" ? undefined : a.type);
    else if (a.type === "filter" && a.domain) ctl.filterDomain(a.domain);
    else if (a.type === "link" && a.from && a.to && byId(a.from) && byId(a.to)) {
      const r = await act("suggestLink", { from: a.from, to: a.to, type: TYPES[a.link as LinkType] ? a.link : "related", why: a.why || "" });
      toast(r ? t("Added as a suggested link. Approve it on the concept.", "Ditambahkan sebagai saran tautan. Setujui di konsepnya.") : t("These two are already linked", "Keduanya sudah tertaut"));
    } else if (a.type === "glossary" && a.term && a.definition) { await act("glossaryUpsert", { term: a.term, definition: a.definition }); toast(t("Saved to your glossary", "Disimpan ke glosarium")); }
  };
  const actionLabel = (a: Action) => {
    const c = a.id ? byId(a.id) : null, L = c ? T(c.label) : "";
    switch (a.type) {
      case "open": return c && t(`Open ${L}`, `Buka ${L}`);
      case "test": return c && t(`Test me on ${L}`, `Tes aku tentang ${L}`);
      case "discuss": return c && t(`Discuss ${L}`, `Diskusikan ${L}`);
      case "path": return c && t(`Learning order for ${L}`, `Urutan belajar ${L}`);
      case "filter": { const d = g.domains.find((x) => x.key === a.domain); return d && t(`Show only ${T(d.name)}`, `Tampilkan hanya ${T(d.name)}`); }
      case "link": { const f = a.from && byId(a.from), to = a.to && byId(a.to); return f && to && t(`Suggest link: ${T(f.label)} ${T(TYPES[(a.link as LinkType) || "related"]?.say || TYPES.related.say)} ${T(to.label)}`, `Sarankan tautan: ${T(f.label)} ${T(TYPES[(a.link as LinkType) || "related"]?.say || TYPES.related.say)} ${T(to.label)}`); }
      case "glossary": return a.term && t(`Save “${a.term}” to glossary`, `Simpan “${a.term}” ke glosarium`);
    }
    return null;
  };

  /* ----- render ----- */
  const renderText = (s: string) => s.split("\n").map((line, i) => {
    const parts: ReactNode[] = [];
    const re = /\[\[([a-z0-9_]+)\]\]|\*\*([^*]+)\*\*/gi;
    let last = 0, m: RegExpExecArray | null;
    while ((m = re.exec(line))) {
      if (m.index > last) parts.push(line.slice(last, m.index));
      if (m[1]) { const c = byId(m[1]); parts.push(c ? <Chip key={m.index} c={c} onClick={() => ctl.select(c.id)} /> : m[1]); }
      else parts.push(<b key={m.index}>{m[2]}</b>);
      last = re.lastIndex;
    }
    if (last < line.length) parts.push(line.slice(last));
    const isItem = /^\s*[-•*]\s+/.test(line);
    return <div key={i} className={isItem ? "li" : undefined} style={!line.trim() ? { height: 8 } : undefined}>{isItem ? parts.map((p, k) => (k === 0 && typeof p === "string" ? p.replace(/^\s*[-•*]\s+/, "") : p)) : parts}</div>;
  });
  const sel = ctl.selected ? byId(ctl.selected) : null;
  const starters = [
    t("What should I study today?", "Apa yang sebaiknya kupelajari hari ini?"),
    t("Which of my topics are least connected?", "Topik mana yang paling sedikit terhubung?"),
    ...(sel ? [t(`Quiz me on ${T(sel.label)}`, `Kuis aku tentang ${T(sel.label)}`), t(`How does ${T(sel.label)} connect to the rest?`, `Apa hubungan ${T(sel.label)} dengan yang lain?`)] : []),
    "/find …", "/help",
  ];

  return (
    <div className="assistant">
      <div className="assistant-log">
        {g.lastImport && <div style={{ marginBottom: 10 }}><ImportReportCard /></div>}
        {items === null ? <p className="muted">{t("Loading…", "Memuat…")}</p> : items.length === 0 && live === null && (
          <div className="assistant-empty">
            <p style={{ margin: "0 0 6px" }}><b>{t("Ask about your whole map.", "Tanya apa saja tentang seluruh petamu.")}</b></p>
            <p className="muted small" style={{ margin: 0 }}>{t("Type @ to bring in a concept, or / for commands like /open, /find, /filter. The assistant can open concepts, start tests and suggest links for you to approve.", "Ketik @ untuk memanggil konsep, atau / untuk perintah seperti /open, /find, /filter. Asisten bisa membuka konsep, memulai tes, dan menyarankan tautan untuk kamu setujui.")}</p>
          </div>
        )}
        {(items || []).map((m, i) => m.kind === "user" ? <div key={i} className="bubble me">{m.text}</div>
          : m.kind === "note" ? <div key={i} className="bubble note">{m.body}</div>
          : <AiBubble key={i} raw={m.text} render={renderText} actionLabel={actionLabel} run={runAction} />)}
        {live !== null && <div className="bubble ai">{live ? renderText(parseReply(live).text) : t("Thinking…", "Berpikir…")}</div>}
        {err && <p className="err">{err}</p>}
        <div ref={end} />
      </div>
      <div className="assistant-input">
        {(items?.length ?? 0) < 2 && live === null && <div className="starter-row">{starters.map((s) => <button key={s} className="chip" onClick={() => (s.endsWith("…") ? (setInput(s.replace("…", "")), box.current?.focus()) : send(s))}>{s}</button>)}</div>}
        {sel && <div className="muted small" style={{ marginBottom: 4 }}>{t("Looking at", "Sedang dilihat")}: <b>{T(sel.label)}</b></div>}
        <div style={{ position: "relative" }}>
          {suggestions.length > 0 && (
            <ul className="ac">{suggestions.map((s, i) => <li key={s.key}><button className={i === pick ? "on" : ""} onMouseDown={(e) => { e.preventDefault(); choose(s.key); }}><span>{s.label}</span><span className="muted small">{s.hint}</span></button></li>)}</ul>
          )}
          <textarea ref={box} className="field" rows={2} value={input} placeholder={t("Ask, @concept, or /command", "Tanya, @konsep, atau /perintah")} aria-label={t("Message the assistant", "Pesan untuk asisten")}
            onChange={(e) => { setInput(e.target.value); setPick(0); }}
            onKeyDown={(e) => {
              if (suggestions.length && (e.key === "ArrowDown" || e.key === "ArrowUp")) { e.preventDefault(); setPick((p) => (p + (e.key === "ArrowDown" ? 1 : suggestions.length - 1)) % suggestions.length); return; }
              if (suggestions.length && (e.key === "Tab" || (e.key === "Enter" && !e.shiftKey))) { e.preventDefault(); choose(suggestions[pick]?.key || suggestions[0].key); return; }
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
            }} />
        </div>
        <div className="btnrow" style={{ marginTop: 6, alignItems: "center" }}>
          {live !== null ? <button className="btn small" onClick={() => abort.current?.abort()}>{t("Stop", "Berhenti")}</button> : <button className="btn primary small" onClick={() => send()}>{t("Send", "Kirim")}</button>}
          {(items?.length ?? 0) > 0 && live === null && <button className="btn small" onClick={() => runCommand("/clear")}>{t("Clear", "Bersihkan")}</button>}
          <span className="muted small"><span className="kbd">Enter</span> {t("send", "kirim")} · <span className="kbd">Shift</span>+<span className="kbd">Enter</span> {t("new line", "baris baru")}</span>
        </div>
      </div>
    </div>
  );
}

function AiBubble({ raw, render, actionLabel, run }: { raw: string; render: (s: string) => ReactNode; actionLabel: (a: Action) => string | null | undefined | false; run: (a: Action) => void }) {
  const { text, actions } = parseReply(raw);
  const shown = actions.map((a) => ({ a, label: actionLabel(a) })).filter((x) => x.label);
  return (
    <div className="bubble ai">
      {render(text)}
      {shown.length > 0 && <div className="btnrow" style={{ marginTop: 8 }}>{shown.map(({ a, label }, i) => <button key={i} className={`btn small${a.type === "link" || a.type === "glossary" ? "" : " primary"}`} onClick={() => run(a)}>{label}</button>)}</div>}
    </div>
  );
}

function Chip({ c, onClick }: { c: Concept; onClick: () => void }) {
  const { T } = useGraph();
  return <button className="cchip" onClick={onClick}><span className="dot" style={{ background: `var(--${level(c.mastery)})` }} />{T(c.label)}</button>;
}

function SearchResult({ r, q, open }: { r: { semantic: boolean; concepts: Hit[]; passages: Hit[] }; q: string; open: (id: string) => void }) {
  const { graph, t } = useGraph();
  const cs = r.concepts.map((h) => ({ h, c: graph!.concepts.find((c) => c.id === h.id) })).filter((x) => x.c);
  return (
    <div>
      <div className="small"><b>{t("Results for", "Hasil untuk")} “{q}”</b> <span className="muted">· {r.semantic ? t("by meaning", "berdasarkan makna") : t("by words (set a search model in Models for meaning-based search)", "berdasarkan kata (atur model pencarian di Model untuk pencarian berdasarkan makna)")}</span></div>
      {cs.length > 0 && <div style={{ margin: "6px 0" }}>{cs.map(({ h, c }) => <Fragment key={h.id}><Chip c={c!} onClick={() => open(c!.id)} /> </Fragment>)}</div>}
      {r.passages.slice(0, 4).map((p) => (
        <div key={p.id} className="passage">
          <div className="muted small">{p.sourceTitle}{p.page ? ` · ${t("p.", "hlm.")} ${p.page}` : ""}{r.semantic ? ` · ${Math.round(p.score * 100)}%` : ""}</div>
          <div>{(p.text || "").slice(0, 260)}{(p.text || "").length > 260 ? "…" : ""}</div>
        </div>
      ))}
      {!cs.length && !r.passages.length && <div className="muted small">{t("Nothing found.", "Tidak ditemukan.")}</div>}
    </div>
  );
}

function cmdHelp(c: string, t: (en: string, id: string) => string) {
  return ({
    help: t("list commands", "daftar perintah"),
    open: t("@concept: show it", "@konsep: tampilkan"),
    test: t("@concept: quiz yourself", "@konsep: kuis diri"),
    discuss: t("@concept: discuss it", "@konsep: diskusikan"),
    path: t("@concept: learning order", "@konsep: urutan belajar"),
    find: t("text: search concepts and passages", "teks: cari konsep dan bagian sumber"),
    filter: t("domain: show one domain (all to reset)", "domain: tampilkan satu domain (all untuk semua)"),
    view: t("network or domains", "network atau domains"),
    review: t("open the next due concept", "buka konsep berikutnya yang perlu direview"),
    add: t("add a source", "tambah sumber"),
    clear: t("clear the chat", "bersihkan obrolan"),
  } as Record<string, string>)[c];
}
