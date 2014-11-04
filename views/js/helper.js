function tweetUL (tweet) {
  return '<li class="tweet" data-uid="' + tweet.id + '">' +  tweet.text + '<div class="footer"> - ' + tweet.user.name + ' posted at ' + (new Date(tweet.created_at)).toLocaleString("ja-JP") +'</div></li>';
}

module.exports.tweetUL = tweetUL;