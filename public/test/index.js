$(document).ready(function () {
  if (window.mochaPhantomJS) { 
    mochaPhantomJS.run();
  } else { 
    mocha.run();
  }
  mocha.ui('tdd');
  mocha.reporter('html');
  var should = chai.should();
  describe('test', function () {
    it('test', function (callback) {
      $('body a').text().should.equal('Login with Twitter');
      callback();
    });
  });
});