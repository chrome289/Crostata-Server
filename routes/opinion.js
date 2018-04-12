const express = require('express');
const logger = require('../utils/logger');

const router = express.Router();

const voteController = require('../controllers/voteController');
const commentController = require('../controllers/commentController');
const reportController = require('../controllers/reportController');

router.post('/vote', voteController.addVote);

router.delete('/vote', voteController.deleteVote);

router.get('/voteTotal', voteController.getVoteTotal);

router.get('/votePerPost', voteController.getVotePerPost);

router.post('/comment', commentController.addComment);

router.delete('/comment', commentController.deleteComment);

router.get('/comments', commentController.getComments);

router.post('/report', reportController.addReport);

module.exports = {
  router
};
