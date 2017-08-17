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

var app = express();

var port = process.env.PORT || 3000;
var https_port = process.env.HTTPS_PORT || parseInt(port) + 1;

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

// Create an HTTP service
http.createServer(app).listen(port);

// Creae ta server using the CORS Proxy
/*
corsProxy.createServer(app).listen(port, "localhost", function() {
    console.warn('created CORS proxy');
});
*/

console.log("Server listening for HTTP connections on port ", port);

// Create an HTTPS service if the certs are present
try {
    var options = {
      key: fs.readFileSync('key.pem'),
      cert: fs.readFileSync('key-cert.pem')
    };
    https.createServer(options, app).listen(https_port);
    console.log("Server listening for HTTPS connections on port ", https_port);
} catch (e) {
    console.error("Security certs not found, HTTPS not available");
}
