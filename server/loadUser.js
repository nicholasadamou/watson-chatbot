exports.loadUser = (C, callback) => {

	const L = C.LOG;

	const store = require('store');
	const token = store.get('authorization_token');
	if (token === undefined) {
		L.warn(`Unable to load authorization token`);

		callback(undefined);

		return;
	}
	L.info(`authorization_token loaded ${token}`)

	L.info(`Loading user information using JWT Token Method.`);

	try {

		const jwt = require('jsonwebtoken');

		const SECRET_KEY = `${process.env.JWT_KEY}:${process.env.JWT_SECRET}`;
		let secret = Buffer.from(SECRET_KEY).toString('base64');

		const jwt_decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
		L.info(`JWT Token decoded ${JSON.stringify(jwt_decoded)}`);

		const user = {
			email: jwt_decoded.emailAddress,
			role: jwt_decoded.role
		}

		L.info(`User '${user.email}' information loaded using JWT Token Method:`, user);

		callback(user);
	} catch (error) {
		L.error(error);

		L.error(`Unable to load user due to err: `, error);

		callback(undefined);
	}
}
