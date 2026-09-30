// GET /api/marketing-analytics · placeholder, returns data/marketing-analytics.json.
// Wire Meta Insights, Google Ads and GA4 here later and fill metric values.
const fs = require('fs'); const path = require('path');
module.exports = async (req, res) => {
  const d = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'marketing-analytics.json'), 'utf8'));
  res.setHeader('Content-Type', 'application/json'); res.setHeader('Access-Control-Allow-Origin', '*');
  res.end(JSON.stringify(d));
};
