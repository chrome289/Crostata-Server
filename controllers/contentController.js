const express = require('express');
const path = require('path');
const logger = require('../utils/logger');
const multer = require('multer');
const fs = require('fs');
const util = require('util');
const sharp = require('sharp');

const AWS = require('aws-sdk');
AWS.config.setPromisesDependency(require('bluebird'));
AWS.config.update({
  'accessKeyId': process.env.AWS_ACCESS_KEY_ID,
  'secretAccessKey': process.env.AWS_SECRET_ACCESS_KEY,
  'region': process.env.AWS_REGION
});
var s3 = new AWS.S3();

var shortid = require('shortid');
var moment = require('moment');

const cacheManager = require('../middlewares/cacheManager.js');
const likeController = require('../controllers/likeController');

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

exports.addTextPost = (req, res) => {
  logger.info('[ContentController] Adding textpost for subject %s',
    req.body.birthId);
  var postContent = req.body.postContent;
  const ext = '.txt';
  var filename = shortid.generate() + 'UTC' + new Date().getTime();
  var newPost = new Post({
    creatorId: req.body.birthId,
    timeCreated: moment().utc().valueOf(),
    contentType: 'TO',
    text: postContent,
    imageId: '',
    likes: 0,
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
      const ext = '.txt';
      var filename = req.file.filename;
      var newPost = new Post({
        creatorId: req.body.birthId,
        timeCreated: moment().utc().valueOf(),
        contentType: 'IT',
        text: postContent,
        imageId: filename + '',
        likes: 0,
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

  var result = [];
  var promiseList = [];

  var birthId = req.query.birthId;
  var skipCount = req.query.skipCount;
  var lastDatetime = moment(Number(req.query.lastTimestamp)).utc().format();

  Post.find({
      timeCreated: {
        '$lt': lastDatetime
      }
    })
    .sort('-timeCreated')
    .skip(skipCount)
    .limit(100)
    .exec()
    .then((nextPostsList) => {
      for (var x = 0; x < nextPostsList.length; x++) {
        promiseList.push(
          likeController.getPostLikes(nextPostsList[x], birthId)
        );
      }
      return Promise.all(promiseList);
    })
    .then((posts) => {
      result = {
        requestId: req.query.requestId,
        list: posts.slice(0, 10)
      };
      return cacheManager.saveInCache(req.query.requestId, skipCount, posts);
    })
    .then((resolve) => {
      logger.verbose('[ContentController] getNextPosts:find:promise ' +
        '- posts fetched');
      res.status(200).json(result);
    })
    .catch((error) => {
      logger.warn('[ContentController] getNextPosts:find - ' + error);
      res.status(500).send();
    });
};

//get images in posts
exports.getPostedImage = (req, res) => {
  logger.info('[ContentController] getPostedImage ' +
    '- Image %s requested', req.query.imageId);
  const dimen = Number(req.query.dimen);
  const quality = Number(req.query.quality);
  var readParams = {
    Bucket: process.env.BUCKET,
    Key: 'posts/images/' + req.query.imageId
  };
  s3.getObject(readParams, (err, data) => {
    if (err) {
      logger.error(err);
      res.status(500).send({
        success: false
      });
    } else {
      sharp(data.Body)
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
    }
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
    })
    .exec()
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

saveNewPostDB = newPost => new Promise((resolve, reject) => {
  //logger.verbose('[ContentController] saveNewPostDB - ' + newPost);
  newPost.save()
    .then((post) => {
      resolve(post);
    })
    .catch((err) => {
      logger.warn('[ContentController] saveNewPostDB:save - ' + err);
      reject(err);
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
