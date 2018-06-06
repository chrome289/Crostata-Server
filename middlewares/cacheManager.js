'use strict';
const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const mongoose = require('mongoose');
const moment = require('moment');
const NodeCache = require('node-cache');
const cache = new NodeCache();

const Subject = require('../models/subject');

const config = require('config');
var Chance = require('chance');
var chance = new Chance();

router.use('/', (req, res, next) => {
  if (req.query.requestId != null) {
    var requestId = req.query.requestId;
    var index = Number(req.query.after);
    getFromCache(requestId, index)
      .then((data) => {
        res.status(200).send(data);
      })
      .catch((index) => {
        req.query.skipCount = index;
        next();
      });
  } else {
    logger.info('[cacheManager] - requestId not present. Forwarding');
    const requestId = chance.hash({
      length: 35
    });
    req.query.requestId = requestId;
    req.query.skipCount = 0;
    next();
  }
});

var getFromCache = (requestId, index) => new Promise((resolve, reject) => {
  cache.get(requestId, (err, cacheData) => {
    if (err) {
      logger.warn('[cacheManager] - ' + err);
      reject(0);
    } else if (cacheData == null) {
      logger.warn('[cacheManager] - ' +
        'cache key not found for requestId ' + requestId);
      reject(0);
    } else {
      logger.info('[cacheManager] - response sent for requestId ' +
        requestId);
      var data = cacheData.data;
      if (data.length < ((index + 10) - cacheData.skipCount)) {
        reject(index);
      } else {
        resolve(data.slice(index, index + 10));
      }
    }
  });
});

var saveInCache = (requestId, skipCount, data) =>
  new Promise((resolve, reject) => {
    var cacheData = {
      skipCount: skipCount,
      data: data
    };
    cache.set(requestId, cacheData, 3600, (err, success) => {
      if (!err && success) {
        logger.info('[cacheManager] - data saved for requestId %s', requestId);
        resolve(cacheData);
      } else {
        logger.warn('[cacheManager] - ' +
          'data not saved for requestId %s' + requestId);
        reject(err);
      }
    });
  });

module.exports = {
  router,
  saveInCache
};
