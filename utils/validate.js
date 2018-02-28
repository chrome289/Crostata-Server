var express = require('express');
var router = express.Router();
var moment = require('moment');
var Subject = require('../models/subject');
var Post = require('../models/post');
var logger = require('../utils/logger');

const professions = ['PEASANT', 'MERCHANT', 'SOLDIER', 'REBEL', 'OLIGARCH', 'NONE'];

function validateTextPost(req) {
  var flag = true;
  if (req.body.postContent.length == 0 || req.body.postContent.length > 40000)
    flag = false;
  if (req.body.birth_id.length == 9 && !isNaN(req.body.birth_id))
    return flag;
}

function validateImagePost(req) {
  var flag = true;
  if (req.body.birth_id.length == 9 && !isNaN(req.body.birth_id))
    return flag;
}

function validateComboPost(req) {
  var flag = true;
  if (req.body.postContent.length == 0 || req.body.postContent.length > 40000)
    flag = false;
  if (req.body.birth_id.length == 9 && !isNaN(req.body.birth_id))
    return flag;
}

function validateImageId(req) {
  return new Promise((resolve, reject) => {
    Post.findOne({
      post_id: req.query.post_id
    }, (err, post) => {
      if (err) {
        reject(err);
      } else if (post == null) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

function validateBirthId(req) {
  return new Promise((resolve, reject) => {
    Subject.findOne({
      birth_id: req.body.birth_id
    }, (err, subject) => {
      if (err) {
        reject(500);
      } else if (subject == null) {
        resolve(400);
      } else {
        resolve();
      }
    });
  });
}


function validateGetProfileImage(req) {
  return new Promise((resolve, reject) => {
    Subject.findOne({
      birth_id: req.query.birth_id
    }, (err, post) => {
      if (err) {
        logger.error(err);
        reject(500);
      } else if (post == null) {
        reject(400);
      } else {
        if (req.query.dimen < 48 || req.query.dimen > 1024)
          reject(400);
        else if (req.query.quality < 1 || req.query.quality > 100)
          reject(400);
        else
          resolve();
      }
    });
  });
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
  validateTextPost,
  validateImagePost,
  validateComboPost,
  validateImageId,
  validateBirthId,
  validateGetProfileImage
};
