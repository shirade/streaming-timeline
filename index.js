var path = require('path');
var server = require(path.join(__dirname, 'lib', 'server.js'));
// SERVER_PORT or something
var port = process.env['PORT'] || '3000';
server.httpd.listen(port);