module.exports = function(C, apiRoutes) {

  const L = C.LOG;

  apiRoutes.get('/count', (req, res) => {
    const A = '/api/count:';
    L.verbose(`${A} Entered.`);

    let n = C.CONFIG.jobs.apiCount && C.CONFIG.jobs.apiCount.count ? C.CONFIG.jobs.apiCount.count : 0;
    let d = C.CONFIG.jobs.apiCount.start;
    let p = C.CONFIG.jobs.apiCount.costPerAPICall * n;

    let out = `Total API Calls ${n} @ $${C.CONFIG.jobs.apiCount.costPerAPICall} per call for a total cost of $${p}`;
    if (d) {
      out += ` starting on ${d}`;
    }

    L.info(`${A} ${out}`);
    res.json({ ok: true, message: `${A} ${out}` });
  });

  return { loaded: true };
}
