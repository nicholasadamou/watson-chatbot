module.exports = function(C, apiRoutes, ensureAuthenticated, CONFIG_KEY) {

  const SESSION = require('../session');
  const UTILS = require('../utils');

  let routeConfig = {};
  routeConfig[CONFIG_KEY] = {};

  //////////////////////////////////////////////////////////////////////////////

  // Add the session identifier to the response if it's available.
  apiRoutes.use((req, res, next) => {

    //NOTE: THIS IS NOT WORKING FOR SOME REASON, SO HEADER IS NOT FOUND ON CLIENT.
    //  So instead for now as a work around, adding to the JSON response in chat.js API.
    //res.setHeader('Access-Control-Allow-Origin', '*');
    //res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Chat-Session-ID');

    if (SESSION.getId(C, req)) res.setHeader('Chat-Session-ID', SESSION.getId(C, req));
    next();
  });

  //////////////////////////////////////////////////////////////////////////////

  routeConfig[CONFIG_KEY].user = UTILS.appendConfig(routeConfig[CONFIG_KEY].user = {}, require('./user')(C, apiRoutes, ensureAuthenticated));
  // routeConfig[CONFIG_KEY].apiCount = UTILS.appendConfig(routeConfig[CONFIG_KEY].apiCount = {}, require('./examples/apiCount')(C, apiRoutes /*, ensureAuthenticated*/));

  // Chat API does not require authentication because we want anonymous access.
  routeConfig[CONFIG_KEY].chat = UTILS.appendConfig(routeConfig[CONFIG_KEY].chat = {}, require('./chat')(C, apiRoutes /*, ensureAuthenticated*/));

  //////////////////////////////////////////////////////////////////////////////

  return {
    getConfig: () => routeConfig
  }
}
//
