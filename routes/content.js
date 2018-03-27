const express = require('express');
const logger = require('../utils/logger');

const router = express.Router();

const contentController = require('../controllers/contentController');

router.post('/textPost', contentController.addTextPost);

router.post('/comboPost', contentController.addComboPost);

router.get('/nextPosts', contentController.getNextPosts);

router.get('/postedImage', contentController.getPostedImage);

router.get('/imageMetadata', contentController.getImageMetadata);

module.exports = {
  router
};
