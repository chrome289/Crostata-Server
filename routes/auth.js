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
   logger.info('Routes:auth:login -- Preparing to login');
   logger.debug('Routes:auth:login -- Subject= ' + req.body.birth_id + ' Password= ' + req.body.password);
   //find the subject with birth_id

   Subject.findOne({
     birth_id: req.body.birth_id
   }, (err, subject) => {
     if (err) {
       //database error
       logger.error('Routes:auth:login --' + err);
       reply.sendTokenFailure(res, 1);
     } else if (!subject) {
       //user doesn't exists
       logger.info('Routes:auth:login -- User doesn\'t exist ->' + req.body.birth_id);
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

           logger.debug('Routes:auth:login -- Token generated ->' + token);

           reply.sendTokenSuccess(res, token);
         } else {
           //password incorrect
           logger.info('Routes:auth:login -- Password incorrect for birth_id ->' + req.body.birth_id.toString());
           reply.sendTokenFailure(res, 3);
         }
       });
     }
   });
 });

 router.post('/signup', function(req, res) {
   //sign up
   var newSubject = new Subject(req.body);
   addSubject(newSubject, (err) => {
     if (err instanceof Error) {
       //an error in addSubject
       logger.error('Routes:auth:addSubject --' + err);
       reply.sendTokenFailure(res, 1);
     } else {
       //signed up
       logger.info('Routes:auth:addSubject -- User signed up ->' + newSubject.birth_id);
       reply.sendSuccess(res);
     }
   });
 });

 router.post('/loginToken', (req, res) => {
   logger.info('Routes:auth:loginToken -- Token valid ->' + res.locals.token);
   reply.sendSuccess(res);
 });


 function addSubject(newSubject, callback) {
   checkSubjectExists(newSubject.birth_id, (err) => {
     if (err instanceof Error) {
       //database error
       logger.error('Routes:auth:checkSubjectExists --' + err);
       callback(err);
     } else {
       //new subject -> save
       saveSubject(newSubject, (err2) => {
         if (err2 instanceof Error) {
           //database error
           logger.error('Routes:auth:saveSubject --' + err2);
           callback(err2);
         } else {
           //successfully saved. callback with null error
           logger.info('Routes:auth:saveSubject -- Subject added successfully');
           callback(null);
         }
       });
     }
   });
 }

 function checkSubjectExists(birth_id, callback) {
   //check through database
   Subject.findOne({
     birth_id: birth_id
   }, (err, subject) => {
     if (err) {
       //database error
       logger.error('Routes:auth:checkSubjectExists --' + err);
       callback(err);
     } else if (subject != null) {
       //subject exists
       logger.debug("Routes:auth:checkSubjectExists Subject already exists" + subject);
       callback(new Error('Subject already exists'));
     } else {
       //subjects doesn't exist. no error in callback
       logger.info("Routes:auth:checkSubjectExists -- Subject doesn't exist -> " + birth_id);
       callback(null);
     }
   });
 }

 function saveSubject(newSubject, callback) {
   //save subject in database
   //validate data before saving in
   if (validate.validateNewUser(newSubject)) {
     //validated
     //hash Password
     bcrypt.hash(newSubject.password, 2, (err, passwordHash) => {
       if (err) {
         logger.debug('Routes:auth:saveSubject:bcrypt --' + err);
       } else {
         logger.error("birth_id " + newSubject.birth_id + "--password--" + newSubject.password);
         newSubject.password = passwordHash;
         newSubject.save((err, subject) => {
           if (err) {
             //database error
             logger.debug('Routes:auth:saveSubject --' + err);
             callback(err);
           } else {
             //subject saved
             logger.debug("Routes:auth:saveSubject -- Subject saved -> " + subject.birth_id);
             callback(0);
           }
         });
       }
     });
   } else {
     //validation failed. callback with err
     var err = new Error('validation');
     logger.debug('Routes:auth:saveSubject --' + err);
     callback(err);
   }
 }

 module.exports = {
   addSubject,
   router
 };
