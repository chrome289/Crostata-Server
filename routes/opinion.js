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

var router = express.Router();

const Post = require('../models/post');
const Vote = require('../models/vote');
var config = require('config');
var reply = require('../utils/reply');
var validate = require('../utils/validate');


router.post('/submitVote', (req, res) => {
  if (validate.validateSubmitVote(req)) {
    var newVote = new Vote({
      birth_id: req.body.birth_id,
      post_id: req.body.post_id,
      value: req.body.value
    });

    if (newVote.value == 0) {
      Vote.findOneAndRemove({
        birth_id: newVote.birth_id,
        post_id: newVote.post_id
      }).then((vote) => {
        logger.debug('routes:opinions:submitVote:findOneAndRemove -- birth_id ' +
          newVote.birth_id + " post_id " + newVote.post_id);
        reply.submitVoteSuccess(res);
      }, (err) => {
        logger.debug('routes:opinions:submitVote:findOneAndRemove -- ' + err);
        reply.submitVoteFailure(res, 500);
      });
    } else {
      Vote.findOneAndUpdate({
        birth_id: newVote.birth_id,
        post_id: newVote.post_id
      }, {
        value: newVote.value
      }).then((vote) => {
        if (vote != null) {
          logger.debug('routes:opinions:submitVote:findOneAndUpdate -- birth_id ' +
            newVote.birth_id + " post_id " + newVote.post_id);
          reply.submitVoteSuccess(res);
        } else {
          newVote.save().then((vote) => {
            logger.debug('routes:opinions:submitVote:findOneAndUpdate:save -- birth_id ' +
              newVote.birth_id + " post_id " + newVote.post_id);
            reply.submitVoteSuccess(res);
          }, (err) => {
            logger.debug('routes:opinions:submitVote:findOneAndRemove:save -- ' + err);
            reply.submitVoteFailure(res, 500);
          });
        }
      }, (err) => {
        logger.debug('routes:opinions:submitVote:findOneAndUpdate -- ' + err);
        reply.submitVoteFailure(res, 500);
      });
    }
  } else {
    reply.submitVoteFailure(res, 400);
  }
});

router.post('/getVoteTotal', (req, res) => {
  if (validate.validateGetVoteTotal(req)) {
    Vote.find({
      post_id: req.body.post_id
    }).exec((err, votes) => {
      if (err) {
        logger.debug('routes:opinions:getVoteTotal:find -- ' + err);
        reply.getVoteTotalFailure(res, 500);
      } else {
        var total = 0;
        for (var x = 0; x < votes.length; x++)
          total += votes[x].value;
        logger.debug('routes:opinions:getVoteTotal:find -- post_id ' + total);
        reply.getVoteTotalSuccess(res, total);
      }
    });
  } else {
    reply.getVoteTotalFailure(res, 400);
  }
});

router.post('/getVotePerPost', (req, res) => {
  if (validate.validateGetVotePerPost(req)) {
    Vote.findOne({
      birth_id: req.body.birth_id,
      post_id: req.body.post_id
    }).then((vote) => {
      logger.debug(vote);
      logger.debug('routes:opinions:getVotePerPost:findOne -- post_id ' + vote.value);
      reply.getVotePerPostSuccess(res, vote.value);
    }, (err) => {
      logger.debug('routes:opinions:getVotePerPost:findOne -- ' + err);
      reply.getVotePerPostFailure(res, 500);
    });
  } else {
    reply.getVotePerPostFailure(res, 400);
  }
});

module.exports = {
  router
};
