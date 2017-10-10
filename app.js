var fs = require('fs');
var express = require('express');
var https = require('https');
var http = require('http');
var request = require('request');
var rest = require('restler');
var url = require('url');
var app = express();
var low = require('lowdb');
var cookieSession = require('cookie-session');
var bodyParser = require('body-parser');
var uuidv4 = require('uuid/v4');
var proxy = require('http-proxy-middleware');
var sslRedirect = require('heroku-ssl-redirect')
var Alexa = require('alexa-sdk');
var randomWords = require('random-words');
var WebSocket = require('ws');

var port = process.env.PORT || 3000;
var https_port = process.env.HTTPS_PORT || parseInt(port) + 1;

//console.warn('process.env: ', process.env);

// Localhost appId
var appId = '3MVG9SemV5D80oBcff3jWxxK32b.valGtNTj90WK4mj5IAn1LOmdrz1ObgypNEnd9JRtxfhKpuE.iX7vv0WSy';
var appSecret = '5138307552141816846';


// Check and set Heroku appId
if (process.env.HEROKU === 'true') {
	appId = '3MVG9SemV5D80oBcff3jWxxK32f4PQBwm702A4fEFlSAEviJg7BsC7PUI_WpupyyBwMfhXypJSkdVqKX7_IXr';
	appSecret = '6818833808157477050';
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

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

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

//var expressWs = require('express-ws')(app);



/*
var cometdServer = cometd.createCometDServer();
var channel = cometdServer.createServerChannel('/service/auth');
channel.addListener('message', function(session, channel, message, callback) {
	console.warn('/service/approve: ', session, channel, message);

    // Invoke the callback to signal that handling is complete.
    callback();
});
*/
/*
app.get('/cometd/test', function(req, res) {
	
	channel.publish(session, message.data);

	res.send({msg: 'test'});
});
*/

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
var _sessionMap = {};
var _rtokenMap = {};

var _phraseMap = {};
var _ctokenMap = {};

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
	var str = '' + Math.floor(Math.random() * 10);
	str += Math.floor(Math.random() * 10);
	str += Math.floor(Math.random() * 10);
	str += Math.floor(Math.random() * 10);
	return [colors[rand2], daysOfWeek[rand1], str];
}

/* Websocket handler */
function handleWsConnection(ws, req) {
	console.warn('handleWsConnection');
  	const location = url.parse(req.url, true);
  	console.warn('location: ', location);
  	// You might use location.query.access_token to authenticate or share sessions
  	// or req.headers.cookie (see http://stackoverflow.com/a/16395220/151312)

	ws.on('message', function incoming(message) {
    	console.log('received: %s', message, typeof message);
    	var obj = JSON.parse(message);
    	if (obj.cmd) {
    		var cmd = obj.cmd.toLowerCase();
    		console.warn('cmd: ', cmd);
    		if (cmd === 'init') {
    			var phraseId = obj.phraseId;
    			console.warn('phraseId: ', phraseId);
    			var phrase = _phraseMap[phraseId];
    			console.warn('phrase: ', phrase);
    			//var _rtoken = _rtokenMap[rtokenId];
    			//console.warn('_rtoken: ', _rtoken);
    			//var _srtoken = _sessionMap[_rtoken.uuid];
    			//console.warn('session _rtoken: ', _srtoken);
    		} else if (cmd === '') {

    		}
    	}

    	if (obj.msg && obj.msg.toLowerCase() === 'ping') {
    		ret = {msg: 'pong'};
    		ws.send(JSON.stringify(ret));
    	}
  	});

  	var ret = {msg: 'success'};
  	ws.send(JSON.stringify(ret));
};	

/*
	Flow

	1. User logs into the Authenticator
	2. User says "Alexa Connect Salesforce"
	3. Alexa generates and displays a phrase such as "Blue Monday 1234"
	4. Alexa sends the phrase to Heroku
	5. Heroku generates and stores a phrase such as "Red Tuesday 5678" 
	6. User is asked to enter the phrase from Alexa
	7. If correct phrase is entered, return phrase is dispalyed on Authenicator screen
	8. User is instructed to say "Alexa, the phrase is Red Tuesday 5678"
	9. Alexa sends phrase to Heroku to verify
	10. If correct, Heroku verifies and sends back access token
	11. Access token is used to make subsequent SFDC calls


*/

/* 
 * Called by Alexa to start the conversation
 * Generates a phrase and returns it
 * Alexa asks the user to say the phrase for verification
 */
app.get('/alexa/init', function(req, res) {
	console.warn('/alexa/init req.query: ', req.query);

	var expires = 30000;

	var _phrase = {
		phrase: generatePassphrase(),
		timeout: Date.now() + expires,
		expires: expires,
		id: uuidv4()
	};	


	// FOR TESTING ONLY
	_phrase.phrase = ['One', 'Two', '1'];

	console.warn('generated phrase: ', _phrase.phrase);
	var id = uuidv4();

	// FOR TESTING ONLY
	id = '1234';

	_phrase.id = id;

	console.warn('phrase id: ', _phrase.id);


	_phraseMap[id] = _phrase;


	ctoken = uuidv4();

	// FOR TESTING ONLY
	ctoken = '5555';

	_ctokenMap[ctoken] = true;

	res.send({status: 'success', msg: 'Please say the phrase displayed on the Authenicator app.', ctoken: ctoken});


	//res.send({phrase: _phrase.phrase, id: id});
});

/* 
 * Called by Alexa to verify the connect phrase
 */
/* REMOVE
app.get('/alexa/verify', function(req, res) {
	console.warn('/alexa/verify req.query: ', req.query);

	if (req.query.phrase && req.query.id) {
		var phrase = req.query.phrase.replace(/\ /g, '_').toLowerCase();
		console.warn('phrase: ', phrase);
		var _phrase = _phraseMap[req.query.id];
		console.warn('_phrase: ', _phrase);
		var matchPhrase = _phrase.phrase.join('_').toLowerCase();
		console.warn('matchPhrase: ', matchPhrase);
		if (matchPhrase === phrase) {
			console.warn('phrase match');
			ctoken = uuidv4();

			// FOR TESTING ONLY
			ctoken = '5555';

			_ctokenMap[ctoken] = true;


			res.send({status: 'success', msg: 'Please say the phrase displayed on the Authenicator app.', ctoken: ctoken});
		} else {
			console.warn('Phrase does not match');	
			res.send({err: 'Phrase does not match'});
		}
	} else {
		res.send({err: 'Invalid request'});
	}
});
*/

/* 
 * Called by Alexa to verify the connect phrase
 */
app.get('/alexa/connect', function(req, res) {
	console.warn('/alexa/connect req.query: ', req.query);

	if (req.query.phrase && req.query.ctoken) {
		if (_ctokenMap[req.query.ctoken] !== true) {
			res.send({err: 'Invalid token'});
		} else {

			var phrase = req.query.phrase.replace(/\ /g, '_').toLowerCase();
			console.warn('phrase: ', phrase);

			var _phrase = null;
			var matchPhrase = null;
			var auth = null;
			for (var id in _phraseMap) {
				console.warn('********************** id: ', id);
				_phrase = _phraseMap[id];
				console.warn('id: ', id, ' ----------------- _phrase: ', _phrase);
				console.warn('_phrase.phrase: ', _phrase.phrase, typeof _phrase.phrase);
				matchPhrase = _phrase.phrase.join('_').toLowerCase();
				console.warn('matchPhrase: ', matchPhrase);

				if (phrase === matchPhrase) {

					console.warn('MATCH!!!!!!');

					// Create and store the auth
					auth = {
						connected: true,
						token: uuidv4(),
						oauthResult: req.session.oauthResult
					};
					_authMap[auth.token] = auth;
				}
			}

			if (auth !== null) {
				res.send({msg: 'Connected', token: auth.token});				
			} else {
				res.send({err: 'Phrase does not match'});
			}
		}
	} else {
		res.send({err: 'Invalid request'});
	}
});

/*
app.get('/alexa/phrase', function(req, res) {
	req.session.uuid = req.session.uuid || uuidv4();
	if (req.query.phrase) {
		var phrase = req.query.phrase;
		console.warn('phrase from Alexa: ', phrase);
		var msg = {cmd: 'prompt_user'};
		ws.send(JSON.stringify(msg));
	}
	res.send({msg: 'success'});

});
*/

app.get('/alexa/auth', function(req, res) {
	//var domain = req.session.origin.replace(/^https?\:\/\//i, "");
	req.session.uuid = req.session.uuid || uuidv4();

	//console.warn('req.session.oauthResult: ', req.session.oauthResult);

	var expires = 30000;

	if (req.session.oauthResult) {

		req.session.phrase = {
			phrase: generatePassphrase(),
			timeout: Date.now() + expires,
			expires: expires,
			id: uuidv4()
		};

		// FOR TESTING ONLY
		req.session.phrase.phrase = ['Foo', 'Bar', '5678'];

		req.session.phrase.id = '5678';

		//req.session.phrase = null; // FOR TESTING CHANGES

		console.warn('req.session.phrase: ', req.session.phrase);

		_phraseMap[req.session.phrase.id] = req.session.phrase;

/*
		var keyPhrase = req.session.phrase && req.session.phrase.phrase ? req.session.phrase.phrase.join('_').toLowerCase() : null;

		var auth = _authMap[keyPhrase];
		if (auth && auth.connected === true) {
			console.warn('connected!!!');
			_authMap[keyPhrase] = {
				oauthResult: req.session.oauthResult,
				phrase: req.session.phrase,
				connected: true
			};			
		} else {
			_authMap[keyPhrase] = {
				oauthResult: req.session.oauthResult,
				phrase: req.session.phrase,
				connected: false
			};
		}
*/

/*
		var n = Date.now();

		// Generate new token if refresh is less than 5 seconds (make configurable?)
		if (req.session.rtoken && req.session.rtoken.timeout > (Date.now() + 5000)) {

		} else {
			req.session.rtoken = {
				id: uuidv4(),
				timeout: Date.now() + expires,
				expires: expires
			};
		}
*/
/*
		_rtokenMap[req.session.rtoken.id] = {
			rtoken: req.session.rtoken,
			uuid: req.session.uuid
		}
*/

	} else {
		req.session.phrase = null;
		//req.session.rtoken = null;
	}

	console.warn('phrase: ', req.session.phrase);
	//console.warn('rtoken: ', req.session.rtoken);

	var oauthResult = req.session.oauthResult || {};


    res.render('pages/alexaauth', {
    	title: 'Authenticator',
    	//rtoken: req.session.rtoken,
		oauthResult: JSON.stringify(oauthResult, null, 4),
    	sandbox: req.session.sandbox || null,
    	phrase: req.session.phrase,
    	phrase1: req.session.phrase ? req.session.phrase.phrase[0] : null,
    	phrase2: req.session.phrase ? req.session.phrase.phrase[1] : null,    	
    	phrase3: req.session.phrase ? req.session.phrase.phrase[2] : null
    });

    //res.render('pages/alexaauth', {title: 'Amazon Alexa - Salesforce Authorization', appId: ""});
});

app.post('/alexa/login', function(req, res) {
	console.warn("alexa/login: ", req.query, req.body);

	console.warn('req.body.login_button: ', req.body.login_button);

	if (req.body.login_button === 'Logout') {
		delete req.session.oauthResult;
        res.redirect("/alexa/auth");

	} else {

	    var config = {
	      client_id: appId,
	      client_secret: appSecret,
	      grant_type: 'password',
	      username: req.body.username,
	      password: req.body.password
	    };

	    rest.post('https://login.salesforce.com/services/oauth2/token', {data: config}).on('complete', function(data, response) {
	    	console.warn('data: ', data);

	        if (response.statusCode === 200) {
	            req.session.oauthResult = {
	            	instanceURL: data.instance_url,
	            	accessToken: data.access_token,
	            	id: data.id,
	            	tokenType: data.token_type,
	            	issuedAt: data.issued_at,
	            	signature: data.signature
	            };
	            delete req.session.auth;
	        }
	        res.redirect("/alexa/auth");
	    });
	}
});

/* OLD CONNECT - REMOVE
app.get('/alexa/connect', function(req, res) {
	console.warn('---------------------------> /alexa/connect req.query: ', req.query);
	var header = null;
	for (var h in req.headers) {
		header = req.headers[h];
		console.warn('header: ', h, header);
	}
	var _auth = null;
	if (req.query.phrase) {
		var phrase = req.query.phrase;
		console.warn('alexa connect phrase: ', phrase);
		phrase = phrase.replace(/\ /g, '_');
		phrase = phrase.toLowerCase();
		console.warn('phrase: ', phrase);
		var matchPhrase = null;
		//for (var phrase in _authMap) {			
			auth = _authMap[phrase];
			//auth = req.session.auth;
			console.warn('auth: ', auth);

			//}
			try {
				matchPhrase = auth.phrase.phrase.join('_').toLowerCase();
				console.warn('matchPhrase: ', matchPhrase);
				if (phrase === matchPhrase) {
					console.warn('matched auth: ', auth);
					auth.connected = true;
					auth.token = uuidv4();
					_auth = auth;
					_authMap[phrase] = auth;
					req.session.auth = auth;
					
					for (var a in _authMap) {
						console.warn('authMap[' + a + ']: ', auth);
					}
					
				} else {
					console.error('no match!!!');
					res.send({err: 'Phrase does not match.'});

				}
			} catch (e) {
				console.error('Exception: ', e);
				res.send({err: 'Phrase does not match.'});
			}
		//}
	}	

	// Only return the token to the remote client (Alexa)
	console.warn('sending token - _auth: ', _auth);
	res.send({token: _auth ? _auth.token : null});
});
*/

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
	res.end();
});

function fullUrl(req, partialUrl) {
  return url.format({
    protocol: req.protocol,
    host: req.get('host'),
    pathname: partialUrl
  });
}

var pluralMap = {
    'app': 'apps',
    'dashboard': 'dashboards',
    'dataset': 'datasets',
    'folder': 'folders',
    'lens': 'lenses',
    'query': 'queries'
};

var singularMap = {
    'apps': 'app',
    'dashboards': 'dashboard',
    'datasets': 'dataset',
    'folders': 'folders',
    'lenses': 'lens',
    'queries': 'query'
};

function isPlural(type) {
    return singularMap[type] ? true : false;
}

// For testing pruning, may need to make this configurable
// Used to prune the results
const _prune = true;

app.get('/einstein/analytics/list', function(req, res) {
	console.warn('/einstein/analytics/list req.query: ', req.query);

	//var auth = req.session.auth;
	//if (auth && req.query.type && req.query.token) {
	
		if (auth.token === req.query.token) {
			var token = req.query.token;
			console.warn('token: ', token);

			/*
			for (var a in _authMap) {
				console.warn('authMap[' + a + ']: ', auth);
			}
			*/

			//var auth = _authMap[token];

			console.warn('auth: ', auth);
			if (auth !== null && typeof auth !== "undefined") {

				var type = req.query.type;

				type = isPlural(type) ? type : pluralMap[type];

				var url = auth.oauthResult.instanceURL + '/services/data/v41.0/wave/' + type.toLowerCase();

				console.warn('auth.oauthResult.accessToken: ', auth.oauthResult.accessToken);
				console.warn('url: ', url);

				request({
					url: url,
					headers: {
						'Authorization': 'Bearer ' + auth.oauthResult.accessToken,
						'Content-Type': 'application/json'
					}
				}, function(error, response, body) {
					if (error) {
						console.error('error: ', error);
						res.send({error: error});
					} else {
						console.log('body: ', body);
						var obj = JSON.parse(body);
						if (obj.errorCode = 'INVALID_SESSION_ID') {

						}

						var obj2 = {};
						obj2[type] = [];
						asset2 = null;
						if (obj[type]) {
							obj[type].forEach(function(asset) {
								console.warn('asset: ', asset);

								if (asset.icon && asset.icon.url) {
									asset.thumbnailUrl = fullUrl(req, asset.icon.url);
								} else {

									// Call without callback
									_getImages(auth, asset);

									// Set the thumbnailUrl to point to the service
									asset.thumbnailUrl = fullUrl(req, '/einstein/analytics/thumb/' + asset.type + '/' + asset.id);
								}

								if (_prune === false) {
									asset2 = asset;
								} else {
									asset2 = {
										id: asset.id,
										name: asset.name,
										namespace: asset.namespace,
										label: asset.label,
										type: asset.type,
										thumbnailUrl: asset.thumbnailUrl,
										assetSharingUrl: asset.assetSharingUrl,
										createdBy: asset.createdBy.name,
										createdDate: asset.createdDate,
										lastModifiedBy: asset.lastModifiedBy.name,
										lastModifiedDate: asset.lastModifiedDate
									};
								}
								
								obj2[type].push(asset2);
							});
						}

						var json = JSON.stringify(obj2);
						res.send(json);
					}
				});
			} else {
				res.send({err: 'Not Authorized'});
			}
		} else {
			res.send({err: 'No access token'});
		}
	//}
});


var _imageData = {};

function _sendImage(req, res, type, data) {
	console.warn('_sendImage: ', type, data);
    if (typeof data == 'undefined' || data === null) {
        var url = 'https://adx-dev-ed.my.salesforce.com/analytics/wave/web/proto/images/app/icons/16.png';        
        //res.writeHead(200, {'Content-Type': 'image/png'});
        //res.send(url);
        req.pipe(request(url)).pipe(res);
    } else {
        var imgData = data.toString('base64');

        var img = new Buffer(imgData, 'base64');

        res.writeHead(200, {'Content-Type': 'image/png', 'Content-Length': img.length});
        res.end(img, 'binary');
    }
}

/*
 * Get the thumnail for an asset
 * Use the next callback to get the buffer, otherwise leave it out for async loading
 */
function _getImages(auth, item, next) {
	console.warn('_getImages: ', auth, item);
    if (item) {

        if (item.files && item.files.length > 0) {
            var count = 0;
            for (var j = 0; j < item.files.length; j++) {
                (function(file) {
                	console.warn('file: ', file);
                    if (file.fileName === "assetPreviewThumb" && file.contentType === "image/png") {
                        var self = this;

                        var options = {
                            headers: {
                                "Accept": "image/png",
                                "Authorization": auth.oauthResult.tokenType + " " + auth.oauthResult.accessToken
                            },
                            decoding: 'binary'

                        };

                        var url = auth.oauthResult.instanceURL + file.url;
                        console.warn('url: ', url);

                        opts = options;
                        opts.url = url;

                        console.warn('calling rest.get for ' + url);
                        rest.get(url, options).on('complete', function(result, response) {
                        	
                        	//console.warn('complete: ', result);

                            var buffer = new Buffer(result, 'binary');
                            //_imageData[item.id] = buffer;
                            _imageData[item.type + '_' + item.id] = buffer;

                            if (typeof next === 'function') {
                                next(buffer);
                            }
                        });

                    }
                })(item.files[j]);         
                        
            }
        } else {
            if (typeof next === 'function') {
                next(null);
            }
        }
    }
}

app.get('/einstein/analytics/thumb/:type/:id', function(req, res) {
    var id = req.params.id;
    console.warn('id: ', id);
    var type = req.params.type;
    console.warn('type: ', type);
    type = type === 'apps' ? 'folders' : type;
    console.warn('type: ', type);

    var data = _imageData[type + '_' + id];

    console.warn('get thumb: ', type, id);

	_sendImage(req, res, type, data);

	return;

    if (!data) {
        var options = {id: id};
        console.warn('calling getAsset: ', type, options);
        getAsset(req, res, type, options, function(result, response) {
            if (response.statusCode === 200) {
                var item = result;
                getImages(req, res, item, function(imageData) {
                    _imageData[type + '_' + id] = imageData;
                    _sendImage(req, res, type, imageData);
                });
            } else {
                console.warn('error for: ', type, options);
            }

        });
    } else {
        sendImage(req, res, type, data);
    }
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
var server = http.createServer(app).listen(port);
console.log("Server listening for HTTP connections on port " + port);


var wss = new WebSocket.Server({ server });
wss.on('connection', handleWsConnection);


var secureWss = null;

// Create an HTTPS service if the certs are present
try {
    var options = {
      key: fs.readFileSync('key.pem'),
      cert: fs.readFileSync('key-cert.pem')
    };
    var secureServer = https.createServer(options, app).listen(https_port);
    console.log("Server listening for HTTPS connections on port " + https_port);
    

	//secureWss = new WebSocket.Server({ secureServer });
	secureWss = new WebSocket.Server({ secureServer });

	secureServer.on('upgrade', function() {
		console.warn('secureServer upgrade: ', arguments);
		secureWss.handleUpgrade(arguments);
	});

	secureWss.on('connection', handleWsConnection);

} catch (e) {
    console.error(e + " - Security certs not found, HTTPS not available");
}
