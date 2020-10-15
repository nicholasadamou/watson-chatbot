module.exports = function(C, app) {

	const JOB = 'Test';

	const L = C.LOG;

	// Determines if the job is already running.
	this.running = false;

	this.start = function() {

		if (!this.running) {
			this.running = true;

			let n = C.CONFIG.jobs.apiCount && C.CONFIG.jobs.apiCount.count ? C.CONFIG.jobs.apiCount.count : 0;
			let d = C.CONFIG.jobs.apiCount.start;

			let out = `Total API Calls ${n} @ $0.0025 per call for a total cost of $${n * 0.0025}`;
			if (d) {
				out += ` starting on ${d}`;
			}

			L.info(`JOB(${JOB}): ${out}`);

			this.running = false;
		}
	}
}
