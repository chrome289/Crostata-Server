const express = require('express');
const router = express.Router();
const config = require('config');

const logger = require('../utils/logger');

var reply = require('../utils/reply');

const {
  check,
  validationResult
} = require('express-validator/check');
const {
  matchedData,
  sanitize
} = require('express-validator/filter');

router.post('/auth/signup', [
  check('name').isLength({
    min: 2,
    max: 40
  }).matches(/^[A-Za-z\s]+$/),
  check('birth_id').isInt({
    min: 0,
    max: 99999999
  }),
  check('password').isLength({
    min: 8
  })
  .matches(/[A-Z]+[a-z]+[0-9]+[!@#$%^&*()+_\-=}{[\]|:;"/?.><,`~]+/),
  check('dob').isISO8601(),
  check('profession').matches(/^(PEASANT|MERCHANT|SOLDIER|REBEL|OLIGARCH|NONE)$/),
  check('gender').isInt({
    min: 0,
    max: 1
  }),
  check('patriot_index').isInt({
    min: -1000,
    max: 1000
  }),
  check('alive').isBoolean(),
  check('informer').isBoolean()
], (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    next();
  } else {
    //validation failed.
    const jsone = {
      errors: errors.mapped()
    };
    logger.debug('middlewares:validator:signup -- validation ' + errors);
    reply.sendTokenFailure(res, 422);
  }
});

router.post('/auth/login', [
  check('birth_id').isLength({
    min: 0,
    max: 99999999
  }),
  check('password').exists()
], (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    next();
  } else {
    //validation failed.
    logger.error('middlewares:validator:login -- validation ' + {
      errors: errors.mapped()
    });
    reply.submitTextPostFailure(res, 422);
  }
});

router.post('/auth/loginToken', [
  check('authorization').exists()
], (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    next();
  } else {
    //validation failed.
    logger.error('middlewares:validator:loginToken -- validation ' + JSON.stringify({
      errors: errors.mapped()
    }));
    reply.submitTextPostFailure(res, 422);
  }
});

router.post('/content/textPost', [
  check('postContent').isLength({
    min: 1,
    max: 20000
  }),
  check('birth_id').isInt({
    min: 0,
    max: 99999999
  })
], (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    next();
  } else {
    //validation failed.
    logger.error('middlewares:validator:submitTextPost -- validation ' + JSON.stringify({
      errors: errors.mapped()
    }));
    reply.submitTextPostFailure(res, 422);
  }
});

router.post('/content/comboPost', [
  //TODO problem with multer
  /*check('postContent').isLength({
    min: 1,
    max: 20000
  }),
  check('birth_id').isInt({
    min: 0,
    max: 99999999
  }),
  check('generate').isBoolean()*/
], (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    next();
  } else {
    //validation failed.
    logger.error('middlewares:validator:submitComboPost -- validation ' + JSON.stringify({
      errors: errors.mapped()
    }));
    reply.submitImagePostFailure(res, 422);
  }
});

router.get('/content/nextPostsList', [
  check('noOfPosts').isLength({
    min: 1,
    max: 20
  }),
  check('lastTimestamp').isFloat()
], (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    next();
  } else {
    //validation failed.
    logger.error('middlewares:validator:getNextPost -- validation ' + JSON.stringify({
      errors: errors.mapped()
    }));
    reply.getPostFailure(res, 422);
  }
});

router.get('/content/postedImage', [
  check('post_id').exists()
], (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    next();
  } else {
    //validation failed.
    logger.error('middlewares:validator:getPostedImage -- validation ' + JSON.stringify({
      errors: errors.mapped()
    }));
    reply.getPostImageFailure(res, 422);
  }
});

router.get('/content/profileImage', [
  check('birth_id').isInt({
    min: 0,
    max: 99999999
  }),
  check('dimen').isInt({
    min: 48,
    max: 1024
  }),
  check('quality').isInt({
    min: 1,
    max: 100
  })
], (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    next();
  } else {
    //validation failed.
    logger.error('middlewares:validator:getProfileImage -- validation ' + JSON.stringify({
      errors: errors.mapped()
    }));
    res.status(422).send({
      success: false
    });
  }
});

router.get('/content/subjectPostsId', [
  check('birth_id').isInt({
    min: 0,
    max: 99999999
  })
], (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    next();
  } else {
    //validation failed.
    logger.error('middlewares:validator:getSubjectPostsId -- validation ' + JSON.stringify({
      errors: errors.mapped()
    }));
    res.status(422).send({
      success: false
    });
  }
});

router.post('/opinion/vote', [
  check('birth_id').isInt({
    min: 0,
    max: 99999999
  }),
  check('value').isIn(['-1', '1'])
], (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    next();
  } else {
    //validation failed.
    logger.error('middlewares:validator:submitVote -- validation ' + JSON.stringify({
      errors: errors.mapped()
    }));
    reply.submitVoteFailure(res, 422);
  }
});

router.delete('/opinion/vote', [
  check('birth_id').isInt({
    min: 0,
    max: 99999999
  }),
  check('post_id').exists().isAlphanumeric()
], (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    next();
  } else {
    //validation failed.
    logger.error('middlewares:validator:deletevote -- validation ' + JSON.stringify({
      errors: errors.mapped()
    }));
    res.status(422).json({
      success: false
    });
  }
});

router.get('/opinion/voteTotal', [
  check('post_id').exists().isAlphanumeric()
], (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    next();
  } else {
    //validation failed.
    logger.error('middlewares:validator:getVoteTotal -- validation ' + JSON.stringify({
      errors: errors.mapped()
    }));
    reply.getVoteTotalFailure(res, 422);
  }
});

router.get('/opinion/votePerPost', [
  check('birth_id').isInt({
    min: 0,
    max: 99999999
  }),
  check('post_id').exists().isAlphanumeric()
], (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    next();
  } else {
    //validation failed.
    logger.error('middlewares:validator:getVotePerPost -- validation ' + JSON.stringify({
      errors: errors.mapped()
    }));
    reply.getVotePerPostFailure(res, 422);
  }
});

module.exports = {
  router
};
