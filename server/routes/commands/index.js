module.exports = function(C) {

  const L = C.LOG;
  const chatCommandNames = C.CONFIG.service.chat.commands;
  const chatCommands = [];

  for (let i = 0; i < chatCommandNames.length; i++) {
    chatCommands[i] = require('./' + chatCommandNames[i])(C);
  }

  L.info(`Loaded chat commands: ${chatCommandNames}`);

  return {
    invokeCommands: (req, message, callback) => {

      let response = {
        message: message,
        response_type: "TEXT",
        submessages: []
      };

      const methods = new Array(chatCommands.length + 2);

      for (let i = 0; i < methods.length; i++) {
        methods[i] = () => {
			return new Promise((resolve, reject) => {
			  if (i === 0) {
				  setTimeout(() => {
					  resolve()
				  }, 100);
			  } else if (i === methods.length - 1) {
				  L.verbose(`Commands processed with output: ${JSON.stringify(response)}`);
				  resolve();
				  callback(response);
			  } else {
				  // Stop the chain if one of the commands returns undefined.
				  if (response === undefined) {
					  resolve();
				  } else {
					  chatCommands[i - 1](req, response, output => {
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
  }}};
}
