import { NextResponse } from "next/server";
import { AIError, errorText } from "./ai/generate";

export const ok = (data: unknown) => NextResponse.json(data);

export function fail(e: unknown, status = 400) {
  if (e instanceof AIError) {
    return NextResponse.json({ error: e.code, message: errorText(e.code) || e.message, detail: e.message !== e.code ? e.message : undefined }, { status });
  }
  const msg = e instanceof Error ? e.message : String(e);
  if (msg === "invalid_json") return NextResponse.json({ error: "invalid_json", message: errorText("invalid_json") }, { status });
  return NextResponse.json({ error: "error", message: msg }, { status });
}

export async function body<T = any>(req: Request): Promise<T> {
  try { return (await req.json()) as T; } catch { return {} as T; }
}
