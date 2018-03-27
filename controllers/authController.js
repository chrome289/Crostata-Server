var express = require('express');
var jwt = require('jsonwebtoken');
var path = require('path');
var bcrypt = require('bcrypt');
var logger = require('../utils/logger');

var Subject = require('../models/subject');
var config = require('config');

const tokenSecret = config.secret;
const professions = ['PEASANT', 'MERCHANT', 'SOLDIER',
  'REBEL', 'OLIGARCH', 'NONE'
];

exports.login = (req, res) => {
  //login
  logger.info('routes:auth:login -- Preparing to login');
  logger.debug('routes:auth:login -- Subject -> ' + req.body.birthId +
    ' Password -> ' + req.body.password);
  //find the subject with birthId

  Subject.findOne({
      birthId: req.body.birthId
    })
    .then((subject) => {
      if (!subject) {
        //user doesn't exists
        logger.info('routes:auth:login:findOne -- User doesn\'t exist -> ' +
          req.body.birthId);
        sendTokenFailure(res, 404);
      } else {
        bcrypt.compare(req.body.password, subject.password, (err, result) => {
          if (result) {
            //login successful
            //send a token //TODO increase expireIn to 24hrs
            const token = generateToken(req.body.birthId);
            logger.debug('routes:auth:login:findOne:bcrypt -- ' +
              'Token generated -> ' + token);

            sendTokenSuccess(res, token);
          } else {
            //password incorrect
            logger.info('routes:auth:login:findOne:bcrypt -- ' +
              'Password incorrect for birthId -> ' +
              req.body.birthId.toString());
            sendTokenFailure(res, 403);
          }
        });
      }
    })
    .catch((err) => {
      //database error
      logger.error('routes:auth:login:mongoose -- ' + err);
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
      logger.error(err);
      sendTokenFailure(res, 500);
    });
};

exports.loginToken = (req, res) => {
  logger.info('routes:auth:loginToken -- Token valid');
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
        //subject exists
        logger.debug('routes:auth:subjectExists:findOne -- ' +
          'Subject exists -> ' + newSubject.birthId);
        exists(true);
      } else {
        //subjects doesn't exist. no error in callback
        logger.info('routes:auth:subjectExists:findOne -- ' +
          'Subject doesn\'t exist -> ' + newSubject.birthId);
        exists(false);
      }
    })
    .catch((err) => {
      logger.error('routes:auth:subjectExists:mongoose --' + err);
      throw err;
    });
});

//hash password
hashPassword = (newSubject) => new Promise((resolve) => {
  //hash Password
  bcrypt.hash(newSubject.password, 2, (err, passwordHash) => {
    if (err) {
      logger.error('routes:auth:hashPassword:bcrypt -- ' + err);
      throw err;
    } else {
      logger.debug('routes:auth:hashPassword:bcrypt -- password hashed');
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
      logger.debug('routes:auth:saveSubject:save -- ' +
        'Subject saved -> ' + subject.birthId);
      resolve(true);
    })
    .catch((err) => {
      logger.debug('routes:auth:saveSubject:mongoose -- ' + err);
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
