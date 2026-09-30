// Sunday 18:00 ACST cron. SMS (Twilio) + email (Resend) digest: outflow, runway, top follow-ups, pipeline, lead SLA breaches.
const { json } = require('./_finance'); const S = require('./_store'); const { load } = require('./_kvdata'); const F = require('./_feed');
const money = (n) => '$' + Math.round(n || 0).toLocaleString('en-AU');
module.exports = async (req, res) => {
  const grid = await load('finance-grid.json'); const sum = await load('finance-summary.json'); const leads = ((await load('leads.json')).leads || []);
  const mAmt = (r) => r.frequency === 'Weekly' ? (r.weekly || 0) * 52 / 12 : (r.monthly || 0);
  const out = grid.rows.filter(r => r.category !== 'Income' && (r.status === 'Active' || r.status === 'Defaulted')).reduce((a, r) => a + mAmt(r), 0);
  const cash = sum.cashOnHand || 0; const runway = out ? (cash / out).toFixed(1) : '·';
  const follow = grid.rows.filter(r => r.status === 'Follow-up' || r.status === 'Defaulted').slice(0, 3).map(r => r.item);
  const pipe = leads.filter(l => ['Quoted', 'Booked'].includes(l.stage)).reduce((a, l) => a + (l.value || 0), 0);
  const sla = leads.filter(l => l.stage === 'New' && !l.contactedAt && Date.now() - new Date(l.createdAt) > 7200000).length;
  const text = ['cyborg. weekly', 'Outflow ' + money(out) + '/mo · runway ' + runway + ' mo', 'Pipeline ' + money(pipe), sla ? sla + ' lead(s) past 2h SLA' : 'Leads on SLA', follow.length ? 'Chase: ' + follow.join(', ') : ''].filter(Boolean).join('\n');
  const log = { text };
  const { TWILIO_ACCOUNT_SID: sid, TWILIO_AUTH_TOKEN: tok, TWILIO_FROM: from, REMINDER_TO: to, RESEND_API_KEY: rs, DIGEST_EMAIL: em } = process.env;
  if (sid && tok && from && to) { const r = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + sid + '/Messages.json', { method: 'POST', headers: { Authorization: 'Basic ' + Buffer.from(sid + ':' + tok).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ From: from, To: to, Body: text }) }); log.sms = r.ok ? 'sent' : 'twilio ' + r.status; } else log.sms = 'skipped · Twilio env missing';
  if (rs && em) { const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + rs, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: 'cyborg <digest@earthedhv.au>', to: [em], subject: 'cyborg. weekly · runway ' + runway + ' mo', text }) }); log.email = r.ok ? 'sent' : 'resend ' + r.status; } else log.email = 'skipped · RESEND_API_KEY / DIGEST_EMAIL missing';
  await F.post('digest', 'Weekly digest sent', 'runway ' + runway + ' mo · pipeline ' + money(pipe), 'settings'); const hist = (await S.get('digest.log')) || []; hist.unshift({ at: new Date().toISOString(), ...log }); await S.set('digest.log', hist.slice(0, 26));
  json(res, 200, log);
};
