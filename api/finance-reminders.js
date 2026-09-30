// GET /api/finance-reminders · pending queue, regenerated from finance-grid.json, merged with stored snooze/dismiss state
// POST /api/finance-reminders · body { id, action: 'snooze1' | 'snooze3' | 'dismiss' }
// Delivery (Twilio SMS, calendar event, web push) is a separate cron worker that reads this queue. Not wired in this pass.
const { json, body, iso, addDays, buildReminders } = require('./_finance'); const { load, save } = require('./_kvdata'); const write = (f, d) => save(f, d);
const FILE = 'finance-reminders.json';
module.exports = async (req, res) => {
  try {
    const store = await load(FILE); const grid = await load('finance-grid.json');
    const today = iso(new Date());
    const prior = Object.fromEntries((store.reminders || []).map(r => [r.id, r]));
    const merged = buildReminders(grid, today).map(r => ({ ...r, state: 'pending', snoozedUntil: null, ...(prior[r.id] ? { state: prior[r.id].state, snoozedUntil: prior[r.id].snoozedUntil } : {}) }));
    if (req.method === 'POST') {
      const p = await body(req);
      const r = merged.find(x => x.id === p.id);
      if (!r) return json(res, 404, { error: 'reminder not found' });
      if (p.action === 'dismiss') { r.state = 'dismissed'; r.snoozedUntil = null; }
      if (p.action === 'snooze1') { r.state = 'snoozed'; r.snoozedUntil = addDays(today, 1); }
      if (p.action === 'snooze3') { r.state = 'snoozed'; r.snoozedUntil = addDays(today, 3); }
    }
    await write(FILE, { _schema: store._schema, generatedAt: new Date().toISOString(), reminders: merged });
    const due = merged.filter(r => r.state !== 'dismissed' && (r.state !== 'snoozed' || r.snoozedUntil <= today));
    return json(res, 200, { generatedAt: new Date().toISOString(), count: due.length, reminders: merged, dueNow: due.filter(r => r.fireOn <= today) });
  } catch (e) { return json(res, 500, { error: e.message }); }
};
