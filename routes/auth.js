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
  Subject.findOne({
    birth_id:newSubject.birth_id
  },(err,subject)=>{
    if(err){
      console.error(err);
      res.json({
        saved:false
      });
    }else if (subject) {
      console.error('subject with birth_id '+subject.birth_id+' exists');
      res.json({
        saved:false
      });
    }else{
      newSubject.save((err, subject) => {
        if (err) {
          console.error(err);
          res.json({
            saved: false
          });
        } else {
          console.log("subject with birth_id " + subject.birth_id + " saved");
          res.json({
            saved: true
          });
        }
      });
    }
  });
});

module.exports = router;
