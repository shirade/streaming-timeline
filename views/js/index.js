var socket = io();

function init () {
  socket.emit('init');
};

socket.on('init', function (tweets) {
  var timeline = $('#timeline');
  for (var i = 0; i < tweets.length; i++) {
    var tweet = tweets[i];
    // 関数にしてみる
    timeline.append(tweetUL(tweet));
  };
});

socket.on('tweet', function (tweet) {
  $('#timeline .tweet:last').remove();
  $('#timeline').prepend(tweetUL(tweet));
});

socket.on('delete', function (tweet) {
  $('#timeline .tweet[uid="' + tweet.id + '"]').remove();
});

window.onload = init;
window.onunload = function () {
  socket.emit('unconnect');
};

// tweet の li　要素を作る関数
// 独自に使っても良い属性を検索する
function tweetUL (tweet) {
  return '<li class="tweet" uid="' + tweet.id + '">' +  tweet.text + '<div class="footer"> - ' + tweet.user.name + ' posted at ' + (new Date(tweet.created_at)).toLocaleString("ja-JP") +'</div></li>';
}