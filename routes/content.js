/*jshint loopfunc: true */

const express = require('express');
const path = require('path');
const logger = require('../utils/logger');
const bcrypt = require('bcrypt');
const multer = require('multer');
const fs = require('fs');
const util = require('util');
const sharp = require('sharp');

var shortid = require('shortid');
var moment = require('moment');

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
        reply.submitImagePostFailure(res, 500);
      });
    }, (error) => {
      logger.debug('Routes:content:submitTextPost:writeFile --' + err);
      reply.submitTextPostFailure(res, 500);
    });

  } else {
    reply.submitTextPostFailure(res, 400);
  }
});

router.post('/submitComboPost', (req, res) => {
  upload(req, res, (err) => {
    if (validate.validateComboPost(req)) {
      if (err) {
        logger.debug('Routes:content:submitComboPost:multer --' + err);
        reply.submitImagePostFailure(res, 500);
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
            reply.submitImagePostFailure(res, 500);
          });
        }, (error) => {
          logger.debug('Routes:content:submitComboPost:writeFile --' + err);
          reply.submitTextPostFailure(res, 500);
        });
      }
    } else {
      reply.submitImagePostFailure(res, 400);
    }
  });

});

router.post('/getNextPostsList', (req, res) => {
  if (validate.validateGetPost(req)) {
    var noOfPosts = Number(req.body.noOfPosts);

    //converting to native date because moment's date doesn't work for some reason
    var lastDatetime = moment.unix(req.body.lastTimestamp)
      .toDate();

    logger.silly("lastts " + lastDatetime + "------" + new Date(req.body.lastTimestamp * 1000));
    Post.aggregate([{
        $match: {
          time_created: {
            '$lt': lastDatetime
          }
        }
      }, {
        $lookup: {
          "from": "subjects",
          "localField": "creator_id",
          "foreignField": "birth_id",
          "as": "creator"
        }
      }])
      .sort('-time_created')
      .limit(noOfPosts)
      .exec((err, posts) => {
        if (err) {
          logger.error(err);
          reply.getPostFailure(res, 500);
        } else {
          logger.debug(util.inspect(posts[0], false, null));
          var promises = [];
          var postArray = [];
          for (var x = 0; x < posts.length; x++) {
            var temp = posts[x];
            promises.push(readPost(temp, posts[x].creator[0])
              .then((result) => {
                postArray.push(result);
                logger.debug('postarray size ' + postArray.length);
              }, (err2) => {
                logger.debug('Routes:content:getNextPost:find --' + err2);
                reply.getPostFailure(res, 500);
              })
            );
          }
          Promise.all(promises).then(() =>
            reply.getPostSuccess(res, postArray));
        }
      });

  } else {
    logger.debug('Routes:content:getNextPost -- validation');
    reply.getPostFailure(res, 400);
  }
});

//get images in posts
router.get('/getPostedImage', (req, res) => {
  validate.validateImageId(req).then((result) => {
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

//get profile images
router.get('/getProfileImage', (req, res) => {
  validate.validateGetProfileImage(req)
    .then((result) => {
      const dimen = Number(req.query.dimen);
      const quality = Number(req.query.quality);
      sharp('./images/' + req.query.birth_id)
        .resize(dimen, dimen)
        .jpeg({
          quality: quality
        })
        .withoutEnlargement(true)
        .toBuffer()
        .then((data) => {
          res.set('Content-Type', 'image/jpg');
          res.status(200).send(data);
        })
        .catch((err) => {
          logger.error('routes:content:getProfileImage:sharp -- ' + err);
          res.status(500).send({
            success: false
          });
        });
    }, (reject) => {
      logger.debug('routes:content:getProfileImage -- ' + reject);
      res.status(reject).send({
        success: false
      });
    });
});

//get all post of a specific user
router.post('/getSubjectPostsId', (req, res) => {
  //  logger.debug('fsdsdfsdfs');
  validate.validateBirthId(req)
    .then((resolve) => {
      Post.find({
        creator_id: req.body.birth_id
      }, (err, posts) => {
        if (err) {
          logger.debug('routes:content:getSubjectPostsId:find -- ' + err);
          res.status(500).send({
            success: false
          });
        } else {
          res.status(200).json(posts);
        }
      });
    }, (reject) => {
      logger.debug('routes:content:getSubjectPosts -- ' + reject);
      res.status(reject).send({
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

readPost = (post, creator) => new Promise((resolve, reject) => {
  readFile(post.text_url, './posts/texts/').then((result) => {
    resolve({
      postId: post.post_id,
      creatorName: creator.name,
      timeCreated: post.time_created,
      contentType: post.content_type,
      text: result,
      upVotes: post.up_votes,
      downVotes: post.down_votes,
      isCensored: post.is_censored
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
