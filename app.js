var fs = require('fs');
var express = require('express');
var https = require('https');
var http = require('http');
var request = require('request');
var rest = require('restler');
var url = require('url');
var app = express();
var path = require('path');
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

// Proxy
var html2CanvasProxy = require('html2canvas-proxy');

// Cryptr
const Cryptr = require('cryptr');


// Postgres
const { Client } = require('pg');

var types = require('pg').types;

console.warn('process.env.DATABASE_URL: ', process.env.DATABASE_URL);

const client = new Client({
	connectionString: process.env.DATABASE_URL,
	ssl: true,
  });
  
client.connect();
/*
client.query('SELECT table_schema,table_name FROM information_schema.tables;', (err, res) => {
	console.warn('client.query returned: ', err, res);

	if (err) {
		console.error('postgres client.query error: ', err);
		throw err;
	}
	for (let row of res.rows) {
		console.log(JSON.stringify(row));
	}
	client.end();
});
*/

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

var _appAuthMap = {
    localhost: {
        oauth: {
			'einsteinprediction123' : {
                appId: '3MVG9SemV5D80oBdO4D3T0wG.Xmp_a0mLlCo_WSYQYHrnNWVtr5AS15pcSsm7fILCFx9Aw6C80r2cor6dz8wq',
                appSecret: '2528F60C8D11B0CE9A617FAC42004FF40AC17492B2B1002ECDC102182387B0BD'
			},
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
            },
            'ackeynotedf18': {
                appId: '3MVG9SemV5D80oBe0VjaR0v7j8x6.Mh.doZYoVpBZcQpdZ3b13QSABzJ2vX8ShgPh_i.GNOLw7171sLPpFRmk',
                appSecret: '3244981663010648141'
			},
			'df19ea': {
				appId: '3MVG9SemV5D80oBcFtKiNxaBPDwFPb9jYuTBAiSTaXC22xUqdnMj99wd1QUn7qOuYt1TnOOzA3SaSFCR3YolL',
				appSecret: '81D172705214785C51F5961457956FEAA3FDBFE7B768840871DA8AD6089B8651'
			}			
        }
    },
    heroku: {
        oauth: {
			'einsteinprediction123' : {
				appId: '3MVG9SemV5D80oBdO4D3T0wG.Xgmfi_9KvP5hIM5sIFn1X7yFdM3lHWDAhdEFerJG4Pcb4fu8lIk7F8TZ5X0F',
				appSecret: 'F5FF9910A86B934B138BC03B54B258B231B7A007F7ED9A55A5AB3EFF2626D5F8'
			},
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
            },
            'ackeynotedf18': {
                appId: '3MVG9SemV5D80oBe0VjaR0v7j83DUFyaBAxCQugkuZlXESfkkueEoRTvL0piDwLa2Xhv.nRwUDjzhKp6LdKHm',
                appSecret: '6962648447068098115'
			},
			'df19ea': {
				appId: '3MVG9SemV5D80oBcFtKiNxaBPDxnwT_J2a83FMyZaZ1hwP0JIl7egJrTLaZiPgmdNHOEhHuM1hPkGZcstaC9P',
				appSecret: '4916F3BB4C246864FC3C23B7739D075826BCF8766C7D0A152FCBFC833C3596FB'
			}                        
        }
	},

    azure: {
        oauth: {
			'einsteinprediction123' : {
				appId: '3MVG9SemV5D80oBdO4D3T0wG.Xt5IQI7wepMXeMjyvFec.h7klw4hyWFZsVFw6kYF7tySJYWOYtBahbTu.GgW',
				appSecret: '81657B4BD8033E7A930D81586DEB8562FEE36B5F79CAD41FF935B4523197FA54'
			},			
            'adx-dev-ed': {
                appId: '3MVG9SemV5D80oBcff3jWxxK32c5zHxFjm3Sc.Eou5bSehiqLnlmha0jAcBE7xK.fL8_FXbizdpYiCG2VSFvm',
                appSecret: '2591270049733179149'
			},
            'wavepm': {
                appId: '3MVG9SemV5D80oBelr7Nm4Bdjw8skGntvxfjQ4USC5YVd8h8jsZemT_fAIWJoFHAChSyKUFw14BALk8sEUJ3Y',
                appSecret: '301338094436076617'
            }
		}
	}
};

let _host = 'localhost';
_host = process.env.HEROKU === 'true' ? 'heroku' : _host;
_host = process.env.AZURE === 'true' ? 'azure' : _host;
console.warn('_host: ', _host);

let _appAuth = _appAuthMap[_host].oauth; //process.env.HEROKU === 'true' ?  : _appAuthMap.localhost.oauth;
console.warn('_appAuth: ', _appAuth);


var db = low('db.json');

app.set('view engine', 'ejs');

//app.set('views', './views');

app.set('views', path.join(__dirname, 'views'));


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



var _oauthResultMap = {};

function getSFDCPasswordToken(domain, username, password, securityToken, callback) {

	try {

		var appAuth = _appAuth[domain];

		var config = {
		client_id: appAuth.appId,
		client_secret: appAuth.appSecret,
		grant_type: 'password',
		username: username,
		password: password + securityToken
		};

		rest.post('https://' + domain  + '.my.salesforce.com/services/oauth2/token', {data: config}).on('complete', function(data, response) {

			if (response.statusCode >= 200 && response.statusCode <= 299) {
				var oauthResult = {
					instanceURL: data.instance_url,
					accessToken: data.access_token,
					id: data.id,
					tokenType: data.token_type,
					issuedAt: data.issued_at,
					signature: data.signature,
					domain: domain
				};
				if (typeof callback === 'function') {
					callback(null, oauthResult);
				}
			} else {
				console.error('OAuth2 Token error: ', response.statusCode, response.statusMessage);
				if (typeof callback === 'function') {
					callback ({statusCode: response.statusCode, statusMessage: response.statusMessage}, null);
				}
			}
		});

	} catch (e) {
		console.error('OAuth2 Token exception: ', e);
		if (typeof callback === 'function') {
			callback({exception: e}, null);
		}
	}

}

var tokenConfigs = {
	'adx-dev-ed': {
		domain: 'adx-dev-ed',
		username: 'skip@eadx.com',
		password: 'waveout9(',
		securityToken: '8qep45xiHEGtdxersgWxxJ75'
	},
	'ackeynotedf18': {
		domain: 'ackeynotedf18',
		username: 'ssauls@eakeynote18.org',
		password: 'waveout4$',
		securityToken: ''
	},
	'df19ea': {
		domain: 'df19ea',
		username: 'adminuser@df19demo.com',
		password: 'EAPlus123#',
		securityToken: ''
	},
};

function getToken(domain, callback) {
	var config = null;
	config = tokenConfigs[domain];
	getSFDCPasswordToken(config.domain, config.username, config.password, config.securityToken, function(err, oauthResult) {
		if (typeof oauthResult !== 'undefined' && oauthResult !== null) {
			_oauthResultMap[oauthResult.domain] = oauthResult;
			getCurrentAPIVersion(oauthResult.domain, function(err, version) {
				if (err) {
					console.error('Error from getCurrentAPIVersion: ', err);
				} else {
					oauthResult.version = version;
				}
				getNamespacePrefix(oauthResult.domain, function(err, ns) {
					if (err) {
						console.error('Error from getNamespacePrefix: ', err);
					} else {
						oauthResult.namespacePrefix = ns;
					}
					if (typeof callback === 'function') {
						callback(null, oauthResult);
					}
				});
			});
		} else {
			console.error('Error getting token for ' + domain + ': ', err);
			callback({'error': 'Error getting token for ' + domain + ': ', err}, null);
		}
	});		
}


for (var domain in tokenConfigs) {
	console.warn('domain: ', domain);
	getToken(domain, function(err, oauthResult) {
		console.warn('oauthResult: ', oauthResult);
		getUserInfo(domain, function(err, userInfo) {
			console.warn('userInfo: ', userInfo);
		});
	});
}


function getCurrentAPIVersion(domain, callback) {

    let path = '/services/data';

    let oauthResult = _oauthResultMap[domain];

    let url = oauthResult.instanceURL + path;

    let version = {version: '0.0'};
    let err = null;

    rest.get(url, options).on('complete', function(result, response) {
                            
        if (response.statusCode === 200) {
            result.forEach(function(v) {
                if (parseFloat(v.version) > parseFloat(version.version)) {
                    version = v;
                };
            });
        } else {            
            console.error('getCurrentApiVersion error: ', response.statusCode, response.statusMessage);
            err = {statusCode: response.statusCode, statusMessage: response.statusMessage};
        }
        if (typeof callback === 'function') {
            callback(err, version);
        }
    });

}

function callPredictionService(domain, payload, callback) {
	try {
		let path = '/services/data/v47.0/smartdatadiscovery/predict';

		let oauthResult = _oauthResultMap[domain];

		let url = oauthResult.instanceURL + path;
		var config = {

			headers: {
				"Authorization": oauthResult.tokenType + " " + oauthResult.accessToken,
				"Content-Type": "application/json",
				"Accept": "application/json"
			},
			data: payload //JSON.stringify(payload)
		};
			
		let err = null;
		let userInfo = null;

		rest.post(url, options).on('complete', function(result, response) {			
			if (response.statusCode >= 200 && response.statusCode <= 299) {
				console.warn('callPredictionService returned: ', result);
			} else {            
				console.error('callPredictionService error: ', response.statusCode, response.statusMessage);
				//err = {statusCode: response.statusCode, statusMessage: response.statusMessage};
			}
			if (typeof callback === 'function') {
				callback(err, result);
			}
		});
	} catch (e) {
		if (typeof callback === 'function') {
			callback({exception: e}, null);
		}
	}
        
  }

function getUserInfo(domain, callback) {
	try {
		let path = '/services/oauth2/userinfo';

		let oauthResult = _oauthResultMap[domain];

		let url = oauthResult.instanceURL + path;
		let options = {
			headers: {
				"Accept": "application/json",
				"Authorization": oauthResult.tokenType + " " + oauthResult.accessToken
			}
		};
			
		let err = null;
		let userInfo = null;

		rest.get(url, options).on('complete', function(result, response) {

			if (response.statusCode >= 200 && response.statusCode <= 299) {
				userInfo = result;
			} else {            
				console.error('getUserInfo error: ', response.statusCode, response.statusMessage);
				err = {statusCode: response.statusCode, statusMessage: response.statusMessage};
			}
			if (typeof callback === 'function') {
				callback(err, userInfo);
			}
		});
	} catch (e) {
		if (typeof callback === 'function') {
			callback({exception: e}, null);
		}
	}
}

function getNamespacePrefix(domain, callback) {

	try {
		let oauthResult = _oauthResultMap[domain];

		let url = oauthResult.instanceURL + oauthResult.version.url + '/query?q=SELECT+NamespacePrefix+FROM+Organization';

		let options = {
			headers: {
				"Accept": "application/json",
				"Authorization": oauthResult.tokenType + " " + oauthResult.accessToken
			}
		};

		var ns = null;
		var err = null;

		rest.get(url, options).on('complete', function(result, response) {
			if (response.statusCode >= 200 && response.statusCode <= 299) {
				if (result.records && result.records.length > 0) {
					ns = result.records[0].NamespacePrefix;
				}
			} else {            
				console.error('getNamespacePrefix error: ', response.statusCode, response.statusMessage);
				err = {statusCode: response.statusCode, statusMessage: response.statusMessage};
			}
			if (typeof callback === 'function') {
				callback(err, ns);
			}
		});
	} catch (e) {
		console.error('getNamespacePrefix excepotion: ', e);
		if (typeof callback === 'function') {
			callback({exception: e}, );
		}
	}
}

function createPlatformEvent(domain, eventName, type, target, payload, callback) {

	try {
		console.warn('createPlatformEvent: ', domain, eventName, type, target, payload);

		let oauthResult = _oauthResultMap[domain];
		console.warn('oauthResult: ', oauthResult);
		let nsp = oauthResult.namespacePrefix ? oauthResult.namespacePrefix + '__' : '';
		console.warn('nsp: ', nsp);

		let postData = {};
		postData[nsp + 'type__c'] = type;
		postData[nsp + 'target__c'] = target;
		postData[nsp + 'payload__c'] = payload ? JSON.stringify(payload) : null;

		console.warn('postData: ', postData);

		let url = oauthResult.instanceURL + oauthResult.version.url + '/sobjects/' + nsp + eventName + '__e';

		console.warn('url: ', url);

		var config = {

			headers: {
				"Authorization": oauthResult.tokenType + " " + oauthResult.accessToken,
				"Content-Type": "application/json",
				"Accept": "application/json"
			},
			data: JSON.stringify(postData)
		};

		console.warn('config: ', config);


		rest.post(url, config).on('complete', function(data, response) {
			console.warn('createPlaformEvent returned data: ', data);
			console.warn('createPlaformEvent returned response.statusCode: ', response.statusCode);

			if (response.statusCode >= 200 && response.statusCode <= 299) {
				console.warn('json data: ', JSON.stringify(data, null, 2));
				
				if (typeof callback === 'function') {
					callback(data, response);
				}  

			} else {            
				console.error('response.statusCode: ', response.statusCode);
				getToken(domain, function(err, oauthResult) {
					if (err) {
						console.warn('getToken for ', domain, ' error: ', err);
						if (typeof callback === 'function') {
							callback(null, response);
						}  					
					} else {
						// Retry with updated token
						createPlatformEvent(domain, eventName, type, target, payload, callback);
					}
				});
			}
		
		});
	} catch (e) {
		console.error('createPlatformEvent exception: ', e);
		if (typeof callback === 'function') {
			callback({exception: e}, null);
		}  					
	}   
}

// hEAlth

function encryptHealthToken(token, secret) {
	const cryptr = new Cryptr(secret);
	let encryptedSecret = cryptr.encrypt(token);
	return encryptedSecret;
}

function validateHealthToken(token, encryptedSecret, callback) {
	console.warn('validateHealthToken');
	console.warn('token: ', token);
	console.warn('encryptedSecret: ', encryptedSecret);

	client.query('SELECT secret FROM account WHERE token = \'' + token + '\';', (err, resp) => {
		let match = false;
		if (err) {
			console.error('client.query error: ', err);
			match = false;
		} else if (resp && resp.rows && resp.rows.length === 1){
			let secret = resp.rows[0].secret;
			console.warn('secret: ', secret);
			const cryptr = new Cryptr(secret);
			let test = cryptr.decrypt(encryptedSecret);
			console.warn('test: ', test);
			if (test === token) {
				console.warn('matching secret!!!!!!!!!!!!!!');
				match = true;
			}
		}

		if (typeof callback === 'function') {
			callback(err, {match: match});
		}
	}); 

}

function createHealthToken(body, callback) {
	
	// We will not store anything from the request

	let error = null;
	let token = null;

	// Handle refresh by checking for token AND secret
	if (body.token && body.secret) {
		let valid = validateHealthToken(body.token, body.secret, function(err, match) {
			console.warn('validateHealthToken returned: ', err, match);

			let error = null;
			let resp = null;

			if (err || match.match === false) {
				error = {
					error: 'UNABLE_TO_REFRESH_TOKEN',
					msg: 'Unable to refresh token'
				};

				if (typeof callback === 'function') {
					callback(error, resp);
				}
			} else {

				let token =  uuidv4();
				let secret = uuidv4();
		
				//const text = 'UPDATE account SET token = $1::text, secret = $2::text WHERE token = $3::text';
				//const values = [token, secret, body.token];

				
				const query = 'UPDATE account SET token = \'' + token + '\', secret = \'' + secret + '\' WHERE token = \'' + body.token + '\';';

				console.warn('query: ', query);

				let error = null;
				let resp = null;
				let encryptedToken = null;
		
				//client.query(text, values, (err, res) => {
				client.query(query, (err, res) => {
				if (err) {
					console.error('client.query error: ', err.stack);
					error = {
						error: 'UNABLE_TO_CREATE_TOKEN',
						msg: 'Unable to create a new token'
					};
				  } else {
					  console.warn('res: ', res);
					  
					  encryptedToken = encryptHealthToken(token, secret);
					  
					  resp = {
						  token: token,
						  secret: encryptedToken
						};
					}
		
					if (typeof callback === 'function') {
						callback(error, resp);
					}
				});	
		

			}
		});

	} else {
		let token =  uuidv4();
		let secret = uuidv4();

		const text = 'INSERT INTO account(token, secret, created_on) VALUES($1, $2, NOW()) RETURNING token,secret';
		const values = [token, secret];

		let error = null;
		let resp = null;
		let encryptedToken = null;

		client.query(text, values, (err, res) => {
			if (err) {
				console.error(err.stack);
				error = {
					error: 'UNABLE_TO_CREATE_TOKEN',
					msg: 'Unable to create a new token'
				};
		  	} else {
				console.log(res.rows[0]);
				let t = res.rows[0].token;
				let s = res.rows[0].secret;

				encryptedToken = encryptHealthToken(t, s);
				resp = {
					token: t,
					secret: encryptedToken
				};
		  	}

		  	if (typeof callback === 'function') {
			  	callback(error, resp);
		  	}
		});	
	
	}	
}

function getHealthAccount(token, callback) {
	client.query('SELECT uid,token,created_on FROM account WHERE token=\'' + token + '\';', (err, resp) => {
		let error = null;
		let account = null;
		if (resp.rows && resp.rows.length > 0) {
			account = resp.rows[0];
		} else {
			error = {
				error: 'ACCOUNT_NOT_FOUND',
				msg: 'Account for token ' + token + ' not found'
			};
		}

		if (typeof callback === 'function') {
			callback(error, account);
		}
	});
}


function getHealthAccounts(config, callback) {
	client.query('SELECT uid,token,secret,created_on FROM account;', (err, resp) => {
		let error = null;
		let accounts = null;
		if (resp.rows && resp.rows.length > 0) {
			accounts = resp.rows;
		} else {
			error = {
				error: 'ACCOUNTS_NOT_FOUND',
				msg: 'Accounts not found'
			};
		}

		if (typeof callback === 'function') {
			callback(error, accounts);
		}
	});
}

function getHealthUserInfo(token, callback) {
	getHealthAccount(token, (err, account) => {
		let body = {};
		if (err || !account) {
			body.error = err;
			let error = {
				error: 'INVALID_TOKEN',
				msg: 'Token ' + token + ' is invalid'
			};

			if (typeof callback === 'function') {
				callback(error, null);
			}			
		} else { 
			client.query('SELECT date_of_birth,age,sex,gender,sfdc_org_id,sfdc_user_id FROM user_info WHERE account_id=\'' + account.uid + '\';', (err, res) => {
				let error = null;
				let resp = null;
				if (err) {
					console.error('getHealthUserInfo error: ', err);
					error = {
						error: 'USER_INFO_NOT_FOUND',
						msg: 'User info for token ' + token + ' not found'
					};
				} else {
					let fields = [];
					let field = null;
					let typeMap = {};
					let v = null;
					for (var t in res._types._types.builtins) {
						v = res._types._types.builtins[t];
						typeMap[v] = t;
					}
					res.fields.forEach(function(f) {
						field = {
							type: typeMap[f.dataTypeID],
							size: f.dataTypeSize,
							format: f.format,
							name: f.name 
						};
						fields.push(field);
					});
					resp = {
						all: res,
						fields: fields,
						rows: res.rows
					};
				}
				if (typeof callback === 'function') {
					callback(error, resp);
				}
			});
		}
	});
}

function updateHealthUserInfo(body, callback) {

	getHealthAccount(body.token, (err, account) => {
		let body = {};
		if (err || !account) {
			body.error = err;
			let error = {
				error: 'INVALID_TOKEN',
				msg: 'Token ' + token + ' is invalid'
			};

			if (typeof callback === 'function') {
				callback(error, null);
			}			
		} else { 

			const text = 'INSERT INTO user_info(account_id, date_of_birth, age, sex, gender, sfdc_org_id, sfdc_user_id) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *';
			const values = [account.uid, body.date_of_birth, body.age, body.sex, body.gender, body.sfdc_org_id, body.sfdc_user_id];

			let error = null;
			let resp = null;

			client.query(text, values, (err, res) => {
				if (err) {
					console.error(err.stack);
					error = {
						error: 'UNABLE_TO_UPDATE_USER_INFO',
						msg: 'Unable to update user info'
					};
				} else {
					console.log('clienty query returned rows: ', res.rows);
					console.log('clienty query returned row 0: ', res.rows[0]);

					resp = res.rows[0];
				}

				if (typeof callback === 'function') {
					callback(error, resp);
				}
			});
		}
	});
}

function getHealthSteps(token, callback) {
	getHealthAccount(token, (err, account) => {
		let body = {};
		if (err || !account) {
			body.error = err;
			let error = {
				error: 'INVALID_TOKEN',
				msg: 'Token ' + token + ' is invalid'
			};

			if (typeof callback === 'function') {
				callback(error, null);
			}			
		} else { 
			client.query('SELECT value,date FROM steps WHERE account_uid=\'' + account.uid + '\' ORDER BY date;', (err, resp) => {
				let error = null;
				let steps = null;
				if (err) {
					console.error('getHealthSteps error: ', err);
					error = {
						error: 'STEPS_NOT_FOUND',
						msg: 'Steps for token ' + token + ' not found'
					};
				} else {
					steps = [];
					resp.rows.forEach(function(row) {
						steps.push(row);
					});					
				}
				if (typeof callback === 'function') {
					callback(error, steps);
				}
			});
		}
	});
}

function addHealthSteps(body, callback) {
	console.warn('addHealthSteps - body: ', JSON.stringify(body, null, 2));
	getHealthAccount(body.token, (err, account) => {
		if (err || !account) {
			let error = {
				error: 'INVALID_TOKEN',
				msg: 'Token ' + body.token + ' is invalid'
			};

			if (typeof callback === 'function') {
				callback(error, null);
			}	
		} else { 

			let date = body.date;
			let value = body.value;

			const text = 'INSERT INTO steps(account_uid, value, date) VALUES($1, $2, $3) RETURNING value,date';
			const values = [account.uid, value, date];
	
			let error = null;
			let resp = null;
	
			client.query(text, values, (err, res) => {
				if (err) {
					console.error(err.stack);
					error = {
						error: 'UNABLE_TO_ADD_STEPS',
						msg: 'Unable to add steps'
					};
				  } else {
					console.log('client.query returned res: ', res);
					let v = res.rows[0].value;
					let d = res.rows[0].date;
	
					resp = {
						value: v,
						date: d
					};
				  }
	
				  if (typeof callback === 'function') {
					  callback(error, resp);
				  }
			});	
	


		}
	});

}
app.post('/health/api/ping', function(req, res) {	
	let params = req.params;
	let query = req.query;
	let body = req.body;
	let headers = req.headers;

	console.warn('POST ping');
	console.warn('params: ', params);
	console.warn('query: ', query);
	console.warn('body: ', body);
	console.warn('headers: ', headers);
	let resp = {pong: 'Pong!'};
	res.send(resp);
});

//app.get('/health/api/account/:token?', function(req, res) {	
//	var token = req.params.token;
app.get('/health/api/account', function(req, res) {	
	let token = req.headers.health_token;

	getHealthAccount(token, (err, account) => {
		let resp = {};
		resp.error = err || undefined;
		resp.account = account || undefined;
		res.send(resp);	
	});
});

app.get('/health/api/steps', function(req, res) {	
	var token = req.query.token;

	getHealthSteps(token, (err, steps) => {
		let resp = {};
		resp.error = err || undefined;
		resp.steps = {steps: steps} || undefined;
		res.send(resp);
	});
});

app.post('/health/api/steps', function(req, res) {	
	let body = req.body;
	
	addHealthSteps(body, (err, steps) => {
		let resp = {};
		resp.error = err || undefined;
		resp.steps = {steps: steps} || undefined;
		res.send(resp);
	});
});

app.post('/health/api/user_info', function(req, res) {	
	let body = req.body;
	
	updateHealthUserInfo(body, (err, user_info) => {
		let resp = {};
		resp.error = err || undefined;
		resp.user_info = user_info || undefined;
		res.send(resp);
	});
});

app.post('/health/api/signup', function(req, res) {
	let body = req.body;

	createHealthToken(body, (err, token) => {
		let resp = {};
		resp.error = err || undefined;
		resp.token = token || undefined;
		res.send(resp);		
	});
});

app.post('/health/api/token', function(req, res) {
	console.warn('POST /health/api/token');
	let body = req.body;
	console.warn('body: ', body);
	let headers = req.headers;
	console.warn('headers: ', headers);
	let token = headers.health_token || body.health_token;
	console.warn('token: ', token);
	let resp = {};
	if (token) {
		req.session.token = token;
		resp.status = 'SUCCESS';
	} else {
		resp.error = {
				error: 'UNABLE_TO_SET_TOKEN',
				msg: 'Unable to set token'
		};
	}
	res.send(resp);
});



app.get('/health', function(req, res) {
	let token = req.session.token;
	console.warn('health_token: ', token);

	let config = {
		title: 'hEAlth'
	};
	if (token) {
		getHealthAccount(token, (err, account) => {
			config.authorized = account ? true : false;
			getHealthUserInfo(token, (err, user_info) => {
				console.warn('getHealthUserInfo returned: ', err, user_info);
				if (err) {
					config.error = err;
				} else {
					config.user_info = user_info;
				}
	
				res.render('pages/health/index', {config: JSON.stringify(config)});
			});	
		});
		
	} else {
		res.render('pages/health/index', {config: JSON.stringify(config)});
	}
});

app.get('/health/signup', function(req, res) {
    res.render('pages/health/signup', {title: 'hEAlth - Signup'});
});



const auth = require('./auth')

app.use(auth)

app.get('/health/admin', function(req, res) {
    res.render('pages/health/admin', {title: 'hEAlth - Admin'});
});

app.get('/health/admin/api/accounts', function(req, res) {	
	console.warn('app.get /health/admin/api/accounts');
	let config = {};
	getHealthAccounts(config, (err, accounts) => {
		let resp = {};
		resp.error = err || undefined;
		resp.accounts = accounts || undefined;
		res.send(resp);	
	});
});






app.get('/', function(req, res) {
    res.render('pages/index', {title: 'Analytics Lightning Out Playground', appId: process.env.APPID});
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

// Commander




app.get('/commander', function(req, res) {
    console.warn('GET commander called at ', new Date());
    res.render('pages/commander', {title: 'Einstein Analytics - Commander', appId: process.env.APPID});
});

app.post('/commander', function(req, res) {
    console.warn('POST commander called at ', new Date());

    console.warn("req.params: ", req.params);
    console.warn("req.body: ", req.body);

    var body = req.body;
    var json = JSON.stringify(req.body, null, 2);
    console.warn("req.body json: ", json);

    var domain = req.body.domain;
    console.warn('domain: ', domain);

    var phrase = req.body.phrase;
    console.warn('phrase: ', phrase);

    let type = 'command';
    
    let target = null;

    let payload = {
        phrase: phrase
    };

    createPlatformEvent(domain, 'EinsteinAnalyticsEvent', type, target, payload, function(data, response) {
        console.warn('createPlatformEvent returned: ', data);
    });    

    res.send({title: 'Einstein Analytics - Commander', phrase: phrase, timestamp: Date.now()});
});

// Hello World
app.get('/lo_ea', function(req, res) {

	let domain = 'adx-dev-ed';

    var appAuth = _appAuth[domain];
		
    res.render('pages/lo_ea', {title: 'Lightning Out - Einstein Analytics', appId: appAuth.appId, domain: domain, host: _host});
});

app.get('/lo_explorer', function(req, res) {

	let domain = 'adx-dev-ed';

    var appAuth = _appAuth[domain];
		
    res.render('pages/lo_explorer', {title: 'Lightning Out - Einstein Analytics', appId: appAuth.appId, domain: domain, host: _host});
});

app.get('/lo_executequery', function(req, res) {

	let domain = 'adx-dev-ed';

    var appAuth = _appAuth[domain];
		
    res.render('pages/lo_executequery', {title: 'Lightning Out - Einstein Analytics', appId: appAuth.appId, domain: domain, host: _host});
});


app.get('/lo_platform', function(req, res) {

	let domain = 'adx-dev-ed';

    var appAuth = _appAuth[domain];
		
    res.render('pages/lo_platform', {title: 'Lightning Out - Einstein Analytics', appId: appAuth.appId, domain: domain, host: _host});
});

// Azure demo
app.get('/demo', function(req, res) {

	let domain = 'einsteinprediction123';

    var appAuth = _appAuth[domain];
		
    res.render('pages/demo', {title: 'Einstein Analytics - Embedded Demo', appId: appAuth.appId, domain: domain, host: _host});
});


// Azure demo
app.get('/lo_azure', function(req, res) {

	let domain = 'adx-dev-ed';

    var appAuth = _appAuth[domain];
		
    res.render('pages/lo_azure', {title: 'Lightning Out - Einstein Analytics', appId: appAuth.appId, domain: domain, host: _host});
});

// Azure demo
app.get('/lo_forrester', function(req, res) {

	let domain = 'einsteinprediction123';

    var appAuth = _appAuth[domain];
		
    res.render('pages/lo_forrester', {title: 'Lightning Out - Einstein Analytics', appId: appAuth.appId, domain: domain, host: _host});
});


app.get('/lo_commander', function(req, res) {
	let domain = 'adx-dev-ed';

    let appAuth = _appAuth[domain];
		
    res.render('pages/lo_commander', {title: 'Einstein Commander', appId: appAuth.appId, domain: domain, host: _host});
});

app.get('/crt', function(req, res) {
		
    res.render('pages/crt', {title: 'CRT'});
});

app.get('/lineage', function(req, res) {
	
	let assetsFile = fs.readFileSync('ea_assets.json');
	let assets = JSON.parse(assetsFile);		
	let assetsJson = JSON.stringify(assets);

    res.render('pages/lineage', {assets: assetsJson});
});

// Teams demo

/*
// Adding a bot to our app
var bot = require('./bot');
bot.setup(app);
*/


app.post('/auth/token', function(req, res) {	
	let params = req.params;
	let query = req.query;
	let body = req.body;
	let headers = req.headers;

	console.warn('POST /auth/token');
	console.warn('params: ', params);
	console.warn('query: ', query);
	console.warn('body: ', body);
	console.warn('headers: ', headers);
	let resp = null;
	if (body) {
		try {
			let oauthResult = typeof body === 'string' ? JSON.parse(body) : body;
			console.warn('oauthResult: ', oauthResult);
			req.session.tokens = req.session.tokens || {};
			req.session.tokens[oauthResult.appId] = oauthResult;
			resp = {msg: 'Successfully set token'};
		} catch (e) {
			console.error(e);
			resp = {msg: 'Unable to set token'};
			req.session.tokens = req.session.tokens || {};
			req.session.tokens[appId] = null;
			delete request.session.tokens[appId];	
		}
	} else {
		resp = {msg: 'Token not sent'};
	}
	res.send(resp);
});

app.delete('/auth/token/:appId?', function(req, res) {	
	var appId = req.params.appId;
	console.warn('delete /auth/token - appId: ', appId);
	let resp = null;
	if (appId) {
		req.session.tokens = req.session.tokens || {};
		req.session.tokens[appId] = null;
		delete request.session.tokens[appId];
		resp = {msg: 'Successfully deleted token'};
	} else {
		resp = {msg: 'Token not found'};
	}
	res.send(resp);
});
	
app.get('/lo_msteams', function(req, res) {

	console.warn('headers');
	console.warn(JSON.stringify(req.headers, null, 2));

	console.warn('body');
	console.warn(JSON.stringify(req.body, null, 2));

	let params = getParams(req);
	console.warn('params');
	console.warn(JSON.stringify(req.params, null, 2));

	let domain = 'adx-dev-ed';

    let appAuth = _appAuth[domain];
		
    res.render('pages/lo_msteams', {title: 'MS Teams - Einstein Analytics', appId: appAuth.appId, domain: domain, host: _host});
});

app.get('/df19ea_msteams', function(req, res) {

	console.warn('headers');
	console.warn(JSON.stringify(req.headers, null, 2));

	console.warn('body');
	console.warn(JSON.stringify(req.body, null, 2));

	let params = getParams(req);
	console.warn('params');
	console.warn(JSON.stringify(req.params, null, 2));

	let domain = 'df19ea';

    let appAuth = _appAuth[domain];
		
	console.warn('appAuth.appId: ', appAuth.appId);

	req.session.tokens = req.session.tokens || {};

	let oauthResultObj = req.session.tokens[appAuth.appId];
	console.warn('oauthResultObj: ', oauthResultObj);
	let oauthResult = null;
	if (oauthResultObj) {
		oauthResult = JSON.stringify(oauthResultObj);
	}
    res.render('pages/lo_msteams', {title: 'MS Teams - Einstein Analytics', appId: appAuth.appId, domain: domain, host: _host, oauthResult: oauthResult});
});

app.get('/lo_prediction_service', function(req, res) {

	console.warn('headers');
	console.warn(JSON.stringify(req.headers, null, 2));

	console.warn('body');
	console.warn(JSON.stringify(req.body, null, 2));

	let params = getParams(req);
	console.warn('params');
	console.warn(JSON.stringify(req.params, null, 2));

	let domain = 'df19ea';

    let appAuth = _appAuth[domain];
		
    res.render('pages/lo_prediction_service', {title: 'MS Teams - Einstein Dicovery', appId: appAuth.appId, domain: domain, host: _host});
});

app.post('/api/messages', function(req, res) {
	console.warn('POST /api/messages called at ', new Date());
	console.warn('body: ', req.body);
});

app.get('/hello', function(req, res) {
	let domain = 'adx-dev-ed';
    var appAuth = _appAuth[domain];
    res.render('pages/lo_ea', {title: 'Hello', appId: appAuth.appId, domain: domain, host: _host});
});

app.get('/config', function(req, res) {
	let domain = 'adx-dev-ed';
    var appAuth = _appAuth[domain];
    res.render('pages/config', {title: 'Config', appId: appAuth.appId, domain: domain, host: _host});
});

app.get('/privacy', function(req, res) {
	let domain = 'adx-dev-ed';
    var appAuth = _appAuth[domain];
    res.render('pages/privacy', {title: 'Privacy', appId: appAuth.appId, domain: domain, host: _host});
});

app.get('/termsofuse', function(req, res) {
	let domain = 'adx-dev-ed';
    var appAuth = _appAuth[domain];
    res.render('pages/termsofuse', {title: 'Terms of Use', appId: appAuth.appId, domain: domain, host: _host});
});

app.get('/msauth', function(req, res) {
	let domain = 'adx-dev-ed';
    var appAuth = _appAuth[domain];
    res.render('pages/msauth', {title: 'Auth', appId: appAuth.appId, domain: domain, host: _host});
});


app.get('/lo_cmdr', function(req, res) {

	let domain = 'adx-dev-ed';
    let oauthResult = _oauthResultMap[domain];
    console.warn('oauthResult: ', oauthResult);
    let nsp = oauthResult.namespacePrefix ? oauthResult.namespacePrefix + '__' : '';
	console.warn('nsp: ', nsp);
		
    res.render('pages/lo_cmdr', {title: 'Lightning Out - Einstein Analytics', appId: process.env.APPID, accessToken: oauthResult.accessToken, instanceURL: oauthResult.instanceURL});
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
	var params = JSON.stringify(req.params);
    res.render('pages/voiceproxy', {title: 'Einstein Analytics - Voice Proxy', params: params});
});

// Voice Analysis Proxy
app.get('/voiceanalysisproxy', function(req, res) {
	req.params = getParams(req);
	var params = JSON.stringify(req.params);
    res.render('pages/voiceanalysisproxy', {title: 'Einstein Analytics - Voice Analysis Proxy', params: params});
});

// Voice Analysis Proxy
app.get('/voicesfxproxy', function(req, res) {
	req.params = getParams(req);
	var params = JSON.stringify(req.params);
    res.render('pages/voicesfxproxy', {title: 'Einstein Analytics - Voice SFX Proxy', params: params});
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

/*
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
*/

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


// html2canvas proxy
app.use("/", html2CanvasProxy());

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
      cert: fs.readFileSync('cert.pem')
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
