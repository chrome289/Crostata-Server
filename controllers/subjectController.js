'use strict';
const express = require('express');
const logger = require('../utils/logger');
const mongoose = require('mongoose');
const sharp = require('sharp');

var moment = require('moment');

const Post = require('../models/post');
const Comment = require('../models/comment');
const Subject = require('../models/subject');
const Vote = require('../models/vote');

var config = require('config');

const cacheManager = require('../middlewares/cacheManager.js');

exports.getPatriotIndex = (req, res) => {
  logger.info('[SubjectController] getPatriotIndex' +
    ' - Get PI for subject %s', req.query.birthId);
  Subject.findOne({
      birthId: req.query.birthId
    })
    .exec()
    .then((subject) => {
      res.status(200).json({
        birthId: subject.birthId,
        patriotIndex: Number(subject.patriotIndex)
      });
    })
    .catch((err) => {
      logger.warn('[SubjectController] getPatriotIndex:findOne - %s', err);
      res.status(422).json({
        birthId: req.query.birthId,
        patriotIndex: 0
      });
    });
};

exports.getRank = (req, res) => {
  logger.info('[SubjectController] getRank' +
    ' - Get rank for subject %s', req.query.birthId);
  getRank(req.query.birthId)
    .then((rank) => {
      res.status(200).json({
        birthId: req.query.birthId,
        rank: rank
      });
    })
    .catch((status) => {
      logger.warn('[SubjectController] getRank:getRank - %s', status);
      res.status(status).json({
        birthId: 0,
        rank: 0
      });
    });
};

//get posts
exports.getPost = (req, res) => {
  logger.info('[SubjectController] getPost' +
    ' - Get posts for subject %s', req.query.birthId);
  fetchPosts(req.query.requestId, req.query.lastTimestamp, req.query.skipCount,
      req.query.creatorId, req.query.birthId)
    .then((resolve) => {
      res.status(200).json(resolve);
    })
    .catch((reject) => {
      logger.warn('[SubjectController] getPost:fetchPosts - %s', reject);
      res.status(500).send();
    });
};

//get comments
exports.getComment = function(req, res) {
  logger.info('[SubjectController] getComment' +
    ' - Get comments for subject %s', req.query.birthId);
  fetchComments(
      req.query.lastTimestamp, req.query.birthId, req.query.noOfComments)
    .then((resolve) => {
      res.status(200).json(resolve);
    })
    .catch((reject) => {
      logger.warn('[SubjectController] getComment:fetchComments - %s', reject);
      res.status(422).send();
    });
};

//get profile images
exports.getProfileImage = (req, res) => {
  logger.info('[SubjectController] getProfileImage' +
    ' - Get profile image for subject %s', req.query.birthId);
  const dimen = Number(req.query.dimen);
  const quality = Number(req.query.quality);
  sharp('./images/' + req.query.birthId)
    .resize(dimen, dimen)
    .jpeg({
      quality: quality
    })
    .withoutEnlargement(true)
    .toBuffer()
    .then((data) => {
      logger.verbose('[SubjectController] getProfileImage:sharp' +
        ' - Image %s sent', req.query.birthId);
      res.set('Content-Type', 'image/jpg');
      res.status(200).send(data);
    })
    .catch((reject) => {
      logger.warn('[SubjectController] getProfileImage:sharp - %s', reject);
      res.status(500).send({
        success: false
      });
    });
};

exports.getInfo = (req, res) => {
  logger.info('[SubjectController] getInfo' +
    ' - Get info for subject %s', req.query.birthId);
  const birthId = req.query.birthId;
  var subjectInfo;
  Subject.findOne({
      birthId: birthId
    }, ['-_id', '-__v', '-password'])
    .lean()
    .exec()
    .then((subject) => {
      subjectInfo = subject;
      //fetching posts
      return Post.find({
        creatorId: birthId
      }).exec();
    })
    .catch((err) => {
      logger.warn('[SubjectController] getInfo:findOne - %s', err);
      res.status(400).json({});
    })
    .then((posts) => {
      subjectInfo.posts = posts.length;
      //fetching comments
      return Comment.find({
        birthId: birthId
      }).exec();
    })
    .then((comments) => {
      subjectInfo.comments = comments.length;
      //fetching rank
      return getRank(birthId);
    })
    .then((rank) => {
      subjectInfo.rank = rank;
      logger.verbose('[SubjectController] getInfo:findOne:getRank - name is %s',
        subjectInfo.name);
      res.status(200).json(subjectInfo);
    })
    .catch((err) => {
      logger.warn('[SubjectController] getInfo:findOne:getRank - %s', err);
      res.status(500).json({});
    });
};

//get overview
exports.overview = (req, res) => {
  logger.info('[SubjectController] overview' +
    ' - Get overview for subject %s', req.query.birthId);
  var resultPosts, resultComments;
  var lastTimestamp = req.query.lastTimestamp,
    birthId = req.query.birthId,
    size = req.query.size;
  fetchComments(lastTimestamp, birthId, size)
    .then((resolve) => {
      resultComments = resolve;
      return fetchPosts(lastTimestamp, birthId, size);
    })
    .then((resolve) => {
      resultPosts = resolve;
      res.status(200).json({
        posts: resultPosts,
        comments: resultComments
      });
    })
    .catch((reject) => {
      logger.warn('[SubjectController] overview:fetchComments:fetchPosts - %s',
        reject);
      res.status(500).json({});
    });
};

var getRank = (birthId) => new Promise((resolve, reject) => {
  Subject.find({}, ['patriotIndex', 'name', 'birthId'])
    .sort({
      'patriotIndex': -1,
      'name': 1
    })
    .exec()
    .then((subjects) => {
      var isFound = false;
      for (var x = 0; x < subjects.length; x++) {
        if (subjects[x].birthId === birthId) {
          isFound = true;
          resolve(x);
        }
      }
      if (!isFound) {
        reject(400);
      }
    })
    .catch((err) => {
      logger.warn('[SubjectController] getRank:find - %s',
        err);
      reject(500);
    });
});

var mapPostsToComments = (posts, comments) => {
  for (var x = 0; x < comments.length; x++) {
    for (var y = 0; y < posts.length; y++) {
      if (posts[y]._id === comments[x].postId) {
        comments[x].post = posts[y];
      }
    }
  }
  return comments;
};

var fetchComments = (lastTimestamp, birthId, size) =>
  new Promise((resolve, reject) => {
    var lastDatetime = moment.unix(lastTimestamp)
      .toDate();

    var commentsResult, postsResult;
    Comment.find({
        birthId: birthId,
        timeCreated: {
          '$lt': lastDatetime
        }
      })
      .sort('-timeCreated')
      .lean()
      .limit(Number(size))
      .then((comments) => {
        commentsResult = comments;
        var postList = [];
        for (var x = 0; x < comments.length; x++) {
          postList.push(String(comments[x].postId));
        }
        return Post.find({
            _id: {
              '$in': postList
            }
          }, ['_id', 'creatorName', 'timeCreated', 'contentType',
            'text', 'imageId'
          ])
          .lean()
          .exec();
      })
      .then((posts) => {
        postsResult = posts;
        var subjectList = [];
        for (var x = 0; x < posts.length; x++) {
          subjectList.push(String(posts[x].creatorId));
        }
        resolve(mapPostsToComments(postsResult, commentsResult));
      })
      .catch((err) => {
        logger.warn('[SubjectController] fetchComments:find:find - %s',
          err);
        reject(err);
      });
  });

var fetchPosts = (requestId, lastTimestamp, skipCount, creatorId, birthId) =>
  new Promise((resolve, reject) => {
    var promiseList = [];
    var result = [];

    var lastDatetime = moment(Number(lastTimestamp)).utc().format();

    Post.find({
        creatorId: creatorId,
        timeCreated: {
          '$lt': lastDatetime
        }
      })
      .sort('-timeCreated')
      .skip(skipCount)
      .limit(100)
      .then((nextPostsList) => {
        for (var x = 0; x < nextPostsList.length; x++) {
          promiseList.push(getPostVotes(nextPostsList[x], birthId));
        }
        return Promise.all(promiseList);
      })
      .then((posts) => {
        result = {
          requestId: requestId,
          posts: posts.slice(0, 10)
        };
        return cacheManager.saveInCache(requestId, skipCount, posts);
      })
      .then((posts) => {
        logger.verbose('[SubjectController] fetchPosts:find:promise ' +
          '- posts fetched');
        resolve(result);
      })
      .catch((err) => {
        logger.warn('[SubjectController] fetchPosts:find - %s',
          err);
        reject(err);
      });
  });

var getPostVotes = (post, birthId) => new Promise((resolve, reject) => {
  var newPost = post.toObject();
  newPost.votes = newPost.upVotes - newPost.downVotes;

  Vote.findOne({
      birthId: birthId,
      postId: newPost._id
    }).exec()
    .then((vote) => {
      newPost.opinion = (vote == null) ? 0 : vote.value;
      resolve(newPost);
    })
    .catch((err) => {
      logger.warn('[ContentController] getPostVotes:findOne - ' + err);
      reject(err);
    });
});
