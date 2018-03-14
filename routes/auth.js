var express = require('express');
var logger = require('../utils/logger');

var router = express.Router();

var authController = require('../controllers/authController');

router.post('/login', authController.login);

router.post('/signup', authController.signup);

router.post('/loginToken', authController.loginToken);

module.exports = {
  router
};
