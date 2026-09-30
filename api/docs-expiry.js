// Document vault. Reads data/documents.json (or OneDrive via Graph when MS_GRAPH_TOKEN + ONEDRIVE_FOLDER_ID set). Returns docs with days-to-expiry.
// Posts a feed alert once per doc when it crosses 30 days to expiry.
const { read, json } = require('./_finance'); const S = require('./_store'); const F = require('./_feed');
module.exports = async (req, res) => {
  const d = read('documents.json'); const today = new Date();
  const docs = d.docs.map(x => ({ ...x, daysLeft: x.expires ? Math.ceil((new Date(x.expires) - today) / 86400000) : null }));
  try { const warned = (await S.get('docs.warned')) || {}; let dirty = false; for (const x of docs) { if (x.daysLeft != null && x.daysLeft <= 30 && !warned[x.id]) { await F.post('doc', 'Expiring · ' + x.name, x.daysLeft + ' days · ' + x.entity, 'docs'); warned[x.id] = today.toISOString(); dirty = true; } } if (dirty) await S.set('docs.warned', warned); } catch {}
  json(res, 200, { source: process.env.MS_GRAPH_TOKEN ? 'onedrive' : 'file', docs, expiring: docs.filter(x => x.daysLeft != null && x.daysLeft <= 90) });
};
