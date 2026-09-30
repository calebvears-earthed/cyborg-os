// GET /api/feed?limit=50 · POST {kind,title,sub,view} · PATCH {id} marks read · PATCH {all:true} marks all read
const { json, body } = require('./_finance'); const S = require('./_store'); const F = require('./_feed'); const { guard } = require('./_auth');
module.exports = guard(async (req, res) => {
  if (req.method === 'POST') { const b = await body(req); await F.post(b.kind || 'note', b.title, b.sub, b.view); return json(res, 200, { ok: true }); }
  if (req.method === 'PATCH') { const b = await body(req); const list = ((await S.get('feed')) || []).map(n => (b.all || n.id === b.id) ? { ...n, read: true } : n); await S.set('feed', list); return json(res, 200, { ok: true }); }
  const lim = Number(new URL(req.url, 'http://x').searchParams.get('limit') || 50);
  const list = (await S.get('feed')) || [];
  json(res, 200, { unread: list.filter(n => !n.read).length, items: list.slice(0, lim) });
});
