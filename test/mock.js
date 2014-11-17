var express = require('express');
var app = express();
var httpd = require('http').Server(app);
var debug = require('debug')('test::mock');
var fs = require('fs');

app.use('/home_timeline.json', function (request, response) {
  var json = fs.readFileSync(__dirname + '/mockData' + '/home_timeline.json', {encoding:'utf8'});
  response.json(JSON.parse(json));
});

httpd.listen(3000);

var request = require('request').defaults({jar: true});

request({url:'http://localhost:3000/home_timeline.json', json:true}, function (error, response, body) {
  console.log(typeof body);
  console.log(body[0]);
});