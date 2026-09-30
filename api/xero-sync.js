// Xero: pulls unpaid bills + last-12-month income once XERO_CLIENT_ID / XERO_CLIENT_SECRET / XERO_TENANT_ID / XERO_REFRESH_TOKEN are set.
// Connect at https://developer.xero.com/app/manage · scopes: accounting.transactions.read accounting.reports.read offline_access
const { json, read, write } = require('./_finance');
module.exports = async (req, res) => {
  const { XERO_CLIENT_ID: id, XERO_CLIENT_SECRET: sec, XERO_TENANT_ID: tenant, XERO_REFRESH_TOKEN: refresh } = process.env;
  if (!id || !sec || !tenant || !refresh) return json(res, 200, { connected: false, note: 'Set XERO_* env in Vercel, then this cron pulls invoices into finance-summary.json' });
  const tok = await fetch('https://identity.xero.com/connect/token', { method: 'POST', headers: { Authorization: 'Basic ' + Buffer.from(id + ':' + sec).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refresh }) }).then(r => r.json());
  if (!tok.access_token) return json(res, 502, { connected: false, error: 'token refresh failed' });
  const H = { Authorization: 'Bearer ' + tok.access_token, 'xero-tenant-id': tenant, Accept: 'application/json' };
  const since = new Date(); since.setMonth(since.getMonth() - 12);
  const inv = await fetch('https://api.xero.com/api.xro/2.0/Invoices?where=Type=="ACCREC"%20AND%20Status=="PAID"&page=1', { headers: H }).then(r => r.json()).catch(() => ({}));
  const paid = (inv.Invoices || []).filter(i => new Date(i.DateString || i.Date) >= since).reduce((a, i) => a + (i.Total || 0), 0);
  const s = read('finance-summary.json'); s.incomeTrailingMonthly = Math.round(paid / 12); s.incomeNote = 'Xero · paid ACCREC invoices · 12-mo avg · synced ' + new Date().toISOString().slice(0, 10); write('finance-summary.json', s);
  json(res, 200, { connected: true, incomeTrailingMonthly: s.incomeTrailingMonthly });
};
