var express = require('express');
var jwt = require('jsonwebtoken');
var path = require('path');
var bcrypt = require('bcrypt');
var logger = require('../utils/logger');

var router = express.Router();

var Subject = require('../models/subject');
var reply = require('../utils/reply');
var validate = require('../utils/validate');
var config = require('config');

const tokenSecret = config.secret;
const professions = ['PEASANT', 'MERCHANT', 'SOLDIER', 'REBEL', 'OLIGARCH', 'NONE'];


router.post('/login', (req, res) => {
  //login
  logger.info('routes:auth:login -- Preparing to login');
  logger.debug('routes:auth:login -- Subject -> ' + req.body.birth_id + ' Password -> ' + req.body.password);
  //find the subject with birth_id

  Subject.findOne({
    birth_id: req.body.birth_id
  }, (err, subject) => {
    if (err) {
      //database error
      logger.error('routes:auth:login:mongoose -- ' + err);
      reply.sendTokenFailure(res, 1);
    } else if (!subject) {
      //user doesn't exists
      logger.info('routes:auth:login:findOne -- User doesn\'t exist -> ' + req.body.birth_id);
      reply.sendTokenFailure(res, 2);
    } else {
      bcrypt.compare(req.body.password, subject.password, (err, result) => {
        if (result) {
          //login successful
          //send a token //TODO increase expireIn to 24hrs
          const payload = {
            iss: 'Crostata Server',
            sub: req.body.birth_id.toString()
          };
          var token = jwt.sign(payload, tokenSecret, {
            expiresIn: 86400
          });

          logger.debug('routes:auth:login:findOne:bcrypt -- Token generated -> ' + token);

          reply.sendTokenSuccess(res, token);
        } else {
          //password incorrect
          logger.info('routes:auth:login:findOne:bcrypt -- Password incorrect for birth_id -> ' + req.body.birth_id.toString());
          reply.sendTokenFailure(res, 3);
        }
      });
    }
  });
});

router.post('/signup', function(req, res) {
  //sign up
  var newSubject = new Subject(req.body);
  if (validate.validateNewUser(newSubject)) {
    //check through database
    subjectExists(newSubject).then((exists) => {
        //if exists return failure
        if (exists)
          reply.sendTokenFailure(res, 2);
        else {
          //hash password and save in db
          hashPassword(newSubject)
            .then(saveSubjectDB(newSubject))
            .then(() => {
              reply.sendSuccess(res);
            });
        }
      })
      .catch((err) => {
        logger.error(err);
        reply.sendTokenFailure(res, 1);
      });
  } else {
    //validation failed.
    logger.error('routes:auth:signup -- validation ');
    reply.sendTokenFailure(res, 1);
  }
});

router.post('/loginToken', (req, res) => {
  logger.info('routes:auth:loginToken -- Token valid');
  //logger.info('routes:auth:loginToken -- '+res.locals.token)
  reply.sendSuccess(res);
});

//check if entry exists
subjectExists = (newSubject) => new Promise((exists) => {
  Subject.findOne({
    birth_id: newSubject.birth_id
  }, (err, subject) => {
    if (err) {
      //database error
      logger.error('routes:auth:subjectExists:mongoose --' + err);
      throw err;
    } else if (subject != null) {
      //subject exists
      logger.debug('routes:auth:subjectExists:findOne -- Subject exists -> ' + newSubject.birth_id);
      exists(true);
    } else {
      //subjects doesn't exist. no error in callback
      logger.info('routes:auth:subjectExists:findOne -- Subject doesn\'t exist -> ' + newSubject.birth_id);
      exists(false);
    }
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
      resolve(passwordHash);
    }
  });
});

saveSubjectDB = (newSubject) => new Promise((resolve) => {
  //save subject in database
  //logger.debug('birth_id ' + newSubject.birth_id + '--password--' + newSubject.password);
  newSubject.save((err, subject) => {
    if (err) {
      //database error
      logger.debug('routes:auth:saveSubject:mongoose -- ' + err);
      throw err;
    } else {
      //subject saved
      logger.debug('routes:auth:saveSubject:save -- Subject saved -> ' + subject.birth_id);
      resolve(true);
    }
  });
});

module.exports = {
  router
};
