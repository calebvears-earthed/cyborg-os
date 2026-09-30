// Full JSON backup of every data file + persisted state. GET /api/export
const fs = require('fs'); const path = require('path'); const S = require('./_store'); const { guard } = require('./_auth');
module.exports = guard(async (req, res) => {
  const dir = path.join(process.cwd(), 'data'); const out = { exportedAt: new Date().toISOString(), files: {}, state: await S.all(['blocks', 'blocks.added', 'crm.favs', 'templates', 'mcal', 'fin.overrides', 'reminders.sent']) };
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) { try { out.files[f] = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch {} }
  res.setHeader('Content-Type', 'application/json'); res.setHeader('Content-Disposition', 'attachment; filename="cyborg-backup-' + out.exportedAt.slice(0, 10) + '.json"'); res.end(JSON.stringify(out, null, 2));
});
