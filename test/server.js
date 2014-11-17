/***
  General modules here
  request - To use the same cookie in the other request, set option {jar: true}
***/
var request = require('request').defaults({jar: true});
var fs = require('fs');
var qs = require('querystring');
var path = require('path');
var assert = require('assert');
var http = require('http');
var debug = require('debug')('test::server');
var child_process = require('child_process');
var exec = child_process.exec;
var cookie = require('cookie');
var cookieParser = require('cookie-parser');

var rootPath = path.join(__dirname, '..');
var server = require(path.join(rootPath, 'lib', 'server'));

/***
  For Twitter RESTful API by 'request' module
***/
var oauth = {
  consumer_key: process.env['TWITTER_CONSUMER_KEY'],
  consumer_secret: process.env['TWITTER_CONSUMER_SECRET'],
  token: process.env['TWITTER_TOKEN_KEY'],
  token_secret: process.env['TWITTER_TOKEN_SECRET']
};

/***
  Test user data which will be stored into session store
***/
var user = {
  id: process.env['TWITTER_USER_ID'],
  name: 'test user',
  screen_name: 'test user',
  token: process.env['TWITTER_TOKEN_KEY'],
  tokenSecret: process.env['TWITTER_TOKEN_SECRET']
};

/***
  helper functions
***/
function setSession (response, callback) {
  var sid = cookieParser.signedCookie(
    cookie.parse(response.request.headers.cookie)['connect.sid'], 
    process.env['COOKIE_SECRET'] || 'secret'
  );
  server.redisStore.set(sid, {cookie: {expires: null}, passport: {user: user}}, callback);
};

function jade (filename, callback) {
  var command = path.join(rootPath, 'node_modules', '.bin', 'jade')
    + ' ' + path.join(rootPath, 'views', filename + '.jade')
    + ' -o ' + path.join(rootPath, 'test', 'html');
  exec(command, callback);
};

/***
  The followings are test codes of index.js
***/
describe('server.js', function () {
  before(function (done) {
    server.redisStore.client.flushdb();
    done();
  });

  describe('before login', function () {
    it('/ - should return index.jade', function (done) {
      request.get('http://localhost:3000/', function (error, response, body) {
        jade('index', function (error, stdout, stderr) {
          assert.strictEqual(response.statusCode, 200);
          var html = fs.readFileSync(path.join(rootPath, 'test', 'html', 'index.html'));
          assert.equal(body, html.toString());
          done();
        });
      });
    });

    it('/css/twitter.css - should return twitter.css', function (done) {
      request.get('http://localhost:3000/css/twitter.css', function (error, response, body) {
        assert.strictEqual(response.statusCode, 200);
        var css = fs.readFileSync(path.join(rootPath, 'public', 'css', 'twitter.css'));
        assert.strictEqual(body, css.toString());
        done();
      });
    });
  });

  describe('after login', function () {
    before(function (done) {
      request('http://localhost:3000/', function (error, response, body) {
        setSession(response, function (error) {
          done();
        });
      });
    });

    it('/ - should return home.jade', function (done) {
      request.get('http://localhost:3000/', function (error, response, body) {
        jade('home', function (error, stdout, stderr) {
          var html = fs.readFileSync(path.join(rootPath, 'test', 'html', 'home.html'));
          assert.equal(body, html.toString());
          done();
        });
      });
    });

    it('/css/twitter.css - should return twitter.css', function (done) {
      request.get('http://localhost:3000/css/twitter.css', function (error, response, body) {
        assert.strictEqual(response.statusCode, 200);
        var css = fs.readFileSync(path.join(rootPath, 'public', 'css', 'twitter.css'));
        assert.strictEqual(body, css.toString());
        done();
      });
    });

    it('/js/twitter.js - should return twitter.js', function (done) {
      request.get('http://localhost:3000/js/twitter.js', function (error, response, body) {
        assert.strictEqual(response.statusCode, 200);
        var js = fs.readFileSync(path.join(rootPath, 'public', 'js', 'twitter.js'));
        assert.strictEqual(body, js.toString());
        done();
      });
    });
  });
  
  describe('logout', function () {
    before(function (done) {
      request('http://localhost:3000/', function (error, response, body) {
        setSession(response, function (error) {
          done();
        });
      });
    });

    it('/logout - should return index.jade', function (done) {
      request.get('http://localhost:3000/logout', function (error, response, body) {
        jade('index', function (error, stdout, stderr) {
          assert.strictEqual(response.statusCode, 200);
          var html = fs.readFileSync(path.join(rootPath, 'test', 'html', 'index.html'));
          assert.equal(body, html.toString());
          done();
        });
      });
    });
  });


  function verifyAbnormalResponse (response, body, expected) {
    assert.strictEqual(response.statusCode, expected['status-code']);
    var regexp = new RegExp(expected['content-type']);
    assert(regexp.exec(response.headers['content-type']));
    assert.strictEqual(body, expected['body']);
  }

  describe('abnormal cases', function () {
    it('/get, should returns 404 not found', function (done) {
      request.get('http://localhost:3000/get', function (error, response, body) {
        if (error) console.error(error);
        verifyAbnormalResponse(response, body, {'status-code': 404, 'content-type': 'text/plain', 'body': 'Not Found'});
        done();
      });
    });

    it('/post, should returns 400 bad request', function (done) {
      request.post('http://localhost:3000/post', function (error, response, body) {
        if (error) console.error(error);
        verifyAbnormalResponse(response, body, {'status-code': 405, 'content-type': 'text/plain', 'body': 'Method Not Allowed'});
        done();
      });
    });

    it('/put, should returns 400 bad request', function (done) {
      request.put('http://localhost:3000/put', function (error, response, body) {
        if (error) console.error(error);   
        verifyAbnormalResponse(response, body, {'status-code': 405, 'content-type': 'text/plain', 'body': 'Method Not Allowed'});
        done();
      });
    });

    it('/delete, should returns 400 bad request', function (done) {
      request.del('http://localhost:3000/delete', function (error, response, body) {
        if (error) console.error(error);
        verifyAbnormalResponse(response, body, {'status-code': 405, 'content-type': 'text/plain', 'body': 'Method Not Allowed'});
        done();
      });
    });
  });

  describe('socketio test', function () {
    var socket, myAgent, expected;
    before(function (done) {
      this.timeout(5 * 1000);
      require(path.join(rootPath, 'test', 'mock.js'));
      request.get({url:'http://localhost:50000/home_timeline.json', json:true}, function (error, response, body) {
        expected = body;
        request('http://localhost:3000/', function (error, response, body) {
          setSession(response, function (error) {
            myAgent = new http.Agent();
            myAgent._addRequest = myAgent.addRequest;
            myAgent.addRequest = function(req, host, port, localAddress) {
              var old = req._headers.cookie;
              req._headers.cookie = response.request.headers.cookie + (old ? '; ' + old : '');
              req._headerNames['cookie'] = 'Cookie'; // なぜ必要なのか？あとでヘッダーに付加されるためには必要なのか？
              return myAgent._addRequest(req, host, port, localAddress);
            };
            done();
          });
        });
      });
    });

    it('tweet(s) event', function (done) {
      this.timeout(5 * 1000);
      client = require('socket.io-client');
      socket = client.connect('http://localhost:3000', { agent: myAgent});
      socket.on('tweet(s)', function (tweets){
        assert.deepEqual(tweets, expected);
        done();
      });
    });

    var delInfo;
    it('socket.on("tweet(s)") should get new tweet info', function (done) {
      this.timeout(10 * 1000);
      var text = 'This is a test tweet';
      socket.removeListener('tweet(s)');
      socket.on('tweet(s)', function (tweet){
        assert.strictEqual(tweet[0].text, delInfo.text);
        done();
      });
      var url = 'https://api.twitter.com/1.1/statuses/update.json?';
      url += qs.stringify({status: text});
      request.post({url:url, oauth:oauth, json:true}, function (error, response, body) {
        delInfo = body;
      });
    });

    it('socket.on("delete") should get delete info', function (done) {
      this.timeout(10 * 1000);
      socket.on('delete', function (tweet){
        assert.strictEqual(tweet.user_id, delInfo.user.id);
        assert.strictEqual(tweet.id, delInfo.id);
        done();
      });
      url = 'https://api.twitter.com/1.1/statuses/destroy/' + delInfo.id_str + '.json';
      request.post({url:url, oauth:oauth, json:true}, function (error, response, body) {
        delInfo = body;
      });
    });

    it('disconnect event', function (done) {
      this.timeout(5 * 1000);
      socket.disconnect();
      done();
    });
  });

  after(function (done) {
    server.redisStore.client.flushdb();
    process.exit();
    done();
  });
});