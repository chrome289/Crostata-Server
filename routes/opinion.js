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
      updateVoteTotals(newVote.post_id).then((resolve) => {
        logger.debug('routes:opinion:submitVote:findOneAndUpdate:updateVoteTotals -- birth_id ' +
          newVote.birth_id + " post_id " + newVote.post_id);
        reply.submitVoteSuccess(res);
      }, (reject) => {
        logger.debug('routes:opinion:submitVote:findOneAndRemove:updateVoteTotals -- ' + err);
        reply.submitVoteFailure(res, 500);
      });
    } else {
      newVote.save().then((vote) => {
        updateVoteTotals(newVote.post_id).then((resolve) => {
          logger.debug('routes:opinion:submitVote:findOneAndUpdate:save:updateVoteTotals -- birth_id ' +
            newVote.birth_id + " post_id " + newVote.post_id);
          reply.submitVoteSuccess(res);
        }, (reject) => {  
          logger.debug('routes:opinion:submitVote:findOneAndRemove:save:updateVoteTotals -- ' + err);
          reply.submitVoteFailure(res, 500);
        });
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
    birth_id: req.query.birth_id,
    post_id: req.query.post_id
  }).then((vote) => {
    updateVoteTotals(req.query.post_id).then((resolve) => {
      logger.debug('routes:opinion:deletevote:findOneAndRemove -- birth_id ' +
        req.query.birth_id + " post_id " + req.query.post_id);
      reply.submitVoteSuccess(res);
    });
  }, (err) => {
    logger.debug('routes:opinion:deletevote:findOneAndRemove -- ' + err);
    reply.submitVoteFailure(res, 500);
  });
});

router.get('/voteTotal', (req, res) => {
  Vote.find({
    post_id: req.query.post_id
  }).exec((err, votes) => {
    if (err) {
      logger.debug('routes:opinion:voteTotal:find -- ' + err);
      reply.voteTotalFailure(res, 500);
    } else {
      var total = 0;
      for (var x = 0; x < votes.length; x++)
        total += votes[x].value;
      logger.debug('routes:opinion:voteTotal:find -- post_id ' + total);
      reply.voteTotalSuccess(res, total);
    }
  });
});

router.get('/votePerPost', (req, res) => {
  Vote.find({
    birth_id: req.query.birth_id,
    post_id: req.query.post_id
  }).then((vote) => {
    if (vote.length > 0) {
      //logger.debug(vote);
      logger.debug('routes:opinion:votePerPost:findOne -- post_id ' + vote.value);
      reply.votePerPostSuccess(res, vote.value);
    } else {
      logger.debug('routes:opinion:votePerPost:findOne -- user didn\'t vote ');
      reply.votePerPostFailure(res, 400);
    }
  }, (err) => {
    logger.debug('routes:opinion:votePerPost:findOne -- ' + err);
    reply.votePerPostFailure(res, 500);
  });
});

updateVoteTotals = postId => new Promise((resolve, reject) => {
  Vote.find({
    post_id: postId
  }).then((votes) => {
    var totalUpVotes = 0;
    var totalDownVotes = 0;
    for (var x = 0; x < votes.length; x++) {
      if (votes[x].value == 1) {
        totalUpVotes++;
      } else {
        totalDownVotes++;
      }
    }
    Post.findOneAndUpdate({
      post_id: postId
    }, {
      up_votes: totalUpVotes,
      down_votes: totalDownVotes
    }).then((post) => {
      logger.debug('routes:opinion:updateVoteTotals:find -- post_id ' + totalUpVotes - totalDownVotes);
      resolve(totalUpVotes - totalDownVotes);
    }, (err) => {
      logger.debug('routes:opinion:updateVoteTotals:find -- ' + err);
      reject(err);
    });
  }, (err) => {
    logger.debug('routes:opinion:updateVoteTotals:find -- ' + err);
    reject(err);
  });
});

module.exports = {
  router
};
