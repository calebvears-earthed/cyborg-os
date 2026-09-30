// POST /api/leads-append · body: partial lead · appends to the live leads document (KV in prod, data/leads.json locally)
const { json, body, nextId, blank } = require('./_leads'); const { load, save } = require('./_kvdata'); const F = require('./_feed');
module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 204, {});
  if (req.method !== 'POST') return json(res, 405, { error: 'POST only' });
  try {
    const p = await body(req);
    if (!p.name) return json(res, 400, { error: 'name required' });
    const db = await load('leads.json');
    const lead = blank({ ...p, id: nextId(db.leads) });
    db.leads.unshift(lead);
    await save('leads.json', db);
    await F.post('lead', 'New lead · ' + lead.name + (lead.suburb ? ' · ' + lead.suburb : ''), lead.source + ' · ' + lead.interest, 'crm');
    return json(res, 200, { ok: true, lead });
  } catch (e) { return json(res, 500, { error: e.message }); }
};
