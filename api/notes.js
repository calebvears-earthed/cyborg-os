// Brain notes · GET ?q=&tag= · POST {text,tag,source} · DELETE ?id= · KV list 'notes'
const { json, body } = require('./_finance'); const S = require('./_store'); const { guard } = require('./_auth');
const TAGS = ['Jobs', 'Sales', 'Brand', 'Finance', 'HV', 'Purple Earth', 'Personal', 'Idea'];
const autoTag = (t) => { const s = t.toLowerCase(); if (/purple earth/.test(s)) return 'Purple Earth'; if (/33 ?kv|11 ?kv|bess|hv\b|joint/.test(s)) return 'HV'; if (/quote|lead|pitch|sell|client/.test(s)) return 'Sales'; if (/brand|logo|marketing|post|video/.test(s)) return 'Brand'; if (/xero|invoice|bill|bas\b|cash|\$/.test(s)) return 'Finance'; if (/install|site|job|crew|troy/.test(s)) return 'Jobs'; if (/gym|run|sleep|weight|family/.test(s)) return 'Personal'; return 'Idea'; };
module.exports = guard(async (req, res) => {
  let notes = (await S.get('notes')) || [];
  const url = new URL(req.url, 'http://x');
  if (req.method === 'POST') { const b = await body(req); if (!b.text) return json(res, 400, { error: 'text required' }); const n = { id: 'nt' + Date.now(), text: b.text.trim(), tag: b.tag || autoTag(b.text), source: b.source || 'Typed', at: new Date().toISOString() }; notes.unshift(n); await S.set('notes', notes); return json(res, 200, { ok: true, note: n }); }
  if (req.method === 'DELETE') { const id = url.searchParams.get('id'); await S.set('notes', notes.filter(n => n.id !== id)); return json(res, 200, { ok: true }); }
  const q = (url.searchParams.get('q') || '').toLowerCase(), tag = url.searchParams.get('tag');
  if (q) notes = notes.filter(n => n.text.toLowerCase().includes(q)); if (tag) notes = notes.filter(n => n.tag === tag);
  json(res, 200, { count: notes.length, tags: TAGS, notes });
});
