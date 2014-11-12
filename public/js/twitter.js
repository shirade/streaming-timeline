(function () {
  var socket = io();

  socket.on('tweets', function (tweets) {
    var timeline = $('#timeline');
    for (var i = 0; i < tweets.length; i++) {
      var tweet = tweets[i];
      timeline.append(createTweetLi(tweet));
    };
  });

  socket.on('new tweet', function (tweet) {
    if ($('#timeline .tweet').length > 4) $('#timeline .tweet:last').remove();
    $('#timeline').prepend(createTweetLi(tweet));
  });

  socket.on('delete tweet', function (tweet) { 
    if ($('#timeline .tweet[id=' + tweet.id + ']').remove().length == 1) {
      socket.emit('supplemental tweet');
    }
  });

  socket.on('supplemental tweet', function (tweet) {
    $('#timeline').append(createTweetLi(tweet));
  });

  function createTweetLi (tweet) {
    return '<li class="tweet" id=' + tweet.id + '>' 
      + '<div class="image_frame">'
      + '<img class="image" src="' + tweet.user.profile_image_url + '" alt="' + tweet.user.screen_name + '">'
      + '</div>'
      + '<div class="user">' + tweet.user.name + ' @' + tweet.user.screen_name + '</div>'
      + '<div class="text">' + tweet.text + '</div>'
      + '</li>';
  };

  module.exports.createTweetLi = createTweetLi;
 })();
  