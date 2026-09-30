// Reports which connectors have credentials present. Never returns the values.
const { json } = require('./_finance');
const DEFS = require('../data/integrations.json');
module.exports = (req, res) => {
  const out = DEFS.map(d => ({ id: d.id, connected: d.env.every(k => !!process.env[k]), missing: d.env.filter(k => !process.env[k]) }));
  json(res, 200, { integrations: out, kv: !!process.env.KV_REST_API_URL, passcode: !!process.env.DASHBOARD_PASSCODE });
};
