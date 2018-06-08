'use strict';
const express = require('express');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

var moment = require('moment');

const Post = require('../models/post');
const Like = require('../models/like');
const Subject = require('../models/subject');

var config = require('config');

exports.addLike = function(req, res) {
  logger.info('[LikeController] addLike ' +
    '- Adding like for post %s and subject %s',
    req.body.postId, req.body.birthId);
  var newLike = new Like({
    birthId: req.body.birthId,
    postId: req.body.postId
  });
  Like.findOneAndRemove({
      birthId: newLike.birthId,
      postId: newLike.postId
    })
    .then((like) => {
      return saveNewLike(newLike);
    })
    .then((likeTotal) => {
      logger.verbose('[LikeController] ' +
        'addLike:findOneAndRemove:saveNewLike - like saved');
      likeSuccess(res, likeTotal);
    })
    .catch((err) => {
      logger.warn('[LikeController] addLike:findOneAndUpdate' +
        ' - %s', err);
      likeFailure(res, 500);
    });
};

exports.deleteLike = function(req, res) {
  logger.info('[LikeController] deleteLike ' +
    '- Deleting like for post %s and subject %s',
    req.query.postId, req.query.birthId);
  Like.findOneAndRemove({
      birthId: req.query.birthId,
      postId: req.query.postId
    })
    .then((like) => {
      return updateLikeTotals(req.query.postId);
    })
    .then((likeTotal) => {
      logger.verbose('[LikeController] ' +
        'deleteLike:findOneAndRemove:updateLikeTotals' +
        ' - updated like total for postId %s and subject %s',
        req.query.postId, req.query.birthId);
      likeSuccess(res, likeTotal);
    })
    .catch((err) => {
      logger.warn('[LikeController] deleteLike:findOneAndRemove' +
        ' - %s', err);
      likeFailure(res, 500);
    });
};

exports.getLikeTotal = function(req, res) {
  logger.info('[LikeController] getLikeTotal ' +
    '- Get like total for post %s', req.query.postId);
  Like.find({
      postId: req.query.postId
    })
    .then((likes) => {
      var total = likes.length;
      logger.verbose('[LikeController] getLikeTotal:find' +
        ' - total likes for post %s are %d', req.query.postId, total);
      likeSuccess(res, total);
    })
    .catch((err) => {
      logger.warn('[LikeController] getLikeTotal:find' +
        ' - %s', err);
      likeFailure(res, 500);
    });
};

exports.getLikePerPost = function(req, res) {
  logger.info('[LikeController] getLikeTotal ' +
    '- Get like total for post %s and subject %s',
    req.query.postId, req.query.birthId);
  Like.find({
      birthId: req.query.birthId,
      postId: req.query.postId
    })
    .then((like) => {
      if (like.length > 0) {
        logger.verbose('[LikeController] getLikePerPost:find' +
          ' - subject %s liked %d for post %s',
          req.query.birthId, 1, req.query.postId);
        likeSuccess(res, 1);
      } else {
        logger.verbose('[LikeController] getLikePerPost:find' +
          ' - no like found');
        likeFailure(res, 400);
      }
    })
    .catch((err) => {
      logger.warn('[LikeController] getLikePerPost:find' +
        ' - %s', err);
      likeFailure(res, 500);
    });
};

var saveNewLike = newLike => new Promise((resolve, reject) => {
  newLike.save()
    .then((like) => {
      return updateLikeTotals(newLike.postId);
    })
    .then((likeTotal) => {
      resolve(likeTotal);
    })
    .catch((err) => {
      logger.warn('[LikeController] saveNewLike:save - %s', err);
      reject(err);
    });
});

var updateLikeTotals = postId => new Promise((resolve, reject) => {
  var likeTotal = 0;
  Like.find({
      postId: postId
    })
    .then((likes) => {
      likeTotal = likes.length;
      return Post.findOneAndUpdate({
        _id: postId
      }, {
        likes: likeTotal
      });
    })
    .then((post) => {
      resolve(likeTotal);
    })
    .catch((err) => {
      logger.warn('[LikeController] updateLikeTotals:find - %s',
        err);
      reject(err);
    });
});


exports.getPostLikes = (post, birthId) => new Promise((resolve, reject) => {
  var newPost = post.toObject();

  Like.findOne({
      birthId: birthId,
      postId: newPost._id
    }).exec()
    .then((like) => {
      newPost.opinion = (like == null) ? 0 : 1;
      resolve(newPost);
    })
    .catch((err) => {
      logger.warn('[ContentController] getPostLikes:findOne - ' + err);
      reject(err);
    });
});


var likeSuccess = (res, total) => {
  res.status(200).json({
    success: true,
    total: total
  });
};

var likeFailure = (res, resultCode) => {
  res.status(resultCode).json({
    success: false,
    total: 0
  });
};
