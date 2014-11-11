var path = require('path');
var assert = require('assert');
var debug = require('debug')('test.db');

var rootPath = path.join(__dirname, '..');
var db, now = Date();

var testUser = {
  id: 12345678,
  name: 'test user',
  screen_name: 'test screen_name'
}

function verifyUser (user) {
  assert.strictEqual(user.id, testUser.id);
  assert.strictEqual(user.name, testUser.name);
  assert.strictEqual(user.screen_name, testUser.screen_name);
};

function createTestUserWithTimeline (timeline) {
  return {
    id: testUser.id,
    name: testUser.name,
    screen_name: testUser.screen_name,
    timeline: timeline,
    profile_image_url: 'http://dummy.profile.image.url'
  };
};

describe('Test of db.js - original database library', function () {
  describe('Normal cases', function () {
    before(function (done) {
      db = require(path.join(rootPath, 'lib', 'db'));
      done();
    });

    it('findOneUserAndUpdate - successful case since the user is not in the database', function (done) {
      var timeline = [{id:12340000, text:'text 0', created_at: now, user: createTestUserWithTimeline([])}];
      db.findOneUserAndUpdate(createTestUserWithTimeline(timeline), function (error, user) {
        verifyUser(user);
        assert.notDeepEqual(user.timeline, timeline);
        done();
      });
    });

    it('findOneUser - should return a user who has only 1 tweet', function (done) {
      db.findOneUser(testUser.id, function (error, user) {
        verifyUser(user);
        assert.strictEqual(error, null);
        assert.strictEqual(user.timeline.length, 1);
        done();
      });
    });

    it('findOneUserAndUpdate - case of the user is already in the database and overwrite timeline with new ones', function (done) {
      var timeline = [
        {id:12340001, text:'text 1', created_at: now, user: createTestUserWithTimeline([])},
        {id:12340002, text:'text 2', created_at: now, user: createTestUserWithTimeline([])},
        {id:12340003, text:'text 3', created_at: now, user: createTestUserWithTimeline([])},
        {id:12340004, text:'text 4', created_at: now, user: createTestUserWithTimeline([])},
        {id:12340005, text:'text 5', created_at: now, user: createTestUserWithTimeline([])}
      ];
      db.findOneUserAndUpdate(createTestUserWithTimeline(timeline), function (error, user) {
        verifyUser(user);
        assert.notDeepEqual(user.timeline, timeline);
        done();
      });
    });

    it('findOneUserAndInsertTweet - insert new tweet to user\'s timeline', function (done) {
      var tweet = {
        id: 12340006,
        text: 'text 6',
        created_at: now,
        user: createTestUserWithTimeline([])
      };
      db.findOneUserAndInsertTweet(tweet, testUser.id, function (error, user) {
        verifyUser(user);
        assert.deepEqual(user.timeline[5], tweet);
        done();
      });
    });

    it('findOneUserAndRemoveTweet - remove deleted tweet from user\'s timeline', function (done) {
      var tweet = {
        user_id: testUser.id,
        id: 12340006
      };
      db.findOneUserAndRemoveTweet(tweet, function (error, user) {
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
    it('findOneUserAndUpdate - should return error since arg[0] is not user object', function (done) {
      db.findOneUserAndUpdate(testUser.name, function (error, user) {
        assert.deepEqual(error, ['arg error', testUser.name]);
        assert.strictEqual(user, null);
        done();
      });
    });

    it('findOneUserAndInsertTweet - should return error since tweet object doesn\'t have id property', function (done) {
      var tweet = {
        text: 'text 6',
        created_at: now
      };
      db.findOneUserAndInsertTweet(tweet, testUser.id, function (error, user) {
        assert.deepEqual(error, ['arg error', tweet]);
        assert.strictEqual(user, null);
        done();
      });
    });
    it('findOneUserAndRemoveTweet - should return error since tweet object doesn\'t have id property', function (done) {
      var tweet = {
        user_id: 12345678
      };
      db.findOneUserAndRemoveTweet(tweet, function (error, user) {
        assert.deepEqual(error, ['arg error', tweet]);
        assert.strictEqual(user, null);
        done();
      });
    });
    it('findOneUserAndRemoveTweet - should return error since there is no user', function (done) {
      var tweet = {
        id: 12340001,
        user_id: 12349999
      };
      db.findOneUserAndRemoveTweet(tweet, function (error, user) {
        assert.deepEqual(error, ['user not found', tweet]);
        assert.strictEqual(user, null);
        done();
      });
    });
  });
});