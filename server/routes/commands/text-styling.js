module.exports = function(C) {

  const L = C.LOG;
  const A = 'text-styling.js';

  return (req, response, callback) => {

    if (response.message.startsWith('*HIGHLIGHT')) {
      response.message = response.message.substring(10).trim();
      response.type = 'HIGHLIGHT';
    }
    else if (response.message.startsWith('*ERROR')) {
      response.message = response.message.substring(6).trim();
      response.type = 'HIGHLIGHT';
    }
    else if (response.message.startsWith('*ALERT')) {
      response.message = response.message.substring(6).trim();
      response.type = 'ALERT';
    }

    callback(response);
  };
}
