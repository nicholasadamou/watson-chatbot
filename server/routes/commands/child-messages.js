module.exports = function(C) {

  const L = C.LOG;
  const A = 'child-messages.js';

  const REGEX = /(?<=\*CHILD\().*?(?=\))/g;
  const REGEX2 = /\*CHILD\(\)/g;

  return (req, response, callback) => {

    let bullets = response.message.match(REGEX);
    if (bullets && bullets.length > 0) {
      for (let i = 0; i < bullets.length; i++) {
        response.submessages.push({
          response_type: 'TEXT',
          message: bullets[i]
        });
      }
      response.message = response.message.replace(REGEX, '').replace(REGEX2, '').trim();
    }

    callback(response);
  };
}
