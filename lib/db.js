var l = console.log;
var e = console.error;

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost/twitter');

mongoose.connection.once('open', function () {
  console.log('MongoDB was connected');
}).on('close', function () {
  console.log('MongoDB was disconnected');
}).on('error', function (error) {
  console.error(error);
});

var userSchema = new Schema({
  id: Number,
  name: String,
  screenName: String,
  timeline: Array
});

var User = mongoose.model('User', userSchema);

module.exports.storeUser = function (user) {
  if (typeof user !== 'object') {
    console.error('user must be an object');
    return;
  }
  user = new User({
    id: user.id,
    name: user.name,
    screenName: user.screenName,
    timeline: user.timeline
  });
  User.findOne({id: user.id}, function (error, u) {
    if (error) {
      console.error(error);
    } else {
      if (u) {
        console.log('User Exists');
        u.screenName = user.screenName;
        u.timeline = user.timeline;
        u.save(function (error) {
          if (error) console.error(error);
        });
      } else {
        console.log('User Doesn\'t Exist');
        user.save(function (error) {
          if (error) console.error(error);
        });
      }
    }
  });
}

module.exports.pushTweet = function (tweet, userID) {
  if (typeof tweet !== 'object') {
    console.error('timeline must be an object');
    return;
  }
  if (userID == null) {
    return;
  }
  User.findOneAndUpdate({id: userID}, {$push: {timeline: {$each: [tweet], $sort: {created_at: -1}}}}, function (error, user) {
    console.log('New tweet was pushed');
  });
}

module.exports.popTweet = function (tweet) {
  if (typeof tweet !== 'object') {
    console.error('tweet must be an object');
    return;
  }
  User.findOne({id: tweet.user_id}, function (error, user) {
    var timeline = user.timeline;
    if (timeline === null) {
      return;
    }
    for (var i = 0; i < timeline.length; i++) {
      if (timeline[i].id == tweet.id) {
        delete timeline.splice(i, 1);
        break;
      }
    }
    user.timeline = timeline;
    user.save(function (error) {
      if (error) {
        console.error(error);
      } else {
        console.log('Tweet was poped from ' + user.name);
      }
    })
  });
}

module.exports.getTimeline = function (userID, callback) {
  if (userID == null) {
    callback([{
      id: -1,
      created_at: Date(),
      text: 'Plase login.',
      user: {
        name: 'Admin'
      }
    }]);
  } else {
    User.findOne({id: userID}, function (error, user) {
      // 200 is temporary num.
      // Return only five tweets
      //console.log(user.timeline.splice(5, 200));
      user.timeline.splice(5, 200);
      callback(error, user.timeline);
    });
  }
}




