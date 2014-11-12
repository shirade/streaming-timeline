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

/***
  Shortcuts command and global variables which are necessary to do test
***/
var rootPath = path.join(__dirname, '..');
var server = require(path.join(rootPath, 'lib', 'server'));

/***
  obj which include enviromental variables
***/
var env = {
  id: process.env['TWITTER_USER_ID'],
  consumer_key: process.env['TWITTER_CONSUMER_KEY'],
  consumer_secret: process.env['TWITTER_CONSUMER_SECRET'],
  token: process.env['TWITTER_TOKEN_KEY'],
  token_secret: process.env['TWITTER_TOKEN_SECRET']
}

/***
  For using Twitter RESTful API by 'request' module
***/
var oauth = {
  id: env.id,
  consumer_key: env.consumer_key,
  consumer_secret: env.consumer_secret,
  token: env.token,
  token_secret: env.token_secret
};

/***
  Test user data which will be stored into session store
***/
var user = {
  id: env.id,
  name: 'test user',
  screen_name: 'test user',
  token: env.token,
  tokenSecret: env.token_secret
};

/***
  helper functions
***/
function setSession (response, callback) {
  var sid = cookieParser.signedCookie(
    cookie.parse(response.request.headers.cookie)['connect.sid'], 
    'secret'
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
    server.httpd.listen(3000);
    done();
  });

  describe('before login', function () {
    it('/ - should return index.jade', function (done) {
      request.get('http://localhost:3000/', function (error, response, body) {
        jade('index', function (error, stdout, stderr) {
          debug(error, stdout, stderr);
          assert.strictEqual(response.statusCode, 200);
          var html = fs.readFileSync(path.join(rootPath, 'test', 'html', 'index.html'));
          assert.equal(body, html.toString());
          done();
        });
      });
    });

    it('/css/twitter.css - should return twitter.css', function (done) {
      request.get('http://localhost:3000/css/twitter.css', function (error, response, body) {
        debug(error);
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
        debug(error);
        assert.strictEqual(response.statusCode, 200);
        var css = fs.readFileSync(path.join(rootPath, 'public', 'css', 'twitter.css'));
        assert.strictEqual(body, css.toString());
        done();
      });
    });

    it('/js/twitter.js - should return twitter.js', function (done) {
      request.get('http://localhost:3000/js/twitter.js', function (error, response, body) {
        debug(error);
        assert.strictEqual(response.statusCode, 200);
        var js = fs.readFileSync(path.join(rootPath, 'public', 'js', 'twitter.js'));
        assert.strictEqual(body, js.toString());
        done();
      });
    });

    after(function (done) {
      server.redisStore.client.flushdb();
      done();
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
          debug(error, stdout, stderr);
          assert.strictEqual(response.statusCode, 200);
          var html = fs.readFileSync(path.join(rootPath, 'test', 'html', 'index.html'));
          assert.equal(body, html.toString());
          done();
        });
      });
    });
  });


  describe('abnormal cases', function () {
    it('/get, should returns 404 not found', function (done) {
      request.get('http://localhost:3000/get', function (error, response, body) {
        if (error) console.error(error);
        assert.strictEqual(response.statusCode, 404);
        assert.strictEqual(body, 'Not Found');
        done();
      });
    });

    it('/post, should returns 400 bad request', function (done) {
      request.post('http://localhost:3000/post', function (error, response, body) {
        if (error) console.error(error);
        assert.strictEqual(response.statusCode, 405);
        assert.strictEqual(body, 'Method Not Allowed');
        done();
      });
    });

    it('/put, should returns 400 bad request', function (done) {
      request.put('http://localhost:3000/put', function (error, response, body) {
        if (error) console.error(error);   
        assert.strictEqual(response.statusCode, 405);
        assert.strictEqual(body, 'Method Not Allowed');
        done();
      });
    });

    it('/delete, should returns 400 bad request', function (done) {
      request.del('http://localhost:3000/delete', function (error, response, body) {
        if (error) console.error(error);
        assert.strictEqual(response.statusCode, 405);
        assert.strictEqual(body, 'Method Not Allowed');
        done();
      });
    });
  });

  describe('socketio test', function () {
    var socket, myAgent, expectedTweets;
    // 説明できるように勉強する．
    before(function (done) {
      this.timeout(5 * 1000);
      var url = 'https://api.twitter.com/1.1/statuses/home_timeline.json?count=20';
      request.get({url:url, oauth:oauth, json:true}, function (error, response, body) {
        expectedTweets = body;
        request('http://localhost:3000/', function (error, response, body) {
          setSession(response, function (error) {
            myAgent = new http.Agent();
            myAgent._addRequest = myAgent.addRequest;
            myAgent.addRequest = function(req, host, port, localAddress) {
              var old = req._headers.cookie;
              req._headers.cookie = response.request.headers.cookie + (old ? '; ' + old : '');
              req._headerNames['cookie'] = 'Cookie';
              return myAgent._addRequest(req, host, port, localAddress);
            };
            done();
          });
        });
      });
    });

    it('socket.on("tweet(s)") should get tweets info', function (done) {
      this.timeout(5 * 1000);
      client = require('socket.io-client');
      socket = client.connect('http://localhost:3000', { agent: myAgent});
      socket.on('connect', function () {
        debug('socket connect');
      }).on('tweet(s)', function (tweets){
        assert.deepEqual(tweets, expectedTweets);
        done();
      });
    });
/*
    it('socket.on("delete") should get delete info', function (done) {
      this.timeout(10 * 1000);
      socket.on('delete', function (tweet){
        console.log('6');
        //assert.equal(tweet.user_id, user.id);
        done();
      });
      var url = 'https://api.twitter.com/1.1/statuses/update.json?';
      url += qs.stringify({status: 'This tweet will be deleted', trim_user: true});
      request.post({url:url, oauth:oauth, json:true}, function (error, response, body) {
        url = 'https://api.twitter.com/1.1/statuses/destroy/' + body.id + '.json';
        request.post({url:url, oauth:oauth, json:true}, function (error, response, body) {
          console.error(error);
          console.log(response);
          console.log(body);
        });
      });
    });
*/
  });

  after(function (done) {
    server.redisStore.client.flushdb();
    process.exit();
    done();
  });
});