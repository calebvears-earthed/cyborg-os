const { json, body } = require('./_finance'); const A = require('./_auth');
module.exports = async (req, res) => {
  if (req.method === 'GET') return json(res, 200, { enabled: A.enabled(), unlocked: A.ok(req) });
  const { passcode } = await body(req);
  if (!A.enabled()) return json(res, 200, { unlocked: true, note: 'DASHBOARD_PASSCODE not set · gate disabled server-side' });
  if (passcode !== A.code()) return json(res, 401, { unlocked: false });
  res.setHeader('Set-Cookie', 'cyborg_session=' + A.token() + '; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000');
  json(res, 200, { unlocked: true });
};
