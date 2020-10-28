const mergeRecursive = (obj1, obj2) => {
	for (let p in obj2) {
	  try {
		// Property in destination object set; update its value.
		if (obj2[p].constructor == Object) {
		  obj1[p] = mergeRecursive(obj1[p], obj2[p]);
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

const appendConfig = (oldConfig, newConfig) => {
	return mergeRecursive(oldConfig, newConfig ? newConfig : {});
}

const getToken = (L, req) => {
	const cookies = JSON.parse(JSON.stringify(req.cookies));
	L.info(`Cookies received ${JSON.stringify(cookies)}`);

	L.info(`Authorization token received ${cookies.JWT_TOKEN}`);
	return cookies.JWT_TOKEN;
}

module.exports = {
	mergeRecursive,
	appendConfig,
	getToken
};
