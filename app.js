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
var proxy = require('http-proxy-middleware');
var sslRedirect = require('heroku-ssl-redirect')
var Alexa = require('alexa-sdk');

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

// enable ssl redirect
app.use(sslRedirect());

var stubOAuthResult = {
	accessToken: undefined,
	appId: undefined,
	instanceURL: undefined,
	refreshToken: undefined,
	userId: undefined
};


var handlers = {

    'Testing': function () {
    	console.warn('Testing');
        this.emit(':tell', 'Hello World!');
    }

};

exports.handler = function(event, context, callback){
    var alexa = Alexa.handler(event, context, callback);
    alexa.registerHandlers(handlers);
    alexa.execute();
};



app.get('/', function(req, res) {
	var origin = req.session.origin || req.query.origin;
	console.warn('origin: ', origin);
	origin = 'https://wavepm.lightning.force.com';
	if (!origin || origin.indexOf('lightning') < 0) {
		res.render('pages/noorigin');
	} else {
		if (req.query.origin) {
			req.session.origin = req.query.origin;
			res.redirect('/');
		} else {

			req.session.uuid = req.session.uuid || uuidv4();
			var domain = req.session.origin.replace(/^https?\:\/\//i, "");
		    res.render('pages/index', {
		    	title: 'Analytics Lightning Out Playground',
		    	appId: appId, origin: origin,
		    	oauthResult: req.session.oauthResult || null,
		    	loAppName: req.session.loAppName,
		    	sandbox: req.session.sandbox,
		    	origin: req.session.origin,
		    	domain: domain
		    });		
		}
	}
});

app.get('/lo2', function(req, res) {
    res.render('pages/lo2', {title: 'Fancy Lightning Out Demo', appId: process.env.APPID});
});

app.get('/lo3', function(req, res) {
    res.render('pages/lo3', {title: 'Fancy Lightning Out Demo', appId: process.env.APPID});
});

app.get('/lo4', function(req, res) {
    res.render('pages/lo4', {title: 'Fancy Lightning Out Demo', appId: process.env.APPID});
});


// Hello World
app.get('/lo_ea', function(req, res) {
    res.render('pages/lo_ea', {title: 'Lightning Out - Einstein Analytics', appId: process.env.APPID});
});


/*
 * MC test
 */
app.get('/mc', function(req, res) {
    res.render('pages/mc', {title: 'MC Test', appId: "3MVG9Iu66FKeHhINsTSPXM9jotcGhUKpq63lvwh3eTOa5GrA8EjBtrrMHtZsrHVmYxE3g8Asn_yPW0Uur2MnE"});
});

app.get('/mc2', function(req, res) {
    res.render('pages/mc2', {title: 'MC2 Test', appId: ""});
});


app.get('/mock', function(req, res) {
    res.render('pages/mock', {title: 'Mock', appId: ""});
});

app.get('/feed/insights', function(req, res) {
	console.warn('feed');

	var content = [
		{
	    	"uid": "EXAMPLE_CHANNEL_MULTI_ITEM_JSON_TTS_1",
	    	"updateDate": "2016-04-10T00:00:00.0Z",
	    	"titleText": "Multi Item JSON (TTS)",
	    	"mainText": "This channel has multiple TTS JSON items. This is the first item.",
	    	"redirectionUrl": "https://www.amazon.com"
		},
		{
			"uid": "EXAMPLE_CHANNEL_MULTI_ITEM_JSON_TTS_2",
			"updateDate": "2016-04-10T00:00:00.0Z",
			"titleText": "Multi Item JSON (TTS)",
			"mainText": "This channel has multiple TTS JSON items. This is the second item.",
			"redirectionUrl": "https://www.amazon.com"
		}
	];

	res.send(content);
});

/*
 * Apex callout test
 */

app.post('/apexstep', function(req, res) {
	console.warn("apexstep");
    console.warn("req.params: ", req.params);
    console.warn("req.body: ", req.body);

    var body = req.body;
    var json = JSON.stringify(req.body);

    console.warn("json: ", json);

    var sampleData = 
	{
	   "metadata":{
	      "strings":[
	         "Name"
	      ],
	      "numbers":[

	      ],
	      "groupings":[

	      ]
	   },
	   "data":[
	      {
	         "Name":"id"
	      },
	      {
	         "Name":"isdeleted"
	      },
	      {
	         "Name":"masterrecordid"
	      },
	      {
	         "Name":"name"
	      },
	      {
	         "Name":"type"
	      }

	   ]
	};

    res.send(sampleData);
});


/*
 * Canvas Test
 *
 */

app.get('/hw', function(req, res) {
    res.render('pages/hw', {title: 'Canvas Test', signedRequestJson: process.env.CANVAS_CONSUMER_SECRET});
});

/*
 * Proxy for REST requests, etc.
 * The instanceURL from OAuth is used to route to the correct org
 */
var options = {
	target: 'http://salesforce.com',
	changeOrigin: true,
	ws: true,
	pathRewrite: {
		'^/proxy' : '/'
	},
	router: function(req) {
		console.warn('router req.session.oauthResult: ', req.session.oauthResult);

		//req.setHeader('Authorization', 'Bearer ' + req.session.oauthResult.accessToken);
		req.headers['Authorization'] = 'Bearer ' + req.session.oauthResult.accessToken;

		return req.session.oauthResult.instanceURL
	}
};

// create the proxy (without context)
var sfdcProxy = proxy(options);

app.use('/proxy', sfdcProxy);


app.get('/userinfo', function(req, res) {

	var url = req.session.oauthResult.instanceURL + '/services/data/v40.0/sobjects/User/' + req.session.oauthResult.userId;

	request({
		url: url,
		headers: {
			'Authorization': 'Bearer ' + req.session.oauthResult.accessToken,
			'Content-Type': 'application/json'
		}
	}, function(error, response, body) {
		if (error) {
			console.error('error: ', error);
			res.send({error: error});
		} else {
			var obj = JSON.parse(body);
			res.send(body);
		}
	});
});


app.get('/dashboards', function(req, res) {

	var url = req.session.oauthResult.instanceURL + '/services/data/v40.0/wave/dashboards';

	request({
		url: url,
		headers: {
			'Authorization': 'Bearer ' + req.session.oauthResult.accessToken,
			'Content-Type': 'application/json'
		}
	}, function(error, response, body) {
		if (error) {
			console.error('error: ', error);
			res.send({error: error});
		} else {
			var obj = JSON.parse(body);
			res.send(body);
		}
	});
});


app.get('/ltngoutapps', function(req, res) {

	var query = "SELECT AuraDefinitionBundleId,Source FROM AuraDefinition WHERE DefType = 'APPLICATION'";
    query = query.replace(/\s\s+/g, '+');

	var url = req.session.oauthResult.instanceURL + '/services/data/v40.0/query/?q=' + query;

	request({
		url: url,
		headers: {
			'Authorization': 'Bearer ' + req.session.oauthResult.accessToken,
			'Content-Type': 'application/json'
		}
	}, function(error, response, body) {
		if (error) {
			console.error('error: ', error);
			res.send({error: error});
		} else {
			console.warn('body: ', body);
			var obj = JSON.parse(body);
			console.warn('obj: ', obj);

            var auraDefinitions = obj.records;

            // Map for use when getting the apps
            var auraDefinitionsMap = {};

            var query2 = "SELECT Id,DeveloperName,NamespacePrefix,MasterLabel FROM AuraDefinitionBundle WHERE Id IN (";
            var delim = "";
            for (var i = 0; i < auraDefinitions.length; i++) {
              auraDefinitionsMap[auraDefinitions[i].AuraDefinitionBundleId] = auraDefinitions[i];
              if (auraDefinitions[i].Source.indexOf("extends=\"ltng:outApp\"") >= 0) {
                query2 += delim + "'" + auraDefinitions[i].AuraDefinitionBundleId + "'";
                delim = ",";
              }
            }
 
            query2 += ")";

            query2 = query2.replace(/\s\s+/g, '+');

			var url = req.session.oauthResult.instanceURL + '/services/data/v40.0/query/?q=' + query2;

			request({
				url: url,
				headers: {
					'Authorization': 'Bearer ' + req.session.oauthResult.accessToken,
					'Content-Type': 'application/json'
				}
			}, function(error, response, body) {
				if (error) {
					console.error('error: ', error);
					res.send({error: error});
				} else {
					var obj = JSON.parse(body);
	                res.send({auraDefinitionsMap: auraDefinitionsMap, auraDefinitionBundles: obj.records});
				}
			});
		}
	});
});

app.post('/oauth-result', function(req, res) {
    console.warn("req.params: ", req.params);
    console.warn("req.body: ", req.body);

    var body = req.body;
    var json = JSON.stringify(req.body);

    console.warn("json: ", json);

	req.session.oauthResult = body.oauthResult;
	req.session.sandbox = body.sandbox || false;
	if (body.oauthResult === null) {
		req.session.loAppName = null;
	}

    res.send('success');
});

app.post('/lo-app-name', function(req, res) {
    console.warn("req.params: ", req.params);
    console.warn("req.body: ", req.body);

    var body = req.body;
    var json = JSON.stringify(req.body);

    console.warn("json: ", json);

	req.session.loAppName = body.loAppName;

    res.send('success');
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