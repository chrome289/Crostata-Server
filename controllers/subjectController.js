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

exports.getPosts = (req, res) => {
  var lastDatetime = moment.unix(req.query.lastTimestamp)
    .toDate();
  Post.find({
      creatorId: req.query.birthId,
      timeCreated: {
        '$lt': lastDatetime
      }
    })
    .sort('-timeCreated')
    .limit(10)
    .exec()
    .then((posts) => {
      res.status(200).json(posts);
    })
    .catch((err) => {
      logger.debug('routes:subject:getSubjectPostsId:find -- ' + err);
      res.status(500).send({
        success: false
      });
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
    .catch((err) => {
      logger.error('routes:subject:getProfileImage:sharp -- ' + err);
      res.status(500).send({
        success: false
      });
    });
};

exports.getComment = function(req, res) {
  var lastDatetime = moment.unix(req.query.lastTimestamp)
    .toDate();

  var commentsResult;
  Comment.find({
      birthId: req.query.birthId,
      timeCreated: {
        '$lt': lastDatetime
      }
    })
    .lean()
    .sort('-timeCreated')
    .limit(Number(req.query.noOfComments))
    .then((comments) => {
      commentsResult = comments;
      var postList = [];
      for (var x = 0; x < comments.length; x++) {
        postList.push(String(comments[x].postId));
      }
      return Post.find({
          postId: {
            '$in': postList
          }
        }, ['-_id', 'postId', 'timeCreated', 'contentType',
          'text', 'imageId'
        ])
        .lean()
        .exec();
    })
    .then((posts) => {
      logger.debug(posts[0]);
      res.status(200).json(mapPostsToComments(posts, commentsResult));
    })
    .catch((err) => {
      logger.debug('routes:opinion:getCommentForUser:find -- ' + err);
      res.status(422).json({
        success: false,
        comments: [],
      });
    });
};

exports.getInfo = (req, res) => {
  const birthId = req.query.birthId;
  var subjectInfo;
  Subject.findOne({
      birthId: birthId
    }, ['-_id', 'birthId', 'name', 'dob', 'profession',
      'gender', 'patriotIndex', 'alive'
    ])
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
      if (posts[y].postId === comments[x].postId) {
        comments[x].post = posts[y];
      }
    }
  }
  return comments;
};
