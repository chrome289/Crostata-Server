'use strict';
const express = require('express');
const logger = require('../utils/logger');
const mongoose = require('mongoose');
const sharp = require('sharp');

var moment = require('moment');

const Post = require('../models/post');
const Comment = require('../models/comment');
const Subject = require('../models/subject');

var config = require('config');

exports.getPatriotIndex = (req, res) => {
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
      logger.error(err);
      res.status(422).json({
        birthId: req.query.birthId,
        patriotIndex: 0
      });
    });
};

exports.getRank = (req, res) => {
  getRank(req.query.birthId)
    .then((rank) => {
      res.status(200).json({
        birthId: req.query.birthId,
        rank: rank
      });
    })
    .catch((status) => {
      res.status(status).json({
        birthId: 0,
        rank: 0
      });
    });
};

//get charts
exports.charts = (req, res) => {
  Subject.find({}, ['birthId', 'name', 'patriotIndex', '-_id'])
    .sort({
      'patriotIndex': -1,
      'name': 1
    })
    .lean()
    .limit(100)
    .exec()
    .then((subjects) => {
      res.status(200).json(subjects);
    })
    .catch((err) => {
      logger.error(err);
      res.status(500).json({});
    });
};

//get posts
exports.getPost = (req, res) => {
  fetchPosts(req.query.lastTimestamp, req.query.birthId, req.query.size)
    .then((resolve) => {
      res.status(200).json(resolve);
    })
    .catch((reject) => {
      logger.debug('routes:subject:getSubjectPostsId:find -- ' + reject);
      res.status(500).send();
    });
};

//get comments
exports.getComment = function(req, res) {
  fetchComments(
      req.query.lastTimestamp, req.query.birthId, req.query.noOfComments)
    .then((resolve) => {
      res.status(200).json(resolve);
    })
    .catch((reject) => {
      logger.debug('routes:opinion:getCommentForUser:find -- ' + reject);
      res.status(422).send();
    });
};

//get profile images
exports.getProfileImage = (req, res) => {
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
      res.set('Content-Type', 'image/jpg');
      res.status(200).send(data);
    })
    .catch((reject) => {
      logger.error('routes:subject:getProfileImage:sharp -- ' + reject);
      res.status(500).send({
        success: false
      });
    });
};

exports.getInfo = (req, res) => {
  const birthId = req.query.birthId;
  var subjectInfo;
  Subject.findOne({
      birthId: birthId
    }, ['-_id', '-__v'])
    .lean()
    .exec()
    .then((subject) => {
      subjectInfo = subject;
      return Post.find({
        creatorId: birthId
      }).exec();
    })
    .catch((err) => {
      logger.error(err);
      res.status(400).json({});
    })
    .then((posts) => {
      subjectInfo.posts = posts.length;
      return Comment.find({
        birthId: birthId
      }).exec();
    })
    .then((comments) => {
      subjectInfo.comments = comments.length;
      return getRank(birthId);
    })
    .then((rank) => {
      subjectInfo.rank = rank;
      res.status(200).json(subjectInfo);
    })
    .catch((err) => {
      logger.error(err);
      res.status(500).json({});
    });
};

//get overview
exports.overview = (req, res) => {
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
      logger.error(reject);
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
      logger.error(err);
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
        reject(err);
      });
  });

var fetchPosts = (lastTimestamp, birthId, size) =>
  new Promise((resolve, reject) => {
    var lastDatetime = moment.unix(lastTimestamp)
      .toDate();
    Post.find({
        creatorId: birthId,
        timeCreated: {
          '$lt': lastDatetime
        }
      })
      .sort('-timeCreated')
      .limit(Number(size))
      .exec()
      .then((posts) => {
        resolve(posts);
      })
      .catch((err) => {
        reject(err);
      });
  });
