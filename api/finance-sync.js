// Weekly cron (vercel.json: "schedule": "0 22 * * 0"). Reads the Bills Register v3 markdown table and syncs data/finance-grid.json.
// Source: OneDrive-earthedhv.au/777 legal + finance/00 active/2026-09-24-Bills-Register-Master-v3.md
// Set BILLS_REGISTER_URL to a Graph API download URL for that file (OneDrive for Business), or BILLS_REGISTER_PATH for a local mount.
const fs = require('fs');
const { read, write, json } = require('./_finance');
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40);
const num = (s) => { const m = String(s).replace(/,/g, '').match(/-?\d+(\.\d+)?/); return m && !/\*/.test(s) ? parseFloat(m[0]) : null; };
const date = (s) => { const d = new Date(s); return isNaN(d) || !/\d{4}/.test(s) ? null : d.toISOString().slice(0, 10); };
// Expects a pipe table with the 10 grid columns in order: Item | Category | Account | Weekly | Monthly | Next due | Frequency | Status | Reminder | Notes
const parse = (md) => md.split('\n').filter(l => /^\s*\|/.test(l) && !/^\s*\|\s*-/.test(l) && !/^\s*\|\s*Item/i.test(l)).map(l => {
  const c = l.split('|').slice(1, -1).map(x => x.trim());
  if (c.length < 10) return null;
  return { id: slug(c[0]), item: c[0], category: c[1], account: c[2], weekly: num(c[3]), monthly: num(c[4]), weeklyLabel: num(c[3]) == null ? c[3] : undefined, monthlyLabel: num(c[4]) == null ? c[4] : undefined, nextDue: date(c[5]), nextDueLabel: date(c[5]) ? undefined : c[5], frequency: c[6], status: c[7], reminder: /^y/i.test(c[8]), notes: c[9] };
}).filter(Boolean);
module.exports = async (req, res) => {
  try {
    let md = null;
    if (process.env.BILLS_REGISTER_PATH) md = fs.readFileSync(process.env.BILLS_REGISTER_PATH, 'utf8');
    else if (process.env.BILLS_REGISTER_URL) md = await (await fetch(process.env.BILLS_REGISTER_URL)).text();
    if (!md) return json(res, 200, { ok: false, skipped: 'BILLS_REGISTER_URL or BILLS_REGISTER_PATH not set' });
    const incoming = parse(md);
    const grid = read('finance-grid.json');
    const byId = Object.fromEntries(grid.rows.map(r => [r.id, r]));
    // Markdown wins for amounts, dates, status and notes. Local-only fields (resumes, Dec overrides, reminder toggles) are kept.
    const rows = incoming.map(r => ({ ...(byId[r.id] || {}), ...r, reminder: byId[r.id] ? byId[r.id].reminder : r.reminder }));
    write('finance-grid.json', { ...grid, asOf: new Date().toISOString().slice(0, 10), rows });
    return json(res, 200, { ok: true, rows: rows.length, added: rows.filter(r => !byId[r.id]).length });
  } catch (e) { return json(res, 500, { error: e.message }); }
};
