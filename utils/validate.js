var express = require('express');
var router = express.Router();
var moment = require('moment');
var Subject = require('../models/subject');

const professions = ['PEASANT', 'MERCHANT', 'SOLDIER', 'REBEL', 'OLIGARCH', 'NONE'];

function validateTextPost(req) {
  var flag = true;
  if (req.body.postContent.length == 0 || req.body.postContent.length > 40000)
    flag = false;
  if (req.body.birth_id.length == 9 && !isNaN(req.body.birth_id))
    return flag;
}


function validateGetPost(req) {
  var flag = true;
  if (req.body.noOfPosts > 0 && req.body.noOfPosts < 21)
    flag = false;
  if (!moment.unix(req.body.lastTimestamp).isValid())
    flag = false;
  return true;
}

function validateNewUser(newSubject) {
  //validations
  var flag = true;
  //logger.debug("length  " + newSubject.name.length);
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
  validateNewUser,
  validateGetPost,
  validateTextPost
};
