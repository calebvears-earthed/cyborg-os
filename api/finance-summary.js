// GET /api/finance-summary · finance-summary.json plus live sums from the grid for both phases
const { read, json } = require('./_finance');
const sums = (rows, phase) => {
  const m = (r) => phase === 'dec' && r.monthlyDec != null ? r.monthlyDec : (r.monthly || 0);
  const live = (r) => ['Active', 'Defaulted'].includes(r.status) || (phase === 'dec' && r.resumes && r.resumes <= '2026-12-31');
  const biz = rows.filter(r => r.category !== 'Income' && ['Earthed HV', 'Earthed Energy', 'ATO'].includes(r.account) && live(r)).reduce((a, r) => a + m(r), 0);
  const personal = rows.filter(r => r.account === 'Caleb Personal' && live(r)).reduce((a, r) => a + m(r), 0);
  return { businessMonthly: biz, personalMonthly: personal };
};
module.exports = async (req, res) => {
  try {
    const s = read('finance-summary.json'); const g = read('finance-grid.json');
    const out = { ...s, computed: { now: sums(g.rows, 'now'), dec: sums(g.rows, 'dec') } };
    ['now', 'dec'].forEach(k => { const c = out.computed[k]; const total = c.businessMonthly + c.personalMonthly; c.combinedWeekly = total / s.weeksPerMonth; c.netMonthly = s.incomeTrailingMonthly - total; c.runwayMonths = total ? s.cashOnHand / total : null; });
    return json(res, 200, out);
  } catch (e) { return json(res, 500, { error: e.message }); }
};
