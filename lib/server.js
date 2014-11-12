var qs = require('querystring');
var path = require('path');
var debug = require('debug')('server');

var express = require('express');
var app = express();
var deamon = require('http').Server(app);
var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;
var Twit = require('twit');
var io = require('socket.io')(deamon);

// var db = require(path.join(__dirname, 'db'));
var domain =  process.env['HOST'] || 'localhost';
var port = process.env['PORT'] || '3000';

var cookie = require('cookie');
var cookieParser = require('cookie-parser');
var session = require('express-session');
//var redisClient = require('redis').createClient();
var ConnectRedis = require('connect-redis')(session);
var redisStore = new ConnectRedis({
  //client: redisClient,
  prefix: 'twitterSessionID:'
});

app.set('views', path.join(__dirname, '..', 'views'));
app.set('view engine', 'jade');
app.set('cookieSecret', 'secret')

app.use(express.static(path.join(__dirname, '..', 'public')));

app.use(session({
  secret: app.get('cookieSecret'),
  store: redisStore,
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

var twitterStrategy = new TwitterStrategy({
  consumerKey: process.env['TWITTER_CONSUMER_KEY'],
  consumerSecret: process.env['TWITTER_CONSUMER_SECRET'],
  callbackURL: path.join('http://' + domain + ':' + port, 'twitter_callback') 
  }, function(token, tokenSecret, profile, done) {
    done(null, {
      id: profile.id,
      name: profile.displayName,
      screen_name: profile.username,
      token: token,
      tokenSecret: tokenSecret
    });
  }
);

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(twitterStrategy);

io.on('connect', function(socket){
  var stream, passportSession, twit;
  var sid = getSID(socket);
  debug('%s: socket connected at %s', sid, Date());
  redisStore.get(sid, function (error, session) {
    if (error === null) {
      passportSession = session.passport.user;
      twit = new Twit({
        consumer_key: process.env['TWITTER_CONSUMER_KEY'],
        consumer_secret: process.env['TWITTER_CONSUMER_SECRET'],
        access_token: passportSession.token,
        access_token_secret: passportSession.tokenSecret
      });
      
      stream = twit.stream('user');
      stream.on('tweet', function (tweet) {
        var trimmedTweet = trimTweet(tweet);
        io.to(socket.id).emit('new tweet', trimmedTweet);
        // db.findOneUserAndInsertTweet(trimmedTweet, passportSession.id, function (error, user) {
        //   if (error) console.error(error);
        // });
      }).on('delete', function (msg) {
        io.to(socket.id).emit('delete tweet', msg.delete.status);
        // db.findOneUserAndRemoveTweet(msg.delete.status, function (error, user) {
        //   if (error) console.error(error);
        // });
      });

      twit.get('statuses/home_timeline', {
        trim_user: false,
        count: 3,
        contributor_details: false,
        include_entities: false
      }, function (error, data, response) {
        if (error) console.error(error);
        var timeline = Array.isArray(data) ? data.map(trimTweet) : [];
        io.to(socket.id).emit('tweets', timeline.slice(0, 5));
        // db.findOneUserAndUpdate({
        //   id: passportSession.id,
        //   name: passportSession.name,
        //   screen_name: passportSession.screen_name,
        //   timeline: timeline
        // }, function (error, user) {
        //   if (error) console.error(error);
        // });
      });
    }
  });

  socket.on('supplemental tweet', function () {
    // db.findOneUser(passportSession.id, function (error, user) {
    //   io.to(socket.id).emit('supplemental tweet', user.timeline[4]);
    // });
  }).on('disconnect', function () {
    debug('%s: socket disconnected at %s', sid, Date());
    if (stream) stream.stop();
    if (socket) socket.disconnect();
  });
});

function authenticate (request, response, next) {
  if (request.isAuthenticated()) {
    debug(request.sessionID + ': Authenticated');
    response.render('home');
  } else {
    debug(request.sessionID + ': Not authenticated');
    response.render('index');
  }
};

function logout (request, response, next) {
  request.logout();
  response.redirect('/');
};

app.get('/', authenticate);
app.get('/home', authenticate);
app.get('/logout', logout);
app.get('/twitter_oauth', passport.authenticate('twitter'));
app.get('/twitter_callback', passport.authenticate('twitter', { 
  successRedirect: '/home',
  failureRedirect: '/' 
}));

/**
  Abnormal Case
**/
app.get('/*', function (request, response) {
  response.sendStatus(404);
});
app.all('/*', function (request, response) {
  response.sendStatus(405);
});

function trimTweet (tweet) {
  if (tweet.id && tweet.created_at && tweet.text && tweet.user.id) {
    return {
      created_at: tweet.created_at,
      id: tweet.id,
      text: tweet.text,
      user: {
        id: tweet.user.id,
        name: tweet.user.name,
        screen_name: tweet.user.screen_name,
        profile_image_url: tweet.user.profile_image_url
      }
    };
  } else {
    debug('arg is invalid');
    return null;
  }
};

function getSID (socket) {
  var parsedCookie = cookie.parse(socket.handshake.headers.cookie);
  return cookieParser.signedCookie(parsedCookie['connect.sid'], app.get('cookieSecret'));
};

module.exports = {
  deamon: deamon,
  redisStore: redisStore,
  twitterStrategy: twitterStrategy,
  trimTweet: trimTweet,
  getSID: getSID
};
