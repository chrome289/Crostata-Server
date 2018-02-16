var express = require('express');
var router = express.Router();
var randomName = require('node-random-name');
var randomNumberGen = require('random-seed');
var randomPasswordGen = require('generate-password');
var Auth = require('./auth');
var Subject = require('../models/subject');

const professions = ['PEASANT', 'SOLDIER', 'REBEL', 'OLIGARCH', 'NONE'];

router.post('/generate', (req, res) => {
  var popCount = req.body.popCount;
  for (x = 0; x < popCount; x++) {
    var newSubject = new Subject();
    //console.log(randomNumber);
    var randomNumber = ~~((randomNumberGen.create().random() * 80000000) + 10000000);
    newSubject.birth_id = "0" + (randomNumber + 10000000);
    newSubject.name = randomName({
      gender: (randomNumber % 2 == 0) ? "male" : "female"
    });

    newSubject.password = randomPasswordGen.generate({
      length: (randomNumber % 8) + 8,
      numbers: true,
      uppercase: true,
      symbols: true
    });
    newSubject.class = randomNumber % 6;
    newSubject.profession = professions[getProfessionID(randomNumber)];
    newSubject.gender = (randomNumber % 2 == 0) ? 0 : 1;
    newSubject.picture = newSubject.birth_id + ".jpg";
    newSubject.patriot_index = randomNumber % 1000;
    newSubject.alive = (randomNumber % 10 == 0) ? 0 : 1;
    newSubject.informer = (randomNumber % 10 == 0) ? 1 : 0;

    Auth.addSubject(newSubject, (err) => {
      if (err instanceof Error) {
        console.error("Exception");
        res.send('NOT DONE');
      }
    });
  }
  res.send('done');
});

function getProfessionID(randomNumber) {
  if (randomNumber % 5 == 0) {
    return 1;
  } else if (randomNumber % 7 == 0) {
    return 2;
  } else if (randomNumber % 11 == 0) {
    return 4;
  }else if (randomNumber % 53 == 0) {
    return 3;
  } else {
    return 0;
  }
}

module.exports = router;