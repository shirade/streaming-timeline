var debug = require('debug')('db');

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.connection.on('error', function (error) {
  console.error(error);
});

mongoose.connect('mongodb://localhost/twitter');

var userSchema = new Schema({
  id: Number,
  name: String,
  screen_name: String,
  timeline: Array
});

var User = mongoose.model('User', userSchema);

module.exports.User = User;

module.exports.findOneUserAndUpdate = function (user, callback) {
  if (validateUserObject(user)) {
    var newUser = new User(user);
    User.findOneAndUpdate(
      {id: user.id}, {
        // newUser じゃだめなの？ あとで調査
        id: newUser.id,
        name: newUser.name,
        screen_name: newUser.screen_name,
        timeline: newUser.timeline
      }, {upsert: true}, 
      callback
    );
  } else {
    callback(['arg error', user], null);
  }
}

module.exports.findOneUserAndInsertTweet = function (tweet, userID, callback) {
  if (validateTweetObject(tweet)) {
    User.findOneAndUpdate(
      {id: userID}, 
      {$push: {timeline: {$each: [tweet], $sort: {created_at: -1}}}},
      callback
    );
  } else {
    callback(['arg error', tweet], null);
  }
};

module.exports.findOneUserAndRemoveTweet = function (tweet, callback) {
  if (typeof tweet === 'object' && tweet.user_id && tweet.id) {
    User.findOne({id: tweet.user_id}, function (error, user) {
      if (!user) {
        callback(['user not found', tweet], user);
      } else {
        for (var i = 0; i < user.timeline.length; i++) {
          if (user.timeline[i].id == tweet.id) {
            user.timeline.splice(i, 1);
            break;
          }
        }
        user.save(function (error) {
          callback(error, user);
        });
      }
    });
  } else {
    callback(['arg error', tweet], null);
  }
};

// 
module.exports.findOneUser = function (userID, callback) {
  User.findOne({id: userID}, callback);
};

function validateTweetObject (tweet) {
  if (typeof tweet === 'object' && tweet.id && tweet.created_at && tweet.text && tweet.user) {
    var user = tweet.user;
    if (user.id && user.name && user.screen_name && user.profile_image_url) {
      return true;
    }
  }
  return false;
};

function validateUserObject (user) {
  if (typeof user === 'object' && user.id && user.name && user.screen_name && user.timeline) {
    var timeline = user.timeline;
    if (Array.isArray(timeline) && (timeline.length === 0 || timeline.map(validateTweetObject).indexOf(false) === -1)) {
      return true;
    };
  }
  return false;
};