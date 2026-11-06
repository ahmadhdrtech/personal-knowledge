import fs from "node:fs";
import path from "node:path";
import { getDb, DATA_DIR } from "@/lib/db";
import { fail, ok } from "@/lib/http";

export const dynamic = "force-dynamic";
const DIR = path.join(DATA_DIR, "backups");

function list() {
  if (!fs.existsSync(DIR)) return [];
  return fs.readdirSync(DIR).filter((f) => f.endsWith(".db")).map((f) => {
    const s = fs.statSync(path.join(DIR, f));
    return { name: f, size: s.size, at: s.mtimeMs };
  }).sort((a, b) => b.at - a.at);
}

export async function GET() {
  return ok({ dir: DIR, backups: list() });
}

/** Save a full copy of the database to data/backups. */
export async function POST() {
  try {
    fs.mkdirSync(DIR, { recursive: true });
    const d = new Date(), z = (n: number) => String(n).padStart(2, "0");
    const stamp = `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}-${z(d.getHours())}${z(d.getMinutes())}${z(d.getSeconds())}`;
    await getDb().$client.backup(path.join(DIR, `neuron-${stamp}.db`));
    return ok({ dir: DIR, backups: list() });
  } catch (e) {
    return fail(e);
  }
}
