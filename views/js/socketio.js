 (function () {
   var socket = io();

  socket.on('init', function (tweets) {
    var timeline = $('#timeline');
    for (var i = 0; i < tweets.length; i++) {
      var tweet = tweets[i];
      timeline.append(tweetUL(tweet));
    };
  });

  socket.on('new tweet', function (tweet) {
    $('#timeline .tweet:last').remove();
    $('#timeline').prepend(tweetUL(tweet));
  });

  socket.on('delete tweet', function (tweet) { 
    if ($('#timeline .tweet[data-uid=' + tweet.id + ']').remove().length == 1) {
      socket.emit('tweet');
    }
  });

  socket.on('supplemental tweet', function (tweet) {
    $('#timeline').append(tweetUL(tweet));
  });

  socket.on('redirect index', function () {
    location.href='/';
  });

  window.onload = function () {
    socket.emit('init');
  };;
  window.onunload = function () {
    socket.emit('unconnect');
  };
 })();
  