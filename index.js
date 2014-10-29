var p = console.log;

var qs = require('querystring');
var path = require('path');

var app = require('express')();
var httpd = require('http').Server(app);
var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;
var Twit = require('twit')

var io = require('socket.io')(httpd);
var db = require('./lib/db');

app.set('views', './views');
app.set('view engine', 'jade');

var cookieParser = require('cookie-parser');
//var bodyParser = require('body-parser');
var session = require('express-session');
var connectMongo = require('connect-mongo')(session);

var sessionStore = new connectMongo({
  db: 'twitter',
  collection: 'sessions'
});

app.use(cookieParser());
//app.use(bodyParser());
app.use(session({
  secret: 'secret',
  store: sessionStore,
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

function trimTweets (timeline) {
  var tweetArray = [];
  for (var i = 0; i < timeline.length; i++) {
    tweetArray.push(trimTweet(timeline[i]));
  }
  return tweetArray;
}

function trimTweet (tweet) {
  return {
    created_at: tweet.created_at,
    id: tweet.id,
    text: tweet.text,
    user: {
      id: tweet.user.id,
      name: tweet.user.name,
      screen_name: tweet.user.screen_name
    }
  };
};

io.on('connection', function(socket){
  p(socket.id + ': connected at ' + Date());

  var cookie = qs.parse(socket.handshake.headers.cookie.replace(' ', ''), ';', '=');
  var sid = cookie['connect.sid'].split('.')[0].slice(2);
  var stream;
  sessionStore.get(sid, function (error, session) {
    cookie = session.passport.user || null;
    if (cookie == null) return;
    var twit = new Twit({
      consumer_key: process.env['NODE_CONSUMER_KEY'],
      consumer_secret: process.env['NODE_CONSUMER_SECRET'],
      access_token: cookie.token,
      access_token_secret: cookie.tokenSecret
    });
    twit.get('statuses/home_timeline', 
      {
        trim_user: false,
        count: 10,
        contributor_details: false,
        include_entities: false
      }, function (error, data, response) {
        if (error) console.error(error);
        db.storeUser({
          id: cookie.id,
          name: cookie.name,
          screenName: cookie.screenName,
          timeline: trimTweets(data)
        });
    });
    stream = twit.stream('user');
    stream.on('tweet', function (tweet) {
      p('= = = = = = Stream.on tweet event = = = = = =');
      var trimmedTweet = trimTweet(tweet)
      io.to(socket.id).emit('tweet', trimmedTweet);
      db.pushTweet(trimmedTweet, cookie.id);
    });
    stream.on('delete', function (msg) {
      p('= = = = = = Stream.on delete event = = = = = =');
      p(msg.delete.status);
      io.to(socket.id).emit('delete', msg.delete.status);
      db.popTweet(msg.delete.status);
    });
  });

  socket.on('init', function () {
    setTimeout(function() {
      db.getTimeline(cookie.id, function (error, timeline) {
        io.to(socket.id).emit('init', timeline);
      });
    }, 3000);
  });
  
  socket.on('unconnect', function () {
    p(socket.id + ': unconnected at ' + Date());
    stream.stop();
  });
});

var ts = new TwitterStrategy({
  consumerKey: process.env['NODE_CONSUMER_KEY'],
  consumerSecret: process.env['NODE_CONSUMER_SECRET'],
  callbackURL: 'http://localhost:3000/oauth/twitter/callback' 
  }, function(token, tokenSecret, profile, done) {
    var session = {
      id: profile.id,
      name: profile.displayName,
      screenName: profile.username,
      token: token,
      tokenSecret: tokenSecret
    };
    done(null, session);
  }
);

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(ts);

app.get('/', function (request, response) {
  response.render('index');
});

app.get('/home', function (request, response) {
  if (typeof request.session.passport.user === 'undefined') {
    request.session.passport.user = null;
    response.redirect('/');
  } else if (request.session.passport.user === null) {
    response.redirect('/');
  } else {
    response.render('home');
  }
});

app.get('/css/cover.css', function (request, response) {
  response.sendFile(path.join(__dirname + '/views/css/cover.css'));
});


app.get('/logout', function (request, response) {
  request.session.passport.user = null;;
  response.redirect('/');
});

app.get('/oauth/twitter/auth', passport.authenticate('twitter'));

app.get('/oauth/twitter/callback', passport.authenticate('twitter', { 
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
  response.sendStatus(400);
});

/**
  Start server 
**/
httpd.listen(3000, function () {
  p('Listening at http://localhost:3000/')
});

