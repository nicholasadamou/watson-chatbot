module.exports = function(C, app, apiRoutes) {

  const L = C.LOG;

  // https://crontab.guru/
  const scheduler = require('node-schedule');
  const jobs = {};

  const CREATE = (schedule, job, jobId, scheduled) => {

    jobs[''+jobId] = job;
    if (scheduled) scheduler.scheduleJob(schedule, job);
  }

  const RUN = (req, res) => {

    const A = '/api/job:';
    L.verbose(`${A} Entered.`);

    const jobId = req.body.jobId || req.query.jobId || undefined;

    if (jobId == undefined) {
      L.warn(`${A} Job ID not provided.`);
      res.json({ ok: false, message: `Job ID not provided.` });
    }
    else {
      if (jobs[''+jobId]) {
        const job = jobs[''+jobId];
        job();
        L.info(`${A} Job associated with Job ID '${jobId}' started.`);
        res.json({ ok: true, message: `Job associated with Job ID '${jobId}' started.` });
      }
      else {
        L.warn(`${A} Job associated with Job ID '${jobId}' not found.`);
        res.json({ ok: false, message: `Job associated with Job ID '${jobId}' not found.` });
    }}
  }

  apiRoutes.get('/job', (req, res) => { RUN(req, res) });
  apiRoutes.post('/job', (req, res) => { RUN(req, res) });

  //////////////////////////////////////////////////////////////////////////////

  // Uncomment to instantiate and run job.
  // CREATE(C.CONFIG.jobs.test.schedule, () => new (require('./examples/test'))(C, app).start(), 1, true);
  // CREATE(C.CONFIG.jobs.apiCount.schedule, () => new (require('./examples/apiCount'))(C, app).start(), 3, false);
}
