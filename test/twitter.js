/***
  How to prepare io()?
***/
var path = require('path');
var assert = require('assert');
var debug = require('debug')('test.debug');

var rootPath = path.join(__dirname, '..');
var twitter;

/*
describe('Test of Twitter.js - client side javascript', function () {
  before(function (done) {
    twitter = require(path.join(rootPath, 'public', 'js', 'twitter.js'));
    done();
  });

  it('function - tweetUL returns <li> element', function (done) {
    var tweet = { id: 1234, text:'test', user: {name: 'test user', screen_name: 'test', profile_image_url: 'dummy'}};
    var now = Date();
    var result = twitter.createTweetLi(tweet);
    done();
  });
});
*/