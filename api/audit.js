// Append-only audit log of grid / lead / block edits. GET ?limit=50 · POST {entity,id,field,before,after}
const { json, body } = require('./_finance'); const S = require('./_store'); const { guard } = require('./_auth');
module.exports = guard(async (req, res) => {
  const log = (await S.get('audit')) || [];
  if (req.method === 'GET') return json(res, 200, { entries: log.slice(0, Number(new URL(req.url, 'http://x').searchParams.get('limit') || 50)) });
  const e = await body(req); log.unshift({ at: new Date().toISOString(), device: (req.headers['user-agent'] || '').slice(0, 40), ...e }); await S.set('audit', log.slice(0, 500));
  json(res, 200, { ok: true, count: log.length });
});
