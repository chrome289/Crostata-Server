'use strict';

const express = require('express');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

var moment = require('moment');

const Post = require('../models/post');
const Vote = require('../models/vote');
const Subject = require('../models/subject');

var config = require('config');

exports.addVote = function(req, res) {
  logger.info('[VoteController] addVote ' +
    '- Adding vote for post %s and subject %s',
    req.body.postId, req.body.birthId);
  var newVote = new Vote({
    birthId: req.body.birthId,
    postId: req.body.postId,
    value: req.body.value
  });
  Vote.findOneAndUpdate({
      birthId: newVote.birthId,
      postId: newVote.postId
    }, {
      value: newVote.value
    })
    .then((vote) => {
      if (vote != null) {
        updateVoteTotals(newVote.postId)
          .then((voteTotal) => {
            logger.verbose('[VoteController] ' +
              'addVote:findOneAndUpdate:updateVoteTotals - vote updated');
            voteSuccess(res, voteTotal);
          })
          .catch((err) => {
            logger.warn('[VoteController] ' +
              'addVote:findOneAndUpdate:updateVoteTotals - %s', err);
            voteFailure(res, 500);
          });
      } else {
        saveNewVote(newVote)
          .then((voteTotal) => {
            logger.verbose('[VoteController] ' +
              'addVote:findOneAndUpdate:saveNewVote - vote saved');
            voteSuccess(res, voteTotal);
          })
          .catch((err) => {
            logger.warn('[VoteController] ' +
              'addVote:findOneAndUpdate:saveNewVote - %s', err);
            voteFailure(res, 500);
          });
      }
    })
    .catch((err) => {
      logger.warn('[VoteController] addVote:findOneAndUpdate' +
        ' - %s', err);
      voteFailure(res, 500);
    });
};

exports.deleteVote = function(req, res) {
  logger.info('[VoteController] deleteVote ' +
    '- Deleting vote for post %s and subject %s',
    req.query.postId, req.query.birthId);
  Vote.findOneAndRemove({
    birthId: req.query.birthId,
    postId: req.query.postId
  }).then((vote) => {
    updateVoteTotals(req.query.postId).then((voteTotal) => {
      logger.verbose('[VoteController] ' +
        'deleteVote:findOneAndRemove:updateVoteTotals' +
        ' - updated vote total for postId %s and subject %s',
        req.query.postId, req.query.birthId);
      voteSuccess(res, voteTotal);
    });
  }, (err) => {
    logger.warn('[VoteController] deleteVote:findOneAndRemove' +
      ' - %s', err);
    voteFailure(res, 500);
  });
};

exports.getVoteTotal = function(req, res) {
  logger.info('[VoteController] getVoteTotal ' +
    '- Get vote total for post %s', req.query.postId);
  Vote.find({
    postId: req.query.postId
  }).exec((err, votes) => {
    if (err) {
      logger.warn('[VoteController] getVoteTotal:find' +
        ' - %s', err);
      voteFailure(res, 500);
    } else {
      var total = 0;
      for (var x = 0; x < votes.length; x++) {
        total += votes[x].value;
      }
      logger.verbose('[VoteController] getVoteTotal:find' +
        ' - total votes for post %s are %d', req.query.postId, total);
      voteSuccess(res, total);
    }
  });
};

exports.getVotePerPost = function(req, res) {
  logger.info('[VoteController] getVoteTotal ' +
  '- Get vote total for post %s and subject %s',
  req.query.postId, req.query.birthId);
  Vote.find({
    birthId: req.query.birthId,
    postId: req.query.postId
  }).then((vote) => {
    if (vote.length > 0) {
      logger.verbose('[VoteController] getVotePerPost:find' +
        ' - subject %s voted %d for post %s',
        req.query.birthId, vote.value, req.query.postId);
      voteSuccess(res, vote.value);
    } else {
      logger.verbose('[VoteController] getVotePerPost:find' +
        ' - no vote found');
      voteFailure(res, 400);
    }
  }, (err) => {
    logger.warn('[VoteController] getVotePerPost:find' +
      ' - %s', err);
    voteFailure(res, 500);
  });
};

var saveNewVote = newVote => new Promise((resolve, reject) => {
  newVote.save()
    .then((vote) => {
      updateVoteTotals(newVote.postId)
        .then((voteTotal) => {
          resolve(voteTotal);
        })
        .catch((err) => {
          logger.warn('[VoteController] saveNewVote:save:updateVoteTotals' +
            ' - %s', err);
          reject(err);
        });
    })
    .catch((err) => {
      logger.warn('[VoteController] saveNewVote:save' +
        ' - %s', err);
      reject(err);
    });
});

var updateVoteTotals = postId => new Promise((resolve, reject) => {
  Vote.find({
      postId: postId
    })
    .then((votes) => {
      var totalUpVotes = 0;
      var totalDownVotes = 0;
      for (var x = 0; x < votes.length; x++) {
        if (votes[x].value === 1) {
          totalUpVotes++;
        } else {
          totalDownVotes++;
        }
      }
      Post.findOneAndUpdate({
          _id: postId
        }, {
          upVotes: totalUpVotes,
          downVotes: totalDownVotes
        })
        .then((post) => {
          resolve(totalUpVotes - totalDownVotes);
        })
        .catch((err) => {
          logger.warn('[VoteController] updateVoteTotal:find:findOneAndUpdate' +
            ' - %s', err);
          reject(err);
        });
    })
    .catch((err) => {
      logger.warn('[VoteController] updateVoteTotals:find - %s',
        err);
      reject(err);
    });
});


var voteSuccess = (res, total) => {
  res.status(200).json({
    success: true,
    total: total
  });
};

var voteFailure = (res, resultCode) => {
  res.status(resultCode).json({
    success: false,
    total: 0
  });
};
