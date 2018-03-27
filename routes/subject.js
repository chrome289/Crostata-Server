var express = require('express');
var router = express.Router();

var subjectController = require('../controllers/subjectController');

router.get('/patriotIndex', subjectController.getPatriotIndex);

router.get('/rank', subjectController.getRank);

router.get('/charts', subjectController.charts);

router.get('/profileImage', subjectController.getProfileImage);

router.get('/posts', subjectController.getPosts);

router.get('/comments', subjectController.getComment);

router.get('/info', subjectController.getInfo);

module.exports = router;
