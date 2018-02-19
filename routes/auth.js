 var express = require('express');
 var jwt = require('jsonwebtoken');
 var path = require('path');
 var logger = require('../utils/logger');

 var router = express.Router();

 var Subject = require('../models/subject');
 var config = require('config');

 const tokenSecret = config.secret;
 const professions = ['PEASANT', 'MERCHANT', 'SOLDIER', 'REBEL', 'OLIGARCH', 'NONE'];


 router.post('/login', (req, res) => {
   Subject.findOne({
     birth_id: req.body.birth_id
   }, (err, subject) => {
     if (err)
       logger.error(err);
     else if (!subject) {
       logger.error('No user with birth_id ' + req.body.birth_id.toString());
       res.json({
         resultCode: 1,
         tokenValue: ""
       });
     } else {
       if (subject.password != req.body.password) {
         logger.debug(subject.password + "^^" + req.body.password);
         logger.error('Password incorrect for birth_id ' + req.body.birth_id.toString());
         res.json({
           resultCode: 2,
           tokenValue: ""
         });
       } else {
         const payload = {
           iss: 'Crostata Server'
         };
         var token = jwt.sign(payload, tokenSecret, {
           expiresIn: 120
         });

         res.json({
           resultCode: 0,
           tokenValue: token
         });
       }
     }
   });
 });

 router.post('/signup', function(req, res) {
   var newSubject = new Subject(req.body);
   addSubject(newSubject, (err) => {
     if (err instanceof Error) {
       logger.debug("auth - signup  " + err);
       res.json({
         saved: false
       });
     } else {
       res.json({
         saved: true
       });
     }
   });
 });

 router.post('/loginToken', (req, res) => {
   res.json({
     success: true
   });
 });


 function addSubject(newSubject, callback) {
   checkSubjectExists(newSubject.birth_id, (err) => {
     if (err instanceof Error) {
       logger.error("auth - addsubject " + err);
       callback(err);
     } else {
       saveSubject(newSubject, (err2) => {
         if (err2 instanceof Error) {
           logger.error("auth - addsubject " + err2);
           callback(err2);
         } else {
           callback(null);
         }
       });
     }
   });
 }

 function checkSubjectExists(birth_id, callback) {
   Subject.findOne({
     birth_id: birth_id
   }, (err, subject) => {
     if (err) {
       logger.error("auth - checkSubjectExists " + err);
       callback(err);
     } else if (subject != null) {
       logger.debug("auth - checkSubjectExists " + subject);
       logger.error('subject with birth_id ' + subject.birth_id + ' exists');
       callback(new Error('Subject already exists'));
     } else {
       callback(null);
     }
   });
 }

 function saveSubject(newSubject, callback) {
   if (validate(newSubject)) {
     newSubject.save((err, subject) => {
       if (err) {
         logger.error("auth - saveSubject " + err);
         callback(err);
       } else {
         logger.debug("subject with birth_id " + subject.birth_id + " saved");
         callback(0);
       }
     });
   } else {
     var err = new Error('validation');
     logger.error("auth - saveSubject " + err);
     callback(err);
   }
 }

 function validate(newSubject) {
   var flag = true;
   logger.debug("length  " + newSubject.name.length);
   if (newSubject.name.length < 2 || newSubject.name.length > 40)
     flag = false;
   if (newSubject.password.length < 8)
     flag = false;
   if (!Date.parse(newSubject.dob))
     flag = false;
   if (professions.indexOf(newSubject.profession) == -1)
     flag = false;
   if (newSubject.gender != 0 && newSubject.gender != 1)
     flag = false;
   if (newSubject.picture !== (newSubject.birth_id + ".jpg"))
     flag = false;
   if (newSubject.patriot_index < -1000 || newSubject.patriot_index > 1000)
     flag = false;
   if (newSubject.alive != true && newSubject.alive != false)
     flag = false;
   if (newSubject.informer != true && newSubject.informer != false)
     flag = false;
   return flag;
 }

 module.exports = {
   addSubject,
   router
 };
