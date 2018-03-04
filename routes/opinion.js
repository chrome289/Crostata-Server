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


router.post('/vote', (req, res) => {
  var newVote = new Vote({
    birth_id: req.body.birth_id,
    post_id: req.body.post_id,
    value: req.body.value
  });

  Vote.findOneAndUpdate({
    birth_id: newVote.birth_id,
    post_id: newVote.post_id
  }, {
    value: newVote.value
  }).then((vote) => {
    if (vote != null) {
      logger.debug('routes:opinion:submitVote:findOneAndUpdate -- birth_id ' +
        newVote.birth_id + " post_id " + newVote.post_id);
      reply.submitVoteSuccess(res);
    } else {
      newVote.save().then((vote) => {
        logger.debug('routes:opinion:submitVote:findOneAndUpdate:save -- birth_id ' +
          newVote.birth_id + " post_id " + newVote.post_id);
        reply.submitVoteSuccess(res);
      }, (err) => {
        logger.debug('routes:opinion:submitVote:findOneAndRemove:save -- ' + err);
        reply.submitVoteFailure(res, 500);
      });
    }
  }, (err) => {
    logger.debug('routes:opinion:submitVote:findOneAndUpdate -- ' + err);
    reply.submitVoteFailure(res, 500);
  });
});

router.delete('/vote', (req, res) => {
  Vote.findOneAndRemove({
    birth_id: req.body.birth_id,
    post_id: req.body.post_id
  }).then((vote) => {
    logger.debug('routes:opinion:deletevote:findOneAndRemove -- birth_id ' +
      req.body.birth_id + " post_id " + req.body.post_id);
    reply.submitVoteSuccess(res);
  }, (err) => {
    logger.debug('routes:opinion:deletevote:findOneAndRemove -- ' + err);
    reply.submitVoteFailure(res, 500);
  });
});

router.get('/voteTotal', (req, res) => {
  Vote.find({
    post_id: req.body.post_id
  }).exec((err, votes) => {
    if (err) {
      logger.debug('routes:opinion:getVoteTotal:find -- ' + err);
      reply.getVoteTotalFailure(res, 500);
    } else {
      var total = 0;
      for (var x = 0; x < votes.length; x++)
        total += votes[x].value;
      logger.debug('routes:opinion:getVoteTotal:find -- post_id ' + total);
      reply.getVoteTotalSuccess(res, total);
    }
  });
});

router.get('/votePerPost', (req, res) => {
  Vote.findOne({
    birth_id: req.body.birth_id,
    post_id: req.body.post_id
  }).then((vote) => {
    if (vote) {
      logger.debug(vote);
      logger.debug('routes:opinion:getVotePerPost:findOne -- post_id ' + vote.value);
      reply.getVotePerPostSuccess(res, vote.value);
    } else {
      logger.debug('routes:opinion:getVotePerPost:findOne -- user didn\'t vote ');
      reply.getVotePerPostFailure(res, 400);
    }
  }, (err) => {
    logger.debug('routes:opinion:getVotePerPost:findOne -- ' + err);
    reply.getVotePerPostFailure(res, 500);
  });
});

module.exports = {
  router
};
