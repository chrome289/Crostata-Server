const express = require('express');
const path = require('path');
const logger = require('../utils/logger');
const bcrypt = require('bcrypt');
const multer = require('multer');
const fs = require('fs');
const util = require('util');
const sharp = require('sharp');

var shortid = require('shortid');
var moment = require('moment');

var diskStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    return cb(null, './posts/images/');
  },
  filename: (req, file, cb) => {
    const ext = '.jpg';
    return cb(null, shortid.generate() + 'UTC' + new Date().getTime());
  }
});

var upload = multer({
  storage: diskStorage
}).single('file');


var Subject = require('../models/subject');
var Post = require('../models/post');
var Vote = require('../models/vote');
var config = require('config');

exports.addTextPost = (req, res) => {
  logger.info('[ContentController] Adding textpost for subject %s',
    req.body.birthId);
  var postContent = req.body.postContent;
  var title = req.body.title;
  const ext = '.txt';
  var filename = shortid.generate() + 'UTC' + new Date().getTime();
  var newPost = new Post({
    creatorId: req.body.birthId,
    timeCreated: moment().utc().valueOf(),
    contentType: 'TO',
    title: title,
    text: postContent,
    imageId: '',
    upVotes: 0,
    downVotes: 0,
    comments: 0,
    isCensored: false,
    isGenerated: req.body.generate
  });
  getSubjectName(req.body.birthId)
    .then((resolve) => {
      newPost.creatorName = resolve;
      return saveNewPostDB(newPost);
    })
    .then((result) => {
      logger.verbose('[ContentController] addTextPost:getSubjectName -' +
        ' Post saved for subject %s with postId %s',
        result.creatorId, result._id);
      res.status(200).send();
    })
    .catch((err) => {
      logger.warn('[ContentController] addTextPost:getSubjectName - ' + err);
      res.status(500).send();
    });
};

exports.addComboPost = (req, res) => {
  logger.info('[ContentController] Adding combopost for subject %s',
    req.body.birthId);
  upload(req, res, (err) => {
    if (err) {
      logger.warn('[ContentController] addComboPost:upload - ' + err);
      res.status(500).send();
    } else {
      var postContent = req.body.postContent;
      var title = req.body.title;
      const ext = '.txt';
      var filename = req.file.filename;
      var newPost = new Post({
        creatorId: req.body.birthId,
        timeCreated: moment().utc().valueOf(),
        contentType: 'IT',
        title: title,
        text: postContent,
        imageId: filename + '',
        upVotes: 0,
        downVotes: 0,
        comments: 0,
        isCensored: false,
        isGenerated: req.body.generate
      });
      getSubjectName(req.body.birthId)
        .then((resolve) => {
          newPost.creatorName = resolve;
          return saveNewPostDB(newPost);
        })
        .then((result) => {
          logger.verbose('[ContentController] addComboPost:upload:' +
            'getSubjectName - Post saved for subject %s with postId %s',
            result.creatorId, result._id);
          res.status(200).send();
        })
        .catch((error) => {
          logger.warn('[ContentController] addComboPost:upload:' +
            'getSubjectName - ' + err);
          res.status(500).send();
        });
    }
  });
};

exports.getNextPosts = (req, res) => {
  logger.info('[ContentController] Fetching next posts');
  var noOfPosts = Number(req.query.noOfPosts);
  var birthId = req.query.birthId;
  var lastDatetime = moment(Number(req.query.lastTimestamp)).utc().format();
  var result = [];
  var promiseList = [];
  Post.find({
      timeCreated: {
        '$lt': lastDatetime
      }
    })
    .sort('-timeCreated')
    .limit(noOfPosts)
    .exec()
    .then((nextPostsList) => {
      for (var x = 0; x < nextPostsList.length; x++) {
        promiseList.push(getPostVotes(nextPostsList[x], birthId));
      }
      Promise.all(promiseList)
        .then((results) => {
          logger.verbose('[ContentController] getNextPosts:find:promise ' +
            '- posts fetched');
          res.status(200).json(results);
        })
        .catch((error) => {
          logger.warn('[ContentController] getNextPosts:find:promise - ' + err);
          res.status(500).send();
        });
    })
    .catch(err => {
      logger.warn('[ContentController] getNextPosts:find - ' + err);
      res.status(500).send();
    });
};

//get images in posts
exports.getPostedImage = (req, res) => {
  logger.info('[ContentController] getPostedImage ' +
    '- Image %s requested', req.query.imageId);
  const dimen = Number(req.query.dimen);
  const quality = Number(req.query.quality);
  sharp('./posts/images/' + req.query.imageId)
    .resize(dimen, null)
    .jpeg({
      quality: quality
    })
    .withoutEnlargement(true)
    .toBuffer()
    .then((data) => {
      logger.verbose('[ContentController] getPostedImage:sharp ' +
        '- image fetched');
      res.set('Content-Type', 'image/jpg');
      res.status(200).send(data);
    })
    .catch((err) => {
      logger.warn('[ContentController] getPostedImage:sharp - ' + err);
      res.status(500).send({
        success: false
      });
    });
};

exports.getImageMetadata = (req, res) => {
  logger.info('[ContentController] getImageMetadata ' +
    '- Metadata for image %s requested', req.query.imageId);
  sharp('./posts/images/' + req.query.imageId)
    .metadata()
    .then((metadata) => {
      logger.verbose('[ContentController] getImageMetadata:sharp ' +
        '- image metadata fetched');
      res.status(200).json({
        width: metadata.width,
        height: metadata.height
      });
    })
    .catch((err) => {
      logger.warn('[ContentController] getImageMetadata:sharp - ' + err);
      res.status(400).send();
    });
};

getSubjectName = birthId => new Promise((resolve, reject) => {
  Subject.findOne({
      birthId: birthId
    }).exec()
    .then((subject) => {
      if (subject == null) {
        reject(422);
      } else {
        resolve(subject.name);
      }
    })
    .catch((err) => {
      logger.warn('[ContentController] getSubjectName:findOne - ' + err);
      reject(err);
    });
});

getPostVotes = (post, birthId) => new Promise((resolve, reject) => {
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

saveNewPostDB = newPost => new Promise((resolve, reject) => {
  newPost.save((err, post) => {
    if (err) {
      logger.warn('[ContentController] saveNewPostDB:save - ' + err);
      reject(err);
    } else {
      resolve();
    }
  });
});

readFile = (path, root) => new Promise((resolve, reject) => {
  if (String(path).length === 0) {
    resolve('');
  } else {
    path = root + path;
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) {
        logger.warn('[ContentController] readFile:readFile - ' + err);
        reject(err);
      } else {
        resolve(data);
      }
    });
  }
});
