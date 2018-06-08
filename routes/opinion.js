const express = require('express');
const logger = require('../utils/logger');

const router = express.Router();

const likeController = require('../controllers/likeController');
const commentController = require('../controllers/commentController');

router.post('/like', likeController.addLike);

router.delete('/like', likeController.deleteLike);

router.get('/likeTotal', likeController.getLikeTotal);

router.get('/likePerPost', likeController.getLikePerPost);

router.post('/comment', commentController.addComment);

router.delete('/comment', commentController.deleteComment);

router.get('/comments', commentController.getComments);

module.exports = {
  router
};
