// Cross-device persistence for UI state (blocks, favs, templates, calendar edits, finance overrides, events).
// GET returns every key with a server timestamp; the client re-syncs on every load (not just first run).
const { json, body } = require('./_finance'); const S = require('./_store'); const { guard } = require('./_auth');
const KEYS = ['blocks', 'blocks.added', 'crm.favs', 'templates', 'mcal', 'fin.overrides', 'passcode.hint', 'events', 'reminderEmail'];
module.exports = guard(async (req, res) => {
  if (req.method === 'GET') { const state = await S.all(KEYS); const stamps = (await S.get('state.stamps')) || {}; return json(res, 200, { backend: S.backend, state, stamps }); }
  const b = await body(req); const stamps = (await S.get('state.stamps')) || {}; const now = Date.now();
  for (const k of Object.keys(b)) if (KEYS.includes(k)) { await S.set(k, b[k]); stamps[k] = now; }
  await S.set('state.stamps', stamps);
  json(res, 200, { ok: true, backend: S.backend, stamps });
});
