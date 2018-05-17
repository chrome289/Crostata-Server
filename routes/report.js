const express = require('express');
const logger = require('../utils/logger');

const router = express.Router();

const reportController = require('../controllers/reportController');

router.post('/report', reportController.addReport);

router.get('/reportMade', reportController.getReportsMade);

router.get('/reportAgainst', reportController.getReportsAgainst);

module.exports = {
  router
};
