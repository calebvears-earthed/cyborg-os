// Seeded KV documents: data/<file>.json is the seed, KV key 'doc:<file>' is the live copy (falls back to a state.json section locally).
// Fixes the read-only-filesystem bug: leads, finance grid and finance reminders now persist in prod.
const fs = require('fs'); const path = require('path'); const S = require('./_store');
const seedPath = (f) => path.join(process.cwd(), 'data', f);
const seed = (f) => JSON.parse(fs.readFileSync(seedPath(f), 'utf8'));
async function load(f) { const live = await S.get('doc:' + f); return live || seed(f); }
async function save(f, d) { await S.set('doc:' + f, d); try { if (!process.env.VERCEL) fs.writeFileSync(seedPath(f), JSON.stringify(d, null, 2)); } catch {} }
module.exports = { load, save, seed };
