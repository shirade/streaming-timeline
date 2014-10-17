var p = console.log;

var qs = require('querystring');
var path = require('path');

var app = require('express')();
var httpd = require('http').Server(app);
var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;

var io = require('socket.io')(httpd);
//var User = require('./lib/db').User;

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
  store: sessionStore
}));
app.use(passport.initialize());
app.use(passport.session());

io.on('connection', function(socket){
  console.log(socket.id + ': connected at ' + Date());
  socket.on('update', function () {
    console.log(socket.id + ': update event at ' + Date());
    var url = 'https://api.twitter.com/1.1/statuses/home_timeline.json?';
    var params = {
      trim_user: false,
      count: 5,
      contributor_details: false,
      include_entities: false
    };
    var cookie = qs.parse(socket.handshake.headers.cookie.replace(' ', ''), ';', '=');
    var sid = cookie['connect.sid'].split('.')[0].slice(2);
    sessionStore.get(sid, function function_name (error, session) {
      cookie = session.passport.user || null;
      if (cookie == null) return;
      TwitterAPI(cookie.token, cookie.tokenSecret, 'GET', url, params, function (error, stringifiedJSON, response) {
        json = JSON.parse(stringifiedJSON);
        if (json.hasOwnProperty('errors')) {
          console.log(socket.id + ': ' + json['errors'][0]['message']);
        }
        io.to(socket.id).emit('update', json);
      });
    });
    // TODO: Why is the following code needed?
  });
  socket.on('unconnect', function () {
    console.log(socket.id + ': unconnected at ' + Date())
  });
});

var ts = new TwitterStrategy({
  // 環境変数から取得するように
  consumerKey: process.env['NODE_CONSUMER_KEY'],
  consumerSecret: process.env['NODE_CONSUMER_SECRET'],
  callbackURL: 'http://localhost:3000/oauth/twitter/callback' 
  }, function(token, tokenSecret, profile, done) {
    var session = {
      id: profile.id,
      screenName: profile.username,
      token: token,
      tokenSecret: tokenSecret
    };
    p(token);
    p(tokenSecret);
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

function TwitterAPI (token, tokenSecret, method, url, params, callback) {
  url += qs.stringify(params);
  ts._oauth.getProtectedResource(
    url,
    method,
    token,
    tokenSecret,
    callback
  );
};

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
  console.log('Listening at http://localhost:3000/')
});

