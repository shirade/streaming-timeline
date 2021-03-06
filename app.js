/*******
  Require core libraries.
*******/
var path = require('path');
var url = require('url');

/*******
  Require other libraries.
*******/
var express = require('express');
var app = express();
var httpd = require('http').Server(app);
var debug = require('debug')('app');
var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;
var Twit = require('twit');
var io = require('socket.io')(httpd);
var cookie = require('cookie');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var ConnectRedis = require('connect-redis')(session);

/*******
  Prepare to use req module for Testing.
*******/
var request = require('request');

/*******
  Prepare to use session with Redis.
*******/
var store;
if (process.env['REDISTOGO_URL']) {
  var rtg = url.parse(process.env['REDISTOGO_URL']);
  store = new ConnectRedis({
    host: rtg.hostname,
    port: rtg.port,
    pass: rtg.auth.split(':')[1],
    prefix: 'twitterSessionID:'
  });
} else {
  store = new ConnectRedis({
    prefix: 'twitterSessionID:'
  });
}
store.client.on('error', debug);
var cookieSecret = process.env['COOKIE_SECRET'] || 'secret';
app.use(session({
  secret: cookieSecret,
  store: store,
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

/*******
  Prepare to use jade and deliver static contents.
*******/
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'bower_components')));

/*******
  Prepare to use Twitter Strategy.
*******/
var twitterCallbackURL = url.parse(process.env['TWITTER_CALLBACK_URL'] || 'http://localhost:3000/twitter_callback');
passport.use(
  new TwitterStrategy({
    consumerKey: process.env['TWITTER_CONSUMER_KEY'],
    consumerSecret: process.env['TWITTER_CONSUMER_SECRET'],
    callbackURL: twitterCallbackURL.href
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

/*******
  Socket.io
*******/
io.on('connect', function(socket){
  var stream;
  var sid = cookieParser.signedCookie(
    cookie.parse(socket.handshake.headers.cookie)['connect.sid'], 
    cookieSecret
  );
  debug('%s: socket connected at %s', sid, Date());
  store.get(sid, function (error, session) {
    if (error === null) {
      var twit = new Twit({
        consumer_key: process.env['TWITTER_CONSUMER_KEY'],
        consumer_secret: process.env['TWITTER_CONSUMER_SECRET'],
        access_token: session.passport.user.token,
        access_token_secret: session.passport.user.tokenSecret
      });
      stream = twit.stream('user');
      stream.on('tweet', function (tweet) {
        io.to(socket.id).emit('tweet(s)', [tweet]);
      }).on('delete', function (data) {
        io.to(socket.id).emit('delete', data.delete.status);
      }).on('error', debug);
      if (process.env['DEV']) {
        req({url:'http://localhost:50000/home_timeline.json', json:true}, function (error, res, timeline) {
          io.to(socket.id).emit('tweet(s)', timeline);
        });
      } else {
        twit.get('statuses/home_timeline', {
          /**
            The number below decides how many tweets you get at first.
          **/
          count: 20
        }, function (error, timeline, res) {
          io.to(socket.id).emit('tweet(s)', timeline);
        });
      }
      module.exports.stream = stream;
    } else {
      io.to(socket.id).emit('error');
    }
  });

  socket.on('disconnect', function () {
    debug('%s: socket disconnected at %s', sid, Date());
    if (stream) stream.stop();
  });
});

/*******
  Server
*******/
function authenticate (req, res) {
  if (req.isAuthenticated()) {
    debug(req.sessionID + ': Authenticated');
    res.render('home');
  } else {
    debug(req.sessionID + ': Not authenticated');
    res.render('index');
  }
};

function logout (req, res) {
  req.logout();
  res.redirect(302, '/');
};

app.get('/', authenticate);
app.get('/logout', logout);
app.get('/twitter_oauth', passport.authenticate('twitter')); 
app.get(twitterCallbackURL.pathname, passport.authenticate('twitter', { 
  successRedirect: '/',
  failureRedirect: '/' 
}));

app.get('/*', function (req, res) {
  res.sendStatus(404);
});
app.all('/*', function (req, res) {
  res.sendStatus(405);
});

httpd.listen(process.env['PORT'] || 3000, function () {
  debug('Server starts listening');
});

/*******
  Catching uncaghtExceptions
*******/
process.on('uncaughtException', debug);

/*******
  Export modules to test.
*******/
module.exports = {
  httpd: httpd,
  store: store
};