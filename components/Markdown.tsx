"use client";
import { Fragment, useEffect, useId, useState } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

/**
 * Safe rich Markdown for lessons and writing. No raw HTML is passed through.
 * - headings, lists, quotes, tables, rules, **bold**, *italic*, `code`, [links](https://…), ![images](https://…)
 * - math: $inline$, \(inline\), $$block$$, \[block\]   (KaTeX)
 * - ```mermaid   flowcharts and diagrams                (Mermaid, strict mode)
 * - ```svg       a hand-made figure, shown as an image so it can't run scripts
 * - other ``` blocks are shown as code
 */

const okUrl = (u: string) => /^(https?:|\/(?!\/)|#|mailto:)/i.test(u.trim());

function TeX({ tex, block }: { tex: string; block?: boolean }) {
  let html = "";
  try { html = katex.renderToString(tex, { displayMode: !!block, throwOnError: false, strict: "ignore", trust: false, output: "html" }); }
  catch { return <code>{tex}</code>; }
  return block ? <div className="md-math" dangerouslySetInnerHTML={{ __html: html }} /> : <span dangerouslySetInnerHTML={{ __html: html }} />;
}

let mermaidLoad: Promise<any> | null = null;
function Mermaid({ code }: { code: string }) {
  const id = "m" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const [svg, setSvg] = useState<string | null>(null), [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    mermaidLoad ||= import("mermaid").then((m) => {
      const dark = typeof window !== "undefined" && (document.documentElement.dataset.theme === "dark" || (!document.documentElement.dataset.theme && window.matchMedia("(prefers-color-scheme: dark)").matches));
      m.default.initialize({ startOnLoad: false, securityLevel: "strict", theme: dark ? "dark" : "neutral", fontFamily: "inherit", flowchart: { htmlLabels: false } });
      return m.default;
    });
    mermaidLoad.then((m) => m.render(id, code)).then((r: { svg: string }) => { if (live) { setSvg(r.svg); setErr(null); } })
      .catch((e: Error) => { if (live) setErr(e?.message || "Diagram error"); document.getElementById("d" + id)?.remove(); });
    return () => { live = false; };
  }, [code, id]);
  if (err) return <div className="md-fig md-err"><div className="small">Diagram couldn’t be drawn: {err.split("\n")[0]}</div><pre><code>{code}</code></pre></div>;
  if (!svg) return <div className="md-fig muted small">…</div>;
  return <div className="md-fig md-mermaid" dangerouslySetInnerHTML={{ __html: svg }} />;
}

function Svg({ code }: { code: string }) {
  const clean = code.trim();
  if (!/^<svg[\s>]/i.test(clean)) return <pre><code>{code}</code></pre>;
  const src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(clean.includes("xmlns=") ? clean : clean.replace(/^<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"'));
  return <div className="md-fig"><img src={src} alt="Figure" /></div>;
}

/* inline: math first, then code, links, images, bold, italic */
function inline(s: string, k: string): React.ReactNode[] {
  const re = /(\$\$[^$]+\$\$|\\\((.+?)\\\)|\$(?=\S)([^$\n]+?)(?<=\S)\$(?!\d)|`[^`]+`|!\[[^\]]*\]\([^)\s]+\)|\[[^\]]+\]\([^)\s]+\)|==[^=\n]+==|\*\*[^*]+\*\*|\*[^*\s][^*]*\*|_[^_\s][^_]*_)/g;
  const out: React.ReactNode[] = [];
  let last = 0, m: RegExpExecArray | null, i = 0;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(<Fragment key={k + i++}>{s.slice(last, m.index)}</Fragment>);
    const p = m[0];
    if (p.startsWith("$$")) out.push(<TeX key={k + i++} tex={p.slice(2, -2)} />);
    else if (p.startsWith("\\(")) out.push(<TeX key={k + i++} tex={m[2]} />);
    else if (p.startsWith("$")) out.push(<TeX key={k + i++} tex={m[3]} />);
    else if (p.startsWith("`")) out.push(<code key={k + i++} className="mono">{p.slice(1, -1)}</code>);
    else if (p.startsWith("![")) {
      const mm = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(p)!;
      out.push(okUrl(mm[2]) ? <img key={k + i++} className="md-img" src={mm[2]} alt={mm[1]} loading="lazy" /> : <Fragment key={k + i++}>{mm[1]}</Fragment>);
    } else if (p.startsWith("[")) {
      const mm = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(p)!;
      out.push(okUrl(mm[2]) ? <a key={k + i++} className="link" href={mm[2]} target="_blank" rel="noreferrer">{mm[1]}</a> : <Fragment key={k + i++}>{mm[1]}</Fragment>);
    } else if (p.startsWith("==")) out.push(<mark key={k + i++} className="md-mark">{inline(p.slice(2, -2), k + i + "m")}</mark>);
    else if (p.startsWith("**")) out.push(<strong key={k + i++}>{inline(p.slice(2, -2), k + i + "b")}</strong>);
    else out.push(<em key={k + i++}>{p.slice(1, -1)}</em>);
    last = m.index + p.length;
  }
  if (last < s.length) out.push(<Fragment key={k + i++}>{s.slice(last)}</Fragment>);
  return out;
}

const cells = (row: string) => row.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

export default function Markdown({ text }: { text: string }) {
  const lines = text.replace(/\r/g, "").split("\n");
  const out: React.ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null, para: string[] = [];
  const key = () => out.length;
  const flushPara = () => { if (para.length) { const n = key(); out.push(<p key={n}>{inline(para.join(" "), `p${n}-`)}</p>); para = []; } };
  const flushList = () => {
    if (!list) return;
    const L = list.ordered ? "ol" : "ul", n = key();
    out.push(<L key={n}>{list.items.map((it, i) => <li key={i}>{inline(it, `l${n}-${i}-`)}</li>)}</L>);
    list = null;
  };
  const flush = () => { flushPara(); flushList(); };
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i], l = raw.trimEnd(), t = l.trim();
    // fenced blocks
    const fence = /^```\s*([\w-]*)\s*$/.exec(t);
    if (fence) {
      flush();
      const lang = fence[1].toLowerCase(), body: string[] = [];
      for (i++; i < lines.length && !/^```\s*$/.test(lines[i].trim()); i++) body.push(lines[i]);
      const code = body.join("\n"), n = key();
      if (lang === "mermaid") out.push(<Mermaid key={n} code={code} />);
      else if (lang === "svg") out.push(<Svg key={n} code={code} />);
      else if (lang === "math" || lang === "latex" || lang === "tex") out.push(<TeX key={n} tex={code} block />);
      else out.push(<pre key={n} className="md-code"><code>{code}</code></pre>);
      continue;
    }
    // display math $$ … $$ or \[ … \] (may span lines)
    if (t.startsWith("$$") || t.startsWith("\\[")) {
      const close = t.startsWith("$$") ? "$$" : "\\]";
      let buf = t.slice(2);
      if (buf.trimEnd().endsWith(close) && buf.length >= close.length) buf = buf.trimEnd().slice(0, -close.length);
      else { for (i++; i < lines.length && !lines[i].trim().endsWith(close); i++) buf += "\n" + lines[i]; if (i < lines.length) buf += "\n" + lines[i].trim().slice(0, -close.length); }
      flush(); out.push(<TeX key={key()} tex={buf} block />); continue;
    }
    // tables: header | --- | rows
    if (t.startsWith("|") && i + 1 < lines.length && /^\|?\s*:?-{2,}/.test(lines[i + 1].trim())) {
      flush();
      const head = cells(t), rows: string[][] = [];
      for (i += 2; i < lines.length && lines[i].trim().startsWith("|"); i++) rows.push(cells(lines[i]));
      i--;
      const n = key();
      out.push(<div key={n} className="tablewrap md-table"><table className="t"><thead><tr>{head.map((h, j) => <th key={j}>{inline(h, `th${n}-${j}-`)}</th>)}</tr></thead>
        <tbody>{rows.map((r, ri) => <tr key={ri}>{r.map((c, j) => <td key={j}>{inline(c, `td${n}-${ri}-${j}-`)}</td>)}</tr>)}</tbody></table></div>);
      continue;
    }
    const h = /^(#{1,4})\s+(.*)$/.exec(l), b = /^\s*[-*•]\s+(.*)$/.exec(l), o = /^\s*\d+[.)]\s+(.*)$/.exec(l), q = /^>\s?(.*)$/.exec(l);
    if (!t) { flush(); continue; }
    if (h) { flush(); const H = (["h3", "h3", "h4", "h4"] as const)[h[1].length - 1], n = key(); out.push(<H key={n}>{inline(h[2], `h${n}-`)}</H>); continue; }
    if (b || o) { flushPara(); const ordered = !!o; if (list && list.ordered !== ordered) flushList(); if (!list) list = { ordered, items: [] }; list.items.push((b || o)![1]); continue; }
    if (q) { flush(); const n = key(); out.push(<blockquote key={n}>{inline(q[1], `q${n}-`)}</blockquote>); continue; }
    if (/^(-{3,}|\*{3,})$/.test(t)) { flush(); out.push(<hr key={key()} />); continue; }
    flushList(); para.push(t);
  }
  flush();
  return <div className="md">{out}</div>;
}
