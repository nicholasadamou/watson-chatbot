"use strict";

///////////////////////////////////////////////////////////////////////////////
// Required modules for app
///////////////////////////////////////////////////////////////////////////////

const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const store = require('store');
const fs = require('fs');
const uuid = require('uuid/v4');

// load ENV variables from .env
require('dotenv').config();

// work around intermediate CA issue
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const LOAD_USER = require("./loadUser");
const SESSION = require("./session");
const UTILS = require('./utils');

///////////////////////////////////////////////////////////////////////////////
// Constants to be shared amongst modules.
///////////////////////////////////////////////////////////////////////////////

const C = {

	CODE_NULL: -2,
	CODE_ERROR: -1,
	CODE_OK: 1,
	CODE_NOT_FOUND: 2,
	CODE_NOT_RESOLVED: 3,
	CODE_WARN: 4,

	DIR: __dirname,

	// A banner that can be set as a process.env.BANNER variable to show in UI.
	BANNER: '',

	// Determines if running locally (if so, no port defined).
	LOCAL: process.env.ENV === 'dev',
	// Only used to store a session when running locally.
	// Note: Can't use cookies because cross domain possibilities when running in local debug.
	// For example server running on port 3000, and client on port 4200.
	LOCAL_SESSION_ID: undefined,
	LOCAL_SESSION: {},

	PORT: undefined,
	HOST: undefined,
	PROTOCOL: 'http',

	// If "enable_debug" is set to 'true', then additional REST APIs are available to query
	// to get more information (should NOT be used in production).
	ENABLE_DEBUG: undefined,

	CONFIG: undefined,
	LOG: undefined,
}

///////////////////////////////////////////////////////////////////////////////
// Set up configuration based on environment (Bluemix Runtime Property).
///////////////////////////////////////////////////////////////////////////////

C.ENABLE_DEBUG = process.env.DEBUG && process.env.DEBUG.toUpperCase() === 'TRUE';
C.BANNER = process.env.BANNER ? process.env.BANNER : '';
C.HOST = process.env.HOST ? process.env.HOST : 'localhost';
C.PORT = process.env.PORT ? process.env.PORT : 6001;
const CONFIG_API_KEY = 'api';

const CONFIG = require('./config')(C);
C.CONFIG = CONFIG;

const ENV = process.env.ENV ? process.env.ENV : CONFIG.env;

///////////////////////////////////////////////////////////////////////////////
// Setup logging.
///////////////////////////////////////////////////////////////////////////////

const winston = require('winston')

const logger = winston.createLogger({});

logger.remove(winston.transports.Console);

logger.add(new winston.transports.Console({
	level: CONFIG.log.level,
	colorize: true
}));

C.LOG = winston;
const L = C.LOG;

///////////////////////////////////////////////////////////////////////////////
// Load application environment (local VCAP config, service credentials).
///////////////////////////////////////////////////////////////////////////////

const app = express();

let MemoryStore = require('memorystore')(session)
if (!C.LOCAL) app.use(session({resave: true, saveUninitialized: true, secret: C.CONFIG.session.secret}));
else {
	app.use(session({
		store: new MemoryStore({
			checkPeriod: C.CONFIG.session.maxAge
		}),
		resave: false,
		saveUninitialized: false,
		secret: C.CONFIG.session.secret
	}))
}

app.use(cors());
// Parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));
// Parse application/json
app.use(bodyParser.json());
app.use(cookieParser());


///////////////////////////////////////////////////////////////////////////////
// Setup Authentication
///////////////////////////////////////////////////////////////////////////////

// NOTES: On how Authentication works for the Chatbot.

// Roles:
//    0 : No-role (no-access)
//        Occurs if JWT token is not verified, is invalid, or does not exist.
//    X : Role determined by user login
// 		  Occurs if JWT token is verified, not invalid, and does exist.

// Authentication States:
//    1. No-role
//      Client uses no-role, limited access.
//    2. Authenticated
//      Client uses role determined by the verified and decoded JWT Token obtained from the domain cookie.

// Request for '/auth/login' returns (if JWT token is not verified or is invalid):
//	  authenticated = false;
//    const userInfo = {};

// Login Flow:
//    Client -> '/isLocal' to determine if running locally.
//    Client -> '/auth/login' Redirects to server for authentication.
//    Server ->
//		Reads, decodes, and verifies the JWT Token received from the SSO authentication flow.
//    	If authentication was unsuccessful, then login failed; otherwise, server sends back the user details and client saves the information locally.
//    Client -> '/api/**'
//      Check for 'Chat-Session-ID' response header
//        If Client unauth, Chat-Session-ID = undefined
//          Do nothing
//        If Client auth'd, Chat-Session-ID = undefined
//          Set client unauth (delete local user info)
//        If Client unauth, Chat-Session-ID = defined
//          Goto Client -> '/api/user/info' action
//        If Client auth'd, Chat-Session-ID = defined
//          Do nothing

// Logout Flow:
//    Client -> '/auth/logout'
//    Client delete local user info

///////////////////////////////////////////////////////////////////////////////

// There are 2 modes authentication can run in:
//   1. Local. No sessions because of cross site cookie issue; uses fake single session.
//   2. Cloud with sessions.

app.get('/chatbot/auth/login', (req, res) => {
	const title = '/chatbot/auth/login';

	const token = UTILS.getToken(L, req);

	if (session) {
		LOAD_USER.loadUser(C, token, user => {
			if (C.LOCAL) C.LOCAL_SESSION_ID = uuid();

			if (user) {
				L.verbose(`${title}: Authenticating session with user '${user.email}' and role '${user.role}'.`);

				res.json({ok: true, authenticated: true, user});
			} else {
				res.json({ok: true, authenticated: false, user: {}});
			}
		});
	}
	else {
		L.verbose(`${title}: Unable to authenticate with session.`);

		res.json({ok: true, authenticated: false, user: {}});
	}
});


///////////////////////////////////////////////////////////////////////////////
// Set up essential routes.
///////////////////////////////////////////////////////////////////////////////

const registerRoutes = callback => {

	// For debugging only
	if (C.ENABLE_DEBUG) {
		app.get('/chatbot/process_env', (req, res) => {
			L.verbose(`/chatbot/process_env: Entered.`);

			res.json({ok: true, env: process.env});
		});

		app.get('/chatbot/isLocal', (req, res) => {
			L.verbose(`/chatbot/isLocal: Entered.`);

			res.json({ok: true, isLocal: C.LOCAL});
		});

		app.get('/chatbot/config', (req, res) => {
			L.verbose(`/chatbot/config: Entered.`);

			res.json({ok: true, config: C.CONFIG});
		});
	}

	// Non-authenticated route to get what environment the application is running in.
	app.get('/chatbot/env', (req, res) => {
		L.verbose(`/chatbot/env: Entered.`);

		const response = {
			ok: true,
			env: {
				isLocal: C.LOCAL === undefined ? false : C.LOCAL,
				banner: C.BANNER,
			}
		};
		response[CONFIG_API_KEY] = C.CONFIG[CONFIG_API_KEY];

		res.json(response);
	});

	// Route to get general API message.
	app.get('/chatbot/api', (req, res) => {
		L.verbose(`/chatbot/api: Entered.`)

		res.json({
			ok: true,
			message: `Welcome to the ${C.CONFIG.application.shortName} API '${ENV}' environment${C.LOCAL ? ' running locally' : ''}.`
		});
	});

	callback();
}

///////////////////////////////////////////////////////////////////////////////
// Serve streaming video
///////////////////////////////////////////////////////////////////////////////

app.get('/chatbot/video', (req, res) => {
	L.verbose(`/chatbot/video: Entered`);

	const name = req.query.name || '';
	let p = path.join(__dirname, 'videos');
	p = path.join(p, name);
	if (!fs.existsSync(p)) {
		res.json({ok: false, message: 'Video not available.'});
		return;
	}
	const stat = fs.statSync(p);
	const fileSize = stat.size;
	const range = req.headers.range;
	if (range) {
		const parts = range.replace(/bytes=/, "").split("-");
		const start = parseInt(parts[0], 10);
		const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
		const chunksize = (end - start) + 1;
		const file = fs.createReadStream(p, {start, end})
		const head = {
			'Content-Range': `bytes ${start} - ${end} / ${fileSize}`,
			'Accept-Ranges': 'bytes',
			'Content-Length': chunksize,
			'Content-Type': 'video/mp4',
		};
		res.writeHead(206, head);
		file.pipe(res);
	} else {
		const head = {
			'Content-Length': fileSize,
			'Content-Type': 'video/mp4',
		};
		res.writeHead(200, head);
		fs.createReadStream(p).pipe(res);
	}
});

///////////////////////////////////////////////////////////////////////////////
// Load resources, register route modules, and start up app.
///////////////////////////////////////////////////////////////////////////////

app.use('/chatbot', express.static(path.join(__dirname, 'ui')));

const apiRoutes = express.Router();

// Register API Routes.
registerRoutes(() => {
	const routes = require('./routes')(C, apiRoutes, CONFIG_API_KEY);
	UTILS.mergeRecursive(CONFIG, routes.getConfig());
});

// Apply the routes to our application with the prefix /chatbot/api.
app.use('/chatbot/api', apiRoutes);

// Start jobs
require('./jobs')(C, app, apiRoutes);

const os = require("os");

L.info(`HOSTNAME: ${os.hostname()}`);

app.listen(C.PORT, () => {
	L.verbose(`Application Configuration: ${ENV}, ${JSON.stringify(CONFIG, null, 2)}`);

	if (C.LOCAL) {
		L.verbose(`Application App Environment: ${JSON.stringify(CONFIG, null, 2)}`);
		if (C.HOST.includes("http") || C.HOST.includes("https")) {
			L.info(`To view your app, open this link in your browser: ${C.HOST}:${C.PORT}/chatbot`);
		} else {
			L.info(`To view your app, open this link in your browser: ${C.PROTOCOL}//${C.HOST}:${C.PORT}/chatbot`);
		}
	} else {
		L.info(`Running in Cloud on Port='${C.PORT}', Env='${ENV}'.`);
	}
});

