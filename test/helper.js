var path = require('path');
var assert = require('assert');

var l = console.log;
var rootPath = path.join(__dirname + '/..');
var helper;

function createTweetUL (tweet) {
  var ul = '<ul class="tweet" data-uid=' + tweet.id + '>';
  ul += '<div class="image_frame">';
  ul += '<div class="image"><img src="' + tweet.user.profile_image_url + '" alt="' + tweet.user.screen_name + '" style="border-radius: 7px;"></div>';
  ul += '</div>';
  ul += '<div class="user">' + tweet.user.name + ' @' + tweet.user.screen_name + '</div>';  
  ul += '<div class="text">' + tweet.text + '</div>';
  //ul += '<div class="delete"><a href="delete">delete(do not push)</a></div>';
  ul += '</ul>';
  return ul;
};

describe('Test of helper.js - client side javascript', function () {
  before(function (done) {
    helper = require(path.join(rootPath + '/views/js/helper'));
    done();
  });

  it('function - tweetUL returns <li> element', function (done) {
    var tweet = { id: 1234, text:'test', user: {name: 'test user', screen_name: 'test', profile_image_url: 'dummy'}};
    var now = Date();
    var result = helper.tweetUL(tweet);
    assert.strictEqual(result, createTweetUL(tweet));
    done();
  });
});