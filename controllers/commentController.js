'use strict';
const express = require('express');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

var moment = require('moment');

const Post = require('../models/post');
const Comment = require('../models/comment');
const Subject = require('../models/subject');

var config = require('config');

exports.addComment = function(req, res) {
  logger.info('[CommentController] Adding a comment ' +
    'from subject %s for post %s', req.body.birthId, req.body.postId);
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
      logger.verbose('[CommentController] addComment - Comment added');
      res.status(200).send();
    })
    .catch((err) => {
      logger.warn('[CommentController] addComment - %s', err);
      res.status(500).send();
    });
};

exports.deleteComment = function(req, res) {
  logger.info('[CommentController] Deleting a comment ' +
    'from subject %s with commentId %s', req.body.birthId, req.query._id);
  Comment.findOneAndRemove({
      _id: mongoose.Types.ObjectId(req.query._id)
    })
    .then((comment) => {
      if (comment == null) {
        logger.verbose('[CommentController] deleteComment:findOneAndRemove' +
          ' - comment not found');
        res.status(500).send();
      } else {
        logger.verbose('[CommentController] deleteComment:findOneAndRemove ' +
          '- Comment deleted');
        res.status(200).send();
      }
    })
    .catch((err) => {
      logger.warn('[CommentController] deleteComment:findOneAndRemove' + err);
      res.status(500).send();
    });
};

exports.getComments = function(req, res) {
  logger.info('[CommentController] Fetching comments for' +
    ' post %s', req.query.postId);
  var lastDatetime = moment(Number(req.query.lastTimestamp)).utc().format();
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
      logger.verbose('[CommentController] getComments:find -' +
        ' get creator details for comments');
      for (var x = 0; x < comments.length; x++) {
        resultPromises.push(getCommentDetails(comments[x]));
      }
      Promise.all(resultPromises)
        .then((comments) => {
          logger.verbose('[CommentController] getComments:find:promise -' +
            ' comments fetching complete');
          commentSuccess(res, comments);
        })
        .catch((err) => {
          logger.warn('[CommentController] getComments:find:promise -' + err);
          commentFailure(res, 500);
        });
    })
    .catch((err) => {
      logger.warn('[CommentController] getComments:find' + err);
      commentFailure(res, 500);
    });
};

var getCommentDetails = comment => new Promise((resolve, reject) => {
  var tempObject = comment.toObject();
  Subject.findOne({
      birthId: comment.birthId
    })
    .then((subject) => {
      tempObject.name = subject.name;
      resolve(tempObject);
    })
    .catch((err) => {
      logger.warn('[CommentController] getCommentDetails:findOne' + err);
      reject(err);
    });
});

var commentSuccess = (res, comments) => {
  res.status(200).json(comments);
};

var commentFailure = (res, resultCode) => {
  res.status(resultCode).json([]);
};
