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
  screen_name: String,
  recentTweets: Array,
  token: String,
  tokenSecret: String
});

module.exports.User = mongoose.model('User', userSchema);