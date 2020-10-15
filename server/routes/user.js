module.exports = function (C, apiRoutes, ensureAuthenticated) {

	const L = C.LOG;
	const SESSION = require('../session');
	const https = require('https');
	const store = require('store');

	apiRoutes.get('/user/info', ensureAuthenticated, (req, res) => {

		const A = '/api/user/info:';
		L.verbose(`${A} Entered.`);

		const session = SESSION.get(C, req);
		const user = store.get('user');

		if (session && user !== undefined) {
			res.json({ok: true, authenticated: true, userInfo: user});
		} else {
			res.json({ok: true, authenticated: false, userInfo: {}});
		}
	});

	// https://w3-connections.ibm.com/wikis/home?lang=en-us#!/wiki/W0da5228bd87a_4bc2_a5c3_54b943c17a02/page/Extracting%20employee%20pictures
	apiRoutes.get('/user/photo', (req, res) => {

		const LN = '/api/user/photo';
		L.verbose(`${LN}: Entered.`);

		const email = req.query.email || '';

		if (!email) {
			L.warn(`${LN}: Email not provided.`);
			res.sendStatus(404);
			return;
		}

		const url = C.CONFIG.service.bluepages.photoUrl + email;
		L.verbose(`${LN}: Attempt to receive photo from url '${url}'`);

		https.get(url, photoResult => {

			const statusCode = photoResult.statusCode;
			const contentType = photoResult.headers['content-type'];

			let error;
			if (statusCode !== 200) {
				error = new Error(`${LN}: Profile photo request failed. Status Code: ${statusCode} for email ${email}.`);
			}

			if (error) {
				L.warn(error.message);
				// Consume response data to free up memory
				photoResult.resume();
				res.sendStatus(404);
			} else {

				let rawData = [];
				photoResult.on('data', chunk => {
					rawData.push(new Buffer(chunk, 'binary'));
				});
				photoResult.on('end', () => {
					try {
						var binary = Buffer.concat(rawData);
						res.writeHead(200, {'Content-Type': 'image/png'});
						res.end(binary, 'binary');
						L.verbose(`${LN}: Photo loaded and sent.`);
					} catch (e) {
						L.error(`${LN}: Received error: ${e.message}`);
					}
				});
			}
		}).on('error', e => {
			L.error(`${LN}: Received error: ${e.message}`);
			res.sendStatus(404);
		});
	});

	return {loaded: true};
}
