// Optional. Google Ads lead form webhook · POST with google_key check (GOOGLE_LEAD_KEY env)
const { read, write, json, body, nextId, blank } = require('./_leads');
module.exports = async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'POST only' });
  try {
    const p = await body(req);
    if (process.env.GOOGLE_LEAD_KEY && p.google_key !== process.env.GOOGLE_LEAD_KEY) return json(res, 403, { error: 'bad key' });
    const f = {}; (p.user_column_data || []).forEach(c => { f[c.column_id] = c.string_value; });
    const db = read();
    db.leads.unshift(blank({ id: nextId(db.leads), source: 'Google', name: f.FULL_NAME || 'Google lead', phone: f.PHONE_NUMBER || '', email: f.EMAIL || '', suburb: f.CITY || '', notes: 'Campaign ' + (p.campaign_id || '') }));
    write(db);
    return json(res, 200, { ok: true });
  } catch (e) { return json(res, 500, { error: e.message }); }
};
