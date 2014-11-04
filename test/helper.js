var path = require('path');
var assert = require('assert');

var l = console.log;
var rootPath = path.join(__dirname + '/..');
var helper;

describe('Test of helper.js - client side javascript', function () {
  before(function (done) {
    helper = require(path.join(rootPath + '/views/js/helper'));
    done();
  });

  it('function - tweetUL returns <li> element', function (done) {
    /*
      For example,
      <li class="tweet" data-uid="1234">test<div class="footer"> - test user posted at Thu Oct 30 2014 12:13:11 GMT+0900 (JST)</div></li>
      is expected.
    */
    var now = Date();
    var expected = '<li class="tweet" data-uid="1234">test<div class="footer"> - test user posted at ' + now + '</div></li>'
    var result = helper.tweetUL({ id: 1234, text:'test', user: {name: 'test user'}, created_at: now});
    assert.strictEqual(result, expected);
    done();
  });
});