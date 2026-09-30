// Unified notifications feed · KV list 'feed' (newest first, capped at 200). Every cron and write path posts here.
const S = require('./_store');
async function post(kind, title, sub, view) {
  const list = (await S.get('feed')) || [];
  list.unshift({ id: 'n' + Date.now() + Math.random().toString(36).slice(2, 6), kind, title, sub: sub || '', view: view || null, at: new Date().toISOString(), read: false });
  await S.set('feed', list.slice(0, 200));
}
module.exports = { post };
