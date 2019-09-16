const auth = require("basic-auth");

const admins = { admin: { password: "Salesforce2@" } };

const blacklist = [
	'/health/admin'
];

module.exports = function(request, response, next) {
  let useAuth = false;
  blacklist.forEach(function(url) {
	if (request.url.indexOf(url) >= 0) {
		useAuth = true;
	}
  });

  if (useAuth === true) {
    var user = auth(request);
    if (!user || !admins[user.name] || admins[user.name].password !== user.pass) {
      response.set("WWW-Authenticate", 'Basic realm="example"');
      return response.status(401).send();
    }
  }

  return next();
};
