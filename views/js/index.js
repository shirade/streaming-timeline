var socket = io();

function init () {
  socket.emit('update');
};

var options = {
  weekday: "long", year: "numeric", month: "short",
  day: "numeric", hour: "2-digit", minute: "2-digit"
};

socket.on('update', function (msg) {
  var timeline = $('#timeline');
  if (msg.hasOwnProperty('errors')) {
    timeline.append('<li class="tweet" style="text-align:center;">I am sorry.<br>Now we can\'t access new tweets because of over access.<br>After 15 minutes, please try again.</li>');
  } else {
    timeline.empty();
    for (var i = 0; i < msg.length; i++) {
      var tweet = msg[i];
      timeline.append('<li class="tweet">' +  tweet.text + '<br> - ' + tweet.user.name + ' posted at ' + (new Date(tweet.created_at)).toLocaleTimeString("ja-JP") +'</li>');
    }
  }
  setTimeout(function () {
    socket.emit('update');
  }, 90 * 1000);
});

 window.onload=init;
 window.onunload=function () {
   socket.emit('unconnect');
 }