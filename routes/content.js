var express = require('express');
var path = require('path');
var logger = require('../utils/logger');
var bcrypt = require('bcrypt');
var moment = require('moment');
var router = express.Router();

var Post = require('../models/post');
var config = require('config');
var reply = require('../utils/reply');
var validate = require('../utils/validate');

router.post('/submitTextPost', (req, res) => {
  var postContent = req.body.postContent;
  if (validate.validateTextPost(req)) {
    bcrypt.hash(postContent + moment().utc().valueOf(), 2, (err, hash) => {
      if (err) {
        logger.debug('Routes:content:submitTextPost:bcrypt --' + err);
        reply.submitTextPostFailure('SERVER_ERROR', 1);
      } else {
        var newPost = new Post({
          post_id: hash,
          creator_id: req.body.birth_id,
          time_created: moment().utc().valueOf(),
          content_type: "TO",
          text_url: "/posts/to/" + hash,
          pic_url: "",
          up_votes: 0,
          down_votes: 0,
          is_censored: false,
          is_generated: (req.body.generate == 0) ? false : true
        });
        //logger.silly('date' + newPost.time_created + "-$$$-" + moment.format());
        newPost.save((err, post) => {
          if (err) {
            logger.debug('Routes:content:submitTextPost:mongoose --' + err);
            reply.submitTextPostFailure('SERVER_ERROR', 1);
          } else {
            logger.debug("Routes:content:submitTextPost -- Post saved -> " + post.post_id);
            reply.submitTextPostSuccess(res);
          }
        });
      }
    });
  } else {
    reply.submitTextPostFailure('INVALID_PARAMS', 2);
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
          reply.getPostFailure('SERVER_ERROR', 1);
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
    reply.getPostFailure('INVALID_PARAMS', 2);
  }
});


module.exports = {
  router
};
