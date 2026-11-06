"use client";
import { createContext, useContext, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useGraph } from "./store";
import { level, LEVEL_NAME, TYPES, CONF } from "@/lib/logic";
import type { Concept, Confidence, Link } from "@/lib/types";

/* ---------- selecting a concept from anywhere ---------- */
type SelectFn = (id: string | null, tab?: string) => void;
const SelectCtx = createContext<SelectFn | null>(null);
export const SelectProvider = SelectCtx.Provider;
export function useSelect(): SelectFn {
  const ctx = useContext(SelectCtx);
  const router = useRouter();
  return ctx || ((id, tab) => router.push(id ? `/?c=${encodeURIComponent(id)}${tab ? `&tab=${tab}` : ""}` : "/"));
}

export function NodeBtn({ id, tab }: { id: string; tab?: string }) {
  const { graph, T } = useGraph();
  const select = useSelect();
  const c = graph?.concepts.find((x) => x.id === id);
  if (!c) return null;
  return <button className="link" onClick={() => select(id, tab)}>{T(c.label)}</button>;
}

export function Dot({ color }: { color: string }) {
  return <span className="dot" style={{ background: color }} />;
}
export const domainColor = (c: number) => `var(--c${c % 8})`;

export function Meter({ c }: { c: Concept }) {
  const { T } = useGraph();
  return (
    <div className="meter">
      <span>{T(LEVEL_NAME[level(c.mastery)])}</span>
      <div className="track"><div className="fill" style={{ width: `${c.mastery}%`, background: `var(--${level(c.mastery)})` }} /></div>
      <span>{c.mastery}%</span>
    </div>
  );
}

/** "A leads to B", with links to the other concept. */
export function LinkSentence({ l, here }: { l: Link; here?: string }) {
  const { graph, T, t: tr } = useGraph();
  const s = graph!.concepts.find((c) => c.id === l.from), t = graph!.concepts.find((c) => c.id === l.to);
  if (!s || !t) return null;
  const cross = !s.domains.some((k) => t.domains.includes(k));
  return (
    <>
      {s.id === here ? <span>{T(s.label)}</span> : <NodeBtn id={s.id} />} {T(TYPES[l.type].say)} {t.id === here ? <span>{T(t.label)}</span> : <NodeBtn id={t.id} />}
      {cross && <span className="pill">{tr("Cross-domain", "Lintas domain")}</span>}
    </>
  );
}

/* ---------- long-running AI calls ---------- */
export function useBusy() {
  const { t } = useGraph();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const ctl = useRef<AbortController | null>(null);
  async function run<R>(label: string, fn: (signal: AbortSignal) => Promise<R>): Promise<R | undefined> {
    ctl.current = new AbortController(); setBusy(label); setErr(null);
    try { return await fn(ctl.current.signal); }
    catch (e) { setErr((e as Error)?.name === "AbortError" ? t("Stopped.", "Dihentikan.") : (e as Error).message || t("Something went wrong. Try again.", "Ada yang salah. Coba lagi.")); return undefined; }
    finally { setBusy(null); ctl.current = null; }
  }
  const stop = () => ctl.current?.abort();
  const status = busy ? <div className="status"><span>{busy}</span><button className="btn small" onClick={stop}>{t("Stop", "Berhenti")}</button></div> : null;
  const error = err ? <p className="err">{err}</p> : null;
  return { run, busy: !!busy, status, error, setErr };
}

export function ConfButtons({ onPick, disabled }: { onPick: (k: Confidence) => void; disabled?: boolean }) {
  const { T } = useGraph();
  return <>{CONF.map((c) => <button key={c.k} className="btn small" disabled={disabled} onClick={() => onPick(c.k)}>{T(c)}</button>)}</>;
}

export function fmtDate(t: number, lang?: string) {
  const l = lang || (typeof document !== "undefined" ? document.documentElement.lang : "en");
  return new Date(t).toLocaleString(l === "id" ? "id-ID" : "en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
export function fmtDay(t: number, lang?: string) {
  const l = lang || (typeof document !== "undefined" ? document.documentElement.lang : "en");
  return new Date(t).toLocaleDateString(l === "id" ? "id-ID" : "en-GB", { weekday: "short", day: "numeric", month: "short" });
}
/** "in 3 days", "2 hours ago" */
export function fmtRel(t: number, lang?: string) {
  const l = lang || (typeof document !== "undefined" ? document.documentElement.lang : "en");
  const rtf = new Intl.RelativeTimeFormat(l === "id" ? "id" : "en", { numeric: "auto" });
  const diff = t - Date.now(), abs = Math.abs(diff);
  if (abs < 3_600_000) return rtf.format(Math.round(diff / 60_000), "minute");
  if (abs < 86_400_000) return rtf.format(Math.round(diff / 3_600_000), "hour");
  if (abs < 30 * 86_400_000) return rtf.format(Math.round(diff / 86_400_000), "day");
  return rtf.format(Math.round(diff / (30 * 86_400_000)), "month");
}
