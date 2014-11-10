#twitter-with-socketio
---

##Intro
Twitter Client with Node.js, Express, Passport and Socket.io

##Spec
This app show recent 5 tweets of your timeline with OAuth.  
Notifications of new tweet, deleted tweet etc. are immediately processed  
and reflected on this client with socket.io and Twitter Streaming API. 

##Environment variables
You need to export environment variables to start twitter client and run test code.  

For twitter client, you need to export the followings.
```bash
$ export TWITTER_CLIENT_DOMAIN='your_domain' # default:localhost
$ export TWITTER_CLIENT_PORT='your_port' # default:3000
$ export TWITTER_CONSUMER_KEY='your_app_consumer_key'
$ export TWITTER_CONSUMER_SECRET='your_app_consumer_secret'
```

For test code, you need to export the followings.
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
####Server side
* **supplemental tweet**  
Client side sends 'supplemental tweet' event when the number of tweet on your timeline is less than 5 for deletion.
* **disconnect**  
Client side sends 'disconnect' event when you leave your timeline page.

####Client side
* **init**  
Server side sends 'init' event soon after your socket successfully connects.
* **new tweet**  
Server side sends 'new tweet' event soon after it recieve 'tweet' event.
* **delete tweet**  
Server side sends 'delete' event soon after it recieve 'delete' event.

##twit stream events
* **tweet**  
Tiwtter sends 'tweet' event when someone posts a tweet on your timeline.
* **delete**  
Tiwtter sends 'delete' event when someone delete a tweet on your timeline.