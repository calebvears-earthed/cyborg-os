// Meta Lead Ads webhook.
// GET ?hub.mode=subscribe&hub.verify_token=...&hub.challenge=... · verification handshake (META_VERIFY_TOKEN env)
// GET ?status=1 · health payload for the CRM card
// POST · leadgen change notification. Fetches the lead via Graph API (META_PAGE_TOKEN env) and appends.
const { read, write, json, body, nextId, blank } = require('./_leads');
const status = () => {
  const db = read();
  const meta = db.leads.filter(l => l.source === 'Meta').sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { endpoint: '/api/meta-lead-webhook', lastReceived: meta[0] ? meta[0].createdAt : null, total: db.webhookTotal || meta.length, manager: 'https://business.facebook.com/latest/leads_center' };
};
module.exports = async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (req.method === 'GET') {
    if (url.searchParams.get('hub.mode') === 'subscribe') {
      if (url.searchParams.get('hub.verify_token') !== process.env.META_VERIFY_TOKEN) return json(res, 403, { error: 'bad token' });
      res.statusCode = 200; return res.end(url.searchParams.get('hub.challenge'));
    }
    return json(res, 200, status());
  }
  if (req.method !== 'POST') return json(res, 405, { error: 'POST only' });
  try {
    const p = await body(req);
    const changes = (p.entry || []).flatMap(e => e.changes || []).filter(c => c.field === 'leadgen');
    const db = read();
    for (const c of changes) {
      let fields = {};
      if (process.env.META_PAGE_TOKEN && c.value && c.value.leadgen_id) {
        const r = await fetch('https://graph.facebook.com/v19.0/' + c.value.leadgen_id + '?access_token=' + process.env.META_PAGE_TOKEN);
        const d = await r.json();
        (d.field_data || []).forEach(f => { fields[f.name] = (f.values || [])[0] || ''; });
      }
      db.leads.unshift(blank({ id: nextId(db.leads), source: 'Meta', name: fields.full_name || 'Meta lead ' + (c.value && c.value.leadgen_id || ''), phone: fields.phone_number || '', email: fields.email || '', suburb: fields.city || fields.suburb || '', interest: fields.interest || 'Solar', notes: 'Form ' + (c.value && c.value.form_id || '') }));
      db.webhookTotal = (db.webhookTotal || 0) + 1;
    }
    write(db);
    return json(res, 200, { ok: true, received: changes.length });
  } catch (e) { return json(res, 500, { error: e.message }); }
};
