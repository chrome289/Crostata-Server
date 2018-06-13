'use strict';
const express = require('express');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

var moment = require('moment');

const Post = require('../models/post');
const Comment = require('../models/comment');
const Subject = require('../models/subject');

const cacheManager = require('../middlewares/cacheManager.js');

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
  Post.findOneAndUpdate({
      _id: req.body.postId
    }, {
      $inc: {
        comments: 1
      }
    })
    .then((post) => {
      return Subject.findOne({
        birthId: newComment.birthId
      });
    })
    .then((subject) => {
      newComment.name = subject.name;
      return newComment.save();
    })
    .then((comment) => {
      logger.verbose('[CommentController] addComment - Comment added');
      res.status(200).send(comment);
    })
    .catch((err) => {
      logger.warn('[CommentController] addComment - %s', err);
      res.status(500).send([]);
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
  var result = [];

  var lastDatetime = moment(Number(req.query.lastTimestamp)).utc().format();
  var skipCount = req.query.skipCount;

  Comment.find({
      postId: req.query.postId,
      timeCreated: {
        '$lt': lastDatetime
      }
    })
    .sort('-timeCreated')
    .skip(skipCount)
    .limit(100)
    .then((comments) => {
      result = {
        requestId: req.query.requestId,
        list: comments.slice(0, 10)
      };
      return cacheManager.saveInCache(req.query.requestId, skipCount, comments);
    })
    .then((comments) => {
      logger.verbose('[CommentController] getComments:find:promise -' +
        ' comments fetching complete');
      if (comments.length === 0) {
        commentFailure(res, 422);
      } else {
        commentSuccess(res, result);
      }
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
