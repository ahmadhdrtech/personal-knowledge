"use client";
import { useEffect, useRef } from "react";
import { GraphView, type GraphOpts } from "./GraphView";
import type { Graph } from "@/lib/types";

export default function GraphCanvas({ graph, opts, onSelect }: { graph: Graph; opts: GraphOpts; onSelect: (id: string | null) => void }) {
  const ref = useRef<SVGSVGElement>(null);
  const view = useRef<GraphView | null>(null);
  const cb = useRef(onSelect);
  cb.current = onSelect;

  useEffect(() => {
    view.current = new GraphView(ref.current!, (id) => cb.current(id));
    return () => { view.current?.destroy(); view.current = null; };
  }, []);

  useEffect(() => { view.current?.update(graph, opts); }, [graph, opts]);

  useEffect(() => {
    if (opts.selected) { const t = setTimeout(() => view.current?.focus(opts.selected!), 30); return () => clearTimeout(t); }
  }, [opts.selected]);

  const id = opts.lang === "id";
  return (
    <>
      <svg id="canvas" ref={ref} role="img" aria-label={id ? "Jaringan konsep, dikelompokkan per domain" : "Network of concepts, grouped into domains"} />
      <div className="zoom-ctl" role="group" aria-label={id ? "Perbesar atau perkecil peta" : "Zoom the map"}>
        <button type="button" onClick={() => view.current?.zoomBy(1.4)} aria-label={id ? "Perbesar" : "Zoom in"} title={id ? "Perbesar (atau gulir)" : "Zoom in (or scroll)"}>+</button>
        <button type="button" onClick={() => view.current?.zoomBy(1 / 1.4)} aria-label={id ? "Perkecil" : "Zoom out"} title={id ? "Perkecil" : "Zoom out"}>−</button>
        <button type="button" onClick={() => view.current?.refit()} aria-label={id ? "Tampilkan seluruh peta" : "Fit the whole map"} title={id ? "Tampilkan seluruh peta" : "Fit the whole map"}>⤢</button>
      </div>
    </>
  );
}
