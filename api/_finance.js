const fs = require('fs'); const path = require('path');
const P = (f) => path.join(process.cwd(), 'data', f);
const read = (f) => JSON.parse(fs.readFileSync(P(f), 'utf8'));
const write = (f, d) => fs.writeFileSync(P(f), JSON.stringify(d, null, 2));
const json = (res, code, body) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.setHeader('Access-Control-Allow-Origin', '*'); res.end(JSON.stringify(body)); };
const body = (req) => new Promise((ok) => { if (req.body) return ok(typeof req.body === 'string' ? JSON.parse(req.body) : req.body); let s = ''; req.on('data', c => s += c); req.on('end', () => ok(s ? JSON.parse(s) : {})); });
const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (s, n) => { const d = new Date(s); d.setDate(d.getDate() + n); return iso(d); };
const money = (n) => n == null ? '·' : '$' + n.toLocaleString('en-AU', { minimumFractionDigits: n % 1 ? 2 : 0 });
const fmt = (s) => new Date(s).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
// Build the pending queue from the grid. Part E rules.
const buildReminders = (grid, today = iso(new Date())) => {
  const out = [];
  grid.rows.filter(r => r.reminder && r.status !== 'Complete').forEach(r => {
    const amt = r.monthlyLabel || money(r.monthly);
    if (r.status === 'Defaulted') out.push({ id: r.id + ':' + today, rowId: r.id, kind: 'defaulted', fireOn: today, channels: ['sms', 'push'], message: 'Reminder: ' + r.item + ' · ' + amt + ' due ' + (r.nextDueLabel || 'now') + ' · ' + r.account + ' · DEFAULTED' });
    if (r.status === 'Paused' && r.resumes) { const f = addDays(r.resumes, -14); out.push({ id: r.id + ':' + f, rowId: r.id, kind: 'resumption', fireOn: f, channels: ['calendar', 'sms', 'push'], message: 'Reminder: ' + r.item + ' resumes ' + fmt(r.resumes) + ' · ' + (r.monthlyDec != null ? money(r.monthlyDec) + '/mo' : amt) + ' · ' + r.account }); }
    else if (r.nextDue) { const f = addDays(r.nextDue, -3); out.push({ id: r.id + ':' + f, rowId: r.id, kind: r.status === 'Pending' && r.resumes ? 'resumption' : 'due', fireOn: f, channels: ['calendar', 'sms', 'push'], message: 'Reminder: ' + r.item + ' · ' + amt + ' due ' + fmt(r.nextDue) + ' · ' + r.account }); }
  });
  return out.sort((a, b) => a.fireOn.localeCompare(b.fireOn));
};
module.exports = { read, write, json, body, iso, addDays, buildReminders };
