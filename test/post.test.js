//force jshint to uee es6
/*jshint expr: true*/

process.env.NODE_ENV = 'test';

var mongoose = require('mongoose');
var chai = require('chai');
var chaiHttp = require('chai-http');

var logger = require('../utils/logger');

var Post = require('../models/post');

var app = require('../app');

var should = chai.should();
chai.use(chaiHttp);
