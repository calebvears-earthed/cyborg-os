// Persistence: Vercel KV (REST) when KV_REST_API_URL/TOKEN set, else data/state.json on disk (ephemeral on Vercel).
const fs = require('fs'); const path = require('path');
const FILE = path.join(process.cwd(), 'data', 'state.json');
const kv = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;
const kvCall = (cmd) => fetch(process.env.KV_REST_API_URL, { method: 'POST', headers: { Authorization: 'Bearer ' + process.env.KV_REST_API_TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(cmd) }).then(r => r.json()).then(d => d.result);
const readFile = () => { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { return {}; } };
async function get(key) { if (kv) { const v = await kvCall(['GET', 'cyborg:' + key]); return v ? JSON.parse(v) : null; } return readFile()[key] ?? null; }
async function set(key, val) { if (kv) { await kvCall(['SET', 'cyborg:' + key, JSON.stringify(val)]); return; } const all = readFile(); all[key] = val; fs.writeFileSync(FILE, JSON.stringify(all, null, 2)); }
async function all(keys) { const out = {}; for (const k of keys) out[k] = await get(k); return out; }
module.exports = { get, set, all, backend: kv ? 'kv' : 'file' };
