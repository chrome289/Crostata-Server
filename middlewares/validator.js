const express = require('express');
const router = express.Router();
const config = require('config');

const logger = require('../utils/logger');

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
  check('birthId').isInt({
    min: 0,
    max: 99999999
  }),
  check('password').isLength({
    min: 8
  })
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/),
  check('dob').isISO8601(),
  check('profession')
  .matches(/^(PEASANT|MERCHANT|SOLDIER|REBEL|OLIGARCH|NONE)$/),
  check('gender').isInt({
    min: 0,
    max: 1
  }),
  check('patriotIndex').isInt({
    min: -1000,
    max: 1000
  }),
  check('alive').isBoolean(),
  check('informer').isBoolean()
], (req, res, next) => {

  logger.debug('name ' + req.body.name);
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    next();
  } else {
    //validation failed.
    logger.debug('middlewares:validator:signup -- validation ' +
      JSON.stringify({
        errors: errors.mapped()
      }));
    res.status(422).send();
  }
});

router.post('/auth/login', [
  check('birthId').isLength({
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
    logger.error('middlewares:validator:login -- validation ' + JSON.stringify({
      errors: errors.mapped()
    }));
    res.status(422).send();
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
    logger.error('middlewares:validator:loginToken -- validation ' +
      JSON.stringify({
        errors: errors.mapped()
      }));
    res.status(422).send();
  }
});

router.post('/content/textPost', [
  check('postContent').isLength({
    min: 1,
    max: 20000
  }),
  check('birthId').isInt({
    min: 0,
    max: 99999999
  })
], (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    next();
  } else {
    //validation failed.
    logger.error('middlewares:validator:submitTextPost -- validation ' +
      JSON.stringify({
        errors: errors.mapped()
      }));
    res.status(422).send();
  }
});

router.post('/content/comboPost', [
  //TODO problem with multer
  /*check('postContent').isLength({
    min: 1,
    max: 20000
  }),
  check('birthId').isInt({
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
    logger.error('middlewares:validator:submitComboPost -- validation ' +
      JSON.stringify({
        errors: errors.mapped()
      }));
    res.status(422).send();
  }
});

router.get('/content/nextPostsList', [
  check('noOfPosts').isLength({
    min: 1,
    max: 20
  }),
  check('lastTimestamp').isFloat(),
  check('birthId').isInt({
    min: 0,
    max: 99999999
  })
], (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    next();
  } else {
    //validation failed.
    logger.error('middlewares:validator:getNextPost -- validation ' +
      JSON.stringify({
        errors: errors.mapped()
      }));
    res.status(422).send();
  }
});

router.get('/content/postedImage', [
  check('postId').exists(),
  check('dimen').isInt({
    min: 48,
    max: 2160
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
    logger.error('middlewares:validator:getPostedImage -- validation ' +
      JSON.stringify({
        errors: errors.mapped()
      }));
    res.status(422).send();
  }
});

router.post('/opinion/vote', [
  check('birthId').isInt({
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
    logger.error('middlewares:validator:submitVote -- validation ' +
      JSON.stringify({
        errors: errors.mapped()
      }));
    res.status(422).send();
  }
});

router.delete('/opinion/vote', [
  check('birthId').isInt({
    min: 0,
    max: 99999999
  }),
  check('postId').exists()
], (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    next();
  } else {
    //validation failed.
    logger.error('middlewares:validator:deletevote -- validation ' +
      JSON.stringify({
        errors: errors.mapped()
      }));
    res.status(422).send();
  }
});

router.get('/opinion/voteTotal', [
  check('postId').exists().isAlphanumeric()
], (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    next();
  } else {
    //validation failed.
    logger.error('middlewares:validator:getVoteTotal -- validation ' +
      JSON.stringify({
        errors: errors.mapped()
      }));
    res.status(422).send();
  }
});

router.get('/opinion/votePerPost', [
  check('birthId').isInt({
    min: 0,
    max: 99999999
  }),
  check('postId').exists().isAlphanumeric()
], (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    next();
  } else {
    //validation failed.
    logger.error('middlewares:validator:getVotePerPost -- validation ' +
      JSON.stringify({
        errors: errors.mapped()
      }));
    res.status(422).send();
  }
});

router.post('/opinion/comment', [
  check('birthId').isInt({
    min: 0,
    max: 99999999
  }),
  check('postId').exists().isAlphanumeric(),
  check('text').exists(),
  check('generate').isBoolean()
], (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    next();
  } else {
    //validation failed.
    logger.error('middlewares:validator:submitComment -- validation ' +
      JSON.stringify({
        errors: errors.mapped()
      }));
    res.status(422).send();
  }
});

router.delete('/opinion/comment', [
  check('_id').exists()
], (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    next();
  } else {
    //validation failed.
    logger.error('middlewares:validator:deleteComment -- validation ' +
      JSON.stringify({
        errors: errors.mapped()
      }));
    res.status(422).send();
  }
});

router.get('/opinion/comments', [
  check('postId').exists(),
  check('noOfComments').isLength({
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
    logger.error('middlewares:validator:getComments -- validation ' +
      JSON.stringify({
        errors: errors.mapped()
      }));
    res.status(422).send();
  }
});

router.get('/subject/profileImage', [
  check('birthId').isInt({
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
    logger.error('middlewares:validator:getProfileImage -- validation ' +
      JSON.stringify({
        errors: errors.mapped()
      }));
    res.status(422).send();
  }
});

router.get('/subject/comments', [
  check('birthId').isInt({
    min: 0,
    max: 99999999
  }),
  check('noOfComments').isLength({
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
    logger.error('middlewares:validator:getCommentForUser -- validation ' +
      JSON.stringify({
        errors: errors.mapped()
      }));
    res.status(422).send();
  }
});


router.get('/subject/patriotIndex', [
  check('birthId').isInt({
    min: 0,
    max: 99999999
  })
], (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    next();
  } else {
    //validation failed.
    logger.error('middlewares:validator:getCommentForUser -- validation ' +
      JSON.stringify({
        errors: errors.mapped()
      }));
    res.status(422).send();
  }
});

router.get('/subject/rank', [
  check('birthId').isInt({
    min: 0,
    max: 99999999
  })
], (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    next();
  } else {
    //validation failed.
    logger.error('middlewares:validator:getCommentForUser -- validation ' +
      JSON.stringify({
        errors: errors.mapped()
      }));
    res.status(422).send();
  }
});

router.get('/subject/posts', [
  check('birthId').isInt({
    min: 0,
    max: 99999999
  })
], (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    next();
  } else {
    //validation failed.
    logger.error('middlewares:validator:getSubjectPostsId -- validation ' +
      JSON.stringify({
        errors: errors.mapped()
      }));
    res.status(422).send();
  }
});

router.get('/subject/info', [
  check('birthId').isInt({
    min: 0,
    max: 99999999
  })
], (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    next();
  } else {
    //validation failed.
    logger.error('middlewares:validator:getCommentForUser -- validation ' +
      JSON.stringify({
        errors: errors.mapped()
      }));
    res.status(422).send();
  }
});

module.exports = {
  router
};
