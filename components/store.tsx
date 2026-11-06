"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Bi, Graph, Lang } from "@/lib/types";
import { T as Tx } from "@/lib/logic";

export class ApiError extends Error {
  constructor(public code: string, message: string) { super(message); }
}

export async function api<R = any>(url: string, init?: RequestInit & { json?: unknown }): Promise<R> {
  const { json, ...rest } = init || {};
  const res = await fetch(url, {
    ...rest,
    method: rest.method || (json !== undefined ? "POST" : "GET"),
    headers: json !== undefined ? { "content-type": "application/json", ...(rest.headers || {}) } : rest.headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || "error", data.message || `HTTP ${res.status}`);
  return data as R;
}

export function errText(e: unknown) {
  const id = typeof document !== "undefined" && document.documentElement.lang === "id";
  if ((e as Error)?.name === "AbortError") return id ? "Dihentikan." : "Stopped.";
  return e instanceof Error ? e.message : id ? "Ada yang salah. Coba lagi." : "Something went wrong. Try again.";
}

interface Ctx {
  graph: Graph | null;
  setGraph: (g: Graph) => void;
  refresh: () => Promise<void>;
  /** Run a map edit; the server returns the updated graph. */
  act: <R = unknown>(action: string, payload?: Record<string, unknown>) => Promise<R>;
  toast: (msg: string, ms?: number) => void;
  lang: Lang;
  /** Pick the text from a stored {en, id} pair. */
  T: (o: Bi | string | null | undefined) => string;
  /** UI text: t("English", "Indonesia"). */
  t: (en: string, id: string) => string;
}
const GraphCtx = createContext<Ctx | null>(null);

export function GraphProvider({ children }: { children: ReactNode }) {
  const [graph, setGraphState] = useState<Graph | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setGraph = useCallback((g: Graph) => setGraphState(g), []);
  const refresh = useCallback(async () => { setGraphState(await api<Graph>("/api/graph")); }, []);
  useEffect(() => { refresh().catch(() => {}); }, [refresh]);

  const toast = useCallback((msg: string, ms = 1900) => {
    setToastMsg(msg); setToastOn(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToastOn(false), ms);
  }, []);

  const act = useCallback(async <R,>(action: string, payload: Record<string, unknown> = {}) => {
    const r = await api<{ graph: Graph; result: R }>("/api/graph", { json: { action, ...payload } });
    setGraphState(r.graph);
    return r.result;
  }, []);

  // theme
  useEffect(() => {
    const t = graph?.prefs.theme;
    if (!t) return;
    if (t === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", t);
  }, [graph?.prefs.theme]);

  const lang = graph?.prefs.lang || "en";
  const T = useCallback((o: Bi | string | null | undefined) => Tx(o, lang), [lang]);
  const t = useCallback((en: string, id: string) => (lang === "id" ? id : en), [lang]);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  return (
    <GraphCtx.Provider value={{ graph, setGraph, refresh, act, toast, lang, T, t }}>
      {children}
      <div className={`toast-g${toastOn ? " show" : ""}`} role="status" aria-live="polite">{toastMsg}</div>
    </GraphCtx.Provider>
  );
}

export function useGraph() {
  const c = useContext(GraphCtx);
  if (!c) throw new Error("useGraph outside provider");
  return c;
}

/** Stored bilingual text, shown in the chosen language. */
export function Bil({ o, className }: { o: Bi | null | undefined; className?: string }) {
  const { T } = useGraph();
  if (!o) return null;
  return <span className={className}>{T(o)}</span>;
}
