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

var host =  process.env['HOST'] || 'localhost';
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

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(
  new TwitterStrategy({
    consumerKey: process.env['TWITTER_CONSUMER_KEY'],
    consumerSecret: process.env['TWITTER_CONSUMER_SECRET'],
    callbackURL: path.join('http://' + host + ':' + port, 'twitter_callback') 
    }, function(token, tokenSecret, profile, done) {
      done(null, {
        id: profile.id,
        name: profile.displayName,
        screen_name: profile.username,
        token: token,
        tokenSecret: tokenSecret
      });
    }
  )
);

io.on('connect', function(socket){
  var stream, twit;
  var sid = cookieParser.signedCookie(
    cookie.parse(socket.handshake.headers.cookie)['connect.sid'], 
    app.get('cookieSecret')
  );
  debug('%s: socket connected at %s', sid, Date());
  redisStore.get(sid, function (error, session) {
    if (error === null) {
      twit = new Twit({
        consumer_key: process.env['TWITTER_CONSUMER_KEY'],
        consumer_secret: process.env['TWITTER_CONSUMER_SECRET'],
        access_token: session.passport.user.token,
        access_token_secret: session.passport.user.tokenSecret
      });
      
      stream = twit.stream('user');
      stream.on('tweet', function (tweet) {
        var trimmedTweet = trimTweet(tweet);
        io.to(socket.id).emit('tweet(s)', [trimmedTweet]);
      }).on('delete', function (msg) {
        io.to(socket.id).emit('delete', msg.delete.status);
      });

      twit.get('statuses/home_timeline', {
        trim_user: false,
        count: 100,
        contributor_details: false,
        include_entities: false
      }, function (error, timeline, response) {
        if (error) console.error(error);
        io.to(socket.id).emit('tweet(s)', data);
      });
    }
  });

  socket.on('disconnect', function () {
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

module.exports = {
  deamon: deamon,
  redisStore: redisStore
};
