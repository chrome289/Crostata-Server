var express = require('express');
var router = express.Router();
/*
var randomName = require('node-random-name');
var randomNumberGen = require('random-seed');
var randomPasswordGen = require('generate-password');

const AWS = require('aws-sdk');
AWS.config.setPromisesDependency(require('bluebird'));
AWS.config.update({
  'accessKeyId': process.env.AWS_ACCESS_KEY_ID,
  'secretAccessKey': process.env.AWS_SECRET_ACCESS_KEY,
  'region': process.env.AWS_REGION
});
var s3 = new AWS.S3();

var Chance = require('chance');
var chance = new Chance();
var fs = require('fs');

var logger = require('../utils/logger');
var Auth = require('./auth');
var Subject = require('../models/subject');

var newSubjects = [];

const professions = ['NONE', 'REBEL', 'PEASANT', 'SOLDIER',
  'MERCHANT', 'OLIGARCH'
];

router.get('/generate', (req, res) => {
  for (var x = 0; x < 10000; x++) {
    var newSubject = new Subject();
    var randomNumber = ~~((randomNumberGen.create().random() * 80000000) +
      10000000);
    newSubject.birthId = '0' + (randomNumber + 10000000);
    newSubject.name = randomName({
      gender: (randomNumber % 2 === 0) ? 'male' : 'female'
    });

    newSubject.password = randomPasswordGen.generate({
      length: (randomNumber % 8) + 8,
      numbers: true,
      uppercase: true,
      symbols: false
    });
    newSubject.dob = new Date(randomNumberGen.create()
      .intBetween(-1636986312, ((new Date()).getTime())));
    newSubject.profession = professions[getProfessionID(randomNumber)];
    newSubject.gender = (randomNumber % 2 === 0) ? 0 : 1;
    newSubject.picture = newSubject.birthId + '.jpg';
    newSubject.alive = (randomNumber % 10 === 0) ? 0 : 1;

    newSubject.informer = (randomNumber % 10 === 0) ? 1 : 0;
    newSubject.moneyDonated = getMoneyDonated(randomNumber);
    newSubject.reportsMade = 0; //getMadeReports(randomNumber);
    newSubject.reportsAgainst = 0; //getAgainstReports(randomNumber);
    newSubject.patriotIndex = getPatriotIndex(newSubject, randomNumber);
    newSubjects.push(newSubject);
  }
  //call addSubject function from auth
  fs.writeFile('../../Postman/signup.TEST.json', JSON.stringify(newSubjects),
    (err) => {
      if (err) {
        logger.error(err);
        res.status(500).json({
          success: false
        });
      } else {
        logger.debug('file saved');
        res.status(200).json({
          success: true
        });
      }
    });
});

router.get('/users', (req, res) => {
  Subject.find({}, {
      birthId: 1,
      _id: 0
    })
    .then((subjects) => {
      res.status(200).json(subjects);
    })
    .catch((err) => {
      res.status(400).send(err);
    });
});

router.get('/setProfileImages', (req, res) => {
  const id = req.query.birthId;
  const aNumber = chance.natural({
    min: 1,
    max: 83
  });
  generateImageFile(aNumber, id);
  res.status(200).send('done');
});

var generateImageFile = (aNumber, birthId) => {
  var readParams = {
    Bucket: process.env.BUCKET,
    Key: 'images/image (' + aNumber + ').jpg'
  };
  s3.getObject(readParams, (err, data) => {
    if (err) {
      logger.error(err);
    } else {
      var putParams = {
        Bucket: process.env.BUCKET,
        Body: data.Body,
        Key: 'images/' + birthId
      };
      s3.putObject(putParams, (err2, data2) => {
        if (err2) {
          logger.error(err2);
        } else {
          logger.verbose('done');
        }
      });
    }
  });
};
//probabilty for professions
var getProfessionID = randomNumber => {
  if (randomNumber % 5 === 0) {
    return 3;
  } else if (randomNumber % 7 === 0) {
    return 1;
  } else if (randomNumber % 11 === 0) {
    return 0;
  } else if (randomNumber % 17 === 0) {
    return 4;
  } else if (randomNumber % 53 === 0) {
    return 5;
  } else {
    return 2;
  }
};

var getMoneyDonated = randomNumber => {
  var power = getProfessionID(randomNumber);
  if (power === 0 || power === 1) {
    return 0;
  } else {
    var temp = chance.natural({
      min: Math.pow(10, power),
      max: Math.pow(50, power)
    });
    return temp;
  }
};

var getMadeReports = randomNumber => {
  var power = getProfessionID(randomNumber);
  if (power === 0 || power === 1) {
    return 0;
  } else {
    var temp = chance.natural({
      min: 0,
      max: 5 * power
    });
    return temp;
  }
};

var getAgainstReports = randomNumber => {
  var power = 5 - Number(getProfessionID(randomNumber));
  if (power === 0 || power === 5) {
    return 0;
  } else {
    var temp = chance.natural({
      min: 0,
      max: 5 * (5 - power)
    });
    return temp;
  }
};

var getPatriotIndex = (newSubject, randomNumber) => {
  var result = 0;

  if (newSubject.moneyDonated > 0) {
    result += (newSubject.moneyDonated / 1000);
  }
  result = Math.floor(result);
  result += ((newSubject.reportsMade * 10) - (newSubject.reportsAgainst * 10));

  var professionID = getProfessionID(randomNumber);
  switch (professionID) {
    case 1:
      result -= 500;
      break;
    case 5:
      result += 200;
      break;
    case 4:
      result += 100;
      break;
    case 3:
      result += 50;
      break;
    case 2:
      result += 20;
      break;
    default:
      result += 10;
      break;
  }

  if (newSubject.informer === 1) {
    result += 200;
  }

  if (result > 999) {
    result = 999;
  } else if (result < -999) {
    result = -999;
  }

  return result;
};*/

module.exports = router;
