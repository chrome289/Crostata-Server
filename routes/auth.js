var express = require('express');
var jwt = require('jsonwebtoken');
var path = require('path');

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
      console.error(err);
    else if (!subject) {
      console.error('No user with birth_id ' + req.body.birth_id.toString());
      res.json({
        login: false,
        token: []
      });
    } else {
      if (subject.password != req.body.password) {
        console.log(subject.password + "^^" + req.body.password);
        console.error('Password incorrect for birth_id ' + req.body.birth_id.toString());
        res.json({
          login: false,
          token: []
        });
      } else {
        const payload = {
          iss: 'Crostata Server',
          exp: new Date().getTime() + 86400000
        };
        var token = jwt.sign(payload, tokenSecret, null);

        res.json({
          login: true,
          token: token
        });
      }
    }
  });
});

router.post('/signup', function(req, res) {
  var newSubject = new Subject(req.body);
  addSubject(newSubject, (err) => {
    if (err instanceof Error) {
      console.log("auth - signup  " + err);
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

function addSubject(newSubject, callback) {
  checkSubjectExists(newSubject.birth_id, (err) => {
    if (err instanceof Error) {
      console.error("auth - addsubject " + err);
      callback(err);
    } else {
      saveSubject(newSubject, (err2) => {
        if (err2 instanceof Error) {
          console.error("auth - addsubject " + err2);
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
      console.error("auth - checkSubjectExists " + err);
      callback(err);
    } else if (subject != null) {
      console.log("auth - checkSubjectExists " + subject);
      console.error('subject with birth_id ' + subject.birth_id + ' exists');
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
        console.error("auth - saveSubject " + err);
        callback(err);
      } else {
        console.log("subject with birth_id " + subject.birth_id + " saved");
        callback(0);
      }
    });
  } else {
    var err = new Error('validation');
    console.error("auth - saveSubject " + err);
    callback(err);
  }
}

function validate(newSubject) {
  var flag = true;
  console.log("length  " + newSubject.name.length);
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
