var express = require('express');
var jwt = require('jsonwebtoken');
var path = require('path');
var bcrypt = require('bcrypt');

const logger = require('../utils/logger');

var Subject = require('../models/subject');
var config = require('config');

const tokenSecret = config.secret;
const professions = ['PEASANT', 'MERCHANT', 'SOLDIER',
  'REBEL', 'OLIGARCH', 'NONE'
];

exports.login = (req, res) => {
  //login
  logger.info('[AuthController] login - Login Attempt');

  logger.verbose('[AuthController] login - Subject %s Password %s',
    req.body.birthId, req.body.password);

  //find the subject with birthId
  Subject.findOne({
      birthId: req.body.birthId
    })
    .then((subject) => {
      if (!subject) {
        //user doesn't exists
        logger.verbose('[AuthController] login:findOne ' +
          '- User %s doesn\'t exist', req.body.birthId);
        sendTokenFailure(res, 404);
      } else {
        bcrypt.compare(req.body.password, subject.password, (err, result) => {
          if (result) {
            //login successful
            //send a token //TODO increase expireIn to 24hrs
            const token = generateToken(req.body.birthId);
            logger.verbose('[AuthController] login:findOne:bcrypt ' +
              '- Token generated=%s', token);

            sendTokenSuccess(res, token);
          } else {
            //password incorrect
            logger.verbose('[AuthController] login:findOne:bcrypt ' +
              '- Password incorrect for %s', req.body.birthId);
            sendTokenFailure(res, 403);
          }
        });
      }
    })
    .catch((err) => {
      //database error
      logger.warn('[AuthController] login:findOne - %s', err);
      sendTokenFailure(res, 500);
    });
};

var generateToken = birthId => {
  const payload = {
    iss: 'Crostata Server',
    sub: birthId.toString()
  };
  const token = jwt.sign(payload, tokenSecret, {
    expiresIn: 86400
  });
  return token;
};

exports.signup = (req, res) => {
  //sign up
  logger.info('[AuthController] signup - Signing up subject %s',
    req.body.birthId);
  var newSubject = new Subject(req.body);
  //check through database
  subjectExists(newSubject)
    .then((exists) => {
      //if exists return failure
      if (exists) {
        sendTokenFailure(res, 400);
      } else {
        //hash password and save in db
        hashPassword(newSubject)
          .then((newSubject) => saveSubjectDB(newSubject))
          .then(() => {
            res.status(200).send();
          });
      }
    })
    .catch((err) => {
      logger.warn('[AuthController] signup:subjectExists - %s', err);
      sendTokenFailure(res, 500);
    });
};

exports.loginToken = (req, res) => {
  logger.info('[AuthController] loginToken - Token valid');
  //logger.info('routes:auth:loginToken -- '+res.locals.token)
  res.status(200).send();
};

//check if entry exists
subjectExists = (newSubject) => new Promise((exists) => {
  Subject.findOne({
      birthId: newSubject.birthId
    })
    .then((subject) => {
      if (subject != null) {
        logger.info('[AuthController] signup:subjectExists - Subject %s exists',
          req.body.birthId);
        exists(true);
      } else {
        //subjects doesn't exist. no error in callback
        logger.verbose('[AuthController] signup:subjectExists' +
          ' - Subject %s doesn\'t exists. Saving.', req.body.birthId);
        exists(false);
      }
    })
    .catch((err) => {
      logger.warn('[AuthController] signup:subjectExists - %s', err);
      throw err;
    });
});

//hash password
hashPassword = (newSubject) => new Promise((resolve) => {
  //hash Password
  bcrypt.hash(newSubject.password, 2, (err, passwordHash) => {
    if (err) {
      logger.warn('[AuthController] signup:subjectExists:hashPassword - %s',
        err);
      throw err;
    } else {
      logger.verbose('[AuthController] signup:subjectExists:hashPassword ' +
        '- Hash generated.');
      newSubject.password = passwordHash;
      resolve(newSubject);
    }
  });
});

saveSubjectDB = (newSubject) => new Promise((resolve) => {
  //save subject in database
  /*logger.debug('birthId ' + newSubject.birthId +
   '--password--' + newSubject.password);*/
  newSubject.save()
    .then((subject) => {
      logger.verbose('[AuthController] signup:subjectExists:saveSubjectDB ' +
        '- Subject %s saved.', req.body.birthId);
      resolve(true);
    })
    .catch((err) => {
      logger.warn('[AuthController] signup:subjectExists:saveSubjectDB - %s',
        err);
      throw err;
    });
});


//response functions
var sendTokenSuccess = (res, token) => {
  res.status(200).json({
    success: true,
    tokenValue: token
  });
};

var sendTokenFailure = (res, resultCode) => {
  res.status(resultCode).json({
    success: false,
    tokenValue: ''
  });
};
