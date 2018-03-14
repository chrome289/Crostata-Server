/*jshint loopfunc: true */
'use strict';
const express = require('express');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

var moment = require('moment');

const Post = require('../models/post');
const Vote = require('../models/vote');
const Comment = require('../models/comment');
const Subject = require('../models/subject');

var config = require('config');

exports.addComment = function(req, res) {
  var newComment = new Comment({
    birthId: req.body.birthId,
    postId: req.body.postId,
    text: req.body.text,
    timeCreated: moment().utc().valueOf(),
    isCensored: false,
    isGenerated: req.body.generate
  });
  newComment.save()
    .then((comment) => {
      res.status(200).send();
    })
    .catch((err) => {
      logger.debug('routes:opinion:postComment:save -- ' + err);
      res.status(500).send();
    });
};

exports.deleteComment = function(req, res) {
  Comment.findOneAndRemove({
      _id: mongoose.Types.ObjectId(req.query._id)
    })
    .then((comment) => {
      if (comment == null) {
        logger.debug('routes:opinion:deleteComment:findOneAndRemove ' +
          '-- comment not found');
        res.status(500).send();
      } else {
        res.status(200).send();
      }
    })
    .catch((err) => {
      logger.debug('routes:opinion:deleteComment:findOneAndRemove -- ' + err);
      res.status(500).send();
    });
};

exports.getComments = function(req, res) {
  //converting to native date because moment's date doesn't work for some reason
  var lastDatetime = moment.unix(req.query.lastTimestamp)
    .toDate();
  Comment.find({
      postId: req.query.postId,
      timeCreated: {
        '$lt': lastDatetime
      }
    })
    .sort('-timeCreated')
    .limit(Number(req.query.noOfComments))
    .then((comments) => {
      var resultPromises = [];
      logger.debug('comments ' + comments + '\n\n' + comments.length);
      for (var x = 0; x < comments.length; x++) {
        resultPromises.push(getCommentDetails(comments[x]));
      }
      Promise.all(resultPromises).then((comments) => {
          commentSuccess(res, comments);
        })
        .catch((err) => {
          logger.debug('routes:opinion:getComments:find:promises -- ' + err);
          commentFailure(res, 500);
        });
    })
    .catch((err) => {
      logger.debug('routes:opinion:getComments:find -- ' + err);
      commentFailure(res, 500);
    });
};

exports.getCommentForUser = function(req, res) {

};

var getCommentDetails = comment => new Promise((resolve, reject) => {
  Subject.findOne({
      birthId: comment.birthId
    }).then((subject) => {
      resolve({
        _id: comment._id,
        name: subject.name,
        text: comment.text,
        timeCreated: comment.timeCreated
      });
    })
    .catch((err) => {
      reject(err);
    });
});



function commentSuccess(res, comments) {
  res.status(200).json({
    success: true,
    comments: comments
  });
}

function commentFailure(res, resultCode) {
  res.status(resultCode).json({
    success: false,
    comments: [],
  });
}
