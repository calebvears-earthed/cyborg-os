// Daily cron. Sends today's reminders: Twilio SMS + Web Push. Calendar is served as an ICS feed (api/calendar-ics.js).
const { json, buildReminders, iso } = require('./_finance'); const S = require('./_store'); const { load } = require('./_kvdata'); const F = require('./_feed');
const twilio = async (msg) => {
  const { TWILIO_ACCOUNT_SID: sid, TWILIO_AUTH_TOKEN: tok, TWILIO_FROM: from, REMINDER_TO: to } = process.env;
  if (!sid || !tok || !from || !to) return 'skipped · Twilio env missing';
  const r = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + sid + '/Messages.json', { method: 'POST', headers: { Authorization: 'Basic ' + Buffer.from(sid + ':' + tok).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ From: from, To: to, Body: msg }) });
  return r.ok ? 'sent' : 'twilio ' + r.status;
};
const push = async (msg) => {
  const subs = (await S.get('push.subs')) || [];
  if (!subs.length || !process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return 'skipped · no subscribers or VAPID keys';
  let webpush; try { webpush = require('web-push'); } catch { return 'skipped · add web-push to package.json'; }
  webpush.setVapidDetails('mailto:' + (process.env.VAPID_EMAIL || 'caleb@earthedhv.au'), process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  let n = 0; for (const s of subs) { try { await webpush.sendNotification(s, JSON.stringify({ title: 'cyborg.', body: msg })); n++; } catch {} }
  return 'pushed to ' + n;
};
module.exports = async (req, res) => {
  const today = iso(new Date());
  const due = buildReminders(await load('finance-grid.json'), today).filter(r => r.fireOn === today);
  const sent = (await S.get('reminders.sent')) || {};
  const log = [];
  for (const r of due) {
    if (sent[r.id]) continue;
    const out = {};
    if (r.channels.includes('sms')) out.sms = await twilio(r.message);
    if (r.channels.includes('push')) out.push = await push(r.message);
    sent[r.id] = { at: new Date().toISOString(), ...out }; log.push({ id: r.id, ...out }); await F.post('reminder', r.message, Object.entries(out).map(([k, v]) => k + ' ' + v).join(' · '), 'finance');
  }
  await S.set('reminders.sent', sent);
  json(res, 200, { today, due: due.length, delivered: log });
};
