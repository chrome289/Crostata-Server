'use strict';
const express = require('express');
const logger = require('../utils/logger');
const mongoose = require('mongoose');
const moment = require('moment');

const Subject = require('../models/subject');

const config = require('config');

exports.search = (req, res) => {
  //logger.verbose('[SearchController] search - %s', req.query.searchText);
  const searchText = '.*' + req.query.searchText + '.*';
  Subject.find({
      'name': {
        $regex: searchText,
        $options: 'i'
      }
    }, ['birthId', 'name', '-_id'])
    .sort('name')
    .limit(10)
    .exec()
    .then((subjects) => {
      logger.verbose('[SearchController] search:find - sending search result');
      res.status(200).json(subjects);
    })
    .catch((err) => {
      logger.warn('[SearchController] search:find - %s', err);
      res.status(500).send();
    });
};
