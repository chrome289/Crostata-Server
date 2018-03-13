/*jshint loopfunc: true */

const express = require('express');
const path = require('path');
const logger = require('../utils/logger');
const bcrypt = require('bcrypt');
const multer = require('multer');
const fs = require('fs');
const util = require('util');
const sharp = require('sharp');
const mongoose = require('mongoose');

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
const Comment = require('../models/comment');
const Subject = require('../models/subject');

var config = require('config');
var reply = require('../utils/reply');


router.post('/vote', (req, res) => {
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
  }).then((vote) => {
    if (vote != null) {
      updateVoteTotals(newVote.postId).then((voteTotal) => {
        logger.debug('routes:opinion:submitVote:findOneAndUpdate:updateVoteTotals -- birthId ' +
          newVote.birthId + " postId " + newVote.postId);
        reply.submitVoteSuccess(res, voteTotal);
      }, (reject) => {
        logger.debug('routes:opinion:submitVote:findOneAndRemove:updateVoteTotals -- ' + err);
        reply.submitVoteFailure(res, 500);
      });
    } else {
      newVote.save().then((vote) => {
        updateVoteTotals(newVote.postId).then((voteTotal) => {
          logger.debug('routes:opinion:submitVote:findOneAndUpdate:save:updateVoteTotals -- birthId ' +
            newVote.birthId + " postId " + newVote.postId);
          reply.submitVoteSuccess(res, voteTotal);
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
    birthId: req.query.birthId,
    postId: req.query.postId
  }).then((vote) => {
    updateVoteTotals(req.query.postId).then((voteTotal) => {
      logger.debug('routes:opinion:deletevote:findOneAndRemove -- birthId ' +
        req.query.birthId + " postId " + req.query.postId);
      reply.deleteVoteSuccess(res, voteTotal);
    });
  }, (err) => {
    logger.debug('routes:opinion:deletevote:findOneAndRemove -- ' + err);
    reply.deleteVoteFailure(res, 500);
  });
});

router.get('/voteTotal', (req, res) => {
  Vote.find({
    postId: req.query.postId
  }).exec((err, votes) => {
    if (err) {
      logger.debug('routes:opinion:voteTotal:find -- ' + err);
      reply.voteTotalFailure(res, 500);
    } else {
      var total = 0;
      for (var x = 0; x < votes.length; x++)
        total += votes[x].value;
      logger.debug('routes:opinion:voteTotal:find -- postId ' + total);
      reply.voteTotalSuccess(res, total);
    }
  });
});

router.get('/votePerPost', (req, res) => {
  Vote.find({
    birthId: req.query.birthId,
    postId: req.query.postId
  }).then((vote) => {
    if (vote.length > 0) {
      //logger.debug(vote);
      logger.debug('routes:opinion:votePerPost:findOne -- postId ' + vote.value);
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

router.post('/comment', (req, res) => {
  var newComment = new Comment({
    birthId: req.body.birthId,
    postId: req.body.postId,
    text: req.body.text,
    timeCreated: moment().utc().valueOf(),
    isCensored: false,
    isGenerated: req.body.generate
  });
  newComment.save()
    .then((comment) => {
      reply.submitCommentSuccess(res);
    })
    .catch((err) => {
      logger.debug('routes:opinion:postComment:save -- ' + err);
      reply.submitCommentFailure(res, 500);
    });
});

router.delete('/comment', (req, res) => {
  Comment.findOneAndRemove({
      _id: mongoose.Types.ObjectId(req.query._id)
    })
    .then((comment) => {
      if (comment == null) {
        logger.debug('routes:opinion:deleteComment:findOneAndRemove -- comment not found');
        reply.deleteCommentFailure(res, 500);
      } else {
        reply.deleteCommentSuccess(res);
      }
    })
    .catch((err) => {
      logger.debug('routes:opinion:deleteComment:findOneAndRemove -- ' + err);
      reply.deleteCommentFailure(res, 500);
    });
});

router.get('/comments', (req, res) => {
  //converting to native date because moment's date doesn't work for some reason
  var lastDatetime = moment.unix(req.query.lastTimestamp)
    .toDate();
  Comment.find({
      postId: req.query.postId,
      timeCreated: {
        '$lt': lastDatetime
      }
    })
    .sort('-timeCreated')
    .limit(Number(req.query.noOfComments))
    .then((comments) => {
      var resultPromises = [];
      logger.debug('comments '+comments+'\n\n'+comments.length);
      for (var x = 0; x < comments.length; x++) {
        resultPromises.push(getCommentDetails(comments[x]));
      }
      Promise.all(resultPromises).then((comments) => {
          reply.getCommentSuccess(res, comments);
        })
        .catch((err) => {
          logger.debug('routes:opinion:getComments:find:promises -- ' + err);
          reply.getCommentFailure(res, 500);
        });
    })
    .catch((err) => {
      logger.debug('routes:opinion:getComments:find -- ' + err);
      reply.getCommentFailure(res, 500);
    });
});

router.get('/commentForUser',(req,res)=>{

});

getCommentDetails = comment => new Promise((resolve, reject) => {
  Subject.findOne({
      birthId: comment.birthId
    }).then((subject) => {
      resolve({
        _id: comment._id,
        name: subject.name,
        text: comment.text,
        timeCreated: comment.timeCreated
      });
    })
    .catch((err) => {
      reject(err);
    });
});

updateVoteTotals = postId => new Promise((resolve, reject) => {
  Vote.find({
    postId: postId
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
      postId: postId
    }, {
      upVotes: totalUpVotes,
      downVotes: totalDownVotes
    }).then((post) => {
      logger.debug('routes:opinion:updateVoteTotals:find -- postId ' + totalUpVotes - totalDownVotes);
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
