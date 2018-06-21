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

//var Alexa = require('alexa-sdk');

var randomWords = require('random-words');
var WebSocket = require('ws');
var Twitter = require('twitter');
var base64 = require('base-64');


//var amazonProductAPI = require('amazon-product-api');


/*
var R = require("r-script");
*/

//var FormulaParser = require('hot-formula-parser').Parser;
//var formulaParser = new FormulaParser();

// Used in the place of standard eval
var safeEval = require('safe-eval');

// Load libraries for eval here 
//var dateFormat = require('dateformat');

/*
var oxr = require('open-exchange-rates');
var fx = require('money');
var accounting = require('accounting');

oxr.set({app_id: '0c5501e3012242b591eac7d7a2cda656'});

oxr.latest(function() {
	// Apply exchange rates and base rate to `fx` library object:
	fx.rates = oxr.rates;
	fx.base = oxr.base;	
});
*/

var port = process.env.PORT || 3000;
var https_port = process.env.HTTPS_PORT || parseInt(port) + 1;

//console.warn('process.env: ', process.env);

/*
// Localhost appId
var appId = '3MVG9SemV5D80oBcff3jWxxK32b.valGtNTj90WK4mj5IAn1LOmdrz1ObgypNEnd9JRtxfhKpuE.iX7vv0WSy';
var appSecret = '5138307552141816846';


// Check and set Heroku appId
if (process.env.HEROKU === 'true') {
	appId = '3MVG9SemV5D80oBcff3jWxxK32f4PQBwm702A4fEFlSAEviJg7BsC7PUI_WpupyyBwMfhXypJSkdVqKX7_IXr';
	appSecret = '6818833808157477050';
}

console.warn('appId: ', appId);
*/

/*
var amazonProductClient = amazonProductAPI.createClient({
  awsId: "AKIAIQAC2ZVNW4GUCBEA",
  awsSecret: "CdP/LdtcPo7UsEa10rfeERt+zCLww4rBhgrDnWuO",
  awsTag: "sfdcdemo-20"
});
*/

/*
// R Test
var out = R("example/ex-sync.R")
  .data("hello world", 20)
  .callSync();
  
console.log('\n\nR output: ', out);


var attitude = JSON.parse(
  require("fs").readFileSync("example/attitude.json", "utf8"));

console.warn('attitude: ', attitude);

console.warn('---------------- Starting async R');
R("example/ex-async.R")
  .data({df: attitude, nGroups: 3, fxn: "mean" })
  .call(function(err, d) {
    console.log(err, d);
	console.log('---------------- Ending async R');
    if (err) {
		console.error('R error: ', err);
	}
});
*/

var _appAuthMap = {
    localhost: {
        oauth: {
            'adx-dev-ed': {
                appId: '3MVG9SemV5D80oBcff3jWxxK32b.valGtNTj90WK4mj5IAn1LOmdrz1ObgypNEnd9JRtxfhKpuE.iX7vv0WSy',
                appSecret: '5138307552141816846'
            },
            'wavepm': {
                appId: '3MVG9SemV5D80oBelr7Nm4Bdjw0IXXBQW4ETMk05KOG5QIhpFLvgkmP37sKVyGIeMsQ7k_zjz3D3DTwg2BHjF',
                appSecret: '7524867041201854375'
            },
            'df17eadx': {
                appId: '3MVG9g9rbsTkKnAXTRjLb_HJvrzsMe5ne87cjIO_8sE7RAM.6C5q0YcbK_pmlCEcFqWRSudAFFzIJFuthJp.X',
                appSecret: '6576199763315337959'
            }            
        }
    },
    heroku: {
        oauth: {
            'adx-dev-ed': {
                appId: '3MVG9SemV5D80oBcff3jWxxK32f4PQBwm702A4fEFlSAEviJg7BsC7PUI_WpupyyBwMfhXypJSkdVqKX7_IXr',
                appSecret: '6818833808157477050'
            },
            'wavepm': {
                appId: '3MVG9SemV5D80oBelr7Nm4BdjwzSxKBZqRhGm8gzBXJNUsh.9sj0WG2UIhW2grZFy5QQZpBdTGnVaP9qfsT1A',
                appSecret: '1169122965078990489'
            },
            'df17eadx': {
                appId: '3MVG9g9rbsTkKnAXTRjLb_HJvr0vSrovGJMtkWWKJEEuFPAcxj5eLP3E5am.KowfnHQF375auqBXi01TQdNON',
                appSecret: '77518935725482072'
            }                        
        }
    }
};

var _appAuth = process.env.HEROKU === 'true' ? _appAuthMap.heroku.oauth : _appAuthMap.localhost.oauth;



var db = low('db.json');

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

/*

	vars - Variables that are used for computations
	data - Row data, each one processed sequentially
	code - Code statements, processed sequentially per row

	The vars are useful for things like totals, previous row values, max, min, etc.
	The data is typically the dataset row data
	The code is JavaScript, but must return a value

	// Sample used with CURL
	{"code":"function(){data.a = data.a + 1;data.b += 100;data.c = data.a * 2;bar += data.a;total++;return {data:data,total:total,bar:bar};}()","data":[{"a":1,"b":2},{"a":5,"b":20}],"vars":{"total":0,"bar":0}}

	{
		code:
			function() {
				data.a = data.a + 1;
				data.b += 100;
				data.c = data.a * 2;
				bar += data.a;total++;
				return {
					data: data,
					total: total,
					bar:bar
				};
			}()
		data: [
			{
				a: 1,
				b: 2
			},
			{
				a: 5,
				b: 20
			}
		],
		vars: {
			total: 0,
			bar: 0
		}
	}

*/
/*

Note that this will return the complete response for the dashboard, e.g.:

{
  "metadata": {
    "strings": [
      "Name",
      "Type"
    ],
    "numbers": [
      "Value"
    ],
    "groupings": [
      "Type"
    ]
  },
  "data": [
    {
      "Name": "Alpha",
      "Type": "A",
      "Value": 50.33
    },
    ...
  ]
}
*/

var _oauthResult = null;

(function getSFDCPasswordToken() {
	var hostname = 'df17eadx';

	var domain = hostname;
	var appAuth = _appAuth[domain];
	console.warn('appAuth: ', appAuth);

	var config = {
	  client_id: appAuth.appId,
	  client_secret: appAuth.appSecret,
	  grant_type: 'password',
	  username: 'skip@df17eadx.com',
	  password: 'waveout2@' // + '7hjL2VWKAodCaNOYMdfQGHSU'
	};

	console.warn('config: ', config);


	rest.post('https://login.salesforce.com/services/oauth2/token', {data: config}).on('complete', function(data, response) {
		console.warn('token call data: ', data);

	    if (response.statusCode === 200) {
	        _oauthResult = {
	        	instanceURL: data.instance_url,
	        	accessToken: data.access_token,
	        	id: data.id,
	        	tokenType: data.token_type,
	        	issuedAt: data.issued_at,
	        	signature: data.signature
	        };
	    }
	});

	console.warn('_oauthResult: ', _oauthResult);
})();


app.post('/eval', function(req, res) {
    console.warn("req.params: ", req.params);
    console.warn("req.body: ", req.body, typeof req.body);

    let body = req.body;
    let stmt = null;
    let result = null;
    let results = [];

    console.warn('body: ', body);

    let code = body.code;
    console.warn('code: ', code, typeof code);
    if (!(code instanceof Array)) {
    	code = [code];
    }
    console.warn('code: ', code);

    let vars = JSON.parse(body.vars);
    console.warn('vars: ', vars, typeof vars);
    /*
    if (!(vars instanceof Array)) {
    	vars = [vars];
    }
    console.warn('vars: ', vars);
	*/

    let data = JSON.parse(body.data);
    if (!(data instanceof Array)) {
    	data = [data];
    }
    console.warn('data: ', data);

	let baseContext = {
		dateFormat: dateFormat
	};
	for (var varName in vars) {
		baseContext[varName] = vars[varName];
	}

	//console.warn('baseContext: ', baseContext);

	let context = null;

	if (code) {

		data.forEach(function(row) {
			console.warn('row: ', row);

			context = baseContext;

			context.data = {};
			
			for (var key in row) {
				context.data[key] = row[key];
			}

			code.forEach(function(stmt) {
				console.warn('stmt: ', stmt);
				//console.warn('context: ', context);
				try {
					result = safeEval(stmt, context);
					results.push(result);
					console.warn('result: ', result);
					//console.warn('context: ', context);

					// See if any variables are in the result and set them in baseContext
					for (var key in vars) {
						if (result[key]) {
							baseContext[key] = result[key];
						}
					}
				} catch (e) {
					console.error(e);
				}
			});
		});
	}

	console.warn('results: ', results);

	let response = {
		metadata: {
			strings: body.strings ? body.strings.split(',') : [],
			numbers: body.numbers ? body.numbers.split(',') : [],
			groupings: body.groupings ? body.groupings.split(',') : []
		},
		data: results
	};
/*
	results.forEach(function(result) {
		console.warn('result: ', result, typeof result);
		response.data.push(result.data);
		for (var key in result.data) {
			let type = typeof result.data[key];
			console.warn('type of ', result.data[key], ' is ', type);
		}
	});
*/
	console.warn('response: ', response);
	console.warn('response json: ', JSON.stringify(response, null, 2));
/*
	if (body.strings) {
		results.met
	}
    "strings": [
      "Name",
      "Type"
    ],
    "numbers": [
      "Value"
    ],
    "groupings": [
      "Type"
    ]
  },
*/
	res.send(response);

});

/*
app.get('/formulas', function(req, res) {

	var formulas = require('hot-formula-parser').SUPPORTED_FORMULAS;
	res.send(formulas);
});

app.post('/formulas/parse', function(req, res) {
    console.warn("req.params: ", req.params);
    console.warn("req.body: ", req.body, typeof req.body);

    let body = req.body;

    let exp = null;
    let formula = null;
    let varName = null;
    let varVal = null;
    let varFormula = null;
    let result = null;
    let formulaResult = null;

    let results = [];

    if (body instanceof Array) {
    	for (var i = 0; i < body.length; i++) {
    		exp = body[i];
    		console.warn("exp: ", exp, typeof exp);
    		result = {};
    		if (exp.set) {
    			varName = exp.set.name;
    			//result.varname = varName;
    			if (exp.set.value || exp.set.value) {
    				varVal = exp.set.value || exp.set.val;
    				varVal = parseFloat(varVal);
    				formulaParser.setVariable(varName, varVal);
	    			//result.varvalue = varVal;
	    			result.formula = "SET(" + varName + "," + varVal + ")";
	    			result.result = varVal;
    			}
    			if (exp.set.formula) {
    				formula = exp.set.formula;
    				result.formula = "SET(" + varName + "," + formula + ")";
		    		formulaResult = formulaParser.parse(formula);
		    		console.warn('formulaResult: ', formulaResult);
		    		//result.varvalue = formulaResult.result;
		    		result.result = formulaResult.result;
		    		result.error = formulaResult.error;
		    		formulaParser.setVariable(varName, formulaResult.result);
    			}
    			if (exp.set.code) {

    			}
    		}
    		if (exp.code) {
    			let code = exp.code;
	    		result.code = code;
    			console.warn('original code: ', code);

    			let r = new RegExp('__[a-zA-Z_]*(__)?', 'g');
    			let m = code.match(r);
    			if (m && m.length > 0) {
    				console.warn('found variable: ', m);
    				m.forEach(function(v) {
    					varName = v.replace(/\_\_/g, '');
    					console.warn('varName: ', varName);
    					varVal = formulaParser.getVariable(varName);
    					console.warn('varVal: ', varVal);
    					code = code.replace(v, varVal);
    				});
    			}

    			console.warn('modified code: ', code);

	    		let context = {
	    			dateFormat: dateFormat,
	    			fx: fx,
	    			accounting: accounting
	    		};

    			try {
					result.result = safeEval(code, context)
    			} catch (e) {
    				console.error('safeEval exception: ', e);
    				result.error = e.message;
    			}
    		}
    		if (exp.formula) {
    			formula = exp.formula;
	    		console.warn('formula: ', formula);
	    		formulaResult = formulaParser.parse(formula);
	    		result.formula = formula;
	    		result.result = formulaResult.result;
	    		result.error = formulaResult.error;
    		}
    		if (exp.get) {
    			varName = exp.get.name
    			varVal = formulaParser.getVariable(varName);
    			result.formula = "GET(" + varName + ")";
    			result.result = varVal;
    			//result.varname = varName;
    			//result.varvalue = varVal;
    		}
    		console.warn('result: ', result);
    		results.push(result);
    	}
    }

    res.send(results);
});

*/

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

app.get('/lo_pw', function(req, res) {
	console.warn('_oauthResult: ', _oauthResult);
    res.render('pages/lo_pw', {title: 'Lightning Out - Einstein Analytics', appId: process.env.APPID, oauthResult: _oauthResult});
});

// df17eadx
app.get('/lo_df17eadx', function(req, res) {
    res.render('pages/lo_df17eadx', {title: 'Lightning Out - Einstein Analytics', appId: process.env.APPID});
});

// jwt
app.get('/lo_jwt', function(req, res) {
    res.render('pages/lo_jwt', {title: 'Lightning Out - Einstein Analytics', appId: process.env.APPID});
});

// iFrame test
app.get('/iframe', function(req, res) {
    res.render('pages/iframe', {title: 'Einstein Analytics - iFrame Test', appId: _appAuth['wavepm'].appId});
});

var getParams = function(req){
  let q=req.url.split('?'),result={};
  if(q.length>=2){
      q[1].split('&').forEach((item)=>{
           try {
             result[item.split('=')[0]]=item.split('=')[1];
           } catch (e) {
             result[item.split('=')[0]]='';
           }
      })
  }
  return result;
}

// Voice Proxy
app.get('/voiceproxy', function(req, res) {
	req.params = getParams(req);
	console.warn('req.params: ', req.params);
	var params = JSON.stringify(req.params);
	console.warn('params: ', params);
    res.render('pages/voiceproxy', {title: 'Einstein Analytics - Voice Proxy', params: params});
});

// Voice Analysis Proxy
app.get('/voiceanalysisproxy', function(req, res) {
	req.params = getParams(req);
	console.warn('req.params: ', req.params);
	var params = JSON.stringify(req.params);
	console.warn('params: ', params);
    res.render('pages/voiceanalysisproxy', {title: 'Einstein Analytics - Voice Analysis Proxy', params: params});
});



// Amazon Item Lookup
app.get('/amazon/item/lookup/:asin?', function(req, res) {	
	var asin = req.params.asin;
    console.warn('asin: ', asin);

	amazonProductClient.itemLookup({
		idType: 'ASIN',
		itemId: asin,
		responseGroup: 'Images,Small,Offers'
	}, function(err, results, response) {
		if (err) {
			console.error(err);
			res.send(err);
		} else {
			console.warn(JSON.stringify(results, null, 2));
			var items = [];
			var item = null;
			results.forEach(function(res) {
				//console.warn('res: ', res);
				item = {
					ASIN: res.ASIN[0],
					ParentASIN: res.ParentASIN[0],
					DetailPageURL: res.DetailPageURL[0],
					SmallImageURL: res.SmallImage[0].URL[0],
					MediumImageURL: res.MediumImage[0].URL[0],
					LargeImageURL: res.LargeImage[0].URL[0],
					Manufacturer: res.ItemAttributes[0].Manufacturer[0],
					ProductGroup: res.ItemAttributes[0].ProductGroup[0],
					Title: res.ItemAttributes[0].Title[0],
					LowestNewPrice: res.OfferSummary[0].LowestNewPrice[0].FormattedPrice[0]
				};
				items.push(item);
			});
			//console.warn('items: ', items);
			res.send(items);
		}
	});
});



// Flatten and simplify the tweets
function transformTweetsForApexStep(tweets) {

	var _tweets = [];

	tweets = typeof tweets === 'string' ? JSON.parse(tweets) : tweets;

	var tweet = null;
	tweets.statuses.forEach(function(status) {
		console.warn('-------------------> status.text: ', status.text);
		//console.warn('status.user: ', status.user);
		//console.warn('status.metadata: ', status.metadata);
		console.warn('status.entities: ', status.entities);
		var hashtags = [];
		var userMentionNames = [];
		var userMentionIds = [];
		if (status.entities) {
			if (status.entities.hashtags) {
				status.entities.hashtags.forEach(function(hashtag) {
					hashtags.push(hashtag.text);
				});
			}
			if (status.entities.user_mentions) {
				status.entities.user_mentions.forEach(function(mention) {
					userMentionNames.push(mention.name);
					userMentionIds.push(mention.id);
				});
			}
		}

		// Convert and flatten date
		var d = new Date(status.created_at);

		tweet = {
			text: status.text,
			id: status.id,
			createdDate: d.toLocaleDateString(),
			createdTime: d.toLocaleTimeString(),
			timestamp: d.getTime(),
			userName: status.user.name,
			userScreenName: status.user.screen_name,
			userId: status.user.id,
			hashtags: hashtags.join(),
			userMentionNames: userMentionNames.join(),
			userMentionIds: userMentionIds.join()
		}
		_tweets.push(tweet);
	});

	return _tweets;
}

var twitterConsumerKey = 'uR6fl45T5lCzdBK94ucKcpYee';
var twitterConsumerSecret = 'kJOXaikS4eGqtU7P4LqvUoDg0RzRrm7mm4Ojh1ODuGPtkLnMvo';
var twitterBearerToken = null;
var twitterClients = null;

function twitterReady() {
	if (typeof twitterBearerToken === 'undefined' || twitterBearerToken === null) {
		console.warn('No twitterBearerToken');
		if (typeof callback === 'function') {
			callback({error: 'Not authorized for Twitter'}, null);
		} else {
			return false;
		}
	} else {
		return true;
	}
}

function twitterSearchTweets(query, callback) {
	console.warn('twitterSearchTweets: ', query);
	if (twitterReady() === false) {
		if (typeof callback === 'function') {
			callback({error: 'Not authorized for Twitter'}, null);
		} else {
			return false;
		}
	} else {
		var url = 'search/tweets';

		var encQuery = {};

		for (var k in query) {
			encQuery[k] = escape(query[k]);
		}

		twitterClient.get(url, encQuery, function(err, tweets, res) {
			if (err) {
				console.warn('Twitter error: ', err);
				if (typeof callback === 'function') {
					callback(err, null);
				} else {
					return err;
				}
			} else {
				console.warn('tweets: ', tweets);

				if (query.transform === 'apex_step') {
					tweets = transformTweetsForApexStep(tweets);
				}

				if (typeof callback === 'function') {
					callback(null, tweets);
				} else {
					return tweets;
				}
			}
		});	
	}
}

(function getTwitterBearerToken() {

	var encodedKey = encodeURI(twitterConsumerKey);
	console.warn('encodedKey: ', encodedKey);
	var encodedSecret = encodeURI(twitterConsumerSecret);
	console.warn('encodedSecret: ', encodedSecret);
	var authString = encodedKey + ':' + encodedSecret;
	console.warn('authString: ', authString);
	var auth = base64.encode(authString);
	console.warn('auth: ', auth);
	var config = {

		headers: {
			"Authorization": "Basic " + auth,
			"Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
		},
		data: {
			grant_type: "client_credentials"
		}
	};

	console.warn("config: ", config);

	
	rest.post('https://api.twitter.com/oauth2/token', config).on('complete', function(data, response) {
    	console.warn('twitter data: ', data);
    	if (data && data.token_type === 'bearer' && data.access_token) {
    		twitterBearerToken = data;
    		twitterClient = new Twitter({
				consumer_key: twitterConsumerKey,
				consumer_secret: twitterConsumerKey,
				bearer_token: twitterBearerToken.access_token
			});

    	} else {
    		console.warn('error getting Twitter token');
    	}
    });
})();


// Twitter
app.get('/twitter', function(req, res) {
    res.render('pages/twitter', {});
});

app.get('/twitterapi/search/tweets', function(req, res) {
    var query = req.query;
    console.warn('/twitterapi/search/tweets: ', query);

    twitterSearchTweets(req.query, function(err, tweets) {
    	if (err) {
    		res.send(err);
    	} else {
    		res.send(tweets);
    	}
    });
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
	//console.warn('handleWsConnection');
  	const location = url.parse(req.url, true);
  	//console.warn('location: ', location);
  	// You might use location.query.access_token to authenticate or share sessions
  	// or req.headers.cookie (see http://stackoverflow.com/a/16395220/151312)

	ws.on('message', function incoming(message) {
    	console.log('received: %s', message, typeof message);
    	var obj = JSON.parse(message);
    	if (obj.cmd) {
    		var cmd = obj.cmd.toLowerCase();
    		//console.warn('cmd: ', cmd);
    		if (cmd === 'init') {
    			var phraseId = obj.phraseId;
    			//console.warn('phraseId: ', phraseId);
    			var phrase = _phraseMap[phraseId];
    			//console.warn('phrase: ', phrase);
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

// Simple cache map using url as the key
var _layouts = {};

function getLayoutByUrl(url, auth, callback) {

	console.warn('getLayoutByUrl: ', url);

	if (_layouts[url]) {
		if (typeof callback === 'function') {
			callback(_layouts[url], null);
		} else {
			return _layouts[url];
		}
	} else {

		request({
			url: url,
			headers: {
				'Authorization': 'Bearer ' + auth.oauthResult.accessToken,
				'Content-Type': 'application/json'
			}
		}, function(error, response, body) {
			if (error) {
				console.error('error: ', error);
				if (typeof callback === 'function') {
					callback(null, error);
				} else {
					return error;
				}
			} else {
				console.log('body: ', body);
				var obj = JSON.parse(body);

				_layouts[url] = obj;

				if (typeof callback === 'function') {
					callback(obj, null);
				} else {
					return obj;
				}
			}
		});
	}
}

/* 
 * Return an sobject formatted via compact layout
 *
 * 
 */
app.get('/alexa/record', function(req, res) {
	console.warn('/alexa/record req.query: ', req.query);

	var token = req.query.token || null;
	var id = req.query.id || null;
	var name = req.query.name || null;
	var type = req.query.type || null;
	var layout = req.query.layout || 'compactLayouts';


	// Describe compactLayout
	// /services/data/v41.0/sobjects/<type>/describe/compactLayouts/primary

	console.warn('token: ', token);
	console.warn('id: ', id);
	console.warn('type: ', type);
	console.warn('name: ', name);
	console.warn('layout: ', layout);

	if (req.session.oauthResult) {
		token = 'SESSION';
	}

	if (token === null) {
		res.send({err: "No access token"});
	} else if ((type === null || name === null) ||id !== null) {
		res.send({err: "Id or Type/Name must be specified"});
	} else {

		var auth = _authMap[token] || null;

		if (token === 'SESSION') {
			auth = {oauthResult: req.session.oauthResult};
		}

		console.warn('auth: ', auth);

		if (auth === null) {
			res.send({err: 'Invalid access token'});
		} else {
			var url = auth.oauthResult.instanceURL + '/services/data/v41.0/sobjects/' + type + '/describe/' + layout + '/primary';
			getLayoutByUrl(url, auth, function(layout, err) {
				console.warn('getLayoutByUrl returned: ', layout, err);
				layout.fieldItems.forEach(function(fieldItem) {
					console.warn('fieldItem: ', fieldItem.label);

					fieldItem.layoutComponents.forEach(function(layoutComponent) {
						console.warn('layoutComponent: ', layoutComponent.type, layoutComponent.value, layoutComponent.tabOrder, layoutComponent.fieldLines);
					});
				});

				if (err) {
					res.send(err);
				} else {
					res.send(layout);
				}
			});
		}

	}
});

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


	var ctoken = uuidv4();

	// FOR TESTING ONLY
	ctoken = '5555';

	_ctokenMap[ctoken] = true;

	res.send({status: 'success', msg: 'Please say the phrase displayed on the Authenicator app.', ctoken: ctoken});


	//res.send({phrase: _phrase.phrase, id: id});
});

/* 
 * Called by Alexa to verify the connect phrase
 */
app.get('/alexa/connect', function(req, res) {
	console.warn('/alexa/connect req.query: ', req.query);

	if (req.query.phrase && req.query.ctoken) {
		if (req.query.ctoken !== 'SUPER_SECRET_SHHHHHH_8675309' || _ctokenMap[req.query.ctoken] !== true) {
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
						oauthResult: _phrase.oauthResult //req.session.oauthResult
					};
					_authMap[auth.token] = auth;
				}
			}

			if (auth !== null) {
				res.send({msg: 'Connected', token: auth.token});				
			} else {
				res.send({err: 'Phrase does not match'});
			}
		} else {
			res.send({err: 'Invalid token'});			
		}
	} else {
		res.send({err: 'Invalid request'});
	}
});

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
			id: uuidv4(),
			oauthResult: req.session.oauthResult
		};

		// FOR TESTING ONLY
		req.session.phrase.phrase = ['Amazon', 'Reinvent', '2017'];

		req.session.phrase.id = '2017';

		//req.session.phrase = null; // FOR TESTING CHANGES

		console.warn('req.session.phrase: ', req.session.phrase);

		_phraseMap[req.session.phrase.id] = req.session.phrase;


	} else {
		req.session.phrase = null;
		//req.session.rtoken = null;
	}

	console.warn('phrase: ', req.session.phrase);
	//console.warn('rtoken: ', req.session.rtoken);

	var oauthResult = req.session.oauthResult || {};

	var domains = [];
	for (var domain in _appAuth) {
		domains.push(domain);
	}
	console.warn('domains: ', domains);

    res.render('pages/alexaauth', {
    	title: 'Authenticator',
    	//rtoken: req.session.rtoken,
		//oauthResult: JSON.stringify(oauthResult, null, 4), // REMOVE!
    	sandbox: req.session.sandbox || null,
    	phrase: req.session.phrase,
    	phrase1: req.session.phrase ? req.session.phrase.phrase[0] : null,
    	phrase2: req.session.phrase ? req.session.phrase.phrase[1] : null,    	
    	phrase3: req.session.phrase ? req.session.phrase.phrase[2] : null,
    	domains: JSON.stringify(domains)

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

		var domain = req.body.domain;
		var appAuth = _appAuth[domain];
		console.warn('appAuth: ', appAuth);

	    var config = {
	      client_id: appAuth.appId,
	      client_secret: appAuth.appSecret,
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

	console.warn('req.query.type: ', req.query.type);
	console.warn('req.query.token: ', req.query.token);

	if (req.query.type === null || typeof req.query.type === 'undefined') {
		res.send({err: "Type must be specified"});
	} else if (req.query.token === null || typeof req.query.token === 'undefined') {
		res.send({err: "No access token"});		
	} else {
	
		var token = req.query.token;
		console.warn('token: ', token);

		var auth = _authMap[token];

		console.warn('auth: ', auth);
		if (auth !== null && typeof auth !== "undefined") {

			var type = req.query.type;
			type = type.toLowerCase();
			console.warn('type: ', type);

			type = isPlural(type) ? type : pluralMap[type];
			console.warn('type: ', type);

			var url = auth.oauthResult.instanceURL + '/services/data/v41.0/wave/' + type;

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

					res.send(obj2);
				}
			});
		} else {
			res.send({err: 'Invalid access token'});
		}
	}
});

//var _projects = [{"name":"Opportunity","creation":"2017-10-05T21:30","status":"REGRESSION_FINISHED","outcome":"Amount","datasetName":"Opportunity","projectId":111,"datasetId":142,"analysisId":107,"storyId":205,"monitorId":107,"scheduleId":-1,"insightCount":9,"transactionCount":6406,"combinationCount":3004,"cardId":27331,"flagged":false,"rw":true},{"name":"Account","creation":"2017-10-03T22:01","status":"REGRESSION_FINISHED","outcome":"Annual Revenue","datasetName":"Account","projectId":108,"datasetId":139,"analysisId":104,"storyId":199,"monitorId":104,"scheduleId":-1,"insightCount":3,"transactionCount":2987,"combinationCount":1858,"cardId":26188,"flagged":false,"rw":true},{"name":"Opportunity","creation":"2017-10-03T19:53","status":"REGRESSION_FINISHED","outcome":"% true (Won)","datasetName":"Opportunity","projectId":106,"datasetId":137,"analysisId":102,"storyId":195,"monitorId":102,"scheduleId":-1,"insightCount":10,"transactionCount":6406,"combinationCount":3694,"cardId":25393,"flagged":false,"rw":true},{"name":"Opportunity","creation":"2017-10-02T17:09","status":"REGRESSION_FINISHED","outcome":"Amount","datasetName":"Opportunity","projectId":105,"datasetId":137,"analysisId":101,"storyId":193,"monitorId":101,"scheduleId":-1,"insightCount":9,"transactionCount":6406,"combinationCount":3004,"cardId":25216,"flagged":false,"rw":true}];

var _projects = [{"name":"Opportunity","creation":"2017-10-05T21:30","status":"REGRESSION_FINISHED","outcome":"Amount","datasetName":"Opportunity","projectId":111,"datasetId":142,"analysisId":107,"storyId":205,"monitorId":107,"scheduleId":-1,"insightCount":9,"transactionCount":6406,"combinationCount":3004,"cardId":27331,"flagged":false,"rw":true},{"name":"Activity","creation":"2017-10-03T22:01","status":"REGRESSION_FINISHED","outcome":"Annual Revenue","datasetName":"Account","projectId":108,"datasetId":139,"analysisId":104,"storyId":199,"monitorId":104,"scheduleId":-1,"insightCount":3,"transactionCount":2987,"combinationCount":1858,"cardId":26188,"flagged":false,"rw":true},{"name":"Lead","creation":"2017-10-03T19:53","status":"REGRESSION_FINISHED","outcome":"% true (Won)","datasetName":"Opportunity","projectId":106,"datasetId":137,"analysisId":102,"storyId":195,"monitorId":102,"scheduleId":-1,"insightCount":10,"transactionCount":6406,"combinationCount":3694,"cardId":25393,"flagged":false,"rw":true},{"name":"Ac","creation":"2017-10-02T17:09","status":"REGRESSION_FINISHED","outcome":"Amount","datasetName":"Opportunity","projectId":105,"datasetId":137,"analysisId":101,"storyId":193,"monitorId":101,"scheduleId":-1,"insightCount":9,"transactionCount":6406,"combinationCount":3004,"cardId":25216,"flagged":false,"rw":true}];

var _stories = {
	"205": {"storyId":205,"storyTree":{"showParent":false,"showSibling":false,"card":{"chart":{"series":[],"yAxisMin":0.0,"yAxisMax":0.0,"xAxisPlotlines":[],"yAxisPlotlines":[]},"id":"27330","analysis_id":"-1","approved":"false","type":"TitleCard","name":"Opportunity","location":null,"score":null,"narrativeTitle":"null","forbiddenItems":{},"legendItemsOptions":{},"addedByDoc": false,"showSingleIntersections":false,"date":"","altGrouping":false,"userID":"null","userName":"null","narrative":"Einstein Discovery evaluated 5,972 Transactions across 3,004 variable combinations to determine which factors most impact Amount.","comments":{},"options":{"chart_type":"column","forbidden":{"indices":{}},"narrative_sequence":[],"r_formula":""}},"children":[{"showParent":false,"showSibling":false,"card":{"chart":{"series":[{"data":[{"name":"2016 Q4","tooltip":{"Average":"5,328,000","Difference From Overall":"2,381,000","Standard Deviation":"3,223,000","Count":"1721"},"highlighted":true,"isInteresting":true,"isSum":false,"y":5327582.82858803,"nullYValue":false,"point":[0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2016 3","tooltip":{"Average":"1,630,000","Difference From Overall":"-1,317,000","Standard Deviation":"1,728,000","Count":"768"},"highlighted":true,"isInteresting":true,"isSum":false,"y":1629948.0,"nullYValue":false,"point":[0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2017 2","tooltip":{"Average":"2,148,000","Difference From Overall":"-798,900","Standard Deviation":"2,007,000","Count":"115"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2147791.304347826,"nullYValue":false,"point":[0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2015 3","tooltip":{"Average":"2,026,000","Difference From Overall":"-921,100","Standard Deviation":"1,323,000","Count":"255"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2025509.7725490197,"nullYValue":false,"point":[0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2014 1","tooltip":{"Average":"2,045,000","Difference From Overall":"-901,900","Standard Deviation":"1,663,000","Count":"252"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2044777.7777777778,"nullYValue":false,"point":[0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2014 3","tooltip":{"Average":"2,061,000","Difference From Overall":"-885,300","Standard Deviation":"1,696,000","Count":"241"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2061327.8008298755,"nullYValue":false,"point":[0,0,0,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2015 2","tooltip":{"Average":"2,041,000","Difference From Overall":"-905,300","Standard Deviation":"1,447,000","Count":"241"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2041385.958506224,"nullYValue":false,"point":[0,0,0,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2013 3","tooltip":{"Average":"2,007,000","Difference From Overall":"-940,000","Standard Deviation":"1,636,000","Count":"240"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2006687.4666666666,"nullYValue":false,"point":[0,0,0,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2013 4","tooltip":{"Average":"2,120,000","Difference From Overall":"-826,300","Standard Deviation":"1,679,000","Count":"239"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2120301.2552301255,"nullYValue":false,"point":[0,0,0,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2014 2","tooltip":{"Average":"2,252,000","Difference From Overall":"-694,700","Standard Deviation":"1,801,000","Count":"236"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2251936.406779661,"nullYValue":false,"point":[0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2014 4","tooltip":{"Average":"2,214,000","Difference From Overall":"-732,500","Standard Deviation":"1,652,000","Count":"228"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2214171.0877192984,"nullYValue":false,"point":[0,0,0,11,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2016 1","tooltip":{"Average":"1,893,000","Difference From Overall":"-1,054,000","Standard Deviation":"1,884,000","Count":"226"},"highlighted":true,"isInteresting":true,"isSum":false,"y":1893008.8495575222,"nullYValue":false,"point":[0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2015 4","tooltip":{"Average":"1,921,000","Difference From Overall":"-1,025,000","Standard Deviation":"1,379,000","Count":"214"},"highlighted":true,"isInteresting":true,"isSum":false,"y":1921196.261682243,"nullYValue":false,"point":[0,0,0,13,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2015 1","tooltip":{"Average":"2,104,000","Difference From Overall":"-842,900","Standard Deviation":"1,410,000","Count":"213"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2103774.647887324,"nullYValue":false,"point":[0,0,0,14,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2013 2","tooltip":{"Average":"2,165,000","Difference From Overall":"-781,900","Standard Deviation":"1,571,000","Count":"182"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2164730.7252747254,"nullYValue":false,"point":[0,0,0,15,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2017 1","tooltip":{"Average":"2,451,000","Difference From Overall":"-495,300","Standard Deviation":"2,526,000","Count":"176"},"highlighted":false,"isInteresting":false,"isSum":false,"y":2451323.8181818184,"nullYValue":false,"point":[0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2016 2","tooltip":{"Average":"2,000,000","Difference From Overall":"-946,800","Standard Deviation":"1,692,000","Count":"158"},"highlighted":true,"isInteresting":true,"isSum":false,"y":1999848.1012658228,"nullYValue":false,"point":[0,0,0,17,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2013 1","tooltip":{"Average":"2,106,000","Difference From Overall":"-840,900","Standard Deviation":"1,314,000","Count":"74"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2105783.7837837837,"nullYValue":false,"point":[0,0,0,18,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2017 3","tooltip":{"Average":"1,895,000","Difference From Overall":"-1,052,000","Standard Deviation":"1,939,000","Count":"68"},"highlighted":true,"isInteresting":true,"isSum":false,"y":1894661.7647058824,"nullYValue":false,"point":[0,0,0,19,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"Other","tooltip":{"Average":"1,372,000","Difference From Overall":"-1,575,000","Standard Deviation":"1,221,000","Count":"125"},"highlighted":true,"isInteresting":true,"isSum":false,"y":1372007.936,"nullYValue":false,"point":[0,0,0,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}],"type":"column","name":""}],"xAxisLabel":"Fiscal Period","yAxisLabel":"Average Amount","xAxisCategories":["2016 4","2016 3","2017 2","2015 3","2014 1","2014 3","2015 2","2013 3","2013 4","2014 2","2014 4","2016 1","2015 4","2015 1","2013 2","2017 1","2016 2","2013 1","2017 3","Other"],"yAxisMin":0.0,"yAxisMax":0.0,"xAxisPlotlines":[],"yAxisPlotlines":[{"color":"LightGrey","value":2946650.0,"width":1.0,"dashStyle":"Dash"}]},"id":"27331","analysis_id":"107","approved":"false","type":"BarCard","name":"Amount by Fiscal Period","location":["UNSET","UNSET","UNSET","ANY","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET"],"score":99.99990698697812,"narrativeTitle":"2016 Q4 has better than average Amount","forbiddenItems":{},"legendItemsOptions":{},"addedByDoc": false,"showSingleIntersections":false,"date":"","altGrouping":false,"userID":"null","userName":"null","narrative":"Fiscal Period explains 31.6% of the variation in Amount.<br><br>Here are some cases where Amount was better than average: <br>• 2016 Q4 is 2,381,000 above average.<br><br>Here are some cases where Amount was worse than average: <br>• 2016 Q3 is 1,317,000 below average.<br>• 2016 Q1 is 1,054,000 below average.<br>• 2015 Q3 is 921,100 below average.<br>• 2014 Q1 is 901,900 below average.<br>• 2013 Q3 is 940,000 below average.","comments":{},"options":{"chart_type":"column","drill_down_options":[],"forbidden":{"indices":{}},"group_by":3,"highlight_best":true,"highlight_sound":true,"narrative_sequence":[],"r_formula":"","show_totals":false}},"children":[]},{"showParent":false,"showSibling":false,"card":{"chart":{"series":[{"data":[{"name":"4","tooltip":{"Average":"4,343,000","Difference From Overall":"1,396,000","Standard Deviation":"3,205,000","Count":"2458"},"highlighted":true,"isInteresting":true,"isSum":false,"y":4342514.043938161,"nullYValue":false,"point":[0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"3","tooltip":{"Average":"1,825,000","Difference From Overall":"-1,121,000","Standard Deviation":"1,664,000","Count":"1598"},"highlighted":true,"isInteresting":true,"isSum":false,"y":1825337.9924906134,"nullYValue":false,"point":[0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2","tooltip":{"Average":"2,106,000","Difference From Overall":"-840,900","Standard Deviation":"1,677,000","Count":"947"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2105702.1837381204,"nullYValue":false,"point":[0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"1","tooltip":{"Average":"2,077,000","Difference From Overall":"-869,700","Standard Deviation":"1,834,000","Count":"969"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2076914.3942208462,"nullYValue":false,"point":[0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0]}],"type":"column","name":""}],"xAxisLabel":"Fiscal Quarter","yAxisLabel":"Average Amount","xAxisCategories":["4","3","2","1"],"yAxisMin":0.0,"yAxisMax":0.0,"xAxisPlotlines":[],"yAxisPlotlines":[{"color":"LightGrey","value":2946650.0,"width":1.0,"dashStyle":"Dash"}]},"id":"27332","analysis_id":"107","approved":"false","type":"BarCard","name":"Amount by Fiscal Quarter","location":["UNSET","UNSET","UNSET","UNSET","ANY","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET"],"score":59.10265466911349,"narrativeTitle":"4 has better than average Amount","forbiddenItems":{},"legendItemsOptions":{},"addedByDoc": false,"showSingleIntersections":false,"date":"","altGrouping":false,"userID":"null","userName":"null","narrative":"Fiscal Quarter explains 18.7% of the variation in Amount.<br><br>Here are some cases where Amount was better than average: <br>• #?#0#?#4 is 1,396,000 above average. This result may have been worsened by Close Date is 2017. This sub-group's Amount was 66% lower than average.<br><br>Here are some cases where Amount was worse than average: <br>• #?#1#?#3 is 1,121,000 below average. This result may have been influenced by Close Date is 2018.<br>• #?#3#?#1 is 869,700 below average. This result may have been worsened by Close Date is 2018 which occurred 2.154 times more often. This sub-group's Amount was 42.1% lower than average.<br>• #?#2#?#2 is 840,900 below average. This result may have been influenced by Close Date is 2017 which occurred 1.769 times more often.","comments":{},"options":{"chart_type":"column","drill_down_options":[],"forbidden":{"indices":{}},"group_by":4,"highlight_best":true,"highlight_sound":true,"narrative_sequence":[],"r_formula":"","show_totals":false}},"children":[]},{"showParent":false,"showSibling":false,"card":{"chart":{"series":[{"data":[{"name":"true","tooltip":{"Average":"3,589,000","Difference From Overall":"642,100","Standard Deviation":"2,957,000","Count":"4062"},"highlighted":true,"isInteresting":true,"isSum":false,"y":3588798.5819793204,"nullYValue":false,"point":[0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0]},{"name":"false","tooltip":{"Average":"1,581,000","Difference From Overall":"-1,366,000","Standard Deviation":"1,260,000","Count":"1910"},"highlighted":true,"isInteresting":true,"isSum":false,"y":1580999.97486911,"nullYValue":false,"point":[0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0]}],"type":"column","name":""}],"xAxisLabel":"Has Line Item","yAxisLabel":"Average Amount","xAxisCategories":["true","false"],"yAxisMin":0.0,"yAxisMax":0.0,"xAxisPlotlines":[],"yAxisPlotlines":[{"color":"LightGrey","value":2946650.0,"width":1.0,"dashStyle":"Dash"}]},"id":"27333","analysis_id":"107","approved":"false","type":"BarCard","name":"Amount by Has Line Item","location":["UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","ANY","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET"],"score":37.77811506962816,"narrativeTitle":"false has worse than average Amount","forbiddenItems":{},"legendItemsOptions":{},"addedByDoc": false,"showSingleIntersections":false,"date":"","altGrouping":false,"userID":"null","userName":"null","narrative":"Has Line Item explains 11.9% of the variation in Amount.<br><br>Here are some cases where Amount was better than average: <br>• #?#0#?#true is 642,100 above average. This result may have been worsened by Close Date is 2017. This sub-group's Amount was 27.5% lower than average.<br><br>Here are some cases where Amount was worse than average: <br>• #?#1#?#false is 1,366,000 below average. This result may have been worsened by Close Date is 2018 which occurred 3.04 times more often. This sub-group's Amount was 19.1% lower than average.","comments":{},"options":{"chart_type":"column","drill_down_options":[],"forbidden":{"indices":{}},"group_by":7,"highlight_best":true,"highlight_sound":true,"narrative_sequence":[],"r_formula":"","show_totals":false}},"children":[]},{"showParent":false,"showSibling":false,"card":{"chart":{"series":[{"data":[{"name":"2013","tooltip":{"Average":"2,092,000","Difference From Overall":"-854,400","Standard Deviation":"1,602,000","Count":"736"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2092241.9130434783,"nullYValue":false,"point":[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2014","tooltip":{"Average":"2,140,000","Difference From Overall":"-806,300","Standard Deviation":"1,704,000","Count":"957"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2140386.574712644,"nullYValue":false,"point":[2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2015","tooltip":{"Average":"2,024,000","Difference From Overall":"-923,100","Standard Deviation":"1,389,000","Count":"923"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2023531.8916576381,"nullYValue":false,"point":[3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2016","tooltip":{"Average":"3,886,000","Difference From Overall":"939,300","Standard Deviation":"3,251,000","Count":"2873"},"highlighted":true,"isInteresting":true,"isSum":false,"y":3885972.717020536,"nullYValue":false,"point":[4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2017","tooltip":{"Average":"2,163,000","Difference From Overall":"-783,800","Standard Deviation":"2,189,000","Count":"405"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2162891.3777777776,"nullYValue":false,"point":[5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2018","tooltip":{"Average":"1,296,000","Difference From Overall":"-1,651,000","Standard Deviation":"1,222,000","Count":"78"},"highlighted":true,"isInteresting":true,"isSum":false,"y":1295769.2307692308,"nullYValue":false,"point":[6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}],"type":"column","name":""}],"xAxisLabel":"Close Date","yAxisLabel":"Average Amount","xAxisCategories":["2013","2014","2015","2016","2017","2018"],"yAxisMin":0.0,"yAxisMax":0.0,"xAxisPlotlines":[],"yAxisPlotlines":[{"color":"LightGrey","value":2946650.0,"width":1.0,"dashStyle":"Dash"}]},"id":"27334","analysis_id":"107","approved":"false","type":"BarCard","name":"Amount by Close Date","location":["ANY","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET"],"score":35.45931605895113,"narrativeTitle":"2016 has better than average Amount","forbiddenItems":{},"legendItemsOptions":{},"addedByDoc": false,"showSingleIntersections":false,"date":"","altGrouping":false,"userID":"null","userName":"null","narrative":"Close Date explains 11.2% of the variation in Amount.<br><br>Here are some cases where Amount was better than average: <br>• #?#3#?#2016 is 939,300 above average.<br><br>Here are some cases where Amount was worse than average: <br>• #?#2#?#2015 is 923,100 below average.<br>• #?#1#?#2014 is 806,300 below average.<br>• #?#0#?#2013 is 854,400 below average.<br>• #?#4#?#2017 is 783,800 below average. This result may have been worsened by Created Date is 2017/Q1 which occurred 6.75 times more often. This sub-group's Amount was 96% lower than average.<br>• #?#5#?#2018 is 1,651,000 below average. This result may have been influenced by Lead Source is null which occurred 25.33 times more often.","comments":{},"options":{"chart_type":"column","drill_down_options":[],"forbidden":{"indices":{}},"group_by":0,"highlight_best":true,"highlight_sound":true,"narrative_sequence":[],"r_formula":"","show_totals":false}},"children":[]},{"showParent":false,"showSibling":false,"card":{"chart":{"series":[{"data":[{"name":"2016","tooltip":{"Average":"3,886,000","Difference From Overall":"939,300","Standard Deviation":"3,251,000","Count":"2873"},"highlighted":true,"isInteresting":true,"isSum":false,"y":3885972.717020536,"nullYValue":false,"point":[0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2014","tooltip":{"Average":"2,140,000","Difference From Overall":"-806,300","Standard Deviation":"1,704,000","Count":"957"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2140386.574712644,"nullYValue":false,"point":[0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2015","tooltip":{"Average":"2,024,000","Difference From Overall":"-923,100","Standard Deviation":"1,389,000","Count":"923"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2023531.8916576381,"nullYValue":false,"point":[0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2017","tooltip":{"Average":"2,163,000","Difference From Overall":"-783,800","Standard Deviation":"2,189,000","Count":"405"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2162891.3777777776,"nullYValue":false,"point":[0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2013","tooltip":{"Average":"2,093,000","Difference From Overall":"-853,900","Standard Deviation":"1,603,000","Count":"735"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2092748.2775510205,"nullYValue":false,"point":[0,0,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2018","tooltip":{"Average":"1,296,000","Difference From Overall":"-1,651,000","Standard Deviation":"1,222,000","Count":"78"},"highlighted":true,"isInteresting":true,"isSum":false,"y":1295769.2307692308,"nullYValue":false,"point":[0,0,0,0,0,6,0,0,0,0,0,0,0,0,0,0,0,0]}],"type":"column","name":""}],"xAxisLabel":"Fiscal Year","yAxisLabel":"Average Amount","xAxisCategories":["2016","2014","2015","2017","2013","2018"],"yAxisMin":0.0,"yAxisMax":0.0,"xAxisPlotlines":[],"yAxisPlotlines":[{"color":"LightGrey","value":2946650.0,"width":1.0,"dashStyle":"Dash"}]},"id":"27335","analysis_id":"107","approved":"false","type":"BarCard","name":"Amount by Fiscal Year","location":["UNSET","UNSET","UNSET","UNSET","UNSET","ANY","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET"],"score":35.438762133450794,"narrativeTitle":"2016 has better than average Amount","forbiddenItems":{},"legendItemsOptions":{},"addedByDoc": false,"showSingleIntersections":false,"date":"","altGrouping":false,"userID":"null","userName":"null","narrative":"Fiscal Year explains 11.2% of the variation in Amount.<br><br>Here are some cases where Amount was better than average: <br>• #?#0#?#2016 is 939,300 above average.<br><br>Here are some cases where Amount was worse than average: <br>• #?#2#?#2015 is 923,100 below average.<br>• #?#1#?#2014 is 806,300 below average.<br>• #?#4#?#2013 is 853,900 below average.<br>• #?#3#?#2017 is 783,800 below average.<br>• #?#5#?#2018 is 1,651,000 below average.","comments":{},"options":{"chart_type":"column","drill_down_options":[],"forbidden":{"indices":{}},"group_by":5,"highlight_best":true,"highlight_sound":true,"narrative_sequence":[],"r_formula":"","show_totals":false}},"children":[]},{"showParent":false,"showSibling":false,"card":{"chart":{"series":[{"data":[{"name":"2016/Q1","tooltip":{"Average":"2,078,000","Difference From Overall":"-869,000","Standard Deviation":"1,791,000","Count":"1619"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2077603.498455837,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0]},{"name":"2016/Q2","tooltip":{"Average":"1,066,000","Difference From Overall":"-1,880,000","Standard Deviation":"1,092,000","Count":"117"},"highlighted":true,"isInteresting":true,"isSum":false,"y":1066341.8803418803,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0]},{"name":"2016/Q3","tooltip":{"Average":"3,795,000","Difference From Overall":"848,600","Standard Deviation":"2,338,000","Count":"320"},"highlighted":true,"isInteresting":true,"isSum":false,"y":3795281.2,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0]},{"name":"2016/Q4","tooltip":{"Average":"2,842,000","Difference From Overall":"-104,200","Standard Deviation":"2,379,000","Count":"1545"},"highlighted":false,"isInteresting":false,"isSum":false,"y":2842491.7747572814,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0]},{"name":"2017/Q1","tooltip":{"Average":"4,058,000","Difference From Overall":"1,111,000","Standard Deviation":"3,600,000","Count":"1028"},"highlighted":true,"isInteresting":true,"isSum":false,"y":4057704.3424124513,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,0,0,0]},{"name":"2017/Q2","tooltip":{"Average":"3,262,000","Difference From Overall":"315,200","Standard Deviation":"2,930,000","Count":"1302"},"highlighted":false,"isInteresting":false,"isSum":false,"y":3261889.474654378,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,0,0,0]},{"name":"2017/Q3","tooltip":{"Average":"2,062,000","Difference From Overall":"-884,800","Standard Deviation":"2,103,000","Count":"41"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2061836.487804878,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,7,0,0,0,0,0,0]}],"type":"column","name":""}],"xAxisLabel":"Last Modified Date","yAxisLabel":"Average Amount","xAxisCategories":["2016/Q1","2016/Q2","2016/Q3","2016/Q4","2017/Q1","2017/Q2","2017/Q3"],"yAxisMin":0.0,"yAxisMax":0.0,"xAxisPlotlines":[],"yAxisPlotlines":[{"color":"LightGrey","value":2946650.0,"width":1.0,"dashStyle":"Dash"}]},"id":"27336","analysis_id":"107","approved":"false","type":"BarCard","name":"Amount by Last Modified Date","location":["UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","ANY","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET"],"score":23.641852403241565,"narrativeTitle":"2017/Q1 has better than average Amount","forbiddenItems":{},"legendItemsOptions":{},"addedByDoc": false,"showSingleIntersections":false,"date":"","altGrouping":false,"userID":"null","userName":"null","narrative":"Last Modified Date explains 7.5% of the variation in Amount.<br><br>Here are some cases where Amount was better than average: <br>• #?#4#?#2017/Q1 is 1,111,000 above average. This result may have been worsened by Close Date is 2017 which occurred 1.714 times more often. This sub-group's Amount was 51% lower than average.<br>• #?#2#?#2016/Q3 is 848,600 above average.<br><br>Here are some cases where Amount was worse than average: <br>• #?#0#?#2016/Q1 is 869,000 below average.<br>• #?#1#?#2016/Q2 is 1,880,000 below average.<br>• #?#6#?#2017/Q3 is 884,800 below average. This result may have been influenced by Close Date is 2017 which occurred 13.33 times more often.","comments":{},"options":{"chart_type":"column","drill_down_options":[],"forbidden":{"indices":{}},"group_by":11,"highlight_best":true,"highlight_sound":true,"narrative_sequence":[],"r_formula":"","show_totals":false}},"children":[]},{"showParent":false,"showSibling":false,"card":{"chart":{"series":[{"data":[{"name":"2013/Q1","tooltip":{"Average":"3,618,000","Difference From Overall":"671,600","Standard Deviation":"3,049,000","Count":"332"},"highlighted":false,"isInteresting":false,"isSum":false,"y":3618253.108433735,"nullYValue":false,"point":[0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2013/Q2","tooltip":{"Average":"3,278,000","Difference From Overall":"331,800","Standard Deviation":"2,769,000","Count":"370"},"highlighted":false,"isInteresting":false,"isSum":false,"y":3278405.535135135,"nullYValue":false,"point":[0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2013/Q3","tooltip":{"Average":"3,438,000","Difference From Overall":"491,100","Standard Deviation":"2,926,000","Count":"387"},"highlighted":false,"isInteresting":false,"isSum":false,"y":3437777.695090439,"nullYValue":false,"point":[0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2013/Q4","tooltip":{"Average":"3,084,000","Difference From Overall":"137,300","Standard Deviation":"2,619,000","Count":"390"},"highlighted":false,"isInteresting":false,"isSum":false,"y":3083948.6358974357,"nullYValue":false,"point":[0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2014/Q1","tooltip":{"Average":"3,465,000","Difference From Overall":"518,500","Standard Deviation":"2,843,000","Count":"355"},"highlighted":false,"isInteresting":false,"isSum":false,"y":3465155.064788732,"nullYValue":false,"point":[0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2014/Q2","tooltip":{"Average":"3,522,000","Difference From Overall":"575,000","Standard Deviation":"2,943,000","Count":"342"},"highlighted":false,"isInteresting":false,"isSum":false,"y":3521666.619883041,"nullYValue":false,"point":[0,0,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2014/Q3","tooltip":{"Average":"3,385,000","Difference From Overall":"438,800","Standard Deviation":"2,753,000","Count":"331"},"highlighted":false,"isInteresting":false,"isSum":false,"y":3385468.1329305135,"nullYValue":false,"point":[0,0,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2014/Q4","tooltip":{"Average":"3,303,000","Difference From Overall":"356,500","Standard Deviation":"2,632,000","Count":"341"},"highlighted":false,"isInteresting":false,"isSum":false,"y":3303108.6920821113,"nullYValue":false,"point":[0,0,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2015/Q1","tooltip":{"Average":"3,180,000","Difference From Overall":"233,800","Standard Deviation":"2,617,000","Count":"359"},"highlighted":false,"isInteresting":false,"isSum":false,"y":3180473.4038997213,"nullYValue":false,"point":[0,0,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2015/Q2","tooltip":{"Average":"2,980,000","Difference From Overall":"32,920","Standard Deviation":"2,382,000","Count":"327"},"highlighted":false,"isInteresting":false,"isSum":false,"y":2979565.7981651374,"nullYValue":false,"point":[0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2015/Q3","tooltip":{"Average":"3,031,000","Difference From Overall":"84,090","Standard Deviation":"2,499,000","Count":"341"},"highlighted":false,"isInteresting":false,"isSum":false,"y":3030733.137829912,"nullYValue":false,"point":[0,0,11,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2015/Q4","tooltip":{"Average":"3,108,000","Difference From Overall":"161,200","Standard Deviation":"2,556,000","Count":"336"},"highlighted":false,"isInteresting":false,"isSum":false,"y":3107886.8571428573,"nullYValue":false,"point":[0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2016/Q1","tooltip":{"Average":"2,131,000","Difference From Overall":"-815,300","Standard Deviation":"2,426,000","Count":"679"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2131310.845360825,"nullYValue":false,"point":[0,0,13,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2016/Q2","tooltip":{"Average":"1,978,000","Difference From Overall":"-968,900","Standard Deviation":"2,410,000","Count":"748"},"highlighted":true,"isInteresting":true,"isSum":false,"y":1977780.705882353,"nullYValue":false,"point":[0,0,14,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2016/Q3","tooltip":{"Average":"3,545,000","Difference From Overall":"598,500","Standard Deviation":"3,022,000","Count":"193"},"highlighted":false,"isInteresting":false,"isSum":false,"y":3545119.170984456,"nullYValue":false,"point":[0,0,15,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2017/Q1","tooltip":{"Average":"164,300","Difference From Overall":"-2,782,000","Standard Deviation":"357,600","Count":"56"},"highlighted":true,"isInteresting":true,"isSum":false,"y":164299.10714285713,"nullYValue":false,"point":[0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2017/Q2","tooltip":{"Average":"1,820,000","Difference From Overall":"-1,127,000","Standard Deviation":"1,222,000","Count":"85"},"highlighted":true,"isInteresting":true,"isSum":false,"y":1819588.1411764706,"nullYValue":false,"point":[0,0,17,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}],"type":"column","name":""}],"xAxisLabel":"Created Date","yAxisLabel":"Average Amount","xAxisCategories":["2013/Q1","2013/Q2","2013/Q3","2013/Q4","2014/Q1","2014/Q2","2014/Q3","2014/Q4","2015/Q1","2015/Q2","2015/Q3","2015/Q4","2016/Q1","2016/Q2","2016/Q3","2017/Q1","2017/Q2"],"yAxisMin":0.0,"yAxisMax":0.0,"xAxisPlotlines":[],"yAxisPlotlines":[{"color":"LightGrey","value":2946650.0,"width":1.0,"dashStyle":"Dash"}]},"id":"27337","analysis_id":"107","approved":"false","type":"BarCard","name":"Amount by Created Date","location":["UNSET","UNSET","ANY","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET"],"score":16.54568867780819,"narrativeTitle":"2016/Q2 and 3 others have worse than average Amount","forbiddenItems":{},"legendItemsOptions":{},"addedByDoc": false,"showSingleIntersections":false,"date":"","altGrouping":false,"userID":"null","userName":"null","narrative":"Created Date explains 5.2% of the variation in Amount.<br><br>Here are some cases where Amount was worse than average: <br>• #?#13#?#2016/Q2 is 968,900 below average. This result may have been influenced by Close Date is 2017 which occurred 2.392 times more often.<br>• #?#12#?#2016/Q1 is 815,300 below average.<br>• #?#15#?#2017/Q1 is 2,782,000 below average. This result may have been worsened by Close Date is 2017 which occurred 6.75 times more often. This sub-group's Amount was 59.4% lower than average.<br>• #?#16#?#2017/Q2 is 1,127,000 below average. This result may have been influenced by Close Date is 2017 which occurred 4.667 times more often.","comments":{},"options":{"chart_type":"column","drill_down_options":[],"forbidden":{"indices":{}},"group_by":2,"highlight_best":true,"highlight_sound":true,"narrative_sequence":[],"r_formula":"","show_totals":false}},"children":[]},{"showParent":false,"showSibling":false,"card":{"chart":{"series":[{"data":[{"name":"Closed Won","tooltip":{"Average":"2,673,000","Difference From Overall":"-273,800","Standard Deviation":"2,519,000","Count":"3035"},"highlighted":false,"isInteresting":false,"isSum":false,"y":2672896.253047776,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0]},{"name":"Closed Lost","tooltip":{"Average":"2,727,000","Difference From Overall":"-219,800","Standard Deviation":"2,317,000","Count":"755"},"highlighted":false,"isInteresting":false,"isSum":false,"y":2726794.680794702,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0]},{"name":"Needs Analysis","tooltip":{"Average":"3,423,000","Difference From Overall":"476,700","Standard Deviation":"3,055,000","Count":"539"},"highlighted":true,"isInteresting":true,"isSum":false,"y":3423302.293135436,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0]},{"name":"Prospecting","tooltip":{"Average":"1,203,000","Difference From Overall":"-1,744,000","Standard Deviation":"1,688,000","Count":"53"},"highlighted":true,"isInteresting":true,"isSum":false,"y":1202950.9433962265,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0]},{"name":"Value Proposition","tooltip":{"Average":"3,733,000","Difference From Overall":"786,400","Standard Deviation":"3,104,000","Count":"453"},"highlighted":true,"isInteresting":true,"isSum":false,"y":3733068.2913907287,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0]},{"name":"Id. Decision Makers","tooltip":{"Average":"3,901,000","Difference From Overall":"954,200","Standard Deviation":"3,130,000","Count":"290"},"highlighted":true,"isInteresting":true,"isSum":false,"y":3900862.2344827587,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0]},{"name":"Perception Analysis","tooltip":{"Average":"3,950,000","Difference From Overall":"1,004,000","Standard Deviation":"3,116,000","Count":"229"},"highlighted":true,"isInteresting":true,"isSum":false,"y":3950419.2838427946,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,7,0]},{"name":"Proposal/Price Quote","tooltip":{"Average":"3,317,000","Difference From Overall":"370,200","Standard Deviation":"2,915,000","Count":"195"},"highlighted":false,"isInteresting":false,"isSum":false,"y":3316815.4256410254,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,0]},{"name":"Qualification","tooltip":{"Average":"2,212,000","Difference From Overall":"-734,400","Standard Deviation":"2,458,000","Count":"177"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2212288.1807909603,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,0]},{"name":"Negotiation/Review","tooltip":{"Average":"2,089,000","Difference From Overall":"-857,600","Standard Deviation":"2,407,000","Count":"148"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2089013.6216216215,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10,0]},{"name":"Other","tooltip":{"Average":"4,520,000","Difference From Overall":"1,574,000","Standard Deviation":"2,392,000","Count":"98"},"highlighted":true,"isInteresting":true,"isSum":false,"y":4520173.3877551025,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,11,0]}],"type":"column","name":""}],"xAxisLabel":"Stage","yAxisLabel":"Average Amount","xAxisCategories":["Closed Won","Closed Lost","Needs Analysis","Prospecting","Value Proposition","Id. Decision Makers","Perception Analysis","Proposal/Price Quote","Qualification","Negotiation/Review","Other"],"yAxisMin":0.0,"yAxisMax":0.0,"xAxisPlotlines":[],"yAxisPlotlines":[{"color":"LightGrey","value":2946650.0,"width":1.0,"dashStyle":"Dash"}]},"id":"27338","analysis_id":"107","approved":"false","type":"BarCard","name":"Amount by Stage","location":["UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","ANY","UNSET"],"score":12.463963666254935,"narrativeTitle":"Value Proposition and 4 others have better than average Amount","forbiddenItems":{},"legendItemsOptions":{},"addedByDoc": false,"showSingleIntersections":false,"date":"","altGrouping":false,"userID":"null","userName":"null","narrative":"Stage explains 3.9% of the variation in Amount.<br><br>Here are some cases where Amount was better than average: <br>• #?#4#?#Value Proposition is 786,400 above average. This result may have been worsened by Close Date is 2017 which occurred 1.484 times more often. This sub-group's Amount was 43.3% lower than average.<br>• #?#5#?#Id. Decision Makers is 954,200 above average.<br>• #?#2#?#Needs Analysis is 476,700 above average. This result may have been worsened by Close Date is 2017 which occurred 2.514 times more often. This sub-group's Amount was 56.6% lower than average.<br>• #?#6#?#Perception Analysis is 1,004,000 above average.<br>• #?#10#?#Other is 1,574,000 above average. This result may have been worsened by Close Date is 2017 which occurred 5.143 times more often. This sub-group's Amount was 51.3% lower than average.<br><br>Here are some cases where Amount was worse than average: <br>• #?#8#?#Qualification is 734,400 below average. This result may have been influenced by Close Date is 2017 which occurred 5.154 times more often.","comments":{},"options":{"chart_type":"column","drill_down_options":[],"forbidden":{"indices":{}},"group_by":16,"highlight_best":true,"highlight_sound":true,"narrative_sequence":[],"r_formula":"","show_totals":false}},"children":[]},{"showParent":false,"showSibling":false,"card":{"chart":{"series":[{"data":[{"name":"100.0","tooltip":{"Average":"2,677,000","Difference From Overall":"-269,800","Standard Deviation":"2,522,000","Count":"3020"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2676807.8834437085,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0]},{"name":"0.0","tooltip":{"Average":"2,935,000","Difference From Overall":"-11,280","Standard Deviation":"2,390,000","Count":"856"},"highlighted":false,"isInteresting":false,"isSum":false,"y":2935362.0934579438,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0]},{"name":"10.0","tooltip":{"Average":"1,958,000","Difference From Overall":"-988,200","Standard Deviation":"2,316,000","Count":"238"},"highlighted":true,"isInteresting":true,"isSum":false,"y":1958403.361344538,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0]},{"name":"20.0","tooltip":{"Average":"3,418,000","Difference From Overall":"471,800","Standard Deviation":"3,051,000","Count":"541"},"highlighted":true,"isInteresting":true,"isSum":false,"y":3418465.715341959,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0]},{"name":"50.0","tooltip":{"Average":"3,728,000","Difference From Overall":"781,200","Standard Deviation":"3,103,000","Count":"454"},"highlighted":true,"isInteresting":true,"isSum":false,"y":3727863.5418502204,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,0]},{"name":"60.0","tooltip":{"Average":"3,901,000","Difference From Overall":"954,200","Standard Deviation":"3,130,000","Count":"290"},"highlighted":true,"isInteresting":true,"isSum":false,"y":3900862.2344827587,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0]},{"name":"70.0","tooltip":{"Average":"3,950,000","Difference From Overall":"1,004,000","Standard Deviation":"3,116,000","Count":"229"},"highlighted":true,"isInteresting":true,"isSum":false,"y":3950419.2838427946,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,7,0,0]},{"name":"75.0","tooltip":{"Average":"3,305,000","Difference From Overall":"358,100","Standard Deviation":"2,912,000","Count":"196"},"highlighted":false,"isInteresting":false,"isSum":false,"y":3304744.8163265307,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,0,0]},{"name":"90.0","tooltip":{"Average":"2,089,000","Difference From Overall":"-857,600","Standard Deviation":"2,407,000","Count":"148"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2089013.6216216215,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,0,0]}],"type":"column","name":""}],"xAxisLabel":"Probability (%)","yAxisLabel":"Average Amount","xAxisCategories":["100.0","0.0","10.0","20.0","50.0","60.0","70.0","75.0","90.0"],"yAxisMin":0.0,"yAxisMax":0.0,"xAxisPlotlines":[],"yAxisPlotlines":[{"color":"LightGrey","value":2946650.0,"width":1.0,"dashStyle":"Dash"}]},"id":"27339","analysis_id":"107","approved":"false","type":"BarCard","name":"Amount by Probability (%)","location":["UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","ANY","UNSET","UNSET"],"score":10.270037658348457,"narrativeTitle":"50.0 and 3 others have better than average Amount","forbiddenItems":{},"legendItemsOptions":{},"addedByDoc": false,"showSingleIntersections":false,"date":"","altGrouping":false,"userID":"null","userName":"null","narrative":"Probability (%) explains 3.2% of the variation in Amount.<br><br>Here are some cases where Amount was better than average: <br>• #?#4#?#50.0 is 781,200 above average. This result may have been worsened by Close Date is 2017 which occurred 1.516 times more often. This sub-group's Amount was 43.8% lower than average.<br>• #?#5#?#60.0 is 954,200 above average.<br>• #?#3#?#20.0 is 471,800 above average. This result may have been worsened by Close Date is 2017 which occurred 2.568 times more often. This sub-group's Amount was 56.3% lower than average.<br>• #?#6#?#70.0 is 1,004,000 above average.<br><br>Here are some cases where Amount was worse than average: <br>• #?#0#?#100.0 is 269,800 below average. This result may have been influenced by Close Date is 2017.<br>• #?#2#?#10.0 is 988,200 below average. This result may have been worsened by Close Date is 2018 which occurred 15.75 times more often. This sub-group's Amount was 26.6% lower than average.","comments":{},"options":{"chart_type":"column","drill_down_options":[],"forbidden":{"indices":{}},"group_by":15,"highlight_best":true,"highlight_sound":true,"narrative_sequence":[],"r_formula":"","show_totals":false}},"children":[]}]},"storyCreationMonitor":{"monitorId":107,"storyId":205,"projectId":111,"storyName":"Opportunity","laptop":false,"insights":"9","relevance":"HIGH","isReady":true,"analyses":[{"analysis_id":107,"outcome":"Amount","status":{"currentlyRunning":"REGRESSION_FINISHED","currentTextStatus":"Ready","currentPercentage":1.0,"clusterStatus":"COMPLETE","waterfallStatus":"COMPLETE","prescriptionStatus":"null","dodStatus":"null","forecastStatus":"null"},"unit":"","progress":1.0,"combinationCount":3004,"combinationCountGuess":126}]},"datasetName":"Opportunity","statistics":{"cardStats":[],"storyViews":[]},"readOnly":false,"duration":"4M","laptop":false,"historicSummary":{},"graphNames":["Close Date","Closed","Created Date","Fiscal Period","Fiscal Quarter","Fiscal Year","Forecast Category","Has Line Item","Has Open Activity","Has Overdue Task","Is Locked","Last Modified Date","Lead Source","May Edit","Opportunity Type","Probability (%)","Stage","Won"],"graphSeriesNames":[["Unconstrained","2013","2014","2015","2016","2017","2018"],["Unconstrained","true","false"],["Unconstrained","2013/Q1","2013/Q2","2013/Q3","2013/Q4","2014/Q1","2014/Q2","2014/Q3","2014/Q4","2015/Q1","2015/Q2","2015/Q3","2015/Q4","2016/Q1","2016/Q2","2016/Q3","2017/Q1","2017/Q2"],["Unconstrained","2016 4","2016 3","2017 2","2015 3","2014 1","2014 3","2015 2","2013 3","2013 4","2014 2","2014 4","2016 1","2015 4","2015 1","2013 2","2017 1","2016 2","2013 1","2017 3","Other"],["Unconstrained","4","3","2","1"],["Unconstrained","2016","2014","2015","2017","2013","2018"],["Unconstrained","Closed","Pipeline","Omitted","Best Case","Commit"],["Unconstrained","true","false"],["Unconstrained","true","false"],["Unconstrained","true","false"],["Unconstrained","false"],["Unconstrained","2016/Q1","2016/Q2","2016/Q3","2016/Q4","2017/Q1","2017/Q2","2017/Q3"],["Unconstrained","Employee Referral","Partner","Word of mouth","Web","Advertisement","Trade Show","Public Relations","Seminar - Internal","null"],["Unconstrained","true"],["Unconstrained","New Business","New Business / Add-on","Existing Business","null"],["Unconstrained","100.0","0.0","10.0","20.0","50.0","60.0","70.0","75.0","90.0"],["Unconstrained","Closed Won","Closed Lost","Needs Analysis","Prospecting","Value Proposition","Id. Decision Makers","Perception Analysis","Proposal/Price Quote","Qualification","Negotiation/Review","Other"],["Unconstrained","false","true"]],"outcome":"Amount","goodbad":"GOOD"},
	"199": {"storyId":199,"storyTree":{"showParent":false,"showSibling":false,"card":{"chart":{"series":[],"yAxisMin":0.0,"yAxisMax":0.0,"xAxisPlotlines":[],"yAxisPlotlines":[]},"id":"26187","analysis_id":"-1","approved":"false","type":"TitleCard","name":"Account","location":null,"score":null,"narrativeTitle":"null","forbiddenItems":{},"legendItemsOptions":{},"addedByDoc": false,"showSingleIntersections":false,"date":"","altGrouping":false,"userID":"null","userName":"null","narrative":"Einstein Discovery evaluated 2,021 Transactions and 18 columns of data across 1,858 variable combinations to determine which factors most impact Annual Revenue. (Note: Overall Average: 1,327,000,000 indicated by dashed grey line. Translucent bars are not statistically important.)","comments":{},"options":{"chart_type":"column","forbidden":{"indices":{}},"narrative_sequence":[],"r_formula":""}},"children":[{"showParent":false,"showSibling":false,"card":{"chart":{"series":[{"data":[{"name":"2016/6","tooltip":{"Average":"34,230,000","Difference From Overall":"-1,292,000,000","Standard Deviation":"1,282,000,000","Count":"1521"},"highlighted":true,"isInteresting":true,"isSum":false,"y":3.4226628418145955E7,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0]},{"name":"2016/7","tooltip":{"Average":"5,258,000,000","Difference From Overall":"3,931,000,000","Standard Deviation":"2,819,000,000","Count":"500"},"highlighted":true,"isInteresting":true,"isSum":false,"y":5.25810008064E9,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0]}],"type":"column","name":""}],"xAxisLabel":"Last Modified Date","yAxisLabel":"Average Annual Revenue","xAxisCategories":["2016/6","2016/7"],"yAxisMin":0.0,"yAxisMax":0.0,"xAxisPlotlines":[],"yAxisPlotlines":[{"color":"LightGrey","value":1.32662003E9,"width":1.0,"dashStyle":"Dash"}]},"id":"26188","analysis_id":"104","approved":"false","type":"BarCard","name":"Annual Revenue by Last Modified Date","location":["UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","ANY","UNSET","UNSET","UNSET","UNSET"],"score":100.00007460759173,"narrativeTitle":"2016/7 has better than average Annual Revenue","forbiddenItems":{},"legendItemsOptions":{},"addedByDoc": false,"showSingleIntersections":false,"date":"","altGrouping":false,"userID":"null","userName":"null","narrative":"Last Modified Date explains 61.4% of the variation in Annual Revenue.<br><br>Here are some cases where Annual Revenue was better than average: <br>• #?#1#?#2016/7 is 3,931,000,000 above average. This result may have been influenced by Created Date is 2016/Q2 which occurred 3.526 times more often.<br><br>Here are some cases where Annual Revenue was worse than average: <br>• #?#0#?#2016/6 is 1,292,000,000 below average. This result may have been worsened by Created Date is 2016/Q1 which occurred 1.328 times more often. This sub-group's Annual Revenue was 100% lower than average.","comments":{},"options":{"chart_type":"column","drill_down_options":[],"forbidden":{"indices":{}},"group_by":13,"highlight_best":true,"highlight_sound":true,"narrative_sequence":[],"r_formula":"","show_totals":false}},"children":[]},{"showParent":false,"showSibling":false,"card":{"chart":{"series":[{"data":[{"name":"1 to 127","tooltip":{"Average":"56,190,000","Difference From Overall":"-1,270,000,000","Standard Deviation":"563,600,000","Count":"201"},"highlighted":true,"isInteresting":true,"isSum":false,"y":5.618706340298507E7,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0]},{"name":"129 to 252","tooltip":{"Average":"71,410,000","Difference From Overall":"-1,255,000,000","Standard Deviation":"690,400,000","Count":"201"},"highlighted":true,"isInteresting":true,"isSum":false,"y":7.141044855721393E7,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0]},{"name":"253 to 380","tooltip":{"Average":"478.1","Difference From Overall":"-1,327,000,000","Standard Deviation":"275.8","Count":"200"},"highlighted":true,"isInteresting":true,"isSum":false,"y":478.085,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0]},{"name":"381 to 514","tooltip":{"Average":"505.9","Difference From Overall":"-1,327,000,000","Standard Deviation":"305","Count":"201"},"highlighted":true,"isInteresting":true,"isSum":false,"y":505.85074626865674,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0]},{"name":"515 to 642","tooltip":{"Average":"36,870,000","Difference From Overall":"-1,290,000,000","Standard Deviation":"521,300,000","Count":"200"},"highlighted":true,"isInteresting":true,"isSum":false,"y":3.686520064E7,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,0]},{"name":"643 to 780","tooltip":{"Average":"117,000,000","Difference From Overall":"-1,210,000,000","Standard Deviation":"964,800,000","Count":"201"},"highlighted":true,"isInteresting":true,"isSum":false,"y":1.1702586841791044E8,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0]},{"name":"781 to 930","tooltip":{"Average":"495.8","Difference From Overall":"-1,327,000,000","Standard Deviation":"297.5","Count":"200"},"highlighted":true,"isInteresting":true,"isSum":false,"y":495.81,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,7,0,0]},{"name":"931 to 10712","tooltip":{"Average":"2,374,000,000","Difference From Overall":"1,047,000,000","Standard Deviation":"3,250,000,000","Count":"200"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2.3737499648E9,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,0,0]},{"name":"10812 to 30886","tooltip":{"Average":"5,420,000,000","Difference From Overall":"4,093,000,000","Standard Deviation":"2,762,000,000","Count":"200"},"highlighted":true,"isInteresting":true,"isSum":false,"y":5.41964992512E9,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,0,0]},{"name":"31232 to 87200","tooltip":{"Average":"5,019,000,000","Difference From Overall":"3,693,000,000","Standard Deviation":"2,885,000,000","Count":"202"},"highlighted":true,"isInteresting":true,"isSum":false,"y":5.019455447445544E9,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10,0,0]}],"type":"column","name":""}],"xAxisLabel":"Employees","yAxisLabel":"Average Annual Revenue","xAxisCategories":["1 to 127","129 to 252","253 to 380","381 to 514","515 to 642","643 to 780","781 to 930","931 to 10712","10812 to 30886","31232 to 87200"],"yAxisMin":0.0,"yAxisMax":0.0,"xAxisPlotlines":[],"yAxisPlotlines":[{"color":"LightGrey","value":1.32662003E9,"width":1.0,"dashStyle":"Dash"}]},"id":"26189","analysis_id":"104","approved":"false","type":"BarCard","name":"Annual Revenue by Employees","location":["UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","ANY","UNSET","UNSET"],"score":84.54267553539498,"narrativeTitle":"10812 to 30886 has better than average Annual Revenue","forbiddenItems":{},"legendItemsOptions":{},"addedByDoc": false,"showSingleIntersections":false,"date":"","altGrouping":false,"userID":"null","userName":"null","narrative":"Employees explains 51.9% of the variation in Annual Revenue.<br><br>Here are some cases where Annual Revenue was better than average: <br>• #?#8#?#10812 to 30886 is 4,093,000,000 above average. This result may have been influenced by Created Date is 2016/Q2 which occurred 3.418 times more often.<br>• #?#9#?#31232 to 87200 is 3,693,000,000 above average. This result may have been influenced by Created Date is 2016/Q2 which occurred 3.464 times more often.<br><br>Here are some cases where Annual Revenue was worse than average: <br>• #?#3#?#381 to 514 is 1,327,000,000 below average. This result may have been influenced by Created Date is 2016/Q1.<br>• #?#2#?#253 to 380 is 1,327,000,000 below average. This result may have been influenced by Created Date is 2016/Q1 which occurred 1.261 times more often.<br>• #?#6#?#781 to 930 is 1,327,000,000 below average. This result may have been influenced by Created Date is 2016/Q1.<br>• #?#4#?#515 to 642 is 1,290,000,000 below average. This result may have been worsened by Created Date is 2016/Q1 which occurred 1.413 times more often. This sub-group's Annual Revenue was 100% lower than average.","comments":{},"options":{"chart_type":"column","drill_down_options":[],"forbidden":{"indices":{}},"group_by":15,"highlight_best":true,"highlight_sound":true,"narrative_sequence":[],"r_formula":"","show_totals":false}},"children":[]},{"showParent":false,"showSibling":false,"card":{"chart":{"series":[{"data":[{"name":"2013/Q1","tooltip":{"Average":"1,344,000,000","Difference From Overall":"17,070,000","Standard Deviation":"5,237,000,000","Count":"113"},"highlighted":false,"isInteresting":false,"isSum":false,"y":1.3436991071150444E9,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0]},{"name":"2013/Q2","tooltip":{"Average":"492.1","Difference From Overall":"-1,327,000,000","Standard Deviation":"288.5","Count":"69"},"highlighted":true,"isInteresting":true,"isSum":false,"y":492.05797101449275,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0]},{"name":"2013/Q3","tooltip":{"Average":"442.1","Difference From Overall":"-1,327,000,000","Standard Deviation":"271.4","Count":"88"},"highlighted":true,"isInteresting":true,"isSum":false,"y":442.09090909090907,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0]},{"name":"2013/Q4","tooltip":{"Average":"509.1","Difference From Overall":"-1,327,000,000","Standard Deviation":"278","Count":"104"},"highlighted":true,"isInteresting":true,"isSum":false,"y":509.1442307692308,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0]},{"name":"2014/Q1","tooltip":{"Average":"599.7","Difference From Overall":"-1,327,000,000","Standard Deviation":"1,065","Count":"84"},"highlighted":true,"isInteresting":true,"isSum":false,"y":599.6904761904761,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,5,0,0,0,0,0,0,0,0,0]},{"name":"2014/Q2","tooltip":{"Average":"450.8","Difference From Overall":"-1,327,000,000","Standard Deviation":"280.6","Count":"77"},"highlighted":true,"isInteresting":true,"isSum":false,"y":450.76623376623377,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,6,0,0,0,0,0,0,0,0,0]},{"name":"2014/Q3","tooltip":{"Average":"465.2","Difference From Overall":"-1,327,000,000","Standard Deviation":"292.9","Count":"93"},"highlighted":true,"isInteresting":true,"isSum":false,"y":465.19354838709677,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,7,0,0,0,0,0,0,0,0,0]},{"name":"2014/Q4","tooltip":{"Average":"544.2","Difference From Overall":"-1,327,000,000","Standard Deviation":"283.7","Count":"87"},"highlighted":true,"isInteresting":true,"isSum":false,"y":544.1609195402299,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,0,0]},{"name":"2015/Q1","tooltip":{"Average":"511.4","Difference From Overall":"-1,327,000,000","Standard Deviation":"273.6","Count":"67"},"highlighted":true,"isInteresting":true,"isSum":false,"y":511.4029850746269,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,9,0,0,0,0,0,0,0,0,0]},{"name":"2015/Q2","tooltip":{"Average":"508.8","Difference From Overall":"-1,327,000,000","Standard Deviation":"295.3","Count":"65"},"highlighted":true,"isInteresting":true,"isSum":false,"y":508.81538461538463,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,10,0,0,0,0,0,0,0,0,0]},{"name":"2015/Q3","tooltip":{"Average":"462.6","Difference From Overall":"-1,327,000,000","Standard Deviation":"302.8","Count":"83"},"highlighted":true,"isInteresting":true,"isSum":false,"y":462.6265060240964,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,11,0,0,0,0,0,0,0,0,0]},{"name":"2015/Q4","tooltip":{"Average":"475.4","Difference From Overall":"-1,327,000,000","Standard Deviation":"308.6","Count":"83"},"highlighted":true,"isInteresting":true,"isSum":false,"y":475.421686746988,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,12,0,0,0,0,0,0,0,0,0]},{"name":"2016/Q1","tooltip":{"Average":"489.6","Difference From Overall":"-1,327,000,000","Standard Deviation":"289.2","Count":"457"},"highlighted":true,"isInteresting":true,"isSum":false,"y":489.62800875273524,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,13,0,0,0,0,0,0,0,0,0]},{"name":"2016/Q2","tooltip":{"Average":"4,590,000,000","Difference From Overall":"3,264,000,000","Standard Deviation":"3,134,000,000","Count":"551"},"highlighted":true,"isInteresting":true,"isSum":false,"y":4.590326510809438E9,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,14,0,0,0,0,0,0,0,0,0]}],"type":"column","name":""}],"xAxisLabel":"Created Date","yAxisLabel":"Average Annual Revenue","xAxisCategories":["2013/Q1","2013/Q2","2013/Q3","2013/Q4","2014/Q1","2014/Q2","2014/Q3","2014/Q4","2015/Q1","2015/Q2","2015/Q3","2015/Q4","2016/Q1","2016/Q2"],"yAxisMin":0.0,"yAxisMax":0.0,"xAxisPlotlines":[],"yAxisPlotlines":[{"color":"LightGrey","value":1.32662003E9,"width":1.0,"dashStyle":"Dash"}]},"id":"26190","analysis_id":"104","approved":"false","type":"BarCard","name":"Annual Revenue by Created Date","location":["UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","ANY","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET"],"score":79.90294564896338,"narrativeTitle":"2016/Q2 has better than average Annual Revenue","forbiddenItems":{},"legendItemsOptions":{},"addedByDoc": false,"showSingleIntersections":false,"date":"","altGrouping":false,"userID":"null","userName":"null","narrative":"Created Date explains 49% of the variation in Annual Revenue.<br><br>Here are some cases where Annual Revenue was better than average: <br>• #?#13#?#2016/Q2 is 3,264,000,000 above average. This result may have been influenced by Industry is Manufacturing.<br><br>Here are some cases where Annual Revenue was worse than average: <br>• #?#12#?#2016/Q1 is 1,327,000,000 below average. This result may have been influenced by Account Source is Web.<br>• #?#3#?#2013/Q4 is 1,327,000,000 below average.<br>• #?#6#?#2014/Q3 is 1,327,000,000 below average.<br>• #?#2#?#2013/Q3 is 1,327,000,000 below average.<br>• #?#7#?#2014/Q4 is 1,327,000,000 below average.","comments":{},"options":{"chart_type":"column","drill_down_options":[],"forbidden":{"indices":{}},"group_by":8,"highlight_best":true,"highlight_sound":true,"narrative_sequence":[],"r_formula":"","show_totals":false}},"children":[]}]},"storyCreationMonitor":{"monitorId":104,"storyId":199,"projectId":108,"storyName":"Account","laptop":false,"insights":"3","relevance":"HIGH","isReady":true,"analyses":[{"analysis_id":104,"outcome":"Annual Revenue","status":{"currentlyRunning":"REGRESSION_FINISHED","currentTextStatus":"Ready","currentPercentage":1.0,"clusterStatus":"COMPLETE","waterfallStatus":"COMPLETE","prescriptionStatus":"null","dodStatus":"null","forecastStatus":"null"},"unit":"","progress":1.0,"combinationCount":1858,"combinationCountGuess":183}]},"datasetName":"Account","statistics":{"cardStats":[],"storyViews":[]},"readOnly":false,"duration":"1M","laptop":false,"historicSummary":{},"graphNames":["Account Source","Account Type","Billing City","Billing Country","Billing State/Province","Billing Zip/Postal Code","Customer Portal Account","Industry","Created Date","Is Locked","May Edit","Partner Account","Shipping City","Last Modified Date","Shipping Country","Employees","Shipping State/Province","Shipping Zip/Postal Code"],"graphSeriesNames":[["Unconstrained","Employee Referral","Word of mouth","Partner","Web","Trade Show","Advertisement","Public Relations","Seminar - Internal"],["Unconstrained","Customer","Partner"],["Unconstrained","null"],["Unconstrained","USA","Canada","Japan","Australia","Russian","Italy","China","Switzerland","Thailand","Singapore","Korea","India","Denmark","Spain","Germany","Normway","Hong Kong","Turkey","Brazil","France","Mexico","Sweden","Belgium","Taiwan","United Kingdom"],["Unconstrained","null","CA","Other"],["Unconstrained","null"],["Unconstrained","false"],["Unconstrained","Retail","Technology","Banking","Energy","Manufacturing","Media","Insurance","Engineering","Biotechnology","Electronics","Apparel","Education","Telecommunications","Transportation","Utilities","Consulting","Finance","Agriculture","Healthcare","Communications"],["Unconstrained","2013/Q1","2013/Q2","2013/Q3","2013/Q4","2014/Q1","2014/Q2","2014/Q3","2014/Q4","2015/Q1","2015/Q2","2015/Q3","2015/Q4","2016/Q1","2016/Q2"],["Unconstrained","false"],["Unconstrained","true"],["Unconstrained","false"],["Unconstrained","null"],["Unconstrained","2016/6","2016/7"],["Unconstrained","USA","Canada","Japan","Australia","Russian","Italy","Thailand","Switzerland","China","Korea","Singapore","Denmark","India","Germany","Normway","Spain","Hong Kong","Turkey","Mexico","Sweden","Brazil","France","Belgium","Taiwan","United Kingdom"],["Unconstrained","1 to 127","129 to 252","253 to 380","381 to 514","515 to 642","643 to 780","781 to 930","931 to 10712","10812 to 30886","31232 to 87200"],["Unconstrained","null","Other"],["Unconstrained","Unspecified"]],"outcome":"Annual Revenue","goodbad":"GOOD"}
};

var old_stories = {
	"205": {"storyId":205,"storyTree":{"showParent":false,"showSibling":false,"card":{"chart":{"series":[],"yAxisMin":0.0,"yAxisMax":0.0,"xAxisPlotlines":[],"yAxisPlotlines":[]},"id":"27330","analysis_id":"-1","approved":"false","type":"TitleCard","name":"Opportunity","location":null,"score":null,"narrativeTitle":"null","forbiddenItems":{},"legendItemsOptions":{},"addedByDoc": false,"showSingleIntersections":false,"date":"","altGrouping":false,"userID":"null","userName":"null","narrative":"Einstein Discovery evaluated 5,972 Transactions and 18 columns of data across 3,004 variable combinations to determine which factors most impact Amount. (Note: Overall Average: 2,947,000 indicated by dashed grey line. Translucent bars are not statistically important.)","comments":{},"options":{"chart_type":"column","forbidden":{"indices":{}},"narrative_sequence":[],"r_formula":""}},"children":[{"showParent":false,"showSibling":false,"card":{"chart":{"series":[{"data":[{"name":"2016 4","tooltip":{"Average":"5,328,000","Difference From Overall":"2,381,000","Standard Deviation":"3,223,000","Count":"1721"},"highlighted":true,"isInteresting":true,"isSum":false,"y":5327582.82858803,"nullYValue":false,"point":[0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2016 3","tooltip":{"Average":"1,630,000","Difference From Overall":"-1,317,000","Standard Deviation":"1,728,000","Count":"768"},"highlighted":true,"isInteresting":true,"isSum":false,"y":1629948.0,"nullYValue":false,"point":[0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2017 2","tooltip":{"Average":"2,148,000","Difference From Overall":"-798,900","Standard Deviation":"2,007,000","Count":"115"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2147791.304347826,"nullYValue":false,"point":[0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2015 3","tooltip":{"Average":"2,026,000","Difference From Overall":"-921,100","Standard Deviation":"1,323,000","Count":"255"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2025509.7725490197,"nullYValue":false,"point":[0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2014 1","tooltip":{"Average":"2,045,000","Difference From Overall":"-901,900","Standard Deviation":"1,663,000","Count":"252"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2044777.7777777778,"nullYValue":false,"point":[0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2014 3","tooltip":{"Average":"2,061,000","Difference From Overall":"-885,300","Standard Deviation":"1,696,000","Count":"241"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2061327.8008298755,"nullYValue":false,"point":[0,0,0,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2015 2","tooltip":{"Average":"2,041,000","Difference From Overall":"-905,300","Standard Deviation":"1,447,000","Count":"241"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2041385.958506224,"nullYValue":false,"point":[0,0,0,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2013 3","tooltip":{"Average":"2,007,000","Difference From Overall":"-940,000","Standard Deviation":"1,636,000","Count":"240"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2006687.4666666666,"nullYValue":false,"point":[0,0,0,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2013 4","tooltip":{"Average":"2,120,000","Difference From Overall":"-826,300","Standard Deviation":"1,679,000","Count":"239"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2120301.2552301255,"nullYValue":false,"point":[0,0,0,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2014 2","tooltip":{"Average":"2,252,000","Difference From Overall":"-694,700","Standard Deviation":"1,801,000","Count":"236"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2251936.406779661,"nullYValue":false,"point":[0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2014 4","tooltip":{"Average":"2,214,000","Difference From Overall":"-732,500","Standard Deviation":"1,652,000","Count":"228"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2214171.0877192984,"nullYValue":false,"point":[0,0,0,11,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2016 1","tooltip":{"Average":"1,893,000","Difference From Overall":"-1,054,000","Standard Deviation":"1,884,000","Count":"226"},"highlighted":true,"isInteresting":true,"isSum":false,"y":1893008.8495575222,"nullYValue":false,"point":[0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2015 4","tooltip":{"Average":"1,921,000","Difference From Overall":"-1,025,000","Standard Deviation":"1,379,000","Count":"214"},"highlighted":true,"isInteresting":true,"isSum":false,"y":1921196.261682243,"nullYValue":false,"point":[0,0,0,13,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2015 1","tooltip":{"Average":"2,104,000","Difference From Overall":"-842,900","Standard Deviation":"1,410,000","Count":"213"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2103774.647887324,"nullYValue":false,"point":[0,0,0,14,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2013 2","tooltip":{"Average":"2,165,000","Difference From Overall":"-781,900","Standard Deviation":"1,571,000","Count":"182"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2164730.7252747254,"nullYValue":false,"point":[0,0,0,15,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2017 1","tooltip":{"Average":"2,451,000","Difference From Overall":"-495,300","Standard Deviation":"2,526,000","Count":"176"},"highlighted":false,"isInteresting":false,"isSum":false,"y":2451323.8181818184,"nullYValue":false,"point":[0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2016 2","tooltip":{"Average":"2,000,000","Difference From Overall":"-946,800","Standard Deviation":"1,692,000","Count":"158"},"highlighted":true,"isInteresting":true,"isSum":false,"y":1999848.1012658228,"nullYValue":false,"point":[0,0,0,17,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2013 1","tooltip":{"Average":"2,106,000","Difference From Overall":"-840,900","Standard Deviation":"1,314,000","Count":"74"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2105783.7837837837,"nullYValue":false,"point":[0,0,0,18,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2017 3","tooltip":{"Average":"1,895,000","Difference From Overall":"-1,052,000","Standard Deviation":"1,939,000","Count":"68"},"highlighted":true,"isInteresting":true,"isSum":false,"y":1894661.7647058824,"nullYValue":false,"point":[0,0,0,19,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"Other","tooltip":{"Average":"1,372,000","Difference From Overall":"-1,575,000","Standard Deviation":"1,221,000","Count":"125"},"highlighted":true,"isInteresting":true,"isSum":false,"y":1372007.936,"nullYValue":false,"point":[0,0,0,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}],"type":"column","name":""}],"xAxisLabel":"Fiscal Period","yAxisLabel":"Average Amount","xAxisCategories":["2016 4","2016 3","2017 2","2015 3","2014 1","2014 3","2015 2","2013 3","2013 4","2014 2","2014 4","2016 1","2015 4","2015 1","2013 2","2017 1","2016 2","2013 1","2017 3","Other"],"yAxisMin":0.0,"yAxisMax":0.0,"xAxisPlotlines":[],"yAxisPlotlines":[{"color":"LightGrey","value":2946650.0,"width":1.0,"dashStyle":"Dash"}]},"id":"27331","analysis_id":"107","approved":"false","type":"BarCard","name":"Amount by Fiscal Period","location":["UNSET","UNSET","UNSET","ANY","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET"],"score":99.99990698697812,"narrativeTitle":"2016 4 has better than average Amount","forbiddenItems":{},"legendItemsOptions":{},"addedByDoc": false,"showSingleIntersections":false,"date":"","altGrouping":false,"userID":"null","userName":"null","narrative":"Fiscal Period explains 31.6% of the variation in Amount.<br><br>Here are some cases where Amount was better than average: <br>• #?#0#?#2016 4 is 2,381,000 above average.<br><br>Here are some cases where Amount was worse than average: <br>• #?#1#?#2016 3 is 1,317,000 below average.<br>• #?#11#?#2016 1 is 1,054,000 below average.<br>• #?#3#?#2015 3 is 921,100 below average.<br>• #?#4#?#2014 1 is 901,900 below average.<br>• #?#7#?#2013 3 is 940,000 below average.","comments":{},"options":{"chart_type":"column","drill_down_options":[],"forbidden":{"indices":{}},"group_by":3,"highlight_best":true,"highlight_sound":true,"narrative_sequence":[],"r_formula":"","show_totals":false}},"children":[]},{"showParent":false,"showSibling":false,"card":{"chart":{"series":[{"data":[{"name":"4","tooltip":{"Average":"4,343,000","Difference From Overall":"1,396,000","Standard Deviation":"3,205,000","Count":"2458"},"highlighted":true,"isInteresting":true,"isSum":false,"y":4342514.043938161,"nullYValue":false,"point":[0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"3","tooltip":{"Average":"1,825,000","Difference From Overall":"-1,121,000","Standard Deviation":"1,664,000","Count":"1598"},"highlighted":true,"isInteresting":true,"isSum":false,"y":1825337.9924906134,"nullYValue":false,"point":[0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2","tooltip":{"Average":"2,106,000","Difference From Overall":"-840,900","Standard Deviation":"1,677,000","Count":"947"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2105702.1837381204,"nullYValue":false,"point":[0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"1","tooltip":{"Average":"2,077,000","Difference From Overall":"-869,700","Standard Deviation":"1,834,000","Count":"969"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2076914.3942208462,"nullYValue":false,"point":[0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0]}],"type":"column","name":""}],"xAxisLabel":"Fiscal Quarter","yAxisLabel":"Average Amount","xAxisCategories":["4","3","2","1"],"yAxisMin":0.0,"yAxisMax":0.0,"xAxisPlotlines":[],"yAxisPlotlines":[{"color":"LightGrey","value":2946650.0,"width":1.0,"dashStyle":"Dash"}]},"id":"27332","analysis_id":"107","approved":"false","type":"BarCard","name":"Amount by Fiscal Quarter","location":["UNSET","UNSET","UNSET","UNSET","ANY","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET"],"score":59.10265466911349,"narrativeTitle":"4 has better than average Amount","forbiddenItems":{},"legendItemsOptions":{},"addedByDoc": false,"showSingleIntersections":false,"date":"","altGrouping":false,"userID":"null","userName":"null","narrative":"Fiscal Quarter explains 18.7% of the variation in Amount.<br><br>Here are some cases where Amount was better than average: <br>• #?#0#?#4 is 1,396,000 above average. This result may have been worsened by Close Date is 2017. This sub-group's Amount was 66% lower than average.<br><br>Here are some cases where Amount was worse than average: <br>• #?#1#?#3 is 1,121,000 below average. This result may have been influenced by Close Date is 2018.<br>• #?#3#?#1 is 869,700 below average. This result may have been worsened by Close Date is 2018 which occurred 2.154 times more often. This sub-group's Amount was 42.1% lower than average.<br>• #?#2#?#2 is 840,900 below average. This result may have been influenced by Close Date is 2017 which occurred 1.769 times more often.","comments":{},"options":{"chart_type":"column","drill_down_options":[],"forbidden":{"indices":{}},"group_by":4,"highlight_best":true,"highlight_sound":true,"narrative_sequence":[],"r_formula":"","show_totals":false}},"children":[]},{"showParent":false,"showSibling":false,"card":{"chart":{"series":[{"data":[{"name":"true","tooltip":{"Average":"3,589,000","Difference From Overall":"642,100","Standard Deviation":"2,957,000","Count":"4062"},"highlighted":true,"isInteresting":true,"isSum":false,"y":3588798.5819793204,"nullYValue":false,"point":[0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0]},{"name":"false","tooltip":{"Average":"1,581,000","Difference From Overall":"-1,366,000","Standard Deviation":"1,260,000","Count":"1910"},"highlighted":true,"isInteresting":true,"isSum":false,"y":1580999.97486911,"nullYValue":false,"point":[0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0]}],"type":"column","name":""}],"xAxisLabel":"Has Line Item","yAxisLabel":"Average Amount","xAxisCategories":["true","false"],"yAxisMin":0.0,"yAxisMax":0.0,"xAxisPlotlines":[],"yAxisPlotlines":[{"color":"LightGrey","value":2946650.0,"width":1.0,"dashStyle":"Dash"}]},"id":"27333","analysis_id":"107","approved":"false","type":"BarCard","name":"Amount by Has Line Item","location":["UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","ANY","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET"],"score":37.77811506962816,"narrativeTitle":"false has worse than average Amount","forbiddenItems":{},"legendItemsOptions":{},"addedByDoc": false,"showSingleIntersections":false,"date":"","altGrouping":false,"userID":"null","userName":"null","narrative":"Has Line Item explains 11.9% of the variation in Amount.<br><br>Here are some cases where Amount was better than average: <br>• #?#0#?#true is 642,100 above average. This result may have been worsened by Close Date is 2017. This sub-group's Amount was 27.5% lower than average.<br><br>Here are some cases where Amount was worse than average: <br>• #?#1#?#false is 1,366,000 below average. This result may have been worsened by Close Date is 2018 which occurred 3.04 times more often. This sub-group's Amount was 19.1% lower than average.","comments":{},"options":{"chart_type":"column","drill_down_options":[],"forbidden":{"indices":{}},"group_by":7,"highlight_best":true,"highlight_sound":true,"narrative_sequence":[],"r_formula":"","show_totals":false}},"children":[]},{"showParent":false,"showSibling":false,"card":{"chart":{"series":[{"data":[{"name":"2013","tooltip":{"Average":"2,092,000","Difference From Overall":"-854,400","Standard Deviation":"1,602,000","Count":"736"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2092241.9130434783,"nullYValue":false,"point":[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2014","tooltip":{"Average":"2,140,000","Difference From Overall":"-806,300","Standard Deviation":"1,704,000","Count":"957"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2140386.574712644,"nullYValue":false,"point":[2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2015","tooltip":{"Average":"2,024,000","Difference From Overall":"-923,100","Standard Deviation":"1,389,000","Count":"923"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2023531.8916576381,"nullYValue":false,"point":[3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2016","tooltip":{"Average":"3,886,000","Difference From Overall":"939,300","Standard Deviation":"3,251,000","Count":"2873"},"highlighted":true,"isInteresting":true,"isSum":false,"y":3885972.717020536,"nullYValue":false,"point":[4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2017","tooltip":{"Average":"2,163,000","Difference From Overall":"-783,800","Standard Deviation":"2,189,000","Count":"405"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2162891.3777777776,"nullYValue":false,"point":[5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2018","tooltip":{"Average":"1,296,000","Difference From Overall":"-1,651,000","Standard Deviation":"1,222,000","Count":"78"},"highlighted":true,"isInteresting":true,"isSum":false,"y":1295769.2307692308,"nullYValue":false,"point":[6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}],"type":"column","name":""}],"xAxisLabel":"Close Date","yAxisLabel":"Average Amount","xAxisCategories":["2013","2014","2015","2016","2017","2018"],"yAxisMin":0.0,"yAxisMax":0.0,"xAxisPlotlines":[],"yAxisPlotlines":[{"color":"LightGrey","value":2946650.0,"width":1.0,"dashStyle":"Dash"}]},"id":"27334","analysis_id":"107","approved":"false","type":"BarCard","name":"Amount by Close Date","location":["ANY","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET"],"score":35.45931605895113,"narrativeTitle":"2016 has better than average Amount","forbiddenItems":{},"legendItemsOptions":{},"addedByDoc": false,"showSingleIntersections":false,"date":"","altGrouping":false,"userID":"null","userName":"null","narrative":"Close Date explains 11.2% of the variation in Amount.<br><br>Here are some cases where Amount was better than average: <br>• #?#3#?#2016 is 939,300 above average.<br><br>Here are some cases where Amount was worse than average: <br>• #?#2#?#2015 is 923,100 below average.<br>• #?#1#?#2014 is 806,300 below average.<br>• #?#0#?#2013 is 854,400 below average.<br>• #?#4#?#2017 is 783,800 below average. This result may have been worsened by Created Date is 2017/Q1 which occurred 6.75 times more often. This sub-group's Amount was 96% lower than average.<br>• #?#5#?#2018 is 1,651,000 below average. This result may have been influenced by Lead Source is null which occurred 25.33 times more often.","comments":{},"options":{"chart_type":"column","drill_down_options":[],"forbidden":{"indices":{}},"group_by":0,"highlight_best":true,"highlight_sound":true,"narrative_sequence":[],"r_formula":"","show_totals":false}},"children":[]},{"showParent":false,"showSibling":false,"card":{"chart":{"series":[{"data":[{"name":"2016","tooltip":{"Average":"3,886,000","Difference From Overall":"939,300","Standard Deviation":"3,251,000","Count":"2873"},"highlighted":true,"isInteresting":true,"isSum":false,"y":3885972.717020536,"nullYValue":false,"point":[0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2014","tooltip":{"Average":"2,140,000","Difference From Overall":"-806,300","Standard Deviation":"1,704,000","Count":"957"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2140386.574712644,"nullYValue":false,"point":[0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2015","tooltip":{"Average":"2,024,000","Difference From Overall":"-923,100","Standard Deviation":"1,389,000","Count":"923"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2023531.8916576381,"nullYValue":false,"point":[0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2017","tooltip":{"Average":"2,163,000","Difference From Overall":"-783,800","Standard Deviation":"2,189,000","Count":"405"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2162891.3777777776,"nullYValue":false,"point":[0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2013","tooltip":{"Average":"2,093,000","Difference From Overall":"-853,900","Standard Deviation":"1,603,000","Count":"735"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2092748.2775510205,"nullYValue":false,"point":[0,0,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2018","tooltip":{"Average":"1,296,000","Difference From Overall":"-1,651,000","Standard Deviation":"1,222,000","Count":"78"},"highlighted":true,"isInteresting":true,"isSum":false,"y":1295769.2307692308,"nullYValue":false,"point":[0,0,0,0,0,6,0,0,0,0,0,0,0,0,0,0,0,0]}],"type":"column","name":""}],"xAxisLabel":"Fiscal Year","yAxisLabel":"Average Amount","xAxisCategories":["2016","2014","2015","2017","2013","2018"],"yAxisMin":0.0,"yAxisMax":0.0,"xAxisPlotlines":[],"yAxisPlotlines":[{"color":"LightGrey","value":2946650.0,"width":1.0,"dashStyle":"Dash"}]},"id":"27335","analysis_id":"107","approved":"false","type":"BarCard","name":"Amount by Fiscal Year","location":["UNSET","UNSET","UNSET","UNSET","UNSET","ANY","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET"],"score":35.438762133450794,"narrativeTitle":"2016 has better than average Amount","forbiddenItems":{},"legendItemsOptions":{},"addedByDoc": false,"showSingleIntersections":false,"date":"","altGrouping":false,"userID":"null","userName":"null","narrative":"Fiscal Year explains 11.2% of the variation in Amount.<br><br>Here are some cases where Amount was better than average: <br>• #?#0#?#2016 is 939,300 above average.<br><br>Here are some cases where Amount was worse than average: <br>• #?#2#?#2015 is 923,100 below average.<br>• #?#1#?#2014 is 806,300 below average.<br>• #?#4#?#2013 is 853,900 below average.<br>• #?#3#?#2017 is 783,800 below average.<br>• #?#5#?#2018 is 1,651,000 below average.","comments":{},"options":{"chart_type":"column","drill_down_options":[],"forbidden":{"indices":{}},"group_by":5,"highlight_best":true,"highlight_sound":true,"narrative_sequence":[],"r_formula":"","show_totals":false}},"children":[]},{"showParent":false,"showSibling":false,"card":{"chart":{"series":[{"data":[{"name":"2016/Q1","tooltip":{"Average":"2,078,000","Difference From Overall":"-869,000","Standard Deviation":"1,791,000","Count":"1619"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2077603.498455837,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0]},{"name":"2016/Q2","tooltip":{"Average":"1,066,000","Difference From Overall":"-1,880,000","Standard Deviation":"1,092,000","Count":"117"},"highlighted":true,"isInteresting":true,"isSum":false,"y":1066341.8803418803,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0]},{"name":"2016/Q3","tooltip":{"Average":"3,795,000","Difference From Overall":"848,600","Standard Deviation":"2,338,000","Count":"320"},"highlighted":true,"isInteresting":true,"isSum":false,"y":3795281.2,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0]},{"name":"2016/Q4","tooltip":{"Average":"2,842,000","Difference From Overall":"-104,200","Standard Deviation":"2,379,000","Count":"1545"},"highlighted":false,"isInteresting":false,"isSum":false,"y":2842491.7747572814,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0]},{"name":"2017/Q1","tooltip":{"Average":"4,058,000","Difference From Overall":"1,111,000","Standard Deviation":"3,600,000","Count":"1028"},"highlighted":true,"isInteresting":true,"isSum":false,"y":4057704.3424124513,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,0,0,0]},{"name":"2017/Q2","tooltip":{"Average":"3,262,000","Difference From Overall":"315,200","Standard Deviation":"2,930,000","Count":"1302"},"highlighted":false,"isInteresting":false,"isSum":false,"y":3261889.474654378,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,0,0,0]},{"name":"2017/Q3","tooltip":{"Average":"2,062,000","Difference From Overall":"-884,800","Standard Deviation":"2,103,000","Count":"41"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2061836.487804878,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,7,0,0,0,0,0,0]}],"type":"column","name":""}],"xAxisLabel":"Last Modified Date","yAxisLabel":"Average Amount","xAxisCategories":["2016/Q1","2016/Q2","2016/Q3","2016/Q4","2017/Q1","2017/Q2","2017/Q3"],"yAxisMin":0.0,"yAxisMax":0.0,"xAxisPlotlines":[],"yAxisPlotlines":[{"color":"LightGrey","value":2946650.0,"width":1.0,"dashStyle":"Dash"}]},"id":"27336","analysis_id":"107","approved":"false","type":"BarCard","name":"Amount by Last Modified Date","location":["UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","ANY","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET"],"score":23.641852403241565,"narrativeTitle":"2017/Q1 has better than average Amount","forbiddenItems":{},"legendItemsOptions":{},"addedByDoc": false,"showSingleIntersections":false,"date":"","altGrouping":false,"userID":"null","userName":"null","narrative":"Last Modified Date explains 7.5% of the variation in Amount.<br><br>Here are some cases where Amount was better than average: <br>• #?#4#?#2017/Q1 is 1,111,000 above average. This result may have been worsened by Close Date is 2017 which occurred 1.714 times more often. This sub-group's Amount was 51% lower than average.<br>• #?#2#?#2016/Q3 is 848,600 above average.<br><br>Here are some cases where Amount was worse than average: <br>• #?#0#?#2016/Q1 is 869,000 below average.<br>• #?#1#?#2016/Q2 is 1,880,000 below average.<br>• #?#6#?#2017/Q3 is 884,800 below average. This result may have been influenced by Close Date is 2017 which occurred 13.33 times more often.","comments":{},"options":{"chart_type":"column","drill_down_options":[],"forbidden":{"indices":{}},"group_by":11,"highlight_best":true,"highlight_sound":true,"narrative_sequence":[],"r_formula":"","show_totals":false}},"children":[]},{"showParent":false,"showSibling":false,"card":{"chart":{"series":[{"data":[{"name":"2013/Q1","tooltip":{"Average":"3,618,000","Difference From Overall":"671,600","Standard Deviation":"3,049,000","Count":"332"},"highlighted":false,"isInteresting":false,"isSum":false,"y":3618253.108433735,"nullYValue":false,"point":[0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2013/Q2","tooltip":{"Average":"3,278,000","Difference From Overall":"331,800","Standard Deviation":"2,769,000","Count":"370"},"highlighted":false,"isInteresting":false,"isSum":false,"y":3278405.535135135,"nullYValue":false,"point":[0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2013/Q3","tooltip":{"Average":"3,438,000","Difference From Overall":"491,100","Standard Deviation":"2,926,000","Count":"387"},"highlighted":false,"isInteresting":false,"isSum":false,"y":3437777.695090439,"nullYValue":false,"point":[0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2013/Q4","tooltip":{"Average":"3,084,000","Difference From Overall":"137,300","Standard Deviation":"2,619,000","Count":"390"},"highlighted":false,"isInteresting":false,"isSum":false,"y":3083948.6358974357,"nullYValue":false,"point":[0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2014/Q1","tooltip":{"Average":"3,465,000","Difference From Overall":"518,500","Standard Deviation":"2,843,000","Count":"355"},"highlighted":false,"isInteresting":false,"isSum":false,"y":3465155.064788732,"nullYValue":false,"point":[0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2014/Q2","tooltip":{"Average":"3,522,000","Difference From Overall":"575,000","Standard Deviation":"2,943,000","Count":"342"},"highlighted":false,"isInteresting":false,"isSum":false,"y":3521666.619883041,"nullYValue":false,"point":[0,0,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2014/Q3","tooltip":{"Average":"3,385,000","Difference From Overall":"438,800","Standard Deviation":"2,753,000","Count":"331"},"highlighted":false,"isInteresting":false,"isSum":false,"y":3385468.1329305135,"nullYValue":false,"point":[0,0,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2014/Q4","tooltip":{"Average":"3,303,000","Difference From Overall":"356,500","Standard Deviation":"2,632,000","Count":"341"},"highlighted":false,"isInteresting":false,"isSum":false,"y":3303108.6920821113,"nullYValue":false,"point":[0,0,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2015/Q1","tooltip":{"Average":"3,180,000","Difference From Overall":"233,800","Standard Deviation":"2,617,000","Count":"359"},"highlighted":false,"isInteresting":false,"isSum":false,"y":3180473.4038997213,"nullYValue":false,"point":[0,0,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2015/Q2","tooltip":{"Average":"2,980,000","Difference From Overall":"32,920","Standard Deviation":"2,382,000","Count":"327"},"highlighted":false,"isInteresting":false,"isSum":false,"y":2979565.7981651374,"nullYValue":false,"point":[0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2015/Q3","tooltip":{"Average":"3,031,000","Difference From Overall":"84,090","Standard Deviation":"2,499,000","Count":"341"},"highlighted":false,"isInteresting":false,"isSum":false,"y":3030733.137829912,"nullYValue":false,"point":[0,0,11,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2015/Q4","tooltip":{"Average":"3,108,000","Difference From Overall":"161,200","Standard Deviation":"2,556,000","Count":"336"},"highlighted":false,"isInteresting":false,"isSum":false,"y":3107886.8571428573,"nullYValue":false,"point":[0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2016/Q1","tooltip":{"Average":"2,131,000","Difference From Overall":"-815,300","Standard Deviation":"2,426,000","Count":"679"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2131310.845360825,"nullYValue":false,"point":[0,0,13,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2016/Q2","tooltip":{"Average":"1,978,000","Difference From Overall":"-968,900","Standard Deviation":"2,410,000","Count":"748"},"highlighted":true,"isInteresting":true,"isSum":false,"y":1977780.705882353,"nullYValue":false,"point":[0,0,14,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2016/Q3","tooltip":{"Average":"3,545,000","Difference From Overall":"598,500","Standard Deviation":"3,022,000","Count":"193"},"highlighted":false,"isInteresting":false,"isSum":false,"y":3545119.170984456,"nullYValue":false,"point":[0,0,15,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2017/Q1","tooltip":{"Average":"164,300","Difference From Overall":"-2,782,000","Standard Deviation":"357,600","Count":"56"},"highlighted":true,"isInteresting":true,"isSum":false,"y":164299.10714285713,"nullYValue":false,"point":[0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},{"name":"2017/Q2","tooltip":{"Average":"1,820,000","Difference From Overall":"-1,127,000","Standard Deviation":"1,222,000","Count":"85"},"highlighted":true,"isInteresting":true,"isSum":false,"y":1819588.1411764706,"nullYValue":false,"point":[0,0,17,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}],"type":"column","name":""}],"xAxisLabel":"Created Date","yAxisLabel":"Average Amount","xAxisCategories":["2013/Q1","2013/Q2","2013/Q3","2013/Q4","2014/Q1","2014/Q2","2014/Q3","2014/Q4","2015/Q1","2015/Q2","2015/Q3","2015/Q4","2016/Q1","2016/Q2","2016/Q3","2017/Q1","2017/Q2"],"yAxisMin":0.0,"yAxisMax":0.0,"xAxisPlotlines":[],"yAxisPlotlines":[{"color":"LightGrey","value":2946650.0,"width":1.0,"dashStyle":"Dash"}]},"id":"27337","analysis_id":"107","approved":"false","type":"BarCard","name":"Amount by Created Date","location":["UNSET","UNSET","ANY","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET"],"score":16.54568867780819,"narrativeTitle":"2016/Q2 and 3 others have worse than average Amount","forbiddenItems":{},"legendItemsOptions":{},"addedByDoc": false,"showSingleIntersections":false,"date":"","altGrouping":false,"userID":"null","userName":"null","narrative":"Created Date explains 5.2% of the variation in Amount.<br><br>Here are some cases where Amount was worse than average: <br>• #?#13#?#2016/Q2 is 968,900 below average. This result may have been influenced by Close Date is 2017 which occurred 2.392 times more often.<br>• #?#12#?#2016/Q1 is 815,300 below average.<br>• #?#15#?#2017/Q1 is 2,782,000 below average. This result may have been worsened by Close Date is 2017 which occurred 6.75 times more often. This sub-group's Amount was 59.4% lower than average.<br>• #?#16#?#2017/Q2 is 1,127,000 below average. This result may have been influenced by Close Date is 2017 which occurred 4.667 times more often.","comments":{},"options":{"chart_type":"column","drill_down_options":[],"forbidden":{"indices":{}},"group_by":2,"highlight_best":true,"highlight_sound":true,"narrative_sequence":[],"r_formula":"","show_totals":false}},"children":[]},{"showParent":false,"showSibling":false,"card":{"chart":{"series":[{"data":[{"name":"Closed Won","tooltip":{"Average":"2,673,000","Difference From Overall":"-273,800","Standard Deviation":"2,519,000","Count":"3035"},"highlighted":false,"isInteresting":false,"isSum":false,"y":2672896.253047776,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0]},{"name":"Closed Lost","tooltip":{"Average":"2,727,000","Difference From Overall":"-219,800","Standard Deviation":"2,317,000","Count":"755"},"highlighted":false,"isInteresting":false,"isSum":false,"y":2726794.680794702,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0]},{"name":"Needs Analysis","tooltip":{"Average":"3,423,000","Difference From Overall":"476,700","Standard Deviation":"3,055,000","Count":"539"},"highlighted":true,"isInteresting":true,"isSum":false,"y":3423302.293135436,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0]},{"name":"Prospecting","tooltip":{"Average":"1,203,000","Difference From Overall":"-1,744,000","Standard Deviation":"1,688,000","Count":"53"},"highlighted":true,"isInteresting":true,"isSum":false,"y":1202950.9433962265,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0]},{"name":"Value Proposition","tooltip":{"Average":"3,733,000","Difference From Overall":"786,400","Standard Deviation":"3,104,000","Count":"453"},"highlighted":true,"isInteresting":true,"isSum":false,"y":3733068.2913907287,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0]},{"name":"Id. Decision Makers","tooltip":{"Average":"3,901,000","Difference From Overall":"954,200","Standard Deviation":"3,130,000","Count":"290"},"highlighted":true,"isInteresting":true,"isSum":false,"y":3900862.2344827587,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0]},{"name":"Perception Analysis","tooltip":{"Average":"3,950,000","Difference From Overall":"1,004,000","Standard Deviation":"3,116,000","Count":"229"},"highlighted":true,"isInteresting":true,"isSum":false,"y":3950419.2838427946,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,7,0]},{"name":"Proposal/Price Quote","tooltip":{"Average":"3,317,000","Difference From Overall":"370,200","Standard Deviation":"2,915,000","Count":"195"},"highlighted":false,"isInteresting":false,"isSum":false,"y":3316815.4256410254,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,0]},{"name":"Qualification","tooltip":{"Average":"2,212,000","Difference From Overall":"-734,400","Standard Deviation":"2,458,000","Count":"177"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2212288.1807909603,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,0]},{"name":"Negotiation/Review","tooltip":{"Average":"2,089,000","Difference From Overall":"-857,600","Standard Deviation":"2,407,000","Count":"148"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2089013.6216216215,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10,0]},{"name":"Other","tooltip":{"Average":"4,520,000","Difference From Overall":"1,574,000","Standard Deviation":"2,392,000","Count":"98"},"highlighted":true,"isInteresting":true,"isSum":false,"y":4520173.3877551025,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,11,0]}],"type":"column","name":""}],"xAxisLabel":"Stage","yAxisLabel":"Average Amount","xAxisCategories":["Closed Won","Closed Lost","Needs Analysis","Prospecting","Value Proposition","Id. Decision Makers","Perception Analysis","Proposal/Price Quote","Qualification","Negotiation/Review","Other"],"yAxisMin":0.0,"yAxisMax":0.0,"xAxisPlotlines":[],"yAxisPlotlines":[{"color":"LightGrey","value":2946650.0,"width":1.0,"dashStyle":"Dash"}]},"id":"27338","analysis_id":"107","approved":"false","type":"BarCard","name":"Amount by Stage","location":["UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","ANY","UNSET"],"score":12.463963666254935,"narrativeTitle":"Value Proposition and 4 others have better than average Amount","forbiddenItems":{},"legendItemsOptions":{},"addedByDoc": false,"showSingleIntersections":false,"date":"","altGrouping":false,"userID":"null","userName":"null","narrative":"Stage explains 3.9% of the variation in Amount.<br><br>Here are some cases where Amount was better than average: <br>• #?#4#?#Value Proposition is 786,400 above average. This result may have been worsened by Close Date is 2017 which occurred 1.484 times more often. This sub-group's Amount was 43.3% lower than average.<br>• #?#5#?#Id. Decision Makers is 954,200 above average.<br>• #?#2#?#Needs Analysis is 476,700 above average. This result may have been worsened by Close Date is 2017 which occurred 2.514 times more often. This sub-group's Amount was 56.6% lower than average.<br>• #?#6#?#Perception Analysis is 1,004,000 above average.<br>• #?#10#?#Other is 1,574,000 above average. This result may have been worsened by Close Date is 2017 which occurred 5.143 times more often. This sub-group's Amount was 51.3% lower than average.<br><br>Here are some cases where Amount was worse than average: <br>• #?#8#?#Qualification is 734,400 below average. This result may have been influenced by Close Date is 2017 which occurred 5.154 times more often.","comments":{},"options":{"chart_type":"column","drill_down_options":[],"forbidden":{"indices":{}},"group_by":16,"highlight_best":true,"highlight_sound":true,"narrative_sequence":[],"r_formula":"","show_totals":false}},"children":[]},{"showParent":false,"showSibling":false,"card":{"chart":{"series":[{"data":[{"name":"100.0","tooltip":{"Average":"2,677,000","Difference From Overall":"-269,800","Standard Deviation":"2,522,000","Count":"3020"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2676807.8834437085,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0]},{"name":"0.0","tooltip":{"Average":"2,935,000","Difference From Overall":"-11,280","Standard Deviation":"2,390,000","Count":"856"},"highlighted":false,"isInteresting":false,"isSum":false,"y":2935362.0934579438,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0]},{"name":"10.0","tooltip":{"Average":"1,958,000","Difference From Overall":"-988,200","Standard Deviation":"2,316,000","Count":"238"},"highlighted":true,"isInteresting":true,"isSum":false,"y":1958403.361344538,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0]},{"name":"20.0","tooltip":{"Average":"3,418,000","Difference From Overall":"471,800","Standard Deviation":"3,051,000","Count":"541"},"highlighted":true,"isInteresting":true,"isSum":false,"y":3418465.715341959,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0]},{"name":"50.0","tooltip":{"Average":"3,728,000","Difference From Overall":"781,200","Standard Deviation":"3,103,000","Count":"454"},"highlighted":true,"isInteresting":true,"isSum":false,"y":3727863.5418502204,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,0]},{"name":"60.0","tooltip":{"Average":"3,901,000","Difference From Overall":"954,200","Standard Deviation":"3,130,000","Count":"290"},"highlighted":true,"isInteresting":true,"isSum":false,"y":3900862.2344827587,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0]},{"name":"70.0","tooltip":{"Average":"3,950,000","Difference From Overall":"1,004,000","Standard Deviation":"3,116,000","Count":"229"},"highlighted":true,"isInteresting":true,"isSum":false,"y":3950419.2838427946,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,7,0,0]},{"name":"75.0","tooltip":{"Average":"3,305,000","Difference From Overall":"358,100","Standard Deviation":"2,912,000","Count":"196"},"highlighted":false,"isInteresting":false,"isSum":false,"y":3304744.8163265307,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,0,0]},{"name":"90.0","tooltip":{"Average":"2,089,000","Difference From Overall":"-857,600","Standard Deviation":"2,407,000","Count":"148"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2089013.6216216215,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,0,0]}],"type":"column","name":""}],"xAxisLabel":"Probability (%)","yAxisLabel":"Average Amount","xAxisCategories":["100.0","0.0","10.0","20.0","50.0","60.0","70.0","75.0","90.0"],"yAxisMin":0.0,"yAxisMax":0.0,"xAxisPlotlines":[],"yAxisPlotlines":[{"color":"LightGrey","value":2946650.0,"width":1.0,"dashStyle":"Dash"}]},"id":"27339","analysis_id":"107","approved":"false","type":"BarCard","name":"Amount by Probability (%)","location":["UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","ANY","UNSET","UNSET"],"score":10.270037658348457,"narrativeTitle":"50.0 and 3 others have better than average Amount","forbiddenItems":{},"legendItemsOptions":{},"addedByDoc": false,"showSingleIntersections":false,"date":"","altGrouping":false,"userID":"null","userName":"null","narrative":"Probability (%) explains 3.2% of the variation in Amount.<br><br>Here are some cases where Amount was better than average: <br>• #?#4#?#50.0 is 781,200 above average. This result may have been worsened by Close Date is 2017 which occurred 1.516 times more often. This sub-group's Amount was 43.8% lower than average.<br>• #?#5#?#60.0 is 954,200 above average.<br>• #?#3#?#20.0 is 471,800 above average. This result may have been worsened by Close Date is 2017 which occurred 2.568 times more often. This sub-group's Amount was 56.3% lower than average.<br>• #?#6#?#70.0 is 1,004,000 above average.<br><br>Here are some cases where Amount was worse than average: <br>• #?#0#?#100.0 is 269,800 below average. This result may have been influenced by Close Date is 2017.<br>• #?#2#?#10.0 is 988,200 below average. This result may have been worsened by Close Date is 2018 which occurred 15.75 times more often. This sub-group's Amount was 26.6% lower than average.","comments":{},"options":{"chart_type":"column","drill_down_options":[],"forbidden":{"indices":{}},"group_by":15,"highlight_best":true,"highlight_sound":true,"narrative_sequence":[],"r_formula":"","show_totals":false}},"children":[]}]},"storyCreationMonitor":{"monitorId":107,"storyId":205,"projectId":111,"storyName":"Opportunity","laptop":false,"insights":"9","relevance":"HIGH","isReady":true,"analyses":[{"analysis_id":107,"outcome":"Amount","status":{"currentlyRunning":"REGRESSION_FINISHED","currentTextStatus":"Ready","currentPercentage":1.0,"clusterStatus":"COMPLETE","waterfallStatus":"COMPLETE","prescriptionStatus":"null","dodStatus":"null","forecastStatus":"null"},"unit":"","progress":1.0,"combinationCount":3004,"combinationCountGuess":126}]},"datasetName":"Opportunity","statistics":{"cardStats":[],"storyViews":[]},"readOnly":false,"duration":"4M","laptop":false,"historicSummary":{},"graphNames":["Close Date","Closed","Created Date","Fiscal Period","Fiscal Quarter","Fiscal Year","Forecast Category","Has Line Item","Has Open Activity","Has Overdue Task","Is Locked","Last Modified Date","Lead Source","May Edit","Opportunity Type","Probability (%)","Stage","Won"],"graphSeriesNames":[["Unconstrained","2013","2014","2015","2016","2017","2018"],["Unconstrained","true","false"],["Unconstrained","2013/Q1","2013/Q2","2013/Q3","2013/Q4","2014/Q1","2014/Q2","2014/Q3","2014/Q4","2015/Q1","2015/Q2","2015/Q3","2015/Q4","2016/Q1","2016/Q2","2016/Q3","2017/Q1","2017/Q2"],["Unconstrained","2016 4","2016 3","2017 2","2015 3","2014 1","2014 3","2015 2","2013 3","2013 4","2014 2","2014 4","2016 1","2015 4","2015 1","2013 2","2017 1","2016 2","2013 1","2017 3","Other"],["Unconstrained","4","3","2","1"],["Unconstrained","2016","2014","2015","2017","2013","2018"],["Unconstrained","Closed","Pipeline","Omitted","Best Case","Commit"],["Unconstrained","true","false"],["Unconstrained","true","false"],["Unconstrained","true","false"],["Unconstrained","false"],["Unconstrained","2016/Q1","2016/Q2","2016/Q3","2016/Q4","2017/Q1","2017/Q2","2017/Q3"],["Unconstrained","Employee Referral","Partner","Word of mouth","Web","Advertisement","Trade Show","Public Relations","Seminar - Internal","null"],["Unconstrained","true"],["Unconstrained","New Business","New Business / Add-on","Existing Business","null"],["Unconstrained","100.0","0.0","10.0","20.0","50.0","60.0","70.0","75.0","90.0"],["Unconstrained","Closed Won","Closed Lost","Needs Analysis","Prospecting","Value Proposition","Id. Decision Makers","Perception Analysis","Proposal/Price Quote","Qualification","Negotiation/Review","Other"],["Unconstrained","false","true"]],"outcome":"Amount","goodbad":"GOOD"},
	"199": {"storyId":199,"storyTree":{"showParent":false,"showSibling":false,"card":{"chart":{"series":[],"yAxisMin":0.0,"yAxisMax":0.0,"xAxisPlotlines":[],"yAxisPlotlines":[]},"id":"26187","analysis_id":"-1","approved":"false","type":"TitleCard","name":"Account","location":null,"score":null,"narrativeTitle":"null","forbiddenItems":{},"legendItemsOptions":{},"addedByDoc": false,"showSingleIntersections":false,"date":"","altGrouping":false,"userID":"null","userName":"null","narrative":"Einstein Discovery evaluated 2,021 Transactions and 18 columns of data across 1,858 variable combinations to determine which factors most impact Annual Revenue. (Note: Overall Average: 1,327,000,000 indicated by dashed grey line. Translucent bars are not statistically important.)","comments":{},"options":{"chart_type":"column","forbidden":{"indices":{}},"narrative_sequence":[],"r_formula":""}},"children":[{"showParent":false,"showSibling":false,"card":{"chart":{"series":[{"data":[{"name":"2016/6","tooltip":{"Average":"34,230,000","Difference From Overall":"-1,292,000,000","Standard Deviation":"1,282,000,000","Count":"1521"},"highlighted":true,"isInteresting":true,"isSum":false,"y":3.4226628418145955E7,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0]},{"name":"2016/7","tooltip":{"Average":"5,258,000,000","Difference From Overall":"3,931,000,000","Standard Deviation":"2,819,000,000","Count":"500"},"highlighted":true,"isInteresting":true,"isSum":false,"y":5.25810008064E9,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0]}],"type":"column","name":""}],"xAxisLabel":"Last Modified Date","yAxisLabel":"Average Annual Revenue","xAxisCategories":["2016/6","2016/7"],"yAxisMin":0.0,"yAxisMax":0.0,"xAxisPlotlines":[],"yAxisPlotlines":[{"color":"LightGrey","value":1.32662003E9,"width":1.0,"dashStyle":"Dash"}]},"id":"26188","analysis_id":"104","approved":"false","type":"BarCard","name":"Annual Revenue by Last Modified Date","location":["UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","ANY","UNSET","UNSET","UNSET","UNSET"],"score":100.00007460759173,"narrativeTitle":"2016/7 has better than average Annual Revenue","forbiddenItems":{},"legendItemsOptions":{},"addedByDoc": false,"showSingleIntersections":false,"date":"","altGrouping":false,"userID":"null","userName":"null","narrative":"Last Modified Date explains 61.4% of the variation in Annual Revenue.<br><br>Here are some cases where Annual Revenue was better than average: <br>• #?#1#?#2016/7 is 3,931,000,000 above average. This result may have been influenced by Created Date is 2016/Q2 which occurred 3.526 times more often.<br><br>Here are some cases where Annual Revenue was worse than average: <br>• #?#0#?#2016/6 is 1,292,000,000 below average. This result may have been worsened by Created Date is 2016/Q1 which occurred 1.328 times more often. This sub-group's Annual Revenue was 100% lower than average.","comments":{},"options":{"chart_type":"column","drill_down_options":[],"forbidden":{"indices":{}},"group_by":13,"highlight_best":true,"highlight_sound":true,"narrative_sequence":[],"r_formula":"","show_totals":false}},"children":[]},{"showParent":false,"showSibling":false,"card":{"chart":{"series":[{"data":[{"name":"1 to 127","tooltip":{"Average":"56,190,000","Difference From Overall":"-1,270,000,000","Standard Deviation":"563,600,000","Count":"201"},"highlighted":true,"isInteresting":true,"isSum":false,"y":5.618706340298507E7,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0]},{"name":"129 to 252","tooltip":{"Average":"71,410,000","Difference From Overall":"-1,255,000,000","Standard Deviation":"690,400,000","Count":"201"},"highlighted":true,"isInteresting":true,"isSum":false,"y":7.141044855721393E7,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0]},{"name":"253 to 380","tooltip":{"Average":"478.1","Difference From Overall":"-1,327,000,000","Standard Deviation":"275.8","Count":"200"},"highlighted":true,"isInteresting":true,"isSum":false,"y":478.085,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0]},{"name":"381 to 514","tooltip":{"Average":"505.9","Difference From Overall":"-1,327,000,000","Standard Deviation":"305","Count":"201"},"highlighted":true,"isInteresting":true,"isSum":false,"y":505.85074626865674,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0]},{"name":"515 to 642","tooltip":{"Average":"36,870,000","Difference From Overall":"-1,290,000,000","Standard Deviation":"521,300,000","Count":"200"},"highlighted":true,"isInteresting":true,"isSum":false,"y":3.686520064E7,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,0]},{"name":"643 to 780","tooltip":{"Average":"117,000,000","Difference From Overall":"-1,210,000,000","Standard Deviation":"964,800,000","Count":"201"},"highlighted":true,"isInteresting":true,"isSum":false,"y":1.1702586841791044E8,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0]},{"name":"781 to 930","tooltip":{"Average":"495.8","Difference From Overall":"-1,327,000,000","Standard Deviation":"297.5","Count":"200"},"highlighted":true,"isInteresting":true,"isSum":false,"y":495.81,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,7,0,0]},{"name":"931 to 10712","tooltip":{"Average":"2,374,000,000","Difference From Overall":"1,047,000,000","Standard Deviation":"3,250,000,000","Count":"200"},"highlighted":true,"isInteresting":true,"isSum":false,"y":2.3737499648E9,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,0,0]},{"name":"10812 to 30886","tooltip":{"Average":"5,420,000,000","Difference From Overall":"4,093,000,000","Standard Deviation":"2,762,000,000","Count":"200"},"highlighted":true,"isInteresting":true,"isSum":false,"y":5.41964992512E9,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,0,0]},{"name":"31232 to 87200","tooltip":{"Average":"5,019,000,000","Difference From Overall":"3,693,000,000","Standard Deviation":"2,885,000,000","Count":"202"},"highlighted":true,"isInteresting":true,"isSum":false,"y":5.019455447445544E9,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10,0,0]}],"type":"column","name":""}],"xAxisLabel":"Employees","yAxisLabel":"Average Annual Revenue","xAxisCategories":["1 to 127","129 to 252","253 to 380","381 to 514","515 to 642","643 to 780","781 to 930","931 to 10712","10812 to 30886","31232 to 87200"],"yAxisMin":0.0,"yAxisMax":0.0,"xAxisPlotlines":[],"yAxisPlotlines":[{"color":"LightGrey","value":1.32662003E9,"width":1.0,"dashStyle":"Dash"}]},"id":"26189","analysis_id":"104","approved":"false","type":"BarCard","name":"Annual Revenue by Employees","location":["UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","ANY","UNSET","UNSET"],"score":84.54267553539498,"narrativeTitle":"10812 to 30886 has better than average Annual Revenue","forbiddenItems":{},"legendItemsOptions":{},"addedByDoc": false,"showSingleIntersections":false,"date":"","altGrouping":false,"userID":"null","userName":"null","narrative":"Employees explains 51.9% of the variation in Annual Revenue.<br><br>Here are some cases where Annual Revenue was better than average: <br>• #?#8#?#10812 to 30886 is 4,093,000,000 above average. This result may have been influenced by Created Date is 2016/Q2 which occurred 3.418 times more often.<br>• #?#9#?#31232 to 87200 is 3,693,000,000 above average. This result may have been influenced by Created Date is 2016/Q2 which occurred 3.464 times more often.<br><br>Here are some cases where Annual Revenue was worse than average: <br>• #?#3#?#381 to 514 is 1,327,000,000 below average. This result may have been influenced by Created Date is 2016/Q1.<br>• #?#2#?#253 to 380 is 1,327,000,000 below average. This result may have been influenced by Created Date is 2016/Q1 which occurred 1.261 times more often.<br>• #?#6#?#781 to 930 is 1,327,000,000 below average. This result may have been influenced by Created Date is 2016/Q1.<br>• #?#4#?#515 to 642 is 1,290,000,000 below average. This result may have been worsened by Created Date is 2016/Q1 which occurred 1.413 times more often. This sub-group's Annual Revenue was 100% lower than average.","comments":{},"options":{"chart_type":"column","drill_down_options":[],"forbidden":{"indices":{}},"group_by":15,"highlight_best":true,"highlight_sound":true,"narrative_sequence":[],"r_formula":"","show_totals":false}},"children":[]},{"showParent":false,"showSibling":false,"card":{"chart":{"series":[{"data":[{"name":"2013/Q1","tooltip":{"Average":"1,344,000,000","Difference From Overall":"17,070,000","Standard Deviation":"5,237,000,000","Count":"113"},"highlighted":false,"isInteresting":false,"isSum":false,"y":1.3436991071150444E9,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0]},{"name":"2013/Q2","tooltip":{"Average":"492.1","Difference From Overall":"-1,327,000,000","Standard Deviation":"288.5","Count":"69"},"highlighted":true,"isInteresting":true,"isSum":false,"y":492.05797101449275,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0]},{"name":"2013/Q3","tooltip":{"Average":"442.1","Difference From Overall":"-1,327,000,000","Standard Deviation":"271.4","Count":"88"},"highlighted":true,"isInteresting":true,"isSum":false,"y":442.09090909090907,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0]},{"name":"2013/Q4","tooltip":{"Average":"509.1","Difference From Overall":"-1,327,000,000","Standard Deviation":"278","Count":"104"},"highlighted":true,"isInteresting":true,"isSum":false,"y":509.1442307692308,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0]},{"name":"2014/Q1","tooltip":{"Average":"599.7","Difference From Overall":"-1,327,000,000","Standard Deviation":"1,065","Count":"84"},"highlighted":true,"isInteresting":true,"isSum":false,"y":599.6904761904761,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,5,0,0,0,0,0,0,0,0,0]},{"name":"2014/Q2","tooltip":{"Average":"450.8","Difference From Overall":"-1,327,000,000","Standard Deviation":"280.6","Count":"77"},"highlighted":true,"isInteresting":true,"isSum":false,"y":450.76623376623377,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,6,0,0,0,0,0,0,0,0,0]},{"name":"2014/Q3","tooltip":{"Average":"465.2","Difference From Overall":"-1,327,000,000","Standard Deviation":"292.9","Count":"93"},"highlighted":true,"isInteresting":true,"isSum":false,"y":465.19354838709677,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,7,0,0,0,0,0,0,0,0,0]},{"name":"2014/Q4","tooltip":{"Average":"544.2","Difference From Overall":"-1,327,000,000","Standard Deviation":"283.7","Count":"87"},"highlighted":true,"isInteresting":true,"isSum":false,"y":544.1609195402299,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,0,0]},{"name":"2015/Q1","tooltip":{"Average":"511.4","Difference From Overall":"-1,327,000,000","Standard Deviation":"273.6","Count":"67"},"highlighted":true,"isInteresting":true,"isSum":false,"y":511.4029850746269,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,9,0,0,0,0,0,0,0,0,0]},{"name":"2015/Q2","tooltip":{"Average":"508.8","Difference From Overall":"-1,327,000,000","Standard Deviation":"295.3","Count":"65"},"highlighted":true,"isInteresting":true,"isSum":false,"y":508.81538461538463,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,10,0,0,0,0,0,0,0,0,0]},{"name":"2015/Q3","tooltip":{"Average":"462.6","Difference From Overall":"-1,327,000,000","Standard Deviation":"302.8","Count":"83"},"highlighted":true,"isInteresting":true,"isSum":false,"y":462.6265060240964,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,11,0,0,0,0,0,0,0,0,0]},{"name":"2015/Q4","tooltip":{"Average":"475.4","Difference From Overall":"-1,327,000,000","Standard Deviation":"308.6","Count":"83"},"highlighted":true,"isInteresting":true,"isSum":false,"y":475.421686746988,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,12,0,0,0,0,0,0,0,0,0]},{"name":"2016/Q1","tooltip":{"Average":"489.6","Difference From Overall":"-1,327,000,000","Standard Deviation":"289.2","Count":"457"},"highlighted":true,"isInteresting":true,"isSum":false,"y":489.62800875273524,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,13,0,0,0,0,0,0,0,0,0]},{"name":"2016/Q2","tooltip":{"Average":"4,590,000,000","Difference From Overall":"3,264,000,000","Standard Deviation":"3,134,000,000","Count":"551"},"highlighted":true,"isInteresting":true,"isSum":false,"y":4.590326510809438E9,"nullYValue":false,"point":[0,0,0,0,0,0,0,0,14,0,0,0,0,0,0,0,0,0]}],"type":"column","name":""}],"xAxisLabel":"Created Date","yAxisLabel":"Average Annual Revenue","xAxisCategories":["2013/Q1","2013/Q2","2013/Q3","2013/Q4","2014/Q1","2014/Q2","2014/Q3","2014/Q4","2015/Q1","2015/Q2","2015/Q3","2015/Q4","2016/Q1","2016/Q2"],"yAxisMin":0.0,"yAxisMax":0.0,"xAxisPlotlines":[],"yAxisPlotlines":[{"color":"LightGrey","value":1.32662003E9,"width":1.0,"dashStyle":"Dash"}]},"id":"26190","analysis_id":"104","approved":"false","type":"BarCard","name":"Annual Revenue by Created Date","location":["UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","ANY","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET","UNSET"],"score":79.90294564896338,"narrativeTitle":"2016/Q2 has better than average Annual Revenue","forbiddenItems":{},"legendItemsOptions":{},"addedByDoc": false,"showSingleIntersections":false,"date":"","altGrouping":false,"userID":"null","userName":"null","narrative":"Created Date explains 49% of the variation in Annual Revenue.<br><br>Here are some cases where Annual Revenue was better than average: <br>• #?#13#?#2016/Q2 is 3,264,000,000 above average. This result may have been influenced by Industry is Manufacturing.<br><br>Here are some cases where Annual Revenue was worse than average: <br>• #?#12#?#2016/Q1 is 1,327,000,000 below average. This result may have been influenced by Account Source is Web.<br>• #?#3#?#2013/Q4 is 1,327,000,000 below average.<br>• #?#6#?#2014/Q3 is 1,327,000,000 below average.<br>• #?#2#?#2013/Q3 is 1,327,000,000 below average.<br>• #?#7#?#2014/Q4 is 1,327,000,000 below average.","comments":{},"options":{"chart_type":"column","drill_down_options":[],"forbidden":{"indices":{}},"group_by":8,"highlight_best":true,"highlight_sound":true,"narrative_sequence":[],"r_formula":"","show_totals":false}},"children":[]}]},"storyCreationMonitor":{"monitorId":104,"storyId":199,"projectId":108,"storyName":"Account","laptop":false,"insights":"3","relevance":"HIGH","isReady":true,"analyses":[{"analysis_id":104,"outcome":"Annual Revenue","status":{"currentlyRunning":"REGRESSION_FINISHED","currentTextStatus":"Ready","currentPercentage":1.0,"clusterStatus":"COMPLETE","waterfallStatus":"COMPLETE","prescriptionStatus":"null","dodStatus":"null","forecastStatus":"null"},"unit":"","progress":1.0,"combinationCount":1858,"combinationCountGuess":183}]},"datasetName":"Account","statistics":{"cardStats":[],"storyViews":[]},"readOnly":false,"duration":"1M","laptop":false,"historicSummary":{},"graphNames":["Account Source","Account Type","Billing City","Billing Country","Billing State/Province","Billing Zip/Postal Code","Customer Portal Account","Industry","Created Date","Is Locked","May Edit","Partner Account","Shipping City","Last Modified Date","Shipping Country","Employees","Shipping State/Province","Shipping Zip/Postal Code"],"graphSeriesNames":[["Unconstrained","Employee Referral","Word of mouth","Partner","Web","Trade Show","Advertisement","Public Relations","Seminar - Internal"],["Unconstrained","Customer","Partner"],["Unconstrained","null"],["Unconstrained","USA","Canada","Japan","Australia","Russian","Italy","China","Switzerland","Thailand","Singapore","Korea","India","Denmark","Spain","Germany","Normway","Hong Kong","Turkey","Brazil","France","Mexico","Sweden","Belgium","Taiwan","United Kingdom"],["Unconstrained","null","CA","Other"],["Unconstrained","null"],["Unconstrained","false"],["Unconstrained","Retail","Technology","Banking","Energy","Manufacturing","Media","Insurance","Engineering","Biotechnology","Electronics","Apparel","Education","Telecommunications","Transportation","Utilities","Consulting","Finance","Agriculture","Healthcare","Communications"],["Unconstrained","2013/Q1","2013/Q2","2013/Q3","2013/Q4","2014/Q1","2014/Q2","2014/Q3","2014/Q4","2015/Q1","2015/Q2","2015/Q3","2015/Q4","2016/Q1","2016/Q2"],["Unconstrained","false"],["Unconstrained","true"],["Unconstrained","false"],["Unconstrained","null"],["Unconstrained","2016/6","2016/7"],["Unconstrained","USA","Canada","Japan","Australia","Russian","Italy","Thailand","Switzerland","China","Korea","Singapore","Denmark","India","Germany","Normway","Spain","Hong Kong","Turkey","Mexico","Sweden","Brazil","France","Belgium","Taiwan","United Kingdom"],["Unconstrained","1 to 127","129 to 252","253 to 380","381 to 514","515 to 642","643 to 780","781 to 930","931 to 10712","10812 to 30886","31232 to 87200"],["Unconstrained","null","Other"],["Unconstrained","Unspecified"]],"outcome":"Annual Revenue","goodbad":"GOOD"}
};

var _recommendations = {
	"107": {
		"DESCRIPTIVE": {
			label: "What Happened",
			results: [27331]
		},
		"FORECAST": {
			label: "What Changed Over Time",
			results: [27340,27341,27342,27343,27344,27345,27346,27347,27348,27349,27350,27351,27352,27353,27354,27355,27356,27357,27358,27359]
		},
		"DIAGNOSTIC": {
			label: "Why It Happened",
			results: [27589,27584,27590,27587,27580,27581,27574,27573,27585,27586,27576,27577,27578,27579,27582,27583]
		},
		"PREDICTVE": {
			label: "What Could Happen",
			results: [27381,27360,27363,27362,27361,27364,27365,27366,27367,27368,27369,27370,27371,27372,27373,27374,27375,27376,27377,27378,27379,27380]
		}
	},
	"104": {
		"DESCRIPTIVE": {
			label: "What Happened",
			results: [26188]
		},
		"FORECAST": {
			label: "What Changed Over Time",
			results: [26192,26191]
		},
		"DIAGNOSTIC": {
			label: "Why It Happened",
			results: []
		},
		"PREDICTVE": {
			label: "What Could Happen",
			results: [26196, 26194, 26193, 26195]
		}
	}


};

/*
	Template for an Alexa list item

        item = {
          token: asset.namespace ? asset.namespace + '__' + asset.name : asset.name,
          image: {
            contentDescription: "",
            sources: [
                {
                    url: asset.thumbnailUrl,
                    size: "X_SMALL",
                    widthPixels: 248,
                    heightPixels: 165
                }
            ]
          },          
          textContent: {
            primaryText: {
              text: asset.label,
              type: 'PlainText'
            },
            secondaryText: {
              text: asset.lastModifiedBy,
              type: 'PlainText'
            },
            tertiaryText: {
              text: new Date(asset.lastModifiedDate).toLocaleString(),
              type: 'PlainText'
            }              
          }
        };


*/

/* A few text utils */
function createAlexaSizedText(text, size) {
	return '<font size="' + size + '">' + text + '</font>';
}

function createAlexaBoldText(text) {
	return '<b>' + text + '</b>';
}

function createAlexaItalicText(text) {
	return '&lt;i&gt;' + text + '&lt;/i&gt;';
}

function createAlexaUnderlineText(text) {
	return '&lt;u&gt;' + text + '&lt;/u&gt;';
}

/*
 * Creates an Alexa list item from a Story card
 */
function createAlexaListItemFromStoryCard(card) {
	var item = {};
	
	//var thumbnailUrl = 'https://analytics-ltngout-playground.herokuapp.com/assets/images/einstein_160x160.png';

	var thumbnailUrl = 'https://analytics-ltngout-playground.herokuapp.com/assets/images/einstein_discovery_test_340x340.png';

	item.token = card.id;
	item.image = {
		contentDescription: card.name,
		sources: [
		    {
		        url: thumbnailUrl,
		        size: "X_SMALL",
		        widthPixels: 88,
		        heightPixels: 88
		    }
		]
	};
	item.textContent = {
		primaryText: {
			text: createAlexaSizedText(createAlexaBoldText(card.name), 3),
			type: 'RichText'
		},
		secondaryText: {
			text: createAlexaSizedText(card.narrativeTitle, 2),
			type: 'RichText'
		}
		/*
		 * NOTE: The narrative text contains formatting characters that need to be filtered/transformed/escaped!
		,
		tertiaryText: {			
			text: createAlexaSizedText(card.narrative, 2),
			type: 'RichText'
		}
		*/
	};

	return item;

}

function transformStoryForAlexa(req, res, story) {
	//story = JSON.parse(story);
	var tstory = {};
	var storyTree = story.storyTree;
	var rootCard = story.storyTree.card;
	console.warn('rootCard: ', rootCard);
	var child = null;
	var listItems = [];
	var item = null;
	for (var i = 0; i < storyTree.children.length; i++) {
		child = storyTree.children[i];
		/*
		console.warn('\n---------------------------------------------------------');
		console.warn('child.card.id: ', child.card.id);
		console.warn('card.type: ', child.card.type);
		console.warn('card.name: ', child.card.name);
		console.warn('card.narrativeTitle: ', child.card.narrativeTitle);
		console.warn('card.narrative: ', child.card.narrative);
		console.warn('children: ', child.children.length);
		*/
		item = createAlexaListItemFromStoryCard(child.card);
		listItems.push(item);
	}

	var shouldEndSession = false;

    let listDef =  {
        outputSpeech: {
            type: 'PlainText',
            text: rootCard.narrative,
        },
        card: {
            type: 'Simple',
            title: 'Story',
            content: rootCard.name,
        },
        reprompt: {
            outputSpeech: {
                type: 'PlainText',
                text: 'Try viewing cards by name.',
            },
        },
        directives: [
            {
                type: "Display.RenderTemplate",
                template: {
                    type: "ListTemplate1",
                    token: rootCard.id,
                    backButton: "VISIBLE",
                    backgroundImage: {
                      contentDescription: 'Salesforce Trailhead Hero Background',
                      sources: [
                        {
                          url: 'https://developer.salesforce.com/resources2/force_com-resources/force_com-hero-bg.png'
                        }
                      ]
                    },
                  title: 'Einstein Discovery Story - ' + rootCard.name,
                  listItems: listItems
                }
            },
            {
                type: "Hint",
                hint: {
                    type: "PlainText",
                    text: "Show Einstein Discovery Story id"
                }
            }
        ],        
        shouldEndSession: shouldEndSession
    };
	
    tstory.listDef = listDef;

	res.send({story: tstory});

}

/*
 {
    "name": "Opportunity",
    "creation": "2017-10-05T21:30",
    "status": "REGRESSION_FINISHED",
    "outcome": "Amount",
    "datasetName": "Opportunity",
    "projectId": 111,
    "datasetId": 142,
    "analysisId": 107,
    "storyId": 205,
    "monitorId": 107,
    "scheduleId": -1,
    "insightCount": 9,
    "transactionCount": 6406,
    "combinationCount": 3004,
    "cardId": 27331,
    "flagged": false,
    "rw": true
  },
*/

/*
 * Creates an Alexa list item from a Project
 */
function createAlexaListItemFromProject(project) {
	var item = {};
	
	//var thumbnailUrl = 'https://analytics-ltngout-playground.herokuapp.com/assets/images/einstein_160x160.png';

	var thumbnailUrl = 'https://analytics-ltngout-playground.herokuapp.com/assets/images/einstein_discovery_test_340x340.png';


	item.token = '' + project.storyId;
	item.image = {
		contentDescription: project.name,
		sources: [
		    {
		        url: thumbnailUrl,
		        size: "X_SMALL",
		        widthPixels: 340,
		        heightPixels: 340
		    }
		]
	};
	item.textContent = {
		primaryText: {
			text: createAlexaSizedText(createAlexaBoldText(project.name), 3),
			type: 'RichText'
		},
		secondaryText: {
			text: createAlexaSizedText('Created: ' +  new Date(project.creation).toLocaleDateString(), 2),
			type: 'RichText'
		}
		/*,
		tertiaryText: {			
			text: createAlexaSizedText('Dataset: ' + project.datasetName + '<br/>' + 'Outcome: ' + project.outcome, 2),
			type: 'RichText'
		}
		*/
	};

	return item;

}

function transformProjectsForAlexa(req, res, projects) {
	var tprojects = {};
	var listItems = [];
	var item = null;
	for (var i = 0; i < projects.length; i++) {
		project = projects[i];
		item = createAlexaListItemFromProject(project);
		listItems.push(item);
	}

	var shouldEndSession = false;

    let listDef =  {
        outputSpeech: {
            type: 'PlainText',
            text: 'Einstein Discovery Stories',
        },
        card: {
            type: 'Simple',
            title: 'Einstein Discovery Stories',
            content: 'Einstein Discovery Stories',
        },
        reprompt: {
            outputSpeech: {
                type: 'PlainText',
                text: 'Try viewing stories by name.',
            },
        },
        directives: [
            {
                type: "Display.RenderTemplate",
                template: {
                    type: "ListTemplate2",
                    token: 'STORIES',
                    backButton: "VISIBLE",
                    backgroundImage: {
                      contentDescription: 'Salesforce Trailhead Hero Background',
                      sources: [
                        {
                          url: 'https://developer.salesforce.com/resources2/force_com-resources/force_com-hero-bg.png'
                        }
                      ]
                    },
                  	title: 'Einstein Discovery Stories',
                  	listItems: listItems
                }
            },
            {
                type: "Hint",
                hint: {
                    type: "PlainText",
                    text: "Show Einstein Discovery Story name"
                }
            }
        ],        
        shouldEndSession: shouldEndSession
    };
	
    tprojects.listDef = listDef;

	res.send({projects: tprojects});

}

function transformStoryCardForAlexa(req, res, card) {
	var tcard =  {};

	var shouldEndSession = false;

	var thumbnailUrl = 'https://analytics-ltngout-playground.herokuapp.com/assets/images/einstein_discovery_test_340x340.png';

	// The unclosed <br> seems to cause problems on Alexa
	var narrative = card.narrative.replace(/\<br\>/g, '<br/>');

    let cardDef =  {
        outputSpeech: {
            type: 'PlainText',
            text: card.name,
        }, 
        card: {
            type: 'Simple',
            title: card.name,
            content: card.narrativeTitle,
        },
        reprompt: {
            outputSpeech: {
                type: 'PlainText',
                //text: card.children.length + ' improvments were found.' //'Try asking what Einstein Analytics can tell you about.',
                text: '5 improvments were found.' //'Try asking what Einstein Analytics can tell you about.',
            },
        },
        directives: [
            {
                type: "Display.RenderTemplate",
                template: {
                    type: "BodyTemplate2",
                    token: card.id,
                    backButton: "VISIBLE",
                    backgroundImage: {
                      	contentDescription: 'Salesforce Trailhead Hero Background',
                      	sources: [
                        	{
                          		url: 'https://developer.salesforce.com/resources2/force_com-resources/force_com-hero-bg.png'
                        	}
                      	]
                    },
                    image: {
						contentDescription: card.name,
						sources: [
						    {
						        url: thumbnailUrl,
						        size: "X_SMALL",
						        widthPixels: 340,
						        heightPixels: 340
						    }
						]
					},
					title: card.name,
					textContent: {
						primaryText: {
							text: createAlexaSizedText(createAlexaBoldText(card.name), 3),
							type: 'RichText'
						},
						secondaryText: {
							text: createAlexaSizedText(card.narrativeTitle, 2),
							type: 'RichText'
						},
						tertiaryText: {			
							text: createAlexaSizedText(narrative, 2),
							type: 'RichText'
						}
					}
                }
            },
            {
                type: "Hint",
                hint: {
                    type: "PlainText",
                    text: "Show What Changed Over Time"
                }
            }
        ],        
        shouldEndSession: shouldEndSession
    };
	
    tcard.cardDef = cardDef;

	res.send({card: tcard});

}

app.get('/einstein/discovery/stories/:id?/:cardId?', function(req, res) {
	console.warn('/einstein/discovery/stories');
	
	var storyId = req.params.id;
    console.warn('storyId: ', storyId);
	var storyIndex = req.query.storyIndex;
    console.warn('storyIndex: ', storyIndex);
	var cardId = req.params.id;
    console.warn('cardId: ', cardId);
    var name = req.query.name;
    console.warn('name: ', name);
    var cardName = req.query.card;
    console.warn('cardName: ', cardName);
    var cardIndex = req.query.cardIndex;
    console.warn('cardIndex: ', cardIndex);
	var transform = req.query.transform;	
    console.warn('transform: ', transform);

    if (storyId !== null && typeof storyId !== 'undefined') {
    	var story = _stories[storyId];
    	if (story !== null && typeof story !== 'undefined') {
    		if (transform === 'alexa') {
    			transformStoryForAlexa(req, res, story);
    		} else {
	    		res.send({story: story});
    		}
    	} else {
    		res.send({msg: "Story " + storyId + " not found."});
    	}
    } else if (storyIndex !== null && typeof storyIndex !== 'undefined') {
    	var i = 1;
    	var story = null;
    	var match = parseInt(storyIndex);
    	for (var key in _stories) {
    		if (i === match) {
    			story = _stories[key]
    		}
    		i++;
    	}
    	console.warn('}}}}}}}}}}}}}}}}}}}}}}}}}}}}} story: ', story);
    	if (story !== null && typeof story !== 'undefined') {
    		if (transform === 'alexa') {
    			transformStoryForAlexa(req, res, story);
    		} else {
	    		res.send({story: story});
    		}
    	} else {
    		res.send({msg: "Story " + storyId + " not found."});
    	}
    } else if (name !== null && typeof name !== 'undefined') {
    	for (var key in _stories) {
    		story = _stories[key];
    		if (story.storyTree.card.name.toLowerCase() === name.toLowerCase()) {
    			break;
    		}
    	}
    	if (story !== null && typeof story !== 'undefined') {

    		if (cardIndex !== null && typeof cardIndex !== 'undefined') {
    			var child = null;
    			child = story.storyTree.children[cardIndex];

    			if (child !== null && typeof child !== 'undefined') {
		    		if (transform === 'alexa') {
		    			transformStoryCardForAlexa(req, res, child.card);
		    		} else {
			    		res.send({card: child.card});
		    		}    			
    			} else {
    				res.send({msg: "Card " + cardIndex + " not found."});
    			}
    		} else if (cardName !== null && typeof cardName !== 'undefined') {
    			var child = null;
    			for (var i = 0; i < story.storyTree.children.length; i++) {
    				child = story.storyTree.children[i];
    				if (child.card.name === cardName) {
    					break;
    				}
    			}

    			if (child !== null && typeof child !== 'undefined') {
		    		if (transform === 'alexa') {
		    			transformStoryCardForAlexa(req, res, child.card);
		    		} else {
			    		res.send({card: child.card});
		    		}    			
    			} else {
    				res.send({msg: "Card " + cardName + " not found."});
    			}
    		} else {
	    		if (transform === 'alexa') {
	    			transformStoryForAlexa(req, res, story);
	    		} else {
		    		res.send({story: story});
	    		}    			
    		}

    	} else {
    		res.send({msg: "Story " + name + " not found."});
    	}

    } else {
    	res.send({stories: _stories});
    }
});	

app.get('/einstein/discovery/projects', function(req, res) {
	console.warn('/einstein/discovery/projects');
	
	var transform = req.query.transform;	
    console.warn('transform: ', transform);

	if (transform === 'alexa') {
		transformProjectsForAlexa(req, res, _projects);
	} else {
    	res.send({projects: _projects});
	}
});	

app.get('/einstein/discovery/recommendations/:analysis_id?', function(req, res) {
	console.warn('/einstein/discovery/recommendations');

	var analysis_id = req.params.id;
	var type = req.query.type || 'PREDICTVE';
	type = type.toUpperCase();

    console.warn('analysis_id: ', analysis_id);
    console.warn('type: ', type);
    if (analysis_id !== null && typeof analysis_id !== 'undefined') {
    	var recommendation = _recommendations[analysis_id][type];
    	if (recommendation !== null && typeof recommendation !== 'undefined') {
    		res.send({recommendation: recommendation});
    	} else {
    		res.send({msg: "Recommendation " + analysis_id + ":" + type + " not found."});
    	}
    } else {
    	res.send({recommendationa: _recommendationa});
    }
});	


var _imageData = {};

function _sendImage(req, res, type, data) {
    if (typeof data == 'undefined' || data === null) {
        //var url = 'https://adx-dev-ed.my.salesforce.com/analytics/wave/web/proto/images/app/icons/16.png';        
        //res.writeHead(200, {'Content-Type': 'image/png'});
        //res.send(url);
        _getImages(auth, item, next);
		_getImages(auth, item, function(imageData) {
			_imageData[type + '_' + id] = imageData;
			//_sendImage(req, res, type, imageData);
		});        

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
function old_getImages(auth, item, next) {
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

function _getImages(id, type, url, token, token_type, next) {

    var options = {
        headers: {
            "Accept": "image/png",
            "Authorization": token_type + " " + token
        },
        decoding: 'binary'

    };

    opts = options;
    opts.url = url;

    rest.get(url, options).on('complete', function(result, response) {
    	
        var buffer = new Buffer(result, 'binary');
        //_imageData[type + '_' + id] = buffer;

        if (typeof next === 'function') {
            next(buffer);
        }
    });

}

app.get('/einstein/analytics/thumb', function(req, res) {
    var id = req.query.id;
    var type = req.query.type;
    var url = req.query.url;
    var token = req.query.token;
    var token_type = req.query.token_type;
    //var data = _imageData[type + '_' + id];

    _getImages(id, type, url, token, token_type, function(imageData) {
		_sendImage(req, res, type, imageData);
    });
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
