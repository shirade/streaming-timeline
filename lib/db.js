var debug = require('debug')('db');

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.connection.on('open', function () {
  debug('MongoDB was connected');
}).on('close', function () {
  debug('MongoDB was disconnected');
}).on('error', function (error) {
  console.error(error);
});

mongoose.connect('mongodb://localhost/twitter');

var userSchema = new Schema({
  id: Number,
  name: String,
  screenName: String,
  timeline: Array
});

var User = mongoose.model('User', userSchema);

module.exports.User = User;

module.exports.upsertUser = function (user, callback) {
  if (typeof user === 'object') {
    user = new User(user);
    User.findOneAndUpdate(
      {id: user.id}, {
        id: user.id,
        name: user.name,
        screenName: user.screenName,
        timeline: user.timeline
      }, {upsert: true}, 
      callback
    );
  } else {
    callback('upsertUser: args error', null);
  }
}

module.exports.insertTweet = function (tweet, userID, callback) {
  if (typeof tweet === 'object' && tweet.id && tweet.text) {
    User.findOneAndUpdate(
      {id: userID}, 
      {$push: {timeline: {$each: [tweet], $sort: {created_at: -1}}}},
      callback
    );
  } else {
    callback('insertTweet: args error' ,null);
  }
};

module.exports.removeTweet = function (tweet, callback) {
  User.findOne({id: tweet.user_id}, function (error, user) {
    for (var i = 0; i < user.timeline.length; i++) {
      if (user.timeline[i].id == tweet.id) {
        user.timeline.splice(i, 1);
        break;
      }
    }
    user.save(function (error) {
      callback(error, user);
    });
  });
};

// 
module.exports.getUser = function (userID, callback) {
  User.findOne({id: userID}, callback);
};
