(function() {
  'use strict';

  var expect = require('chai').expect,
      fs = require('fs-extra'),
      request = require('superagent'),
      SERVER_PORT = 8125;

  describe('Configuration', function() {

    it('should have a README file', function() {
      expect(fs.existsSync('README.md')).to.be.true;
    });

    it('should have a LICENSE file', function() {
      expect(fs.existsSync('LICENSE')).to.be.true;
    });

  });

  describe('Build status', function() {

    it('should have the build-status feature', function() {
      expect(fs.existsSync('features/build-status/build-status.js')).to.be.true;
    });

    it('should create the status picture', function() {
      var buildStatus = require('../features/build-status/build-status.js');

      expect(buildStatus.status('anythingelse')).to.be.false;
      expect(buildStatus.status('processing')).to.be.true;
      expect(buildStatus.status('error')).to.be.true;
      expect(buildStatus.status('ok')).to.be.true;
    });

  });

  describe('Web server', function() {

    var Server = null;

    it('should have the server.js feature', function() {
      expect(fs.existsSync('features/server.js')).to.be.true;
    });

    it('should be accessible on ' + SERVER_PORT, function(done) {
      Server = require('../features/server.js');

      var testServer = new Server(SERVER_PORT, function(request, response) {
        return response.ok();
      });

      request.post('localhost:' + SERVER_PORT).end(function(response) {
        testServer.http().close();
        expect(response).to.be.an('object');
        expect(response.statusCode).to.equal(200);
        done();
      });
    });

    it('should post data', function(done) {
      Server = require('../features/server.js');

      var testServer = new Server(SERVER_PORT, function(request, response, body) {
        var post = JSON.parse(body);

        expect(post).to.deep.equal({
          myTest: 'isOk'
        });

        return response.ok();
      });

      request
        .post('localhost:' + SERVER_PORT)
        .send({
          myTest: 'isOk'
        })
        .end(function(response) {
          testServer.http().close();
          expect(response).to.be.an('object');
          expect(response.statusCode).to.equal(200);
          done();
        })
        ;
    });

    it('should return a forbidden response', function(done) {
      var testServer = new Server(SERVER_PORT, function(request, response) {
        return response.forbidden();
      });

      request.post('localhost:' + SERVER_PORT).end(function(response) {
        testServer.http().close();
        expect(response).to.be.an('object');
        expect(response.statusCode).to.equal(403);
        done();
      });
    });

    it('should send a get request', function(done) {
      var testServer = new Server(SERVER_PORT, function(request, response) {
        return response.ok();
      });

      request.get('localhost:' + SERVER_PORT).end(function(response) {
        testServer.http().close();
        expect(response).to.be.an('object');
        expect(response.statusCode).to.equal(200);
        done();
      });
    });

  });

})();