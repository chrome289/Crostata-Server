var express = require('express');
var router = express.Router();
var randomName = require('node-random-name');
var randomNumberGen = require('random-seed');
var randomPasswordGen = require('generate-password');
var chance = require('chance');
var fs = require('fs');

var logger = require('../utils/logger');
var Auth = require('./auth');
var Subject = require('../models/subject');

var newSubjects = [];

const professions = ['PEASANT', 'MERCHANT', 'SOLDIER', 'REBEL', 'OLIGARCH', 'NONE'];

router.get('/generate', (req, res) => {
  for (var x = 0; x < 1000; x++) {
    var newSubject = new Subject();
    //logger.debug(randomNumber);
    //generate a random number
    var randomNumber = ~~((randomNumberGen.create().random() * 80000000) + 10000000);
    newSubject.birth_id = "0" + (randomNumber + 10000000);
    newSubject.name = randomName({
      gender: (randomNumber % 2 == 0) ? "male" : "female"
    });

    newSubject.password = randomPasswordGen.generate({
      length: (randomNumber % 8) + 8,
      numbers: true,
      uppercase: true,
      symbols: false
    });
    const currentDate = new Date();
    newSubject.dob = new Date(randomNumberGen.create().intBetween(-1636986312, (currentDate.getTime())));
    newSubject.profession = professions[getProfessionID(randomNumber)];
    newSubject.gender = (randomNumber % 2 == 0) ? 0 : 1;
    newSubject.picture = newSubject.birth_id + ".jpg";
    newSubject.patriot_index = 1000 - (randomNumber % 1999);
    newSubject.alive = (randomNumber % 10 == 0) ? 0 : 1;
    newSubject.informer = (randomNumber % 10 == 0) ? 1 : 0;
    newSubjects.push(newSubject);
  }
  //call addSubject function from auth
  fs.writeFile('./Postman/signup.TEST.json', JSON.stringify(newSubjects), (err) => {
    if (err) {
      logger.error(err);
      res.status(500).json({
        success: false
      });
    } else {
      logger.debug("file saved");
      res.status(200).json({
        success: true
      });
    }
  });
});

//probabilty for professions
function getProfessionID(randomNumber) {
  if (randomNumber % 5 == 0) {
    return 2;
  } else if (randomNumber % 7 == 0) {
    return 3;
  } else if (randomNumber % 11 == 0) {
    return 5;
  } else if (randomNumber % 17 == 0) {
    return 1;
  } else if (randomNumber % 53 == 0) {
    return 4;
  } else {
    return 0;
  }
}

module.exports = router;
