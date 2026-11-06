// Makes a dated copy of the database in data/backups. Run with: bun run db:backup
import fs from "node:fs";
import path from "node:path";
import { getDb, DATA_DIR } from "../lib/db";

const dir = path.join(DATA_DIR, "backups");
fs.mkdirSync(dir, { recursive: true });
const d = new Date(), z = (n: number) => String(n).padStart(2, "0");
const stamp = `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}-${z(d.getHours())}${z(d.getMinutes())}`;
const file = path.join(dir, `neuron-${stamp}.db`);
getDb().$client.backup(file).then(() => console.log(`Backup saved: ${file}`));
