// Resets the knowledge map to the 15-concept demo. Keeps your models, keys and usage history.
// Run with: bun run seed
import { getDb } from "../lib/db";
import { seedDemo } from "../lib/db/seed";

const db = getDb();
seedDemo(db);
db.$client.prepare("INSERT OR REPLACE INTO settings(key,value) VALUES('seeded','1')").run();
const n = db.$client.prepare("SELECT COUNT(*) AS n FROM concepts").get() as { n: number };
console.log(`Demo map ready: ${n.n} concepts in data/neuron.db`);
