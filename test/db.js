var path = require('path');
var assert = require('assert');
var debug = require('debug')('test.db');

var rootPath = path.join(__dirname, '..');
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
  describe('Normal cases', function () {
    before(function (done) {
      db = require(path.join(rootPath, 'lib', 'db'));
      done();
    });

    it('upsertUser - successful case since the user is not in the database', function (done) {
      var timeline = [{id:12340000, text:'text 0', created_at: now}];
      db.upsertUser(createTestUserWithTimeline(timeline), function (error, user) {
        verifyUser(user);
        assert.notDeepEqual(user.timeline, timeline);
        done();
      });
    });

    it('getUser - User 12345678 has only 1 tweet, this becomes error', function (done) {
      db.getUser(testUser.id, function (error, user) {
        verifyUser(user);
        assert.strictEqual(error, null);
        assert.strictEqual(user.timeline.length, 1);
        done();
      });
    });

    it('upsertUser - case of the user is already in the database and overwrite timeline with new ones', function (done) {
      var timeline = [
        {id:12340001, text:'text 1', created_at: now},
        {id:12340002, text:'text 2', created_at: now},
        {id:12340003, text:'text 3', created_at: now},
        {id:12340004, text:'text 4', created_at: now},
        {id:12340005, text:'text 5', created_at: now}
      ];
      db.upsertUser(createTestUserWithTimeline(timeline), function (error, user) {
        verifyUser(user);
        assert.notDeepEqual(user.timeline, timeline);
        done();
      });
    });

    it('insertTweet - insert new tweet to user\'s timeline', function (done) {
      var tweet = {
        id: 12340006,
        text: 'text 6',
        created_at: now
      };
      db.insertTweet(tweet, testUser.id, function (error, user) {
        verifyUser(user);
        assert.deepEqual(user.timeline[5], tweet);
        done();
      });
    });

    it('removeTweet - remove deleted tweet from user\'s timeline', function (done) {
      var tweet = {
        user_id: testUser.id,
        id: 12340006
      };
      db.removeTweet(tweet, function (error, user) {
        verifyUser(user);
        assert.strictEqual(error, null);
        assert.strictEqual(user.timeline.length, 5);
        done();
      });
    });

    it('getUser - get fifth tweet from user\' timeline', function (done) {
      db.getUser(testUser.id, function (error, user) {
        verifyUser(user);
        assert.strictEqual(error, null);
        assert.strictEqual(user.timeline.length, 5);
        done();
      });
    });

    after(function (done) {
      db.User.remove({}, function (error) {
        if (error) console.error(error);
        done();
      });
    });
  });

  describe('Abnormal cases', function () {
    it('upsertUser - should return error since arg[0] is not user object', function (done) {
      db.upsertUser('Test user', function (error, user) {
        assert.strictEqual(error, 'upsertUser: args error');
        assert.strictEqual(user, null);
        done();
      });
    });

    it('insertTweet - should return error since tweet object doesn\'t have id property', function (done) {
      var tweet = {
        text: 'text 6',
        created_at: now
      };
      db.insertTweet(tweet, testUser.id, function (error, user) {
        assert.strictEqual(error, 'insertTweet: args error');
        assert.strictEqual(user, null);
        done();
      });
    });
  });
});