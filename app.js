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
var randomWords = require('random-words');

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

/* NEED A BETTER SECURE STORE FOR MORE THAN DEMOS!!!!! */
var _authMap = {};

var daysOfWeek = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday"
];

var colors = [
	"Red",
	"Green",
	"Blue",
	"Purple",
	"Yellow",
	"Orange",
	"Black",
	"White",
	"Pink",
	"Cyan",
	"Fuscia",
	"Aqua",
	"Maroon",
	"Gray"
];

function generatePassphrase() {
	var rand1 = Math.floor(Math.random() * daysOfWeek.length);
	var rand2 = Math.floor(Math.random() * colors.length);
	return [colors[rand2], daysOfWeek[rand1]];
}

app.get('/alexa/auth', function(req, res) {
	//var domain = req.session.origin.replace(/^https?\:\/\//i, "");
	req.session.uuid = req.session.uuid || uuidv4();

	console.warn('req.session.oauthResult: ', req.session.oauthResult);

	var expires = 15000; // 60000;

	if (req.session.oauthResult) {
		req.session.phrase = {
			phrase: generatePassphrase(), //randomWords(2),
			timeout: Date.now() + expires
		};
		var auth = _authMap[req.session.oauthResult.accessToken];
		if (auth && auth.connected === true) {
			console.warn('connected!!!');
		} else {
			_authMap[req.session.oauthResult.accessToken] = {
				oauthResult: req.session.oauthResult,
				phrase: req.session.phrase,
				connected: false
			};
		}
	} else {
		req.session.phrase = null;
	}

	console.warn('phrase: ', req.session.phrase);

    res.render('pages/alexaauth', {
    	title: 'Salesforce Einstein - Amazon Alexa',
    	appId: appId,
		oauthResult: req.session.oauthResult || null,
    	sandbox: req.session.sandbox || null,
    	phrase: req.session.phrase,
    	phrase1: req.session.phrase ? req.session.phrase.phrase[0] : null,
    	phrase2: req.session.phrase ? req.session.phrase.phrase[1] : null,    	
    	//domain: domain
    });

    //res.render('pages/alexaauth', {title: 'Amazon Alexa - Salesforce Authorization', appId: ""});
});

app.get('/alexa/connect', function(req, res) {
	console.warn('req.query: ', req.query);
	var _auth = null;
	if (req.query.phrase) {
		var phrase = req.query.phrase;
		console.warn('alexa connect phrase: ', phrase);
		phrase = phrase.replace(/\ /g, '_');
		phrase = phrase.toLowerCase();
		for (var appId in _authMap) {
			auth = _authMap[appId];
			console.warn('auth: ', auth);
			try {
				if (phrase === auth.phrase.phrase.join('_').toLowerCase()) {
					console.warn('matched auth: ', auth);
					auth.connected = true;
					auth.token = uuidv4();
					_auth = auth;
				} else {
					console.error('no match!!!');
				}
			} catch (e) {
			}
		}
	}	

	// Only return the token to the remote client (Alexa)
	res.send({token: _auth ? _auth.token : null});
});

/*
	NOTES

	On Alexa handle the "two-factor" auth by having user enter 2 word keyphrase
	If successful, store the token on Alexa side
	For each request to an Alexa endpoint, check for the token and validate (client spec, etc.?)
	Add commands on Heroku to access SFDC resources

	User flow/script:

	User: Alexa, open Einstein Analytics
	Alexa: Blah blah blah, please visit https://foo.bar to login and get your passphrase
	User: The passphrase is Foo Bar
	Alexa: Great, I've connnected to your Salesforce org
	User: Show my Power Insights...

*/

app.post('/oauth-result', function(req, res) {
    console.warn("req.params: ", req.params);
    console.warn("req.body: ", req.body);

    var body = req.body;
    var json = JSON.stringify(req.body);

    console.warn("json: ", json);

	if (body.oauthResult === null) {
		req.session.loAppName = null;
		console.warn('req.session.oauthResult.appId: ', req.session.oauthResult.appId);
		console.warn('_authMap[req.session.oauthResult.accessToken: ', _authMap[req.session.oauthResult.accessToken]);
		_authMap[req.session.oauthResult.accessToken] = null;
	}

	req.session.oauthResult = body.oauthResult;
	req.session.sandbox = body.sandbox || false;

    res.send('success');
});




app.get('/ping', function(req, res) {
	var content = [
		{
			msg: 'Hello from Heroku!',
			date: new Date().toISOString()
		}
	];

	res.send(content);
});

app.get('/feed/insights.json', function(req, res) {
	console.warn('feed/insights.json');

	var date = new Date();
	date.setMinutes(0);
	date.setSeconds(0);
	date.setMilliseconds(0);
	var isoString = date.toISOString();

	var content = [
		{
	    	"uid": "EXAMPLE_EA_INSIGHTS_TTS_1",
	    	"updateDate": isoString,
	    	"titleText": "Marketing Opportunity",
	    	"mainText": "You can increase revenue with a marketing spiff.",
	    	"redirectionUrl": "https://www.salesforce.com"
		},
		{
			"uid": "EXAMPLE_EA_INSIGHTS_TTS_2",
			"updateDate": isoString,
			"titleText": "Stale Accounts",
			"mainText": "You have three accounts that are not driving any business.",
			"redirectionUrl": "https://www.salesforce.com"
		},
		{
			"uid": "EXAMPLE_EA_INSIGHTS_TTS_3",
			"updateDate": isoString,
			"titleText": "Case Escalations",
			"mainText": "Two of your key accounts have escalated open cases in recent days.",
			"redirectionUrl": "https://www.salesforce.com"
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