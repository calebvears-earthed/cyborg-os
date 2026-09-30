const { json, body } = require('./_finance'); const S = require('./_store'); const { guard } = require('./_auth');
module.exports = guard(async (req, res) => {
  if (req.method === 'GET') return json(res, 200, { vapidPublicKey: process.env.VAPID_PUBLIC_KEY || null, subscribers: ((await S.get('push.subs')) || []).length });
  const sub = await body(req); if (!sub || !sub.endpoint) return json(res, 400, { error: 'bad subscription' });
  const subs = ((await S.get('push.subs')) || []).filter(s => s.endpoint !== sub.endpoint); subs.push(sub); await S.set('push.subs', subs);
  json(res, 200, { ok: true, subscribers: subs.length });
});
