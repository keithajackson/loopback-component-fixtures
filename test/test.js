var request = require('supertest');
var loopback = require('loopback');
var expect = require('chai').expect;
var fixturesComponent = require('../');
var app;
var Item;

describe('loopback fixtures component', function() {
  beforeEach(function() {
    app = loopback();
    app.set('legacyExplorer', false);

    var dataSource = app.dataSource('db', {
      name: 'db',
      connector: 'memory'
    });

    Item = dataSource.createModel('item', {
      id: {type: Number, id: true},
      name: String,
      description: String
    });

    app.model(Item);
    app.use(loopback.rest());
  });

  describe('when using defaults', function() {
    it('shouldn\'t load fixtures on startup ', function(done) {
      var options = {};
      fixturesComponent(app, options);
      request(app).get('/items')
        .expect(200)
        .end(function(err, res) {
          expect(err).to.equal(null);
          expect(res.body).to.be.an('Array');
          expect(res.body.length).to.equal(0);
          done();
        });
    });
  });

  describe('setting loadFixturesOnStartup: true', function() {
    it('should load fixtures on startup ', function(done) {
      var options = {
        'loadFixturesOnStartup': true,
        'fixturesPath': 'test/test-fixtures/'
      };
      fixturesComponent(app, options);
      request(app).get('/items')
        .expect(200)
        .end(function(err, res) {
          expect(err).to.equal(null);
          expect(res.body).to.be.an('Array');
          expect(res.body.length).to.equal(2);
          done();
        });
    });

    it('shouldn\'t load in start fixtures because of wrong environment', function(done) {

      app.settings.env = 'env';

      var options = {
        'loadFixturesOnStartup': true,
        'fixturesPath': 'test/test-fixtures/',
        'environments': 'wrong_env'
      };

      fixturesComponent(app, options);

      request(app).get('/items')
        .expect(200)
        .end(function(err, res) {
          expect(err).to.equal(null);
          expect(res.body).to.be.an('Array');
          expect(res.body.length).to.equal(0);
          done();
        });
    });

    it('should load in start fixtures because of env matches', function(done) {

      app.settings.env = 'env';

      var options = {
        'loadFixturesOnStartup': true,
        'fixturesPath': 'test/test-fixtures/',
        'environments': 'env'
      };

      fixturesComponent(app, options);

      request(app).get('/items')
        .expect(200)
        .end(function(err, res) {
          expect(err).to.equal(null);
          expect(res.body).to.be.an('Array');
          expect(res.body.length).to.equal(2);
          done();
        });
    });

    it('should load in start fixtures because of env matches (as array)', function(done) {

      app.settings.env = 'env';

      var options = {
        'loadFixturesOnStartup': true,
        'fixturesPath': 'test/test-fixtures/',
        'environments': ['env']
      };

      fixturesComponent(app, options);

      request(app).get('/items')
        .expect(200)
        .end(function(err, res) {
          expect(err).to.equal(null);
          expect(res.body).to.be.an('Array');
          expect(res.body.length).to.equal(2);
          done();
        });
    });

    it('shouldn\'t load files without .json extension', function(done) {
      var options = {
        'loadFixturesOnStartup': true,
        'fixturesPath': 'test/test-fixtures/'
      };
      fixturesComponent(app, options);
      request(app).get('/DontLoadThis')
        .expect(404)
        .end(function(err, res) {
          expect(err).to.equal(null);
          done();
        });
    });
  });

  describe('fixtures endpoints', function() {
    describe('a GET request to /fixtures/setup', function() {
      it('should return success message', function(done) {
        var options = {
          'fixturesPath': 'test/test-fixtures/'
        };
        fixturesComponent(app, options);
        request(app).get('/fixtures/setup')
          .expect(200)
          .end(function(err, res) {
            expect(err).to.equal(null);
            expect(res.body).to.be.an('Object');
            expect(res.body).to.deep.equal({'fixtures': 'setup complete'});
            done();
          });
      });

      it('should load fixtures', function(done) {
        var options = {
          'fixturesPath': 'test/test-fixtures/'
        };
        fixturesComponent(app, options);
        request(app).get('/fixtures/setup').end(function() {
          request(app).get('/items')
            .expect(200)
            .end(function(err, res) {
              expect(err).to.equal(null);
              expect(res.body).to.be.an('Array');
              expect(res.body.length).to.equal(2);
              done();
            });
        });
      });
    });

    describe('a GET request to /fixtures/teardown', function() {
      it('should return success message', function(done) {
        var options = {
          'fixturesPath': 'test/test-fixtures/'
        };
        fixturesComponent(app, options);
        request(app).get('/fixtures/teardown')
          .expect(200)
          .end(function(err, res) {
            expect(err).to.equal(null);
            expect(res.body).to.be.an('Object');
            expect(res.body).to.deep.equal({'fixtures': 'teardown complete'});
            done();
          });
      });

      it('should teardown fixtures', function(done) {
        var options = {
          'loadFixturesOnStartup': true,
          'fixturesPath': 'test/test-fixtures/'
        };
        fixturesComponent(app, options);
        request(app).get('/fixtures/teardown')
          .end(function(err, res) {
            expect(err).to.equal(null);
            app.models.Item.find(function(err, data) {
              expect(data.length).to.equal(0);
              done();
            });
          });
      });
    });
  });

});
