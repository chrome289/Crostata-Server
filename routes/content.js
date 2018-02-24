/*jshint loopfunc: true */

var express = require('express');
var path = require('path');
var logger = require('../utils/logger');
var bcrypt = require('bcrypt');
var moment = require('moment');
var multer = require('multer');
var fs = require('fs');
var shortid = require('shortid');

var diskStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    return cb(null, './posts/images/');
  },
  filename: (req, file, cb) => {
    const ext = '.jpg';
    return cb(null, shortid.generate() + 'UTC' + new Date().getTime());
  }
});

var upload = multer({
  storage: diskStorage
}).single('file');

var router = express.Router();

var Post = require('../models/post');
var config = require('config');
var reply = require('../utils/reply');
var validate = require('../utils/validate');

router.post('/submitTextPost', (req, res) => {
  var postContent = req.body.postContent;
  const ext = '.txt';
  if (validate.validateTextPost(req)) {
    var filename = shortid.generate() + 'UTC' + new Date().getTime();
    var newPost = new Post({
      post_id: filename,
      creator_id: req.body.birth_id,
      time_created: moment().utc().valueOf(),
      content_type: 'TO',
      text_url: filename,
      pic_url: '',
      up_votes: 0,
      down_votes: 0,
      is_censored: false,
      is_generated: req.body.generate
    });
    //logger.silly('date' + newPost.time_created + '-$$$-' + moment.format());
    var promise = writeTextToFile(filename, postContent);
    promise.then((result) => {
      saveNewPostDB(newPost).then((result) => {
        logger.debug('Routes:content:submitTextPost -- Post saved -> ' + newPost.post_id);
        reply.submitImagePostSuccess(res);
      }, (error) => {
        logger.debug('Routes:content:submitTextPost:mongoose --' + err);
        reply.submitImagePostFailure(res, 1);
      });
    }, (error) => {
      logger.debug('Routes:content:submitTextPost:writeFile --' + err);
      reply.submitTextPostFailure(res, 1);
    });

  } else {
    reply.submitTextPostFailure(res, 2);
  }
});

router.post('/submitImagePost', (req, res) => {
  upload(req, res, (err) => {
    if (validate.validateImagePost(req)) {
      if (err) {
        logger.debug('Routes:content:submitImagePost:multer --' + err);
        reply.submitImagePostFailure(res, 1);
      } else {
        //logger.silly(req.file.filename);
        var filename = req.file.filename;
        var newPost = new Post({
          post_id: filename,
          creator_id: req.body.birth_id,
          time_created: moment().utc().valueOf(),
          content_type: 'IO',
          text_url: '',
          pic_url: filename,
          up_votes: 0,
          down_votes: 0,
          is_censored: false,
          is_generated: req.body.generate
        });
        //logger.silly('date' + newPost.time_created + '-$$$-' + moment.format());
        saveNewPostDB(newPost).then((result) => {
          logger.debug('Routes:content:submitImagePost -- Post saved -> ' + newPost.post_id);
          reply.submitImagePostSuccess(res);
        }, (error) => {
          logger.debug('Routes:content:submitImagePost:mongoose --' + err);
          reply.submitImagePostFailure(res, 1);
        });
      }
    } else {
      reply.submitImagePostFailure(res, 2);
    }
  });
});

router.post('/submitComboPost', (req, res) => {
  upload(req, res, (err) => {
    if (validate.validateComboPost(req)) {

      if (err) {
        logger.debug('Routes:content:submitComboPost:multer --' + err);
        reply.submitImagePostFailure(res, 1);
      } else {
        var postContent = req.body.postContent;
        const ext = '.txt';
        //logger.silly(req.file.filename);
        var filename = req.file.filename;
        var newPost = new Post({
          post_id: filename,
          creator_id: req.body.birth_id,
          time_created: moment().utc().valueOf(),
          content_type: 'IT',
          text_url: filename,
          pic_url: filename,
          up_votes: 0,
          down_votes: 0,
          is_censored: false,
          is_generated: req.body.generate
        });
        //logger.silly('date' + newPost.time_created + '-$$$-' + moment.format());
        writeTextToFile(filename, postContent).then((result) => {
          saveNewPostDB(newPost).then((result) => {
            logger.debug('Routes:content:submitComboPost -- Post saved -> ' + newPost.post_id);
            reply.submitImagePostSuccess(res);
          }, (error) => {
            logger.debug('Routes:content:submitComboPost:mongoose --' + err);
            reply.submitImagePostFailure(res, 1);
          });
        }, (error) => {
          logger.debug('Routes:content:submitComboPost:writeFile --' + err);
          reply.submitTextPostFailure(res, 1);
        });
      }
    } else {
      reply.submitImagePostFailure(res, 2);
    }
  });

});

router.post('/getNextPosts', (req, res) => {
  if (validate.validateGetPost(req)) {
    var noOfPosts = Number(req.body.noOfPosts);
    var lastDatetime = moment.unix(req.body.lastTimestamp)
      .utc()
      .format('YYYY-MM-DD HH:mm:ss.SSS');
    //logger.silly(lastDatetime);
    Post.find({
        time_created: {
          $gt: lastDatetime
        }
      })
      .sort('-time_created')
      .limit(noOfPosts)
      .exec((err, posts) => {
        if (err) {
          logger.error(err);
          reply.getPostFailure(res, 1);
        } else {
          var promises = [];
          var postArray = [];
          for (var x = 0; x < posts.length; x++) {
            var temp = posts[x];
            promises.push(readPost(temp)
              .then((result) => {
                postArray.push(result);
              }, (err2) => {
                logger.debug('Routes:content:getPost:find --' + err2);
                reply.getPostFailure(res, 1);
              })
            );
          }
          Promise.all(promises).then(() =>
            reply.getPostSuccess(res, postArray));
        }
      });

  } else {
    reply.getPostFailure(res, 2);
  }
});

router.get('/getPostImage', (req, res) => {
  validate.validateImageID(req).then((result) => {
    res.set('Content-Type', 'image/jpg');
    res.sendFile(req.query.post_id, {
      root: path.join(__dirname, '../posts/images')
    }, (err) => {
      if (err)
        logger.debug(err);
    });
  }, (error) => {
    logger.debug(error);
    res.json({
      success: false
    });
  });
});


writeTextToFile = (filename, postContent) => new Promise((resolve, reject) => {
  fs.writeFile('./posts/texts/' + filename, postContent, 'utf8', (err) => {
    if (err) {
      logger.debug('Routes:content:writeTextToFile:fs --' + err);
      reject(err);
    } else {
      logger.debug('Routes:content:writeTextToFile -- text file written to disk ');
      resolve();
    }
  });
});

saveNewPostDB = newPost => new Promise((resolve, reject) => {
  newPost.save((err, post) => {
    if (err) {
      logger.debug('Routes:content:saveNewPostDB:mongoose --' + err);
      reject(err);
    } else {
      logger.debug('Routes:content:saveNewPostDB -- Post saved -> ' + post.post_id);
      resolve();
    }
  });
});

readPost = (post) => new Promise((resolve, reject) => {
  readFile(post.text_url, './posts/texts/').then((result) => {
    resolve({
      post_id: post.post_id,
      time_created: post.time_created,
      text: result,
      image: post.pic_url 
    });
  }, (err) => {
    reject(err);
  });
});

readFile = (path, root) => new Promise((resolve, reject) => {
  if (String(path).length == 0) {
    resolve('');
  } else {
    path = root + path;
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) {
        logger.debug('Routes:content:readFile:fs --' + err);
        reject(err);
      } else {
        logger.debug('Routes:content:readFile:fs --' + 'file read from path ' + path);
        resolve(data);
      }
    });
  }
});


module.exports = {
  router
};
