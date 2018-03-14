/*jshint loopfunc: true */

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

exports.addTextPost = function(req, res) {
  var postContent = req.body.postContent;
  const ext = '.txt';
  var filename = shortid.generate() + 'UTC' + new Date().getTime();
  var newPost = new Post({
    postId: filename,
    creatorId: req.body.birthId,
    timeCreated: moment().utc().valueOf(),
    contentType: 'TO',
    textUrl: filename,
    imageUrl: '',
    upVotes: 0,
    downVotes: 0,
    isCensored: false,
    isGenerated: req.body.generate
  });
  //logger.silly('date' + newPost.timeCreated + '-$$$-' + moment.format());
  var promise = writeTextToFile(filename, postContent);
  promise.then((result) => {
    saveNewPostDB(newPost)
      .then((result) => {
        logger.debug('Routes:content:submitTextPost -- ' +
          'Post saved -> ' + newPost.postId);
        res.status(200).send();
      }, (error) => {
        logger.debug('Routes:content:submitTextPost:mongoose --' + err);
        res.status(500).send();
      });
  }, (error) => {
    logger.debug('Routes:content:submitTextPost:writeFile --' + err);
    res.status(500).send();
  });
};

exports.addComboPost = function(req, res) {
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
        textUrl: filename,
        imageUrl: filename,
        upVotes: 0,
        downVotes: 0,
        isCensored: false,
        isGenerated: req.body.generate
      });
      //logger.silly('date' + newPost.timeCreated + '-$$$-' + moment.format());
      writeTextToFile(filename, postContent)
        .then((result) => {
          saveNewPostDB(newPost).then((result) => {
            logger.debug('Routes:content:submitComboPost -- ' +
              'Post saved -> ' + newPost.postId);
            res.status(200).send();
          }, (error) => {
            logger.debug('Routes:content:submitComboPost:mongoose --' + err);
            res.status(500).send();
          });
        }, (error) => {
          logger.debug('Routes:content:submitComboPost:writeFile --' + err);
          res.status(500).send();
        });
    }
  });
};

exports.getNextPosts = function(req, res) {
  var noOfPosts = Number(req.query.noOfPosts);
  var birthId = req.query.birthId;
  //converting to native date because moment's date doesn't work for some reason
  var lastDatetime = moment.unix(req.query.lastTimestamp)
    .toDate();

  var result = [];
  var promises = [];
  Post.find({
      timeCreated: {
        '$lt': lastDatetime
      }
    })
    .sort('-timeCreated')
    .limit(noOfPosts)
    .then((nextPostsList) => {
      for (var x = 0; x < nextPostsList.length; x++) {
        var promise1 = readPost(nextPostsList[x]);
        var promise2 = Subject.findOne({
          birthId: nextPostsList[x].creatorId
        }).exec();
        var promise3 = Vote.findOne({
          birthId: birthId,
          postId: nextPostsList[x].postId
        }).exec();

        promises.push(new Promise((result) => {
            Promise.all([promise1, promise2, promise3]).then((values) => {
              //  logger.debug(values)
              var tempResult = values[0];
              tempResult.creatorName = values[1].name;
              tempResult.opinion = (values[2] == null) ? 0 : values[2].value;
              result(tempResult);
            });
          })
          .catch((err) => {
            logger.error(err);
          })
        );
      }
      Promise.all(promises).then((results) => {
        res.status(200).json(results);
      }, (err) => {
        res.status(500).send();
      });
    });
};

//get images in posts
exports.getPostedImage = function(req, res) {
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

//get profile images
exports.getProfileImage = function(req, res) {
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
      logger.error('routes:content:getProfileImage:sharp -- ' + err);
      res.status(500).send({
        success: false
      });
    });
};

//get all post of a specific user
exports.getSubjectPostsId = function(req, res) {
  Post.find({
    creatorId: req.query.birthId
  }, (err, posts) => {
    if (err) {
      logger.debug('routes:content:getSubjectPostsId:find -- ' + err);
      res.status(500).send({
        success: false
      });
    } else {
      res.status(200).json(posts);
    }
  });
};

writeTextToFile = (filename, postContent) => new Promise((resolve, reject) => {
  fs.writeFile('./posts/texts/' + filename, postContent, 'utf8', (err) => {
    if (err) {
      logger.debug('Routes:content:writeTextToFile:fs --' + err);
      reject(err);
    } else {
      logger.debug('Routes:content:writeTextToFile -- ' +
        'text file written to disk ');
      resolve();
    }
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

readPost = (post) => new Promise((resolve, reject) => {
  readFile(post.textUrl, './posts/texts/').then((result) => {
    resolve({
      postId: post.postId,
      creatorId: post.creatorId,
      timeCreated: post.timeCreated,
      contentType: post.contentType,
      text: result,
      votes: post.upVotes - post.downVotes,
      isCensored: post.isCensored
    });
  }, (err) => {
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
