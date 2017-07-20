var fs = require('fs');
var express = require('express');
var https = require('https');
var http = require('http');
var request = require('request');
var app = express();

var port = process.env.PORT || 3000;
var https_port = process.env.HTTPS_PORT || parseInt(port) + 1;

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
    res.sendfile('index.html');
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