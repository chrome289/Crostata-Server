const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const morgan = require('morgan');
const compression = require('compression');
const helmet = require('helmet');
const slow = require('connect-slow');

//routes
const index = require('./routes/index');
const subject = require('./routes/subject');
const auth = require('./routes/auth');
const bot = require('./routes/bot');
const content = require('./routes/content');
const opinion = require('./routes/opinion');
const search = require('./routes/search');
const report = require('./routes/report');


//middlewares
const tokenMiddleware = require('./middlewares/token');
const validatorMiddleware = require('./middlewares/validator');
const cacheManager = require('./middlewares/cacheManager');

//winston logger
const logger = require('./utils/logger');

//config
const config = require('config');

//TODO remove delay later
const app = express();
/*.use(slow({
  delay: 3000
}));*/

app.set('port', process.env.PORT || 3000);

//only spinning up server when mocha is not watching (--watch)
if (!module.parent) {
  var server = app.listen(app.get('port'), function() {
    logger.info('[App] Express server listening on port ' +
      server.address().port);
  });
}

//database
mongoose.Promise = require('bluebird');
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
app.use(bodyParser.json({
  limit: '50mb'
}));
app.use(bodyParser.urlencoded({
  extended: false,
  limit: '50mb'
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//use tokenMiddleware only when auth is done already
app.use('/api/v1', validatorMiddleware.router);
app.use('/api/v1', tokenMiddleware.router);
app.use('/api/v1', cacheManager.router);


//setting up routes hierachy
app.use('/', index);
app.use('/bot', bot);

app.use('/api/v1/subject', subject);
app.use('/api/v1/auth', auth.router);
app.use('/api/v1/content', content.router);
app.use('/api/v1/opinion', opinion.router);
app.use('/api/v1/search', search.router);
app.use('/api/v1/report', report.router);

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
