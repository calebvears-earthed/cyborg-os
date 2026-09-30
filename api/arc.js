// Arc · Claude with tools over every Cyborg data surface. POST {messages:[{role,content}], view, context}
// Needs ANTHROPIC_API_KEY. Model via ARC_MODEL (default claude-sonnet-4-5). Log persisted to KV 'arc.log' (last 60 turns).
const { json, body } = require('./_finance'); const S = require('./_store'); const { load, save, seed } = require('./_kvdata'); const F = require('./_feed'); const { guard } = require('./_auth');
const { nextId, blank } = require('./_leads');
const DATA = ['pages.json', 'leads.json', 'finance-grid.json', 'finance-summary.json', 'calendar-events.json', 'urgent-actions.json', 'contacts.json', 'documents.json', 'marketing-plan.json', 'training.json'];
const SYSTEM = `You are Arc, the resident operator inside cyborg. — the personal operating system of Caleb Vears, director of Earthed High Voltage (HV cable jointing to 33 kV, BESS) and Earthed Energy (solar + battery) in the Adelaide Hills, SA. Single user, internal only. Be terse, direct, Australian English, no emoji. Money in AUD. Dates in Australia/Adelaide. Use tools to read real data before answering about jobs, leads, bills, events or documents. When Caleb asks you to do something, do it with a tool and confirm in one line. Never invent numbers.`;
const TOOLS = [
  { name: 'read_data', description: 'Read a Cyborg data document. Files: ' + DATA.join(', '), input_schema: { type: 'object', properties: { file: { type: 'string' } }, required: ['file'] } },
  { name: 'list_leads', description: 'Filter leads', input_schema: { type: 'object', properties: { stage: { type: 'string' }, source: { type: 'string' }, q: { type: 'string' } } } },
  { name: 'append_lead', description: 'Create a lead', input_schema: { type: 'object', properties: { name: { type: 'string' }, phone: { type: 'string' }, email: { type: 'string' }, suburb: { type: 'string' }, interest: { type: 'string' }, source: { type: 'string' }, notes: { type: 'string' }, value: { type: 'number' } }, required: ['name'] } },
  { name: 'update_lead', description: 'Patch a lead by id (stage, nextAction, notes, value, contactedAt…)', input_schema: { type: 'object', properties: { id: { type: 'string' }, patch: { type: 'object' } }, required: ['id', 'patch'] } },
  { name: 'patch_bill', description: 'Update a finance-grid row by id (status, reminder, notes, nextDue, monthly)', input_schema: { type: 'object', properties: { id: { type: 'string' }, patch: { type: 'object' } }, required: ['id', 'patch'] } },
  { name: 'create_block', description: 'Create a work block (task) on the Urgent list', input_schema: { type: 'object', properties: { title: { type: 'string' }, meta: { type: 'string' }, time: { type: 'string' }, priority: { type: 'string', enum: ['urgent', 'semi', 'non'] }, todos: { type: 'array', items: { type: 'string' } } }, required: ['title'] } },
  { name: 'create_event', description: 'Add a calendar event. cat: urgent|personal|energy|hv|compliance|finance. reminder: none|15|60|morning|1440|10080 with email', input_schema: { type: 'object', properties: { title: { type: 'string' }, date: { type: 'string' }, time: { type: 'string' }, cat: { type: 'string' }, notes: { type: 'string' }, reminder: { type: 'string' }, email: { type: 'string' } }, required: ['title', 'date'] } },
  { name: 'add_note', description: 'Save a note to Brain', input_schema: { type: 'object', properties: { text: { type: 'string' }, tag: { type: 'string' } }, required: ['text'] } },
  { name: 'search', description: 'Search across leads, bills, events, contacts, documents, notes', input_schema: { type: 'object', properties: { q: { type: 'string' } }, required: ['q'] } },
  { name: 'notify', description: 'Post to the notifications feed', input_schema: { type: 'object', properties: { title: { type: 'string' }, sub: { type: 'string' } }, required: ['title'] } },
];
async function run(name, a) {
  if (name === 'read_data') { if (!DATA.includes(a.file)) return { error: 'unknown file' }; try { return await load(a.file); } catch { return seed(a.file); } }
  if (name === 'list_leads') { let l = (await load('leads.json')).leads; if (a.stage) l = l.filter(x => x.stage === a.stage); if (a.source) l = l.filter(x => x.source === a.source); if (a.q) l = l.filter(x => JSON.stringify(x).toLowerCase().includes(a.q.toLowerCase())); return l.slice(0, 40); }
  if (name === 'append_lead') { const db = await load('leads.json'); const lead = blank({ ...a, id: nextId(db.leads), owner: 'Arc' }); db.leads.unshift(lead); await save('leads.json', db); await F.post('lead', 'Arc added lead · ' + lead.name, lead.interest, 'crm'); return lead; }
  if (name === 'update_lead') { const db = await load('leads.json'); const i = db.leads.findIndex(l => l.id === a.id); if (i < 0) return { error: 'not found' }; db.leads[i] = { ...db.leads[i], ...a.patch }; await save('leads.json', db); return db.leads[i]; }
  if (name === 'patch_bill') { const g = await load('finance-grid.json'); const i = g.rows.findIndex(r => r.id === a.id); if (i < 0) return { error: 'not found' }; g.rows[i] = { ...g.rows[i], ...a.patch }; await save('finance-grid.json', g); return g.rows[i]; }
  if (name === 'create_block') { const added = (await S.get('blocks.added')) || []; const item = { id: 'a' + Date.now(), title: a.title, meta: a.meta || 'Arc', time: a.time || '30 min', due: 'Today', owner: 'Arc', priority: a.priority || 'semi', todos: (a.todos || []).map(t => ({ t, done: false })) }; added.push(item); await S.set('blocks.added', added); await F.post('block', 'Arc queued · ' + a.title, a.meta || '', 'urgent'); return item; }
  if (name === 'create_event') { const ev = (await S.get('events')) || { added: [], edits: {}, deleted: [] }; const id = 'l' + Date.now(); const rec = { id, title: a.title, date: a.date, time: a.time || '', cat: a.cat || 'energy', notes: a.notes || '', reminder: a.reminder || 'none', email: a.email || '' }; ev.added.push(rec); await S.set('events', ev); if (rec.reminder !== 'none' && rec.email) { const q = (await S.get('event.reminders')) || []; const t = /^\d\d:\d\d$/.test(rec.time) ? rec.time : '08:00'; const start = new Date(rec.date + 'T' + t + ':00+09:30'); const sendAt = rec.reminder === 'morning' ? new Date(rec.date + 'T07:00:00+09:30') : new Date(start.getTime() - Number(rec.reminder) * 60000); q.push({ ...rec, sendAt: sendAt.toISOString(), sent: false }); await S.set('event.reminders', q); } await F.post('event', 'Arc added · ' + a.title, a.date + (a.time ? ' ' + a.time : ''), 'month'); return rec; }
  if (name === 'add_note') { const notes = (await S.get('notes')) || []; const n = { id: 'nt' + Date.now(), text: a.text, tag: a.tag || 'Idea', source: 'Arc', at: new Date().toISOString() }; notes.unshift(n); await S.set('notes', notes); return n; }
  if (name === 'notify') { await F.post('arc', a.title, a.sub, null); return { ok: true }; }
  if (name === 'search') { const q = a.q.toLowerCase(); const hit = (o) => JSON.stringify(o).toLowerCase().includes(q); const out = {}; const L = await load('leads.json'); out.leads = L.leads.filter(hit).slice(0, 10); out.bills = (await load('finance-grid.json')).rows.filter(hit).slice(0, 10); out.contacts = seed('contacts.json').filter(hit).slice(0, 10); out.documents = (seed('documents.json').docs || []).filter(hit).slice(0, 10); out.events = seed('calendar-events.json').filter(hit).slice(0, 10); out.notes = ((await S.get('notes')) || []).filter(hit).slice(0, 10); return out; }
  return { error: 'unknown tool' };
}
module.exports = guard(async (req, res) => {
  if (req.method === 'GET') return json(res, 200, { connected: !!process.env.ANTHROPIC_API_KEY, model: process.env.ARC_MODEL || 'claude-sonnet-4-5', log: (await S.get('arc.log')) || [] });
  if (req.method === 'DELETE') { await S.set('arc.log', []); return json(res, 200, { ok: true }); }
  const key = process.env.ANTHROPIC_API_KEY;
  const b = await body(req);
  if (!key) return json(res, 200, { reply: 'Arc is not connected · add ANTHROPIC_API_KEY in Vercel → Environment Variables and redeploy.', connected: false });
  const messages = (b.messages || []).slice(-20).map(m => ({ role: m.role === 'arc' ? 'assistant' : 'user', content: m.text || m.content }));
  const sys = SYSTEM + '\n\nToday: ' + new Date().toLocaleDateString('en-AU', { timeZone: 'Australia/Adelaide', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + '. Caleb is looking at the "' + (b.view || 'dashboard') + '" page.' + (b.context ? '\nOn screen: ' + JSON.stringify(b.context).slice(0, 6000) : '');
  const call = (msgs) => fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' }, body: JSON.stringify({ model: process.env.ARC_MODEL || 'claude-sonnet-4-5', max_tokens: 1200, system: sys, tools: TOOLS, messages: msgs }) }).then(r => r.json());
  const used = [];
  try {
    let msgs = messages, out;
    for (let i = 0; i < 6; i++) {
      out = await call(msgs); if (out.error) throw new Error(out.error.message);
      const uses = (out.content || []).filter(c => c.type === 'tool_use'); if (!uses.length || out.stop_reason !== 'tool_use') break;
      const results = []; for (const u of uses) { const r = await run(u.name, u.input || {}); used.push(u.name); results.push({ type: 'tool_result', tool_use_id: u.id, content: JSON.stringify(r).slice(0, 12000) }); }
      msgs = [...msgs, { role: 'assistant', content: out.content }, { role: 'user', content: results }];
    }
    const reply = (out.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n').trim() || 'Done.';
    const log = ((await S.get('arc.log')) || []).concat([{ role: 'me', text: messages[messages.length - 1].content, at: new Date().toISOString() }, { role: 'arc', text: reply, tools: used, at: new Date().toISOString() }]).slice(-60);
    await S.set('arc.log', log);
    json(res, 200, { reply, tools: used, connected: true });
  } catch (e) { json(res, 200, { reply: 'Arc error · ' + e.message, connected: true, error: true }); }
});
