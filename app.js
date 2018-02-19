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

var index = require('./routes/index');
var users = require('./routes/users');
var auth = require('./routes/auth');
var bot = require('./routes/bot');

var tokenMiddleware = require('./middlewares/token');

var logger = require('./utils/logger');

var config = require('config');

var app = express();

app.set('port', process.env.PORT || 3000);

if (!module.parent) {
  var server = app.listen(app.get('port'), function() {
    logger.debug('Express server listening on port ' + server.address().port);
  });
}

mongoose.connect(config.database);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(compression());
app.use(helmet());

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
//app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth/signup',auth.router);
app.use('api/auth/login',auth.router);

app.use('/', index);

app.use(tokenMiddleware);

app.use('/api/auth', auth.router);

app.use('/users', users);
app.use('/bot', bot);


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
