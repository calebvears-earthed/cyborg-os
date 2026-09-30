const fs = require('fs'); const path = require('path');
const FILE = path.join(process.cwd(), 'data', 'leads.json');
const read = () => JSON.parse(fs.readFileSync(FILE, 'utf8'));
const write = (d) => fs.writeFileSync(FILE, JSON.stringify(d, null, 2));
const json = (res, code, body) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.setHeader('Access-Control-Allow-Origin', '*'); res.end(JSON.stringify(body)); };
const body = (req) => new Promise((ok) => { if (req.body) return ok(typeof req.body === 'string' ? JSON.parse(req.body) : req.body); let s = ''; req.on('data', c => s += c); req.on('end', () => ok(s ? JSON.parse(s) : {})); });
const nextId = (leads) => 'L-' + String(Math.max(0, ...leads.map(l => parseInt((l.id || '').replace('L-', ''), 10) || 0)) + 1).padStart(4, '0');
const blank = (o) => ({ id: '', name: '', phone: '', email: '', source: 'Direct', referredBy: '', company: '', suburb: '', interest: 'Solar', value: 0, createdAt: new Date().toISOString(), contactedAt: null, responded: false, consultBooked: false, followUps: 0, lastContact: { date: '', method: '' }, nextAction: 'Call', stage: 'New', lostReason: '', owner: 'Arc', notes: '', ...o });
module.exports = { read, write, json, body, nextId, blank };
