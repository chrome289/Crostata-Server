var express = require('express');
var router=express.Router();

var winston = require('winston');

winston.emitErrs = true;

var logger = new winston.Logger({
  transports: [
    new (winston.transports.Console)({
      timestamp: (new Date()).toLocaleTimeString(),
      colorize: true,
      level: 'debug'
    })
  ]
});

module.exports = logger;
