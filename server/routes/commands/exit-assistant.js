module.exports = function(C) {

  const L = C.LOG;
  const A = 'exit-assistant.js';

  return (req, response, callback) => {

    if (response.message.startsWith('*EXIT')) {

      let exit = false;
      response.message = response.message.substring(5).trim();
      response.exit = true;
    }

    callback(response);
  };
}
