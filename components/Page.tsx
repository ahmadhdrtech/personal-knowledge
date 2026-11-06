"use client";
import type { ReactNode } from "react";
import { useGraph } from "./store";

export default function Page({ title, lede, actions, children }: { title: string; lede?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  const { graph, t } = useGraph();
  return (
    <div className="content">
      <div className="page">
        <div className="page-head"><h1>{title}</h1>{actions && <div className="actions">{actions}</div>}</div>
        {lede && <p className="lede">{lede}</p>}
        {graph ? children : <p className="muted">{t("Loading…", "Memuat…")}</p>}
      </div>
    </div>
  );
}
