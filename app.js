var fs = require('fs');
var express = require('express');
var https = require('https');
var http = require('http');
var request = require('request');
var app = express();
var low = require('lowdb');
var cookieSession = require('cookie-session');
var bodyParser = require('body-parser');
var uuidv4 = require('uuid/v4');

var port = process.env.PORT || 3000;
var https_port = process.env.HTTPS_PORT || parseInt(port) + 1;

console.warn('process.env: ', process.env);

// Localhost appId
var appId = '3MVG9SemV5D80oBcff3jWxxK32b.valGtNTj90WK4mj5IAn1LOmdrz1ObgypNEnd9JRtxfhKpuE.iX7vv0WSy';


// Check and set Heroku appId
if (process.env.HEROKU === 'true') {
	appId = '3MVG9SemV5D80oBcff3jWxxK32f4PQBwm702A4fEFlSAEviJg7BsC7PUI_WpupyyBwMfhXypJSkdVqKX7_IXr';
}

console.warn('appId: ', appId);

var db = low('db.json');

/*
db.defaults({ posts: [], user: {} })
	.write();

db.get('posts')
	.push({ id: 1, title: 'lowdb is awesome'})
	.write();

db.set('user.name', 'typicode')
	.write();

var foo = db.get('foo');
console.warn('foo: ', foo, foo.push);
if (!foo) {
	db.set('foo', ["0"])
		.write();
}
foo.push("1").push("2").write();
foo.pop().write();
*/

app.set('view engine', 'ejs');

app.set('views', './views');

app.use(express.static(__dirname + '/public'));

app.use(bodyParser.json())

//app.use(cookieParser('waveiscool'));

app.use(cookieSession({
  name: 'session',
  keys: ['analytics','wave','ltng','out'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

app.use(express.static(__dirname + '/public'));


app.get('/', function(req, res) {
	var origin = req.query.origin;
	console.warn('origin: ', origin);
	if (!origin || origin.indexOf('lightning') < 0) {
		res.render('pages/noorigin');
	} else {
		req.session.uuid = req.session.uuid || uuidv4();
	    res.render('pages/index', {title: 'Analytics Lightning Out Playground', appId: appId, origin: origin});		
	}
});

app.get('/test', function(req, res) {
	req.session.uuid = req.session.uuid || uuidv4();
	req.session.count = (req.session.count || 0)+ 1;
	console.warn('req.session: ', req.session);
    res.render('pages/test', {title: 'Test', count: req.session.count, appId: req.session.appId});
});

app.post('/appid', function(req, res) {
    console.warn("req.params: ", req.params);
    console.warn("req.body: ", req.body);

    var body = req.body; //req.params.json;
    var json = JSON.stringify(req.body);

    console.warn("json: ", json);

    req.session.appId = body.appId;

    res.send('success');

});

// Create an HTTP service
http.createServer(app).listen(port);
console.log("Server listening for HTTP connections on port " + port);

// Create an HTTPS service if the certs are present
try {
    var options = {
      key: fs.readFileSync('key.pem'),
      cert: fs.readFileSync('key-cert.pem')
    };
    https.createServer(options, app).listen(https_port);
    console.log("Server listening for HTTPS connections on port " + https_port);
} catch (e) {
    console.error(e + " - Security certs not found, HTTPS not available");
}