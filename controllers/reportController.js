const express = require('express');
const path = require('path');
const logger = require('../utils/logger');
const mongoose = require('mongoose');
const moment = require('moment');
const Chance = require('chance');
const chance = new Chance();

var Report = require('../models/report');
var Subject = require('../models/subject');

//contentType = 0=profile,1=post,2=comment
exports.addReport = (req, res) => {
  var newReport = new Report();
  newReport.contentId = req.body.contentId;
  newReport.contentType = req.body.contentType;
  newReport.creatorId = req.body.creatorId;
  newReport.reporterId = req.body.reporterId;
  newReport.isReviewed = chance.bool({
    likelihood: 20
  });
  if (!newReport.isReviewed) {
    newReport.isAccepted = false;
  } else {
    newReport.isAccepted = chance.bool({
      likelihood: 50
    });
  }

  Report.findOne({
      contentId: newReport.contentId,
      reporterId: newReport.reporterId
    }).exec()
    .then((report) => {
      if (report == null) {
        return newReport.save();
      } else {
        //  logger.debug(report);
        res.status(422).send();
      }
    })
    .then((report) => {
      return updatePatriotIndex(report);
    })
    .then((resolve) => {
      res.status(200).send();
    })
    .catch((err) => {
      logger.error(err);
      res.status(500).send();
    });
};

var updatePatriotIndex = report => new Promise((resolve, err) => {
  if (report.isReviewed && report.isAccepted) {
    Subject.findOne({
        birthId: report.reporterId
      })
      .then((subject) => {
        var temp = subject.patriotIndex + 10;
        var temp2 = subject.reportsMade + 1;
        if (temp > 999) {
          temp = 999;
        }
        return subject.update({
          patriotIndex: temp,
          reportsMade: temp2
        }).exec();
      })
      .then((subject) => {
        return Subject.findOne({
          birthId: report.creatorId
        });
      })
      .then((subject) => {
        var temp = subject.patriotIndex - 10;
        var temp2 = subject.reportsAgainst + 1;
        if (temp < -999) {
          temp = -999;
        }
        return subject.update({
          patriotIndex: temp,
          reportsAgainst: temp2
        }).exec();
      })
      .then((subject) => {
        resolve();
      })
      .catch((err) => {
        logger.error(err);
        err(err);
      });
  } else {
    resolve();
  }
});
