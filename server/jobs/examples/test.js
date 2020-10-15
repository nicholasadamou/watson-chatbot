module.exports = function(C, app) {

  const JOB = 'Test';

  const L = C.LOG;

  // Determines if the job is already running.
  this.running = false;

  this.start = function() {

    if (!this.running) {
      this.running = true;

      L.info(`JOB(${JOB}): Started.`, C.CONFIG.jobs.test.runTime);

      setTimeout(() => {

        L.info(`JOB(${JOB}): Completed.`);
        this.running = false;
      },
      C.CONFIG.jobs.test.runTime);
    }
  }
}
