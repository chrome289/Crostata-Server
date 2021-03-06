var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');

var logger = require('../utils/logger');

router.use('/', (req, res, next) => {
  if (req.path === '/auth/login' || req.path === '/auth/signup') {
    next();
  } else {
    var token = req.headers.authorization; //.split(' ')[1];
    const tokenSecret = process.env.secret;
    
    if (token.includes(' ')) {
      token = token.split(' ')[1];
    }
    //logger.info('Middleware:token -- Token value ->' + token);
    if (token.length > 0) {
      jwt.verify(token, tokenSecret, function(err, result) {
        if (err) {
          logger.warn('[Token] Token invalid');
          res.status(400).send();
        } else {
          //logger.debug('[Token] Token valid');
          res.locals.token = token;
          next();
        }
      });
    } else {
      logger.warn('[Token] No token value present');
      res.status(400).send();
    }
  }
});

module.exports = {
  router
};
