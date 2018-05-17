const express = require('express');
const logger = require('../utils/logger');

const router = express.Router();

const searchController = require('../controllers/searchController');

router.get('/', searchController.search);

module.exports = {
  router
};
