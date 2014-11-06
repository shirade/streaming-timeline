[![Build Status](https://travis-ci.org/shirade/twitter-with-socketio.svg?branch=master)](https://travis-ci.org/shirade/twitter-with-socketio)

#twitter-with-socketio
---

##Intro
Twitter Client with Node.js, Express, Passport and Socket.io

##Spec
This app show recent 5 tweets of your timeline with OAuth.  
Notifications of new tweet, deleted tweet etc. are immediately processed  
and reflected on your timeline with socket.io and Twitter Streaming API. 

##Enviroment variables
You need to export environment variables to start twitter client and run test code.  

For twitter clinet, you need to export the followings.
```bash
$ export NODE_CONSUMER_KEY='your_app_consumer_key'
$ export NODE_CONSUMER_SECRET='your_app_consumer_secret'
```

For running test code, you need to export the followings.
```bash
$ export NODE_TOKEN_KEY='your_token_key'
$ export NODE_TOKEN_SECRET='your_token_secret'
$ export NODE_USER_ID='your_twitter_user_id'
```
* your_twitter_user_id must be an id associated with your tokens.

##Test
```bash
$ npm test
```