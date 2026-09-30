// Passcode gate. Set DASHBOARD_PASSCODE in Vercel env. Cookie is an HMAC of the passcode so it can be verified statelessly.
const crypto = require('crypto');
const code = () => process.env.DASHBOARD_PASSCODE || '';
const token = () => crypto.createHmac('sha256', code() + '|cyborg').update('session').digest('hex');
const cookie = (req) => ((req.headers.cookie || '').match(/cyborg_session=([a-f0-9]+)/) || [])[1];
const enabled = () => !!code();
const ok = (req) => !enabled() || cookie(req) === token() || (req.headers['x-cyborg-passcode'] === code());
const guard = (handler) => (req, res) => { if (!ok(req)) { res.statusCode = 401; res.setHeader('Content-Type', 'application/json'); return res.end('{"error":"locked"}'); } return handler(req, res); };
module.exports = { enabled, ok, token, guard, code };
