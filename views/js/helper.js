// tweet の li　要素を作る関数
// 独自に使っても良い属性を検索する
function tweetUL (tweet) {
  return '<li class="tweet" data-uid="' + tweet.id + '">' +  tweet.text + '<div class="footer"> - ' + tweet.user.name + ' posted at ' + (new Date(tweet.created_at)).toLocaleString("ja-JP") +'</div></li>';
}

// どうやったら奇麗に関数をテスタブルにできるのか
module.exports.tweetUL = tweetUL;