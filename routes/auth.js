var express = require('express');
var jwt = require('jsonwebtoken');
var path = require('path');

var router = express.Router();

var Subject = require('../models/subject');
var config = require('config');

const tokenSecret = config.secret;

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
      console.log(err);
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
  var result = checkSubjectExists(newSubject.birth_id);
  if (result instanceof Error) {
    callback(result);
  } else {
    saveSubject(newSubject, (err) => {
      if (err instanceof Error) {
        callback(err);
      } else {
        callback(null);
      }
    });
  }
}

function checkSubjectExists(birth_id) {
  Subject.findOne({
    birth_id: birth_id
  }, (err,subject) => {
    if (err) {
      console.error(err);
      return err;
    } else if (subject) {
      console.error('subject with birth_id ' + subject.birth_id + ' exists');
      return new Error('Subject already exists');
    } else {
      return null;
    }
  });
}

function saveSubject(newSubject, callback) {
  newSubject.save((err, subject) => {
    if (err) {
      console.error(err);
      callback(err);
    } else {
      console.log("subject with birth_id " + subject.birth_id + " saved");
      callback(0);
    }
  });
}

module.exports = {
  addSubject,
  router
};
