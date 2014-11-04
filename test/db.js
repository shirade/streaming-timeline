var path = require('path');
var assert = require('assert');

var l = console.log;
var rootPath = path.join(__dirname + '/..');
var db;

describe('Test of db.js - original database library', function () {
  before(function (done) {
    db = require(path.join(rootPath + '/lib/db'));
    db.connect('mongodb://localhost/test');
    setTimeout(function() {
      done();
    }, 500);
  });

  it('storeUser - case of the user is not in the database', function (done) {
    var now = Date();
    db.storeUser({
      id: 12345678,
      name: 'test user',
      screenName: 'test screenName',
      timeline: [{id:12340006, text:'text 6', created_at: now}]
    }, function (error, user) {
      assert.strictEqual(error, null);
      done();
    });
  });

  it('getFifthTweet - User 12345678 has only 1 tweet, this becomes error', function (done) {
    db.getFifthTweet(12345678, function (error, tweet) {
      assert.strictEqual(error, 'no more tweet');
      done();
    });
  });

  it('storeUser - case of the user is already in the database', function (done) {
    var now = Date();
    db.storeUser({
      id: 12345678,
      name: 'test user',
      screenName: 'test screenName',
      timeline: [
        {id:12340001, text:'text 1', created_at: now},
        {id:12340002, text:'text 2', created_at: now},
        {id:12340003, text:'text 3', created_at: now},
        {id:12340004, text:'text 4', created_at: now},
        {id:12340005, text:'text 5', created_at: now}
      ]
    }, function (error, user) {
      assert.strictEqual(error, null);
      done();
    });
  });

  it('pushTweet - push new tweet to user\'s timeline', function (done) {
    var now = Date();
    var tweet = {
      id: 12340006,
      text: 'text',
      created_at: now
    };
    db.pushTweet(tweet, 12345678, function (error, user) {
      assert.strictEqual(error, null);
      done();
    });
  });

  it('popTweet - pop deleted tweet from user\'s timeline', function (done) {
    var tweet = {
      user_id: 12345678,
      id: 12340006
    };
    db.popTweet(tweet, function (error, user) {
      assert.strictEqual(error, null);
      done();
    });
  });

  it('getFifthTweet - get fifth tweet from user\' timeline', function (done) {
    db.getFifthTweet(12345678, function (error, tweet) {
      assert.strictEqual(error, null);
      done();
    });
  });

  after(function (done) {
    db.User.remove({}, function (error) {
      db.disconnect();
      done();
    });
  });
});