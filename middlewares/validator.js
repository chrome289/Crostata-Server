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
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    next();
  } else {
    //validation failed.
    logger.warn('[Validator] [POST]auth:signup - ' +
      JSON.stringify({
        errors: errors.mapped()
      }));
    res.status(422).send();
  }
});

router.post('/auth/login', [
  check('birthId').isInt({
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
    logger.warn('[Validator] [POST]auth:login - ' +
      JSON.stringify({
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
    logger.warn('[Validator] [POST]auth:loginToken - ' +
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
    logger.warn('[Validator] [POST]content:textPost - ' +
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
    logger.warn('[Validator] [POST]content:comboPost - ' +
      JSON.stringify({
        errors: errors.mapped()
      }));
    res.status(422).send();
  }
});

router.get('/content/nextPosts', [
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
    logger.warn('[Validator] [GET]content:nextPosts - ' +
      JSON.stringify({
        errors: errors.mapped()
      }));
    res.status(422).send();
  }
});

router.get('/content/postedImage', [
  check('imageId').exists(),
  check('dimen').isInt({
    min: 8,
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
    logger.warn('[Validator] [GET]content:postedImage - ' +
      JSON.stringify({
        errors: errors.mapped()
      }));
    res.status(422).send();
  }
});

router.post('/opinion/like', [
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
    logger.warn('[Validator] [POST]opinion:like - ' +
      JSON.stringify({
        errors: errors.mapped()
      }));
    res.status(422).send();
  }
});

router.delete('/opinion/like', [
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
    logger.warn('[Validator] [DELETE]opinion:like - ' +
      JSON.stringify({
        errors: errors.mapped()
      }));
    res.status(422).send();
  }
});

router.get('/opinion/likeTotal', [
  check('postId').exists().isAlphanumeric()
], (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    next();
  } else {
    //validation failed.
    logger.warn('[Validator] [GET]opinion:likeTotal - ' +
      JSON.stringify({
        errors: errors.mapped()
      }));
    res.status(422).send();
  }
});

router.get('/opinion/likePerPost', [
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
    logger.warn('[Validator] [GET]opinion:likePerPost - ' +
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
  check('text').exists().isLength({
    min:1,
    max:20000
  }),
  check('generate').isBoolean()
], (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    next();
  } else {
    //validation failed.
    logger.warn('[Validator] [POST]opinion:comment - ' +
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
    logger.warn('[Validator] [DELETE]opinion:comment - ' +
      JSON.stringify({
        errors: errors.mapped()
      }));
    res.status(422).send();
  }
});

router.get('/opinion/comments', [
  check('postId').exists(),
  check('lastTimestamp').isFloat()
], (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    next();
  } else {
    //validation failed.
    logger.warn('[Validator] [GET]opinion:comments - ' +
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
    min: 8,
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
    logger.warn('[Validator] [GET]subject:profileImage - ' +
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
  check('noOfComments').isInt({
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
    logger.warn('[Validator] [GET]subject:comments - ' +
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
    logger.warn('[Validator] [GET]subject:patriotIndex - ' +
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
    logger.warn('[Validator] [GET]subject:rank - ' +
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
    logger.warn('[Validator] [GET]subject:posts - ' +
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
    logger.warn('[Validator] [GET]subject:info - ' +
      JSON.stringify({
        errors: errors.mapped()
      }));
    res.status(422).send();
  }
});

router.get('/subject/combinedContributions', [
  check('birthId').isInt({
    min: 0,
    max: 99999999
  }),
  check('size').isInt({
    min: 1,
    max: 10 //result has both comments and posts
  }),
  check('lastTimestamp').isFloat()
], (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    next();
  } else {
    //validation failed.
    logger.warn('[Validator] [GET]subject:combinedContributions - ' +
      JSON.stringify({
        errors: errors.mapped()
      }));
    res.status(422).send();
  }
});

module.exports = {
  router
};
