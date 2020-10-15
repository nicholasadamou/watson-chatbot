module.exports = function(C) {

  const L = C.LOG;
  const A = 'invoke-command.js';
  const SESSION = require('../../session');

  const request = require('request');

  const REGEX = /(?<=\*COMMAND\().*?(?=\))/g;
  const REGEX2 = /\*COMMAND\(\)/g;

  const invokeCommand = (req, command, response, callback) => {

    let email = undefined;
    const session = SESSION.get(C, req);
    if (session && session.userInfo) {
      email = session.userInfo.email;
      L.verbose(`${A} Email in session is '${email}'`);
    }
    else {
      L.verbose(`${A} Unable to receive email because not available in session: ${JSON.stringify(session)}`);
    }

    const commandJson = JSON.parse(command);
    const sessionRequired = commandJson.sessionRequired && commandJson.sessionRequired.toUpperCase().startsWith('T');

    if (sessionRequired && !email) {

      response.message = '';
      callback(response);
    }
    else {

      const method = commandJson.method;
      const uri = commandJson.uri;
      const responseVar = commandJson.response_var;
      const suppressChildren = commandJson.suppressChildren && commandJson.suppressChildren.toUpperCase().startsWith('T');
      const altResponse = commandJson.altResponse ? commandJson.altResponse : undefined;

      if (!commandJson || !method || !uri || !responseVar) {

        L.warn(`${A} Unable to process command: ${command}`);
        callback(undefined);
      }
      else {

        let fullUri = (req.secure ? 'https://' : 'http://') + C.CONFIG.command_domain + uri;
        if (email) {
          fullUri = fullUri.indexOf('?') ? fullUri + '&email=' + email : fullUri + '?email=' + email;
        }

        L.verbose(`${A} Invoking '${fullUri}' command.`);

        request({ method: method, uri: fullUri, json: true}, (err, requestRes, body) => {
          if (err) {

            L.warn(`${A} Unable to process command: ${command} due to err: `, err);
            callback(undefined);
          }
          else {

            if (body[responseVar] && body[responseVar].length > 0) {

              if (!suppressChildren) {
                for (let j = 0; j < body[responseVar].length; j++) {
                  response.submessages.push(body[responseVar][j]);
            }}}
            else {

              // If there is no response from the command, then we want to just not show any message for it (skip that message all together).
              if (altResponse) {
                response.submessages.push({
                  response_type: 'TEXT',
                  message: altResponse
                });
            }}

            response.message = response.message.replace(REGEX, '').replace(REGEX2, '').trim();
            callback(response);
        }});
    }}
  }

  return (req, response, callback) => {

    let commands = response.message.match(REGEX);
    if (commands && commands.length > 0) {

      response.message = response.message.replace(REGEX, '').replace(REGEX2, '').trim();

      const methods = new Array(commands.length + 2);

      for (let i = 0; i < methods.length; i++) {
        methods[i] = () => {
			return new Promise((resolve, reject) => {
			  if (i === 0) {
				  setTimeout(() => {
					  resolve()
				  }, 100);
			  } else if (i === methods.length - 1) {
				  resolve();
				  callback(response);
			  } else {
				  // Stop the chain if one of the commands returns undefined.
				  if (response === undefined) {
					  resolve();
				  } else {
					  const cmd = commands[i - 1];
					  invokeCommand(req, cmd, response, output => {
						  response = output;
						  resolve();
					  });
				  }
			  }
		  });
      }}

      let p = methods[0]();
      for (let i = 1; i < methods.length; i++) {
        p = p.then(methods[i]);
    }}
    else {
      callback(response);
    }
  };
}
