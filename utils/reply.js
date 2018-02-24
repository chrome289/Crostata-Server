var express = require('express');
var router = express.Router();

function sendSuccess(res) {
  res.json({
    success: true,
    resultCode: 0
  });
}

function sendFailure(res, resultCode) {
  res.json({
    success: false,
    resultCode: resultCode
  });
}



function getPostSuccess(res, postArray) {
  res.json({
    success: true,
    resultCode: 0,
    posts: postArray
  });
}

function getPostFailure(res, resultCode) {
  res.json({
    success: false,
    resultCode: resultCode,
    posts: []
  });
}



function submitTextPostSuccess(res) {
  res.json({
    success: true,
    resultCode: 0
  });
}

function submitTextPostFailure(res, resultCode) {
  res.json({
    success: false,
    resultCode: resultCode
  });
}



function submitImagePostSuccess(res) {
  res.json({
    success: true,
    resultCode: 0
  });
}

function submitImagePostFailure(res, resultCode) {
  res.json({
    success: false,
    resultCode: resultCode
  });
}



function sendTokenSuccess(res, token) {
  res.json({
    success: true,
    resultCode: 0,
    tokenValue: token
  });
}

function sendTokenFailure(res, resultCode) {
  res.json({
    success: false,
    resultCode: resultCode,
    tokenValue: ""
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
  sendTokenFailure
};
