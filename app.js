var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
var morgan = require("morgan");
var compression = require("compression");
var helmet = require("helmet");
var slow = require('connect-slow');

//routes
var index = require('./routes/index');
var users = require('./routes/users');
var auth = require('./routes/auth');
var bot = require('./routes/bot');
var content = require('./routes/content');

//middlewares
var tokenMiddleware = require('./middlewares/token');

//winston logger
var logger = require('./utils/logger');

//config
var config = require('config');

//TODO remove delay later
var app = express();/*.use(slow({
  delay: 3000
}));*/

app.set('port', process.env.PORT || 3000);

//only spinning up server when mocha is not watching (--watch)
if (!module.parent) {
  var server = app.listen(app.get('port'), function() {
    logger.debug('Express server listening on port ' + server.address().port);
  });
}

//database
mongoose.connect(config.database);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//gzip compression
app.use(compression());

//helmet
app.use(helmet());

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
//app.use(logger('dev'));

//more middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//setting up routes hierachy
app.use('/', index);
app.use('/users', users);
app.use('/bot', bot);

app.use('/api/auth', auth.router);
//use tokenMiddleware only when auth is done already
app.use(tokenMiddleware);
//app.use('/api/auth/loginToken', auth.router);
app.use('/api/content', content.router);



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
