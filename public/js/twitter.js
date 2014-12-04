(function () {
  var socket = io();
  socket.on('tweet(s)', function (msg) {
    var timeline = $('#timeline');
    if (msg.length === 1) {
      timeline.prepend(createTweetLi(msg[0]));
    } else {
      msg.map(function (tweet, index) {
        timeline.append(createTweetLi(tweet));
      });
    }
  }).on('delete', function (tweet) { 
    $('#' + tweet.id).remove();
  }).on('error', function () {
    $('.tweet').remove();
    $('#timeline').prepend('<li class="error">A error has occured. Please re-login.</li>');
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
 })();
  