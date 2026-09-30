// GET /api/finance-grid?category=Debt&account=Earthed%20HV&status=Active&dueWithin=7&reminder=1 · filtered rows
// POST /api/finance-grid · body { id, ...fields } · updates a single row. Live copy in KV (prod) / data/finance-grid.json (local).
const { json, body, iso, addDays } = require('./_finance'); const { load, save } = require('./_kvdata');
const FILE = 'finance-grid.json';
module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 204, {});
  try {
    const grid = await load(FILE);
    if (req.method === 'GET') {
      const f = Object.fromEntries(new URL(req.url, 'http://x').searchParams);
      let rows = grid.rows;
      ['category', 'account', 'status'].forEach(k => { if (f[k]) { const set = f[k].split(','); rows = rows.filter(r => set.includes(r[k])); } });
      if (f.reminder) rows = rows.filter(r => r.reminder);
      if (f.dueWithin) { const lim = addDays(iso(new Date()), +f.dueWithin); rows = rows.filter(r => r.nextDue && r.nextDue <= lim); }
      return json(res, 200, { asOf: grid.asOf, count: rows.length, rows });
    }
    if (req.method === 'POST') {
      const p = await body(req);
      const i = grid.rows.findIndex(r => r.id === p.id);
      if (i < 0) return json(res, 404, { error: 'row not found' });
      grid.rows[i] = { ...grid.rows[i], ...p };
      await save(FILE, grid);
      return json(res, 200, { ok: true, row: grid.rows[i] });
    }
    return json(res, 405, { error: 'GET or POST' });
  } catch (e) { return json(res, 500, { error: e.message }); }
};
