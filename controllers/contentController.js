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
  var postContent = req.body.postContent;
  const ext = '.txt';
  var filename = shortid.generate() + 'UTC' + new Date().getTime();
  var newPost = new Post({
    postId: filename,
    creatorId: req.body.birthId,
    timeCreated: moment().utc().valueOf(),
    contentType: 'TO',
    text: postContent,
    imageId: '',
    upVotes: 0,
    downVotes: 0,
    isCensored: false,
    isGenerated: req.body.generate
  });
  saveNewPostDB(newPost)
    .then((result) => {
      logger.debug('Routes:content:submitTextPost -- ' +
        'Post saved -> ' + newPost.postId);
      res.status(200).send();
    })
    .catch((err) => {
      logger.debug('Routes:content:submitTextPost --' + err);
      res.status(500).send();
    });
};

exports.addComboPost = (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      logger.debug('Routes:content:submitComboPost:multer --' + err);
      res.status(500).send();
    } else {
      var postContent = req.body.postContent;
      const ext = '.txt';
      //logger.silly(req.file.filename);
      var filename = req.file.file;
      var newPost = new Post({
        postId: filename,
        creatorId: req.body.birthId,
        timeCreated: moment().utc().valueOf(),
        contentType: 'IT',
        text: postContent,
        imageId: filename,
        upVotes: 0,
        downVotes: 0,
        isCensored: false,
        isGenerated: req.body.generate
      });
      //logger.silly('date' + newPost.timeCreated + '-$$$-' + moment.format());
      saveNewPostDB(newPost)
        .then((result) => {
          logger.debug('Routes:content:submitComboPost -- ' +
            'Post saved -> ' + newPost.postId);
          res.status(200).send();
        })
        .catch((error) => {
          logger.debug('Routes:content:submitComboPost:writeFile --' + err);
          res.status(500).send();
        });
    }
  });
};

exports.getNextPosts = (req, res) => {
  var noOfPosts = Number(req.query.noOfPosts);
  var birthId = req.query.birthId;
  //converting to native date because moment's date doesn't work for some reason
  var lastDatetime = moment.unix(req.query.lastTimestamp)
    .toDate();
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
        promiseList.push(getSuperPost(nextPostsList[x], birthId));
      }
      Promise.all(promiseList)
        .then((results) => {
          res.status(200).json({
            'posts': results
          });
        })
        .catch((error) => {
          logger.error(error);
          res.status(500).send();
        });
    });
};

//get images in posts
exports.getPostedImage = (req, res) => {
  const dimen = Number(req.query.dimen);
  const quality = Number(req.query.quality);
  sharp('./posts/images/' + req.query.postId)
    .resize(dimen, null)
    .jpeg({
      quality: quality
    })
    .withoutEnlargement(true)
    .toBuffer()
    .then((data) => {
      res.set('Content-Type', 'image/jpg');
      logger.debug(data.length);
      res.status(200).send(data);
    })
    .catch((err) => {
      logger.error('routes:content:postedImage:sharp -- ' + err);
      res.status(500).send({
        success: false
      });
    });
};

exports.getImageMetadata = (req, res) => {
  sharp('./posts/images/' + req.query.postId)
    .metadata()
    .then((metadata) => {
      res.status(200).json({
        width: metadata.width,
        height: metadata.height
      });
    })
    .catch((err) => {
      logger.error(err);
      res.status(400).send();
    });
};

getSuperPost = (originalPost, birthId) => new Promise((resolve, reject) => {
  originalPost.votes = originalPost.upVotes - originalPost.downVotes;

  Subject.findOne({
      birthId: originalPost.creatorId
    }).exec()
    .then((subject) => {
      originalPost.creatorName = subject.name;
      return Vote.findOne({
        birthId: birthId,
        postId: originalPost.postId
      }).exec();
    })
    .then((vote) => {
      originalPost.opinion = (vote == null) ? 0 : vote.value;
      resolve(originalPost);
    })
    .catch((err) => {
      logger.error(err);
      reject(err);
    });
});

saveNewPostDB = newPost => new Promise((resolve, reject) => {
  newPost.save((err, post) => {
    if (err) {
      logger.debug('Routes:content:saveNewPostDB:mongoose --' + err);
      reject(err);
    } else {
      logger.debug('Routes:content:saveNewPostDB -- ' +
        'Post saved -> ' + post.postId);
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
        logger.debug('Routes:content:readFile:fs --' + err);
        reject(err);
      } else {
        logger.debug('Routes:content:readFile:fs --' +
          'file read from path ' + path);
        resolve(data);
      }
    });
  }
});
