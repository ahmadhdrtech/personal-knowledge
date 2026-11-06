// d3 force graph, ported from the prototype's simulation, hull and ring code.
import * as d3 from "d3";
import type { Concept, Domain, Graph, Lang, Link, View } from "@/lib/types";
import { level, LEVEL_NAME, T, TYPES } from "@/lib/logic";

type SimNode = d3.SimulationNodeDatum & { id: string; c: Concept; lines?: string[]; w?: number };
type SimLink = d3.SimulationLinkDatum<SimNode> & { l: Link };

export interface GraphOpts {
  lang: Lang;
  view: View;
  hidden: Set<string>;
  selected: string | null;
  query: string;
}

const radius = (c: Concept) => 8 + Math.min(c.sources.length, 5) * 3.2;
const CHAR = 6.6, LINE = 14; // 12px label font: average character width and line height
/** Split a label into at most two lines of about 16 characters. */
export function wrapLabel(s: string, max = 16): string[] {
  if (s.length <= max) return [s];
  const words = s.split(/\s+/), lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (!cur) cur = w;
    else if ((cur + " " + w).length <= max || lines.length === 1) cur += " " + w;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  if (lines.length > 2) return [lines[0], lines.slice(1).join(" ")];
  return lines;
}
const mColor = (m: number) => `var(--${level(m)})`;

export class GraphView {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private root: d3.Selection<SVGGElement, unknown, null, undefined>;
  private hullG: d3.Selection<SVGGElement, unknown, null, undefined>;
  private linkG: d3.Selection<SVGGElement, unknown, null, undefined>;
  private nodeG: d3.Selection<SVGGElement, unknown, null, undefined>;
  private zoom: d3.ZoomBehavior<SVGSVGElement, unknown>;
  private sim: d3.Simulation<SimNode, SimLink>;
  private nodes = new Map<string, SimNode>();
  private simLinks: SimLink[] = [];
  private data: Graph | null = null;
  private o: GraphOpts = { lang: "en", view: "domains", hidden: new Set(), selected: null, query: "" };
  private W = 800;
  private H = 600;
  private AN: Record<string, { x: number; y: number }> = {};
  private linkSel?: d3.Selection<SVGPathElement, SimLink, SVGGElement, unknown>;
  private nodeSel?: d3.Selection<SVGGElement, SimNode, SVGGElement, unknown>;
  private hullSel?: d3.Selection<SVGGElement, Domain, SVGGElement, unknown>;
  private ro: ResizeObserver;
  private hullLine = d3.line().curve(d3.curveCatmullRomClosed.alpha(0.7));
  private userZoomed = false;
  private fitPending = true;
  private spread = 1;

  constructor(private el: SVGSVGElement, private onSelect: (id: string | null) => void) {
    this.svg = d3.select(el);
    const defs = this.svg.append("defs");
    ([["arr", "arrowhead"], ["arr-hot", "arrowhead hot"], ["arr-acc", "arrowhead acc"]] as const).forEach(([id, cls]) => {
      defs.append("marker").attr("id", id).attr("viewBox", "0 0 10 10").attr("refX", 9).attr("refY", 5).attr("markerWidth", 7).attr("markerHeight", 7).attr("orient", "auto")
        .append("path").attr("d", "M0 0L10 5L0 10Z").attr("class", cls);
    });
    this.root = this.svg.append("g");
    this.hullG = this.root.append("g").attr("class", "hulls");
    this.linkG = this.root.append("g");
    this.nodeG = this.root.append("g");
    this.zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.15, 4]).on("zoom", (e) => {
      this.root.attr("transform", e.transform);
      if (e.sourceEvent) this.userZoomed = true;
    });
    this.svg.call(this.zoom).on("dblclick.zoom", null);
    this.svg.on("click", (e: MouseEvent) => {
      const t = e.target as Element;
      if (t === el || t.closest(".hull")) this.onSelect(null);
    });
    this.size();
    this.sim = d3.forceSimulation<SimNode, SimLink>()
      .force("link", d3.forceLink<SimNode, SimLink>().id((d) => d.id).distance((l) => (l.l.status === "suggested" ? 150 : 115) * Math.min(1.5, this.spread)).strength(() => (this.o.view === "domains" ? 0.2 : 0.45)))
      .force("charge", d3.forceManyBody().strength(-520).distanceMax(700))
      .force("collide", d3.forceCollide<SimNode>().radius((d) => radius(d.c) + 14))
      .force("labels", this.labelForce())
      .force("x", d3.forceX<SimNode>((d) => this.ax(d)))
      .force("y", d3.forceY<SimNode>((d) => this.ay(d)))
      .on("tick", () => { this.tick(); if (this.fitPending && this.sim.alpha() < 0.08) { this.fitPending = false; if (!this.userZoomed) this.fit(600); } })
      .on("end", () => { if (this.fitPending) { this.fitPending = false; if (!this.userZoomed) this.fit(600); } });
    this.ro = new ResizeObserver(() => { this.size(); this.setForces(); this.sim.alpha(0.3).restart(); });
    this.ro.observe(el.parentElement || el);
  }

  /** Keeps each node's label box (circle plus the text under it) from overlapping another's. */
  private labelForce() {
    let nodes: SimNode[] = [];
    const box = (n: SimNode) => {
      const r = radius(n.c), w = Math.max(2 * r + 10, (n.w || 60) + 10), lines = n.lines?.length || 1;
      return { hw: w / 2, top: r + 6, bottom: r + 10 + lines * LINE };
    };
    const force = (alpha: number) => {
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]; if (a.x == null || a.y == null) continue;
        const ba = box(a);
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]; if (b.x == null || b.y == null) continue;
          const bb = box(b);
          const dx = b.x - a.x, dy = b.y - a.y;
          const ox = ba.hw + bb.hw - Math.abs(dx);
          if (ox <= 0) continue;
          // vertical extent: a spans [y - top, y + bottom]
          const oy = dy >= 0 ? a.y + ba.bottom - (b.y - bb.top) : b.y + bb.bottom - (a.y - ba.top);
          if (oy <= 0) continue;
          const k = 0.5 * alpha;
          if (ox < oy) { const m = ox * k * (dx >= 0 ? 1 : -1); a.x -= m; b.x += m; }
          else { const m = oy * k * (dy >= 0 ? 1 : -1); a.y -= m; b.y += m; }
        }
      }
    };
    force.initialize = (ns: SimNode[]) => { nodes = ns; };
    return force;
  }

  /** Zoom so the whole visible map fits, with room for the labels. */
  fit(ms = 400) {
    const vis = [...this.nodes.values()].filter((n) => n.x != null && n.y != null && this.visible(n.c));
    if (!vis.length) return;
    const x0 = d3.min(vis, (n) => n.x! - (n.w || 60) / 2)!, x1 = d3.max(vis, (n) => n.x! + (n.w || 60) / 2)!;
    const y0 = d3.min(vis, (n) => n.y! - radius(n.c) - 30)!, y1 = d3.max(vis, (n) => n.y! + radius(n.c) + 14 + (n.lines?.length || 1) * LINE)!;
    const pad = 36, topPad = 70; // the domain chips sit at the top
    const k = Math.max(0.15, Math.min(1.4, (this.W - 2 * pad) / (x1 - x0 || 1), (this.H - topPad - pad) / (y1 - y0 || 1)));
    const t = d3.zoomIdentity.translate(this.W / 2, topPad + (this.H - topPad - pad) / 2).scale(k).translate(-(x0 + x1) / 2, -(y0 + y1) / 2);
    this.svg.transition().duration(ms).call(this.zoom.transform, t);
  }
  zoomBy(f: number) { this.userZoomed = true; this.svg.transition().duration(250).call(this.zoom.scaleBy, f); }
  refit() { this.userZoomed = false; this.fit(); }

  destroy() { this.sim.stop(); this.ro.disconnect(); this.svg.selectAll("*").remove(); this.svg.on(".zoom", null).on("click", null); }

  private size() {
    const r = (this.el.parentElement || this.el).getBoundingClientRect();
    this.W = r.width || 800; this.H = r.height || 600;
  }
  private anchors() {
    const ks = (this.data?.domains || []).map((t) => t.key), m: Record<string, { x: number; y: number }> = {};
    const dom = this.o.view === "domains";
    // the layout grows with the map; the view zooms to fit, so labels get room instead of piling up
    const R = Math.max(Math.min(this.W, this.H) * (dom ? 0.3 : 0.24), (dom ? 150 : 110) * this.spread);
    ks.forEach((k, i) => { const a = (-Math.PI * 3) / 4 + (i * 2 * Math.PI) / ks.length; m[k] = { x: this.W / 2 + Math.cos(a) * R * 1.3, y: this.H / 2 + Math.sin(a) * R }; });
    return m;
  }
  private ax(d: SimNode) { return d3.mean(d.c.domains, (k) => (this.AN[k] || { x: this.W / 2 }).x) ?? this.W / 2; }
  private ay(d: SimNode) { return d3.mean(d.c.domains, (k) => (this.AN[k] || { y: this.H / 2 }).y) ?? this.H / 2; }
  private setForces() {
    this.AN = this.anchors();
    const st = this.o.view === "domains" ? 0.16 : 0.06;
    (this.sim.force("x") as d3.ForceX<SimNode>).x((d) => this.ax(d)).strength(st);
    (this.sim.force("y") as d3.ForceY<SimNode>).y((d) => this.ay(d)).strength(st);
  }
  private visible = (c: Concept) => c.domains.some((k) => !this.o.hidden.has(k));
  private domain = (k: string) => this.data?.domains.find((d) => d.key === k);
  private tColor = (k: string) => { const t = this.domain(k); return t ? `var(--c${t.color % 8})` : "var(--edge)"; };

  /** Push new data and options. Keeps node positions between updates. */
  update(data: Graph, o: GraphOpts) {
    const prev = this.o, prevData = this.data;
    this.data = data; this.o = o;
    const structural = !prevData || prevData.concepts.length !== data.concepts.length || prevData.links.length !== data.links.length
      || prev.view !== o.view || prev.lang !== o.lang
      || prevData.links.some((l, i) => l.lid !== data.links[i]?.lid || l.status !== data.links[i]?.status)
      || prevData.concepts.some((c, i) => c.id !== data.concepts[i]?.id || c.domains.join() !== data.concepts[i]?.domains.join() || c.sources.length !== data.concepts[i]?.sources.length);
    this.spread = Math.max(1, Math.sqrt(data.concepts.length / 10));
    if (!prevData || prev.view !== o.view || prev.hidden.size !== o.hidden.size) { this.fitPending = true; if (prev.view !== o.view) this.userZoomed = false; }
    this.render();
    if (structural) this.sim.alpha(prevData ? (prev.view !== o.view ? 0.8 : 0.35) : 1).restart();
    else if (this.fitPending) { this.fitPending = false; if (!this.userZoomed) this.fit(); }
  }

  private render() {
    const g = this.data!;
    this.setForces();
    // nodes: reuse objects so positions survive
    const next = new Map<string, SimNode>();
    for (const c of g.concepts) {
      const old = this.nodes.get(c.id);
      if (old) { old.c = c; next.set(c.id, old); }
      else {
        const n: SimNode = { id: c.id, c };
        n.x = this.ax(n) + (Math.random() * 60 - 30); n.y = this.ay(n) + (Math.random() * 60 - 30);
        next.set(c.id, n);
      }
    }
    this.nodes = next;
    const nodes = [...next.values()];
    this.simLinks = g.links.map((l) => ({ source: l.from, target: l.to, l }));

    this.hullSel = this.hullG.selectAll<SVGGElement, Domain>("g.hull").data(g.domains, (t) => t.key).join((enter) => {
      const e = enter.append("g").attr("class", "hull"); e.append("path"); e.append("text"); return e;
    });
    this.hullSel.select("path").attr("fill", (t) => `var(--c${t.color % 8})`).attr("stroke", (t) => `var(--c${t.color % 8})`);
    this.hullSel.select("text").attr("fill", (t) => `var(--c${t.color % 8})`);
    this.hullG.classed("off", this.o.view !== "domains");
    this.root.classed("domains", this.o.view === "domains");

    this.linkSel = this.linkG.selectAll<SVGPathElement, SimLink>("path").data(this.simLinks, (l) => String(l.l.lid)).join("path")
      .attr("class", (l) => `edge t-${l.l.type}${l.l.status === "suggested" ? " suggested" : ""}`);

    const self = this;
    this.nodeSel = this.nodeG.selectAll<SVGGElement, SimNode>("g.node").data(nodes, (d) => d.id).join((enter) => {
      const e = enter.append("g").attr("class", "node").attr("tabindex", 0).attr("role", "button")
        .on("click", (ev: MouseEvent, d) => { ev.stopPropagation(); self.onSelect(d.id); })
        .on("keydown", (ev: KeyboardEvent, d) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); self.onSelect(d.id); } })
        .call(d3.drag<SVGGElement, SimNode>()
          .on("start", (ev, d) => { if (!ev.active) self.sim.alphaTarget(0.25).restart(); d.fx = d.x; d.fy = d.y; })
          .on("drag", (ev, d) => { d.fx = ev.x; d.fy = ev.y; })
          .on("end", (ev, d) => { if (!ev.active) self.sim.alphaTarget(0); d.fx = null; d.fy = null; }));
      e.append("g").attr("class", "rings"); e.append("circle").attr("class", "core"); e.append("circle").attr("class", "flag"); e.append("text");
      return e;
    });
    const L = this.o.lang;
    this.nodeSel.attr("aria-label", (d) => `${T(d.c.label, L)}, ${d.c.domains.map((k) => T(this.domain(k)?.name, L)).join(L === "id" ? " dan " : " and ")}, ${T(LEVEL_NAME[level(d.c.mastery)], L)}${d.c.miscon ? (L === "id" ? ", miskonsepsi" : ", misconception flagged") : ""}`);
    this.nodeSel.select(".rings").selectAll<SVGPathElement, { k: string; i: number; n: number; r: number }>("path")
      .data((d) => d.c.domains.map((k, i, a) => ({ k, i, n: a.length, r: radius(d.c) })))
      .join("path")
      .attr("d", (o) => d3.arc()({ innerRadius: o.r + 1.5, outerRadius: o.r + 5, startAngle: (o.i / o.n) * 2 * Math.PI, endAngle: ((o.i + 1) / o.n) * 2 * Math.PI, padAngle: o.n > 1 ? 0.12 : 0 }))
      .attr("fill", (o) => this.tColor(o.k));
    this.nodeSel.select(".core").attr("r", (d) => radius(d.c)).attr("fill", (d) => mColor(d.c.mastery));
    this.nodeSel.select(".flag").attr("cx", (d) => radius(d.c) * 0.75).attr("cy", (d) => -radius(d.c) * 0.75).attr("r", 4.5).classed("hidden", (d) => !d.c.miscon);
    this.nodeSel.select<SVGTextElement>("text").each(function (d) {
      const t = d3.select(this); t.selectAll("tspan").remove(); const r = radius(d.c) + 19;
      const lines = wrapLabel(T(d.c.label, L));
      d.lines = lines; d.w = Math.max(...lines.map((x) => x.length)) * CHAR;
      lines.forEach((ln, i) => t.append("tspan").attr("x", 0).attr("y", r + i * LINE).text(ln));
    });

    this.sim.nodes(nodes);
    (this.sim.force("link") as d3.ForceLink<SimNode, SimLink>).links(this.simLinks);
    (this.sim.force("collide") as d3.ForceCollide<SimNode>).radius((d) => radius(d.c) + 14);
    this.applyVisibility();
    this.highlight();
    this.tick();
  }

  private edgePath = (l: SimLink) => {
    const s = l.source as SimNode, t = l.target as SimNode;
    if (s.x == null || t.x == null || s.y == null || t.y == null) return "";
    const dx = t.x - s.x, dy = t.y - s.y;
    const cx = (s.x + t.x) / 2 - dy * 0.12, cy = (s.y + t.y) / 2 + dx * 0.12;
    const v1x = cx - s.x, v1y = cy - s.y, d1 = Math.hypot(v1x, v1y) || 1, v2x = t.x - cx, v2y = t.y - cy, d2 = Math.hypot(v2x, v2y) || 1;
    const r1 = radius(s.c) + 6, r2 = radius(t.c) + (TYPES[l.l.type].dir ? 7 : 6);
    return `M${s.x + (v1x / d1) * r1},${s.y + (v1y / d1) * r1} Q${cx},${cy} ${t.x - (v2x / d2) * r2},${t.y - (v2y / d2) * r2}`;
  };

  private drawHulls() {
    if (this.o.view !== "domains" || !this.hullSel) return;
    const self = this;
    const placed: { x0: number; x1: number; y: number }[] = [];
    this.hullSel.each(function (tp) {
      const pts: [number, number][] = [];
      self.nodes.forEach((n) => {
        if (n.x == null || n.y == null || !self.visible(n.c) || self.o.hidden.has(tp.key) || !n.c.domains.includes(tp.key)) return;
        const r = radius(n.c) + 26;
        for (let i = 0; i < 10; i++) { const a = (i / 10) * 2 * Math.PI; pts.push([n.x + Math.cos(a) * r, n.y + Math.sin(a) * r]); }
      });
      const g = d3.select(this);
      if (pts.length < 3) { g.select("path").attr("d", null); g.select("text").text(""); return; }
      const h = d3.polygonHull(pts)!;
      const top = h.reduce((m, p) => (p[1] < m[1] ? p : m), h[0]);
      g.select("path").attr("d", self.hullLine(h));
      // put the name above the hull; move it up if it would sit on another domain's name
      const name = T(tp.name, self.o.lang), hw = (name.length * 7.4) / 2 + 6;
      let y = top[1] - 8;
      for (let guard = 0; guard < 12 && placed.some((p) => top[0] - hw < p.x1 && top[0] + hw > p.x0 && Math.abs(p.y - y) < 17); guard++) y -= 17;
      placed.push({ x0: top[0] - hw, x1: top[0] + hw, y });
      g.select("text").attr("x", top[0]).attr("y", y).text(name);
    });
  }

  private tick() {
    this.linkSel?.attr("d", this.edgePath);
    this.nodeSel?.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    this.drawHulls();
  }

  private applyVisibility() {
    const byId = (id: string) => this.nodes.get(id)?.c;
    this.nodeSel?.classed("hidden", (d) => !this.visible(d.c));
    this.linkSel?.classed("hidden", (l) => { const a = byId(l.l.from), b = byId(l.l.to); return !a || !b || !this.visible(a) || !this.visible(b); });
    const q = this.o.query.trim().toLowerCase();
    this.nodeSel?.classed("match", (d) => !!q && `${d.c.label.en} ${d.c.label.id || ""}`.toLowerCase().includes(q));
    this.drawHulls();
  }

  private highlight() {
    const sel = this.o.selected, g = this.data!;
    let nb: Set<string> | null = null;
    if (sel) { nb = new Set([sel]); g.links.forEach((l) => { if (l.from === sel) nb!.add(l.to); if (l.to === sel) nb!.add(l.from); }); }
    this.nodeSel?.classed("sel", (d) => d.id === sel).classed("dim", (d) => !!nb && !nb.has(d.id));
    this.linkSel?.classed("dim", (l) => !!nb && l.l.from !== sel && l.l.to !== sel)
      .classed("hot", (l) => !!sel && (l.l.from === sel || l.l.to === sel) && l.l.status !== "suggested")
      .attr("marker-end", (l) => {
        if (!TYPES[l.l.type].dir) return null;
        if (l.l.status === "suggested") return "url(#arr-acc)";
        return sel && (l.l.from === sel || l.l.to === sel) ? "url(#arr-hot)" : "url(#arr)";
      });
  }

  focus(id: string) {
    const n = this.nodes.get(id);
    if (n && n.x != null && n.y != null) this.svg.transition().duration(500).call(this.zoom.translateTo, n.x, n.y);
  }
}
