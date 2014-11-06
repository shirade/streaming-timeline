var l = console.log;
var e = console.error;

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports.connect = function (url) {
  mongoose.connect(url);
}

module.exports.disconnect = function () {
  mongoose.disconnect();
}

mongoose.connection.once('open', function () {
  //console.log('MongoDB was connected');
}).on('close', function () {
  //console.log('MongoDB was disconnected');
}).on('error', function (error) {
  console.error(error);
});

var userSchema = new Schema({
  id: Number,
  name: String,
  screenName: String,
  timeline: Array,
  authenticated: Boolean
});

var User = mongoose.model('User', userSchema);

module.exports.User = User;

module.exports.storeUser = function (user, callback) {
  newUser = new User(user);
  User.findOne({id: newUser.id}, function (error, user) {
    if (user) {
      //console.log('User Already Exists');
      user.screenName = newUser.screenName;
      user.timeline = newUser.timeline;
      user.save(function (error) {
        callback(error, user);
      });
    } else {
      //console.log('User Doesn\'t Exist');
      newUser.save(function (error) {
        callback(error, newUser);
      });
    }
  });
}

module.exports.pushTweet = function (tweet, userID, callback) {
  User.findOneAndUpdate({id: userID}, {$push: {timeline: {$each: [tweet], $sort: {created_at: -1}}}}, function (error, user) {
    callback(error, user);
  });
};

module.exports.popTweet = function (tweet, callback) {
  User.findOne({id: tweet.user_id}, function (error, user) {
    for (var i = 0; i < user.timeline.length; i++) {
      if (user.timeline[i].id == tweet.id) {
        user.timeline.splice(i, 1);
        break;
      }
    }
    user.save(function (error) {
      callback(error, user);
    })
  });
};

module.exports.getFifthTweet = function (userID, callback) {
  User.findOne({id: userID}, function (error, user) {
    if (user.timeline[4]) {
      callback(error, user.timeline[4]);
    } else {
      callback('no more tweet', null);
    }
  });
};
