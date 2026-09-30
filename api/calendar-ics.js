// Subscribe to this URL in Google/Apple/Outlook calendar: reminders + due dates land as all-day events.
const { read, buildReminders } = require('./_finance');
const esc = (s) => String(s).replace(/[\\;,]/g, (m) => '\\' + m).replace(/\n/g, '\\n');
module.exports = (req, res) => {
  const grid = read('finance-grid.json');
  const rem = buildReminders(grid).filter(r => r.channels.includes('calendar'));
  const rows = grid.rows.filter(r => r.nextDue && r.status !== 'Complete');
  const ev = (uid, date, title, desc) => ['BEGIN:VEVENT', 'UID:' + uid + '@cyborg.earthedhv.au', 'DTSTART;VALUE=DATE:' + date.replace(/-/g, ''), 'SUMMARY:' + esc(title), 'DESCRIPTION:' + esc(desc), 'END:VEVENT'].join('\r\n');
  const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//cyborg//finance//EN', 'X-WR-CALNAME:cyborg · Bills',
    ...rows.map(r => ev('due-' + r.id + '-' + r.nextDue, r.nextDue, 'Due · ' + r.item + ' · ' + (r.monthlyLabel || '$' + r.monthly), r.account + ' · ' + (r.notes || ''))),
    ...rem.map(r => ev('rem-' + r.id, r.fireOn, r.message, r.kind)), 'END:VCALENDAR'].join('\r\n');
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8'); res.setHeader('Content-Disposition', 'inline; filename="cyborg-bills.ics"'); res.end(body);
};
