(function() {
  'use strict';

  var assert = require('chai').assert,
      fs = require('fs-extra'),
      request = require('superagent'),
      SERVER_PORT = 8125;

  describe('Configuration', function() {

    it('should have a README file', function() {
      assert(fs.existsSync('README.md') === true, 'Project has a README file');
    });

    it('should have a LICENSE file', function() {
      assert(fs.existsSync('LICENSE') === true, 'Project has a LICENSE file');
    });

  });

  describe('Build status', function() {

    it('should have the build-status feature', function() {
      assert(fs.existsSync('features/build-status/build-status.js') === true, 'Feature build-status.js exists');
    });

    it('should create the status picture', function() {
      var buildStatus = require('../features/build-status/build-status.js');

      assert(buildStatus.status('anythingelse') === false, 'Trying anything else status');
      assert(buildStatus.status('processing') === true, 'Create status processing');
      assert(buildStatus.status('error') === true, 'Create status error');
      assert(buildStatus.status('ok') === true, 'Create status ok');
    });

  });

  describe('Web server', function() {

    it('should have the server.js feature', function() {
      assert(fs.existsSync('features/server.js') === true, 'Feature server.js exists');
    });

    it('should have a webserver on ' + SERVER_PORT, function(done) {
      var Server = require('../features/server.js'),
          testServer = new Server(SERVER_PORT, function(request, response) {
            return response.ok();
          });

      request.post('localhost:' + SERVER_PORT).end(function(response) {
        testServer.http().close();
        assert(response && response.statusCode == 200, 'Successful server creation');
        done();
      });
    });

  });

})();