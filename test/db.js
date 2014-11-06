var path = require('path');
var assert = require('assert');

var l = console.log;
var e = console.error;
var rootPath = path.join(__dirname + '/..');
var db, now = Date();

var testUser = {
  id: 12345678,
  name: 'test user',
  screenName: 'test screenName',
}

function verifyUser (user) {
  assert.strictEqual(user.id, testUser.id);
  assert.strictEqual(user.name, testUser.name);
  assert.strictEqual(user.screenName, testUser.screenName);
};

function createTestUserWithTimeline (timeline) {
  return {
    id: testUser.id,
    name: testUser.name,
    screenName: testUser.screenName,
    timeline: timeline
  };
};

describe('Test of db.js - original database library', function () {
  before(function (done) {
    db = require(path.join(rootPath + '/lib/db'));
    db.connect('mongodb://localhost/test');
    setTimeout(function() {
      done();
    }, 500);
  });

  it('storeUser - successful case since the user is not in the database', function (done) {
    var timeline = [{id:12340000, text:'text 0', created_at: now}];
    db.storeUser(createTestUserWithTimeline(timeline), function (error, user) {
      verifyUser(user);
      assert.notDeepEqual(user.timeline, timeline);
      done();
    });
  });

  it('getFifthTweet - User 12345678 has only 1 tweet, this becomes error', function (done) {
    db.getFifthTweet(testUser.id, function (error, tweet) {
      assert.strictEqual(tweet, null);
      assert.strictEqual(error, 'no more tweet');
      done();
    });
  });

  it('storeUser - case of the user is already in the database and overwrite timeline with new ones', function (done) {
    var timeline = [
      {id:12340001, text:'text 1', created_at: now},
      {id:12340002, text:'text 2', created_at: now},
      {id:12340003, text:'text 3', created_at: now},
      {id:12340004, text:'text 4', created_at: now},
      {id:12340005, text:'text 5', created_at: now}
    ];
    db.storeUser(createTestUserWithTimeline(timeline), function (error, user) {
      verifyUser(user);
      assert.notDeepEqual(user.timeline, timeline);
      done();
    });
  });

  it('pushTweet - push new tweet to user\'s timeline', function (done) {
    var tweet = {
      id: 12340006,
      text: 'text 6',
      created_at: now
    };
    db.pushTweet(tweet, testUser.id, function (error, user) {
      verifyUser(user);
      assert.deepEqual(user.timeline[5], tweet);
      done();
    });
  });

  it('popTweet - pop deleted tweet from user\'s timeline', function (done) {
    var tweet = {
      user_id: testUser.id,
      id: 12340006
    };
    db.popTweet(tweet, function (error, user) {
      verifyUser(user);
      assert.strictEqual(user.timeline.length, 5);
      assert.strictEqual(error, null);
      done();
    });
  });

  it('getFifthTweet - get fifth tweet from user\' timeline', function (done) {
    db.getFifthTweet(testUser.id, function (error, tweet) {
      assert.strictEqual(tweet.id, 12340005);
      assert.strictEqual(tweet.text, 'text 5');
      done();
    });
  });

  after(function (done) {
    db.User.remove({}, function (error) {
      if (error) e(error);
      db.disconnect();
      done();
    });
  });
});