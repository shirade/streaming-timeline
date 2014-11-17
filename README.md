[![Build Status](https://travis-ci.org/shirade/twitter-with-socketio.svg?branch=master)](https://travis-ci.org/shirade/twitter-with-socketio)

#twitter-with-socketio
---

##Intro
Twitter Client with Node.js, Express, Passport and Socket.io

##Spec
This app show recent 5 tweets of your timeline with OAuth.  
Notifications of new tweet, deleted tweet etc. are reflected  
on this client with socket.io and Twitter Streaming API. 

##Environment variables
You need to export environment variables to start twitter client and run test code.  

For twitter client,
```bash
$ export HOST_NAME='your_host_name' # default:localhost
$ export PORT='your_port' # default:3000
$ export COOKIE_SECRET='your_cookie_secret' # default:secret
$ export TWITTER_CONSUMER_KEY='your_app_consumer_key'
$ export TWITTER_CONSUMER_SECRET='your_app_consumer_secret'
```

For test,
```bash
$ export TWITTER_TOKEN_KEY='your_token_key'
$ export TWITTER_TOKEN_SECRET='your_token_secret'
$ export TWITTER_USER_ID='your_twitter_user_id'
```
* your_twitter_user_id must be an id associated with your tokens.

##Test
```bash
$ npm test
```

##socket.io events
* **tweet(s)**  
This event emitted when you open timeline or there is a new tweet.

* **delete**  
This event emitted when there is a tweet to delete.