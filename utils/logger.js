var express = require('express');
var router = express.Router();

var winston = require('winston');

winston.emitErrs = true;

var logger = new winston.Logger({
  transports: [
    new(winston.transports.Console)({
      timestamp: (new Date()).toLocaleTimeString(),
      colorize: true,
      level: 'silly'
    }),
    new(winston.transports.File)({
      timestamp: (new Date()).toLocaleTimeString(),
      filename: 'err.log',
      level: 'error'
    })
  ]
});
logger.info('Utils: Logger -- logger setup');

module.exports = logger;
