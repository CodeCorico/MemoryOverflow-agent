'use strict';

var expect = require('chai').expect,
    fs = require('fs-extra'),
    request = require('superagent'),
    SERVER_PORT = 8125;

describe('Server', function() {

  describe('Files', function() {

    it('should have the server.js feature', function() {
      expect(fs.existsSync('features/server.js')).to.be.true;
    });

  });

  describe('The server', function() {

    beforeEach(function() {
      this.Server = require('../features/server.js');
    });

    it('should be accessible on ' + SERVER_PORT, function(done) {
      var testServer = new this.Server(SERVER_PORT, function(request, response) {
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
      var testServer = new this.Server(SERVER_PORT, function(request, response, body) {
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
        });
    });

    it('should return a forbidden response', function(done) {
      var testServer = new this.Server(SERVER_PORT, function(request, response) {
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
      var testServer = new this.Server(SERVER_PORT, function(request, response) {
        return response.ok();
      });

      request.get('localhost:' + SERVER_PORT).end(function(response) {
        testServer.http().close();
        expect(response).to.be.an('object');
        expect(response.statusCode).to.equal(200);
        done();
      });
    });

    it('should send a FLOOD post request', function(done) {
      var testServer = new this.Server(SERVER_PORT, function(request, response) {
        // this code shouldn't be played
        expect(true).to.be.false;
        return response.ok();
      });

      request
        .post('localhost:' + SERVER_PORT)
        .send({
          flood: new Array(1e7).join('1')
        })
        .end(function(response) {
          testServer.http().close();
          expect(response).to.be.an('object');
          expect(response.statusCode).to.equal(418);
          done();
        });
    });

  });

});