// GET /api/leads-list?source=Meta&stage=New&interest=Battery&owner=Caleb&q=text · returns filtered leads
// PATCH /api/leads-list · body { id, ...fields } · updates one lead (stage, nextAction, notes, contactedAt…)
const { json, body } = require('./_leads'); const { load, save } = require('./_kvdata');
module.exports = async (req, res) => {
  try {
    const db = await load('leads.json');
    if (req.method === 'PATCH' || req.method === 'POST') {
      const p = await body(req); const i = db.leads.findIndex(l => l.id === p.id);
      if (i < 0) return json(res, 404, { error: 'lead not found' });
      db.leads[i] = { ...db.leads[i], ...p }; await save('leads.json', db);
      return json(res, 200, { ok: true, lead: db.leads[i] });
    }
    const url = new URL(req.url, 'http://x');
    let leads = db.leads;
    ['source', 'stage', 'interest', 'owner'].forEach(k => { const v = url.searchParams.get(k); if (v) leads = leads.filter(l => String(l[k] || '').toLowerCase() === v.toLowerCase()); });
    const q = (url.searchParams.get('q') || '').toLowerCase();
    if (q) leads = leads.filter(l => JSON.stringify(l).toLowerCase().includes(q));
    return json(res, 200, { count: leads.length, leads });
  } catch (e) { return json(res, 500, { error: e.message }); }
};
