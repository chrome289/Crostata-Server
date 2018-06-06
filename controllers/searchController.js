'use strict';
const express = require('express');
const logger = require('../utils/logger');
const mongoose = require('mongoose');
const moment = require('moment');

const Subject = require('../models/subject');
const cacheManager = require('../middlewares/cacheManager.js');

const config = require('config');

exports.search = (req, res) => {
  const searchText = '.*' + req.query.searchText + '.*';
  const skipCount = req.query.skipCount;
  var result;
  Subject.find({
      'name': {
        $regex: searchText,
        $options: 'i'
      }
    }, ['birthId', 'name', 'profession', '-_id'])
    .sort('name')
    .skip(skipCount)
    .limit(10)
    .exec()
    .then((subjects) => {
      result = {
        requestId: req.query.requestId,
        searchResults: subjects.slice(0, 10)
      };
      return cacheManager.saveInCache(req.query.requestId, skipCount, subjects);
    })
    .then((resolve) => {
      logger.verbose('[SearchController] search:find - sending search result');
      res.status(200).json(result);
    })
    .catch((reject) => {
      logger.warn('[SearchController] search:saveInCache - %s', reject);
      res.status(500).send();
    })
    .catch((err) => {
      logger.warn('[SearchController] search:find - %s', err);
      res.status(500).send();
    });
};
