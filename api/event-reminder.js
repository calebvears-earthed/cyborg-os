// POST: queue an email reminder for a calendar event. DELETE ?id=: drop it. GET (cron, every 15 min): send due reminders via Resend.
const S = require('./_store'); const { json } = require('./_finance'); const F = require('./_feed');
const KEY = 'event.reminders';
const sendAt = (ev) => {
  const t = ev.time && /^\d\d:\d\d$/.test(ev.time) ? ev.time : '08:00';
  const start = new Date(ev.date + 'T' + t + ':00+09:30');
  if (ev.reminder === 'morning') return new Date(ev.date + 'T07:00:00+09:30');
  const mins = Number(ev.reminder); return isNaN(mins) ? start : new Date(start.getTime() - mins * 60000);
};
module.exports = async (req, res) => {
  const list = (await S.get(KEY)) || [];
  if (req.method === 'POST') {
    const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    if (!b.id || !b.email || !b.date) return json(res, 400, { error: 'id, email, date required' });
    const rec = { ...b, sendAt: sendAt(b).toISOString(), sent: false };
    const next = list.filter(r => r.id !== b.id).concat(rec); await S.set(KEY, next);
    return json(res, 200, { status: process.env.RESEND_API_KEY ? 'Reminder queued for ' + rec.sendAt : 'Stored · add RESEND_API_KEY to send', sendAt: rec.sendAt });
  }
  if (req.method === 'DELETE') { const id = new URL(req.url, 'http://x').searchParams.get('id'); await S.set(KEY, list.filter(r => r.id !== id)); return json(res, 200, { ok: true }); }
  // cron
  const rs = process.env.RESEND_API_KEY; const now = Date.now(); const log = [];
  for (const r of list) {
    if (r.sent || new Date(r.sendAt).getTime() > now) continue;
    if (!rs) { log.push(r.id + ' · skipped, no RESEND_API_KEY'); continue; }
    const when = new Date(r.date + 'T' + (r.time || '08:00') + ':00+09:30').toLocaleString('en-AU', { timeZone: 'Australia/Adelaide', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
    const text = [r.title, when, r.notes || '', '', 'Open cyborg. to edit or clear this event.'].join('\n');
    const resp = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + rs, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: 'cyborg <calendar@earthedhv.au>', to: [r.email], subject: 'Reminder · ' + r.title + ' · ' + when, text }) });
    r.sent = resp.ok; r.sentAt = new Date().toISOString(); r.status = resp.ok ? 'sent' : 'resend ' + resp.status; log.push(r.id + ' · ' + r.status); await F.post('reminder', 'Reminder ' + r.status + ' · ' + r.title, when, 'month');
  }
  await S.set(KEY, list.filter(r => !r.sent || now - new Date(r.sentAt).getTime() < 30 * 86400000));
  json(res, 200, { checked: list.length, log });
};
