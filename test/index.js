var request = require('request').defaults({jar: true});
var fs = require('fs');
var qs = require('querystring');
var path = require('path');
var assert = require('assert');
var async = require('async');

var l = console.log;
var e = console.error;
var rootPath = path.join(__dirname + '/..');
var index, server;

function getSID (cookie) {
  return qs.parse(cookie, '&', '=')['connect.sid'].slice(2).split('.')[0];
};

describe('index.js', function () {
  before(function (done) {
    async.series([
      function (callback) {
        index = require(path.join(rootPath + '/index'));
        callback();
      }, function (callback) {
        index.db.connect('mongodb://localhost/test');
        callback();
      }, function (callback) {
        server = index.server.listen(3000, 'localhost');
        callback();
      }, function (callback) {
        done();
        callback();
      }
    ]);
  });

  describe('Normal cases - Unauthorized', function () {
    it('/css/cover.css should return content of cover.css', function (done) {
      request.get('http://localhost:3000/css/cover.css', function (error, response, body) {
        if (error) {
          e(error);
          done();
        } else {

          assert.strictEqual(response.statusCode, 200);
          var css = fs.readFileSync(path.join(__dirname + '/../views/css/cover.css'));
          assert.strictEqual(body, css.toString()); // toString() make buffer to utf8
          done();
        }
      });
    });

    it('/ should return statusCode 200', function (done) {
      request.get('http://localhost:3000/', function (error, response, body) {
        if (error) {
          e(error);
          done();
        } else {
          
          assert.strictEqual(response.statusCode, 200);
          done();
        }
      });
    });

    it('/home should return statusCode 401 since not authenticated', function (done) {
      request.get('http://localhost:3000/home', function (error, response, body) {
        if (error) {
          e(error);
          done();
        } else {
          
          assert.strictEqual(response.statusCode, 401);
          done();
        }
      });
    });

    it('/logout should return statusCode 200', function (done) {
      request.get('http://localhost:3000/logout', function (error, response, body) {
        if (error) {
          e(error);
          done();
        } else {
          
          assert.strictEqual(response.statusCode, 200);
          done();
        }
      });
    });

    it('function trimTweets', function (done) {
      var now = Date();
      var timeline = [{
        created_at: now,
        id:1,
        text:'1',
        user: {
          id: 1,
          name: '1',
          screen_name: '1'
        }
      },{
        created_at: now,
        id:2,
        text:'2',
        user: {
          id: 2,
          name: '2',
          screen_name: '2'
        }
      },{
        created_at: now,
        id:3,
        text:'3',
        user: {
          id: 3,
          name: '3',
          screen_name: '3'
        }
      }
      ];
      assert.deepEqual(timeline, index.trimTweets(timeline));
      done();
    });

    /*
    it('/oauth/twitter/auth should return statusCode 200 and twitter auth page', function (done) {
      this.timeout(4000);
      request.get('http://localhost:3000/oauth/twitter/auth', function (error, response, body) {
        if (error) {
          e(error);
          done();
        } else {
          assert.strictEqual(response.statusCode, 200);
          done();
        }
      });
    });
    */
  });

  describe('Abnormal cases', function () {
    it('/get, should returns 404 not found', function (done) {
      request.get('http://localhost:3000/get', function (error, response, body) {
        if (error) {
          e(error);
          done();
        } else {
          
          assert.strictEqual(response.statusCode, 404);
          assert.strictEqual(body, 'Not Found');
          done();
        }
      });
    });

    it('/post, should returns 400 bad request', function (done) {
      request.post('http://localhost:3000/post', function (error, response, body) {
        if (error) {
          e(error);
        } else {
          
          assert.strictEqual(response.statusCode, 400);
          assert.strictEqual(body, 'Bad Request');
        }
        done();
      });
    });

    it('/put, should returns 400 bad request', function (done) {
      request.put('http://localhost:3000/put', function (error, response, body) {
        if (error) {
          e(error);
        } else {
          
          assert.strictEqual(response.statusCode, 400);
          assert.strictEqual(body, 'Bad Request');
        }
        done();
      });
    });

    it('/delete, should returns 400 bad request', function (done) {
      request.del('http://localhost:3000/delete', function (error, response, body) {
        if (error) {
          e(error);
        } else {
          
          assert.strictEqual(response.statusCode, 400);
          assert.strictEqual(body, 'Bad Request');
        }
        done();
      });
    });
  });

///*
  describe('Normal cases - Authorized', function () {

    it('/home should be authorized', function (done) {
      request.get({url: 'http://localhost:3000/home'}, function (error, response, body) {
        //l(getSID(response.req._headers.cookie)); // HERE IS DEBUG CODE ! ! ! ! !
        var sid = getSID(response.req._headers.cookie);
        index.sessionStore.set(
          sid, {
            cookie: {
              expires: null
            },
            passport: {
              user: {
                id:123456789, 
                token:'2856049496-11vlxDgOkKiz6Crh89Yr2sWZd28dGcfNBcIYxMp', 
                tokenSecret:'2i0Rg1gMWJpDfCnEJgaUQNE0q49zjlLYSCxVvBOwsiwYq'
              }
            }
          }, function (error) {
            //index.sessionStore.get(sid, function (error, session) {l('=== 1 ===');l(response.statusCode);l(session);});
            assert.strictEqual(response.statusCode, 401);
            request.get({url: 'http://localhost:3000/home'}, function (error, response, body) {
              //index.sessionStore.get(sid, function (error, session) {l('=== 2 ===');l(response.statusCode);l(session);});
              assert.strictEqual(response.statusCode, 200);
              done();
            });
        });
      });
    });

    it('socket io test', function (done) {
      var io = require('socket.io-client');
      var socket = io.connect('http://localhost:3000/home');
      setTimeout(function() {done();}, 1000);
    });

    after(function (done) {
      done();
    });
  });
//*/
  after(function (done) {
    index.sessionStore.clear(function (error) { e(error); });
    server.close(function () {
      index.db.disconnect();
      process.exit();
      done()
    })
  });
});