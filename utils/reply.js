var express = require('express');
var router = express.Router();

var logger = require('../utils/logger');

function sendSuccess(res) {
  res.status(200).json({
    success: true
  });
}

function sendFailure(res, resultCode) {
  res.status(resultCode).json({
    success: false
  });
}



function getPostSuccess(res, postArray) {
  logger.debug('postarray size ' + postArray.length);
  res.status(200).json({
    success: true,
    posts: postArray
  });
}

function getPostFailure(res, resultCode) {
  res.status(resultCode).json({
    success: false,
    posts: []
  });
}

function getPostImageSuccess(res, postArray) {
  logger.debug('postarray size ' + postArray.length);
  res.status(200).json({
    success: true
  });
}

function getPostImageFailure(res, resultCode) {
  res.status(resultCode).json({
    success: false
  });
}

function submitTextPostSuccess(res) {
  res.status(200).json({
    success: true
  });
}

function submitTextPostFailure(res, resultCode) {
  res.status(resultCode).json({
    success: false
  });
}



function submitImagePostSuccess(res) {
  res.status(200).json({
    success: true
  });
}

function submitImagePostFailure(res, resultCode) {
  res.status(resultCode).json({
    success: false
  });
}



function sendTokenSuccess(res, token) {
  res.status(200).json({
    success: true,
    tokenValue: token
  });
}

function sendTokenFailure(res, resultCode) {
  res.status(resultCode).json({
    success: false,
    tokenValue: ""
  });
}

function submitVoteSuccess(res) {
  res.status(200).json({
    success: true
  });
}

function submitVoteFailure(res, resultCode) {
  res.status(resultCode).json({
    success: false
  });
}

function voteTotalSuccess(res, total) {
  res.status(200).json({
    success: true,
    total: total
  });
}

function voteTotalFailure(res, resultCode) {
  res.status(resultCode).json({
    success: false
  });
}

function votePerPostSuccess(res, total) {
  res.status(200).json({
    success: true,
    total: total
  });
}

function votePerPostFailure(res, resultCode) {
  res.status(resultCode).json({
    success: false
  });
}

module.exports = {
  sendSuccess,
  sendFailure,

  getPostSuccess,
  getPostFailure,

  submitTextPostSuccess,
  submitTextPostFailure,

  submitImagePostSuccess,
  submitImagePostFailure,

  sendTokenSuccess,
  sendTokenFailure,

  submitVoteSuccess,
  submitVoteFailure,

  voteTotalSuccess,
  voteTotalFailure,

  votePerPostSuccess,
  votePerPostFailure
};
