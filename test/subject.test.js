process.env.NODE_ENV = 'test';

var mongoose = require('mongoose');
var chai = require('chai');
var chaiHttp = require('chai-http');

var logger = require('../utils/logger');

var Subject = require('../models/subject');
var authController = require('../controllers/authController');

var app = require('../app');

var should = chai.should();
chai.use(chaiHttp);

const aSubject = {
  'birthId': '038812566',
  'name': 'Darwin Ceniceros',
  'password': 'Password1',
  'dob': '2016-05-18T16:00:00Z',
  'profession': 'PEASANT',
  'gender': 0,
  'picture': '038812566.jpg',
  'patriotIndex': 566,
  'alive': true,
  'informer': false
};

describe('subject tests', () => {
  beforeEach((done) => {
    Subject.remove({}, (err) => {
      if (err) {
        logger.error('TEST: Database not cleared ' + err);
      } else {
        logger.debug('TEST: Database cleared');
      }
      done();
    });
  });

  describe('adding subject', () => {
    it('addition & duplicate birthId', (done) => {
      chai.request(app)
        .post('/api/v1/auth/signup')
        .send(aSubject)
        .end((err, res) => {
          res.should.have.status(200);

          chai.request(app)
            .post('/api/v1/auth/signup')
            .send(aSubject)
            .end((err, res) => {
              res.should.have.status(400);
              done();
            });
        }).timeout(3000);
    });
  });

  describe('subject name length', () => {
    it('name length 0 or 1', (done) => {
      var tempSubject = Object.assign({}, aSubject);
      tempSubject.name = 'L';
      chai.request(app)
        .post('/api/v1/auth/signup')
        .send(tempSubject)
        .end((err, res) => {
          res.should.have.status(422);
          done();
        });
    }).timeout(3000);
    it('name length >40', (done) => {
      var tempSubject = Object.assign({}, aSubject);
      tempSubject.name = 'Contrary to popular belief, ' +
        'Lorem Ipsum is not simply random text. ' +
        'It has roots in a piece of classical Latin literature from 45 BC, ' +
        'making it over 2000 years old. Richard McClintock, ' +
        'a Latin professor at Hampden-Sydney College in Virginia, ' +
        'looked up one of the more obscure Latin words, consectetur, ' +
        'from a Lorem Ipsum passage, ' +
        'and going through the cites of the word in classical literature, ' +
        'discovered the undoubtable source. ' +
        'Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of ' +
        'Finibus Bonorum et Malorum (The Extremes of Good and Evil) by Cicero' +
        'written in 45 BC. This book is a treatise on the theory of ethics, ' +
        'very popular during the Renaissance. The first line of Lorem Ipsum, ' +
        '\'Lorem ipsum dolor sit amet..\',' +
        ' comes from a line in section 1.10.32.';
      chai.request(app)
        .post('/api/v1/auth/signup')
        .send(tempSubject)
        .end((err, res) => {
          res.should.have.status(422);
          done();
        });
    }).timeout(3000);
  });

  describe('subject password length', () => {
    it('password length 7', (done) => {
      var tempSubject = Object.assign({}, aSubject);
      tempSubject.password = '1234567';
      chai.request(app)
        .post('/api/v1/auth/signup')
        .send(tempSubject)
        .end((err, res) => {
          res.should.have.status(422);
          done();
        });
    }).timeout(3000);
  });

  describe('invalid profession', () => {
    it('invalid profession', (done) => {
      var tempSubject = Object.assign({}, aSubject);
      tempSubject.profession = 'REPORTER';
      chai.request(app)
        .post('/api/v1/auth/signup')
        .send(tempSubject)
        .end((err, res) => {
          res.should.have.status(422);
          done();
        });
    }).timeout(3000);
    it('lowercase profession', (done) => {
      var tempSubject = Object.assign({}, aSubject);
      tempSubject.profession = 'peasant';
      chai.request(app)
        .post('/api/v1/auth/signup')
        .send(tempSubject)
        .end((err, res) => {
          res.should.have.status(422);
          done();
        });
    }).timeout(3000);
  });

  describe('invalid gender', () => {
    it('gender = 2', (done) => {
      var tempSubject = Object.assign({}, aSubject);
      tempSubject.gender = 2;
      chai.request(app)
        .post('/api/v1/auth/signup')
        .send(tempSubject)
        .end((err, res) => {
          res.should.have.status(422);
          done();
        });
    }).timeout(3000);
    it('gender = 0', (done) => {
      var tempSubject = Object.assign({}, aSubject);
      tempSubject.gender = -1;
      chai.request(app)
        .post('/api/v1/auth/signup')
        .send(tempSubject)
        .end((err, res) => {
          res.should.have.status(422);
          done();
        });
    }).timeout(3000);
  });

  /*describe('picture', () => {
    it('invalid picture path', (done) => {
      var tempSubject = Object.assign({}, aSubject);
      tempSubject.picture = '8454845150.jpg';
      chai.request(app)
        .post('/api/v1/auth/signup')
        .send(tempSubject)
        .end((err, res) => {
          res.should.have.status(422);
          done();
        });
    }).timeout(3000);
  });*/

  describe('patriotIndex', () => {
    it('patriotIndex < - 1000', (done) => {
      var tempSubject = Object.assign({}, aSubject);
      tempSubject.patriotIndex = -1001;
      chai.request(app)
        .post('/api/v1/auth/signup')
        .send(tempSubject)
        .end((err, res) => {
          res.should.have.status(422);
          done();
        });
    }).timeout(3000);
    it('patriotIndex > 1000', (done) => {
      var tempSubject = Object.assign({}, aSubject);
      tempSubject.patriotIndex = 1001;
      chai.request(app)
        .post('/api/v1/auth/signup')
        .send(tempSubject)
        .end((err, res) => {
          res.should.have.status(422);
          done();
        });
    }).timeout(3000);
    it('invalid patriotIndex', (done) => {
      var tempSubject = Object.assign({}, aSubject);
      tempSubject.patriotIndex = 'a';
      chai.request(app)
        .post('/api/v1/auth/signup')
        .send(tempSubject)
        .end((err, res) => {
          res.should.have.status(422);
          done();
        });
    }).timeout(3000);
  });

  describe('alive', () => {
    it('invalid alive value', (done) => {
      var tempSubject = Object.assign({}, aSubject);
      tempSubject.alive = 'trued';
      chai.request(app)
        .post('/api/v1/auth/signup')
        .send(tempSubject)
        .end((err, res) => {
          res.should.have.status(422);
          done();
        });
    }).timeout(3000);
  });

  describe('informer', () => {
    it('invalid informer value', (done) => {
      var tempSubject = Object.assign({}, aSubject);
      tempSubject.informer = 'trued';
      chai.request(app)
        .post('/api/v1/auth/signup')
        .send(tempSubject)
        .end((err, res) => {
          res.should.have.status(422);
          done();
        });
    }).timeout(3000);
  });

  describe('d o b', () => {
    it('invalid d o b value', (done) => {
      var tempSubject = Object.assign({}, aSubject);
      tempSubject.dob = 'trued';
      chai.request(app)
        .post('/api/v1/auth/signup')
        .send(tempSubject)
        .end((err, res) => {
          res.should.have.status(422);
          done();
        });
    }).timeout(3000);

    it('invalid d o b value 2', (done) => {
      var tempSubject = Object.assign({}, aSubject);
      tempSubject.dob = '04 Dec 1995 00:12:00 GMT';
      chai.request(app)
        .post('/api/v1/auth/signup')
        .send(tempSubject)
        .end((err, res) => {
          res.should.have.status(422);
          done();
        });
    }).timeout(3000);
  });
});
