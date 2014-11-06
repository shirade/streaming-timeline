function tweetUL (tweet) {
  var ul = '';
  ul += '<ul class="tweet" data-uid=' + tweet.id + '>';
  ul += '<div class="image_frame">';
  ul += '<div class="image"><img src="' + tweet.user.profile_image_url + '" alt="' + tweet.user.screen_name + '" style="border-radius: 7px;"></div>';
  ul += '</div>';
  ul += '<div class="user">' + tweet.user.name + ' @' + tweet.user.screen_name + '</div>';  
  ul += '<div class="text">' + tweet.text + '</div>';
  //ul += '<div class="delete"><a href="delete">delete(do not push)</a></div>';
  ul += '</ul>';
  return ul;
}
module.exports.tweetUL = tweetUL;