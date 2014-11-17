var express = require('express');
var app = express();
var httpd = require('http').Server(app);
var fs = require('fs');

app.use('/home_timeline.json', function (request, response) {
  var json = fs.readFileSync(__dirname + '/mockData' + '/home_timeline.json', {encoding:'utf8'});
  response.json(JSON.parse(json));
});

httpd.listen(50000);