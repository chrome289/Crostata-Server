var express = require('express');
var router = express.Router();

const winston = require('winston');
const {
  createLogger,
  format,
  transports
} = winston;
const {
  combine,
  timestamp,
  label,
  prettyPrint,
  printf
} = format;

const myFormat = printf(info => {
  return `${info.timestamp} ${info.level}: ${info.message}`;
});

const logger = createLogger({
  format: combine(
    format.splat(),
    format.simple(),
    timestamp(),
    format.colorize(),
    prettyPrint(),
    myFormat
  ),
  transports: [
    new(winston.transports.Console)({
      timestamp: (new Date()).toLocaleTimeString(),
      level: 'silly'
    }),
    new(winston.transports.File)({
      filename: 'logs/err.log',
      level: 'error'
    }),
    new(winston.transports.File)({
      filename: 'logs/out.log',
      level: 'info'
    })
  ]
});

logger.info('[Logger] Logger init complete');

module.exports = logger;
