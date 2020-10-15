exports.get = (C, req) => {
  return C.LOCAL ? C.LOCAL_SESSION : req.session;
}

exports.getId = (C, req) => {
  return C.LOCAL ? C.LOCAL_SESSION_ID : req.sessionID;
}

exports.destroy = (C, req) => {
  if (C.LOCAL) {
    C.LOCAL_SESSION_ID = undefined;
    C.LOCAL_SESSION = {};
  }
  else {
    req.session.userInfo = undefined;
    req.session.destroy();
    if (typeof req.logout === 'function') req.logout();
  }
}
