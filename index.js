var path = require('path');
var server = require(path.join(__dirname, 'lib', 'server.js'));
var port = process.env['TWITTER_CLIENT_PORT'] || '3000';
server.deamon.listen(port);