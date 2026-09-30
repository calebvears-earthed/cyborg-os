// Bank balances via Basiq (CDR-accredited aggregator covering NAB + Macquarie). Set BASIQ_API_KEY + BASIQ_USER_ID.
// Connect at https://dashboard.basiq.io · consent UI links the two banks · cashOnHand updates into finance-summary.json
const { json, read, write } = require('./_finance');
module.exports = async (req, res) => {
  const { BASIQ_API_KEY: key, BASIQ_USER_ID: user } = process.env;
  if (!key || !user) return json(res, 200, { connected: false, note: 'Set BASIQ_API_KEY and BASIQ_USER_ID in Vercel for NAB + Macquarie live balances' });
  const tok = await fetch('https://au-api.basiq.io/token', { method: 'POST', headers: { Authorization: 'Basic ' + key, 'Content-Type': 'application/x-www-form-urlencoded', 'basiq-version': '3.0' }, body: 'scope=SERVER_ACCESS' }).then(r => r.json());
  const acc = await fetch('https://au-api.basiq.io/users/' + user + '/accounts', { headers: { Authorization: 'Bearer ' + tok.access_token } }).then(r => r.json()).catch(() => ({}));
  const accounts = (acc.data || []).map(a => ({ institution: a.institution, name: a.name, balance: Number(a.balance || 0), available: Number(a.availableFunds || 0) }));
  const s = read('finance-summary.json'); s.cashOnHand = Math.round(accounts.reduce((t, a) => t + a.balance, 0)); s.cashOnHandNote = 'Live · Basiq · ' + accounts.map(a => a.name).join(', '); s.accounts = accounts; write('finance-summary.json', s);
  json(res, 200, { connected: true, accounts });
};
