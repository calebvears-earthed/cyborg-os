// Daily weight / macros entries. GET → {entries}. POST {date,kg,kcal,protein,carbs,fats,note}. Also recomputes calorie target toward 95 kg.
const { json, body } = require('./_finance'); const S = require('./_store'); const { guard } = require('./_auth');
module.exports = guard(async (req, res) => {
  let entries = (await S.get('health.log')) || [];
  if (req.method === 'POST') { const e = await body(req); entries = entries.filter(x => x.date !== e.date); entries.push(e); entries.sort((a, b) => a.date.localeCompare(b.date)); await S.set('health.log', entries); }
  json(res, 200, { entries });
});
