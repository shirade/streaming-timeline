[![Build Status](https://travis-ci.org/shirade/twitter-streaming-timeline.svg?branch=master)](https://travis-ci.org/shirade/twitter-streaming-timeline)

#twitter-with-socketio
---

##Intro
Twitter Sterming Timeline Client with Node.js, Express and Socket.io for the purpose of self-learning.

##Specification
This app show recent 5 tweets of your timeline with OAuth.  
Notifications of new tweet, deleted tweet etc. are reflected with Socket.IO and Twitter Streaming API. 

###socket.io events
* **tweet(s)**  
This event emits when you open timeline or there is a new tweet.

* **delete**  
This event emits when there is a tweet to delete.

* **error**  
This event emits when there is a error on server-side.

##Getting started
For running twitter client locally, you need to export 2 vars at least.  
And you have to launch redis-server on your console.
```bash
$ export TWITTER_CONSUMER_KEY='your_app_consumer_key'
$ export TWITTER_CONSUMER_SECRET='your_app_consumer_secret'
$ export COOKIE_SECRET='your_cookie_secret' 
# => default:secret (option)
```

For running 'npm test', you need to export 3 vars.
```bash
$ export TWITTER_TOKEN_KEY='your_token_key'
$ export TWITTER_TOKEN_SECRET='your_token_secret'
$ export TWITTER_USER_ID='your_twitter_user_id'
# => your_twitter_user_id must be an id associated with your tokens.
```

##Deployment on Heroku
If you wanna deploy this client on Heroku, you need to set 5 vars.  
And you also need to install [REDISTOGO](https://addons.heroku.com/redistogo) add-on.
```bash
$ heroku config:set TWITTER_CONSUMER_KEY='your_app_consumer_key'
$ heroku config:set TWITTER_CONSUMER_SECRET='your_app_consumer_secret'
$ heroku config:set TWITTER_CALLBACK_URL='your_callback_url' 
# => example:https://example.com/twitter_callback
$ heroku config:set COOKIE_SECRET='your_cookie_secret'
$ heroku config:set REDISTOGO_URL='your_redistogo_url' 
# => example:redis://redistogo:abcdefghijklmnopqrstuvwxyz@ddd.redistogo.com:9876/
```