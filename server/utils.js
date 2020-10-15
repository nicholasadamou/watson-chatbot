const mergeRecursive = (obj1, obj2) => {
	for (let p in obj2) {
	  try {
		// Property in destination object set; update its value.
		if (obj2[p].constructor == Object) {
		  obj1[p] = UTILS_IMPL.mergeRecursive(obj1[p], obj2[p]);
		} else {
		  obj1[p] = obj2[p];
		}
	  } catch(e) {
		// Property in destination object not set; create it and set its value.
		obj1[p] = obj2[p];
	  }
	}
	return obj1;
}

const getEnvConfig = (shared, prod) => {
	return mergeRecursive(shared, prod);
}

const appendConfig = (oldConfig, newConfig) => {
	return mergeRecursive(oldConfig, newConfig ? newConfig : {});
}

const loadCookie = (L, store, req) => {
	const cookies = JSON.parse(JSON.stringify(req.cookies));
	L.info(`Cookies received ${JSON.stringify(cookies)}`);
	store.set('cookies', cookies);

	if (cookies.JWT_TOKEN) {
		L.info(`Authorization token received ${cookies.JWT_TOKEN}`);
		store.set('authorization_token', cookies.JWT_TOKEN);
	}
}

module.exports = {
	mergeRecursive,
	getEnvConfig,
	appendConfig,
	loadCookie
};
