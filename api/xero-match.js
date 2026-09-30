// Daily. Marks grid rows Paid when a matching Xero bill (ACCPAY) with similar contact name is PAID since last due date.
const { read, write, json } = require('./_finance');
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
module.exports = async (req, res) => {
  const { XERO_CLIENT_ID: id, XERO_CLIENT_SECRET: sec, XERO_TENANT_ID: tenant, XERO_REFRESH_TOKEN: refresh } = process.env;
  if (!id || !sec || !tenant || !refresh) return json(res, 200, { connected: false, note: 'Set XERO_* env · bills then auto-mark Paid when Xero clears them' });
  const tok = await fetch('https://identity.xero.com/connect/token', { method: 'POST', headers: { Authorization: 'Basic ' + Buffer.from(id + ':' + sec).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refresh }) }).then(r => r.json());
  if (!tok.access_token) return json(res, 502, { error: 'token refresh failed' });
  const since = new Date(Date.now() - 45 * 86400000).toISOString().slice(0, 10);
  const inv = await fetch('https://api.xero.com/api.xro/2.0/Invoices?where=Type=="ACCPAY"%20AND%20Status=="PAID"%20AND%20FullyPaidOnDate>=DateTime(' + since.replace(/-/g, ',') + ')', { headers: { Authorization: 'Bearer ' + tok.access_token, 'xero-tenant-id': tenant, Accept: 'application/json' } }).then(r => r.json()).catch(() => ({}));
  const paid = (inv.Invoices || []).map(i => ({ contact: norm(i.Contact && i.Contact.Name), total: i.Total, date: (i.FullyPaidOnDate || '').slice(0, 10) }));
  const grid = read('finance-grid.json'); const matched = [];
  grid.rows = grid.rows.map(r => { const hit = paid.find(p => p.contact && norm(r.item).includes(p.contact.slice(0, 6))); if (!hit || r.status === 'Complete') return r; matched.push(r.item); return { ...r, status: 'Paid', lastPaid: hit.date, lastPaidAmount: hit.total, notes: (r.notes ? r.notes + ' · ' : '') + 'Xero paid ' + hit.date }; });
  write('finance-grid.json', grid); json(res, 200, { connected: true, matched });
};
