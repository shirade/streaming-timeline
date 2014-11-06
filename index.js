var l = console.log;
var e = console.error;

var qs = require('querystring');
var path = require('path');

var app = require('express')();
var server = require('http').Server(app);
var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;
var Twit = require('twit')

var io = require('socket.io')(server);
var db = require('./lib/db');

app.set('views', './views');
app.set('view engine', 'jade');
var session = require('express-session');

var connectMongo = require('connect-mongo')(session);
var sessionStore = new connectMongo({
  db: 'twitter',
  collection: 'sessions'
});

app.use(session({
  secret: 'secret',
  cookie: { 
    maxAge: 12 * 60 * 60 * 1000
  },
  store: sessionStore,
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

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

io.on('connection', function(socket){
  try {
    var sid = getSID(socket);
    //l(sid + ': connected at ' + Date());
    var stream, twit, passportSession;
    sessionStore.get(sid, function (error, session) {
      passportSession = session.passport.user || null;
      if (passportSession == null) return;
      twit = new Twit({
        consumer_key: process.env['NODE_CONSUMER_KEY'],
        consumer_secret: process.env['NODE_CONSUMER_SECRET'],
        access_token: passportSession.token,
        access_token_secret: passportSession.tokenSecret
      });
      stream = twit.stream('user');
      stream.on('tweet', function (tweet) {
        var trimmedTweet = trimTweet(tweet);
        db.pushTweet(trimmedTweet, passportSession.id, function (error, user) {
          io.to(socket.id).emit('new tweet', trimmedTweet);
        });
      }).on('delete', function (msg) {
        db.popTweet(msg.delete.status, function (error, user) {
          io.to(socket.id).emit('delete tweet', msg.delete.status);
        });
      });
    });
  } catch (error) {
    io.to(socket.id).emit('redirect index');
  }

  socket.on('init', function () {
    //l('= = = = = = socket.on init = = = = = =');
    try {
      twit.get('statuses/home_timeline', {
        trim_user: false,
        count: 50,
        contributor_details: false,
        include_entities: false
      }, function (error, data, response) {
        if (error) e(error);
        var timeline = trimTweets(data);
        db.storeUser({
          id: passportSession.id,
          name: passportSession.name,
          screenName: passportSession.screenName,
          timeline: timeline
        }, function (error, user) {
          timeline.splice(5, 195);
          io.to(socket.id).emit('init', timeline);
        });
      });
    } catch (error) {
      io.to(socket.id).emit('redirect index');
    }
  });
  socket.on('tweet', function () {
    db.getFifthTweet(passportSession.id, function (error, tweet) {
      io.to(socket.id).emit('supplemental tweet', tweet);
    });
  }).on('unconnect', function () {
    //l(sid + ': unconnected at ' + Date());
    if (stream) {
      stream.stop();
    }
    io.to(socket.id).emit('unconnect', true);
  });
});

app.get('/', function (request, response) {
  //l(request.headers);
  response.render('index');
});

function authenticate (request, response, next) {
  //l('= = = = = = = = = = = = authenticate = = = = = = = = = = = =');
  sessionStore.get(request.sessionID, function (error, session) {
    if (session && session.passport.user.id) {
      //l(request.sessionID + ': Authenticated');
      next();
    } else {
      //l(request.sessionID + ': Not authenticated');
      // statusCode 401 is Unauthorized
      response.redirect(401, '/');
    }
  });
};

app.get('/home', authenticate, function (request, response) {
  response.render('home');
});

app.get('/logout', function (request, response) {
  request.session.destroy(function(error) {
    response.redirect(302, '/');
  });
});

app.get('/oauth/twitter/auth', passport.authenticate('twitter'));

app.get('/oauth/twitter/callback', passport.authenticate('twitter', { 
  successRedirect: '/home',
  failureRedirect: '/' 
}));

app.get('/css/cover.css', function (request, response) {
  response.sendFile(path.join(__dirname + '/views/css/cover.css'));
});

/**
  Abnormal Case
**/
app.get('/*', function (request, response) {
  response.sendStatus(404);
});

app.all('/*', function (request, response) {
  response.sendStatus(400);
});

// supplemental function

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
      screen_name: tweet.user.screen_name,
      profile_image_url: tweet.user.profile_image_url
    }
  };
};

function getSID (socket) {
  var obj = qs.parse(socket.handshake.headers.cookie.replace(' ', ''), ';', '=');
  return obj['connect.sid'].split('.')[0].slice(2);
};

/**
  Start server 
**/
if (require.main === module) {
  server.listen(3000, function () {
    l('Listening at http://localhost:3000/');
    db.connect('mongodb://localhost/twitter');
  });
};

module.exports.server = server;
module.exports.db = db;
module.exports.sessionStore = sessionStore;
module.exports.trimTweets = trimTweets;
module.exports.ts = ts;
