var express = require('express');
var path = require('path');
var logger = require('../utils/logger');
var bcrypt = require('bcrypt');
var moment = require('moment');
var multer = require('multer');
var fs = require('fs');
var shortid = require('shortid');

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

var router = express.Router();

var Post = require('../models/post');
var config = require('config');
var reply = require('../utils/reply');
var validate = require('../utils/validate');

router.post('/submitTextPost', (req, res) => {
  var postContent = req.body.postContent;
  const ext = '.txt';
  if (validate.validateTextPost(req)) {
    var filename = shortid.generate() + 'UTC' + new Date().getTime();
    var newPost = new Post({
      post_id: filename,
      creator_id: req.body.birth_id,
      time_created: moment().utc().valueOf(),
      content_type: "TO",
      text_url: filename,
      pic_url: "",
      up_votes: 0,
      down_votes: 0,
      is_censored: false,
      is_generated: req.body.generate
    });
    //logger.silly('date' + newPost.time_created + "-$$$-" + moment.format());
    fs.writeFile('./posts/texts/' + filename, postContent, (err) => {
      if (err) {
        logger.debug('Routes:content:submitTextPost:writeFile --' + err);
        reply.submitTextPostFailure(res, 1);
      } else {
        newPost.save((err, post) => {
          if (err) {
            logger.debug('Routes:content:submitTextPost:mongoose --' + err);
            reply.submitTextPostFailure(res, 1);
          } else {
            logger.debug("Routes:content:submitTextPost -- Post saved -> " + post.post_id);
            reply.submitTextPostSuccess(res);
          }
        });
      }
    });

  } else {
    reply.submitTextPostFailure(res, 2);
  }
});


router.post('/submitImagePost', (req, res) => {
  if (true) {
    upload(req, res, (err) => {
      if (err) {
        logger.debug('Routes:content:submitTextPost:multer --' + err);
        reply.submitImagePostFailure(res, 1);
      } else {
        //logger.silly(req.file.filename);
        var filename = req.file.filename;
        var newPost = new Post({
          post_id: filename,
          creator_id: req.body.birth_id,
          time_created: moment().utc().valueOf(),
          content_type: 'IO',
          text_url: '',
          pic_url: filename,
          up_votes: 0,
          down_votes: 0,
          is_censored: false,
          is_generated: req.body.generate
        });
        //logger.silly('date' + newPost.time_created + "-$$$-" + moment.format());
        newPost.save((err, post) => {
          if (err) {
            logger.debug('Routes:content:submitTextPost:mongoose --' + err);
            reply.submitImagePostFailure(res, 1);
          } else {
            logger.debug('Routes:content:submitTextPost -- Post saved -> ' + post.post_id);
            reply.submitImagePostSuccess(res);
          }
        });
      }
    });
  } else {
    reply.submitImagePostFailure(res, 2);
  }
});



router.post('/getPosts', (req, res) => {
  if (validate.validateGetPost(req)) {
    var noOfPosts = Number(req.body.noOfPosts);
    var lastDatetime = moment.unix(req.body.lastTimestamp)
      .utc()
      .format('YYYY-MM-DD HH:mm:ss.SSS');
    var postArray = [];

    logger.silly(lastDatetime);
    Post.find({
        time_created: {
          $gt: lastDatetime
        }
      })
      .sort('-time_created')
      .limit(noOfPosts)
      .exec((err, posts) => {
        if (err) {
          logger.error(err);
          reply.getPostFailure(res, 1);
        } else {
          for (var x = 0; x < posts.length; x++) {
            postArray.push({
              post_id: posts[x].post_id,
              time_created: posts[x].time_created
            });
          }
          reply.getPostSuccess(res, postArray);
        }
      });

  } else {
    reply.getPostFailure(res, 2);
  }
});

module.exports = {
  router
};
