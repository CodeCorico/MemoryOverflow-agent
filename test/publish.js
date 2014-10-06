(function() {
  'use strict';

  var assert = require('chai').assert,
      fs = require('fs'),
      request = require('superagent'),
      SERVER_PORT = 8125;

  describe('Configuration', function() {

    it('should have a README file', function() {
      assert(fs.existsSync('./README.md') === true, 'Project has a README file');
    });

    it('should have a LICENSE file', function() {
      assert(fs.existsSync('./README.md') === true, 'Project has a LICENSE file');
    });

  });

  describe('Web server', function() {

    it('should have the server.js feature', function() {
      assert(fs.existsSync('./features/server.js') === true, 'Feature server.js exists');
    });

    var Server = require('../features/server.js'),
        testServer = new Server(SERVER_PORT, function(request, response, body) {
          return response.ok();
        });

    it('should have a webserver on ' + SERVER_PORT, function(done) {
      request.post('localhost:' + SERVER_PORT).end(function(response) {
        testServer.http().close();
        assert(response && response.statusCode == 200, 'Successful server creation');
        done();
      });
    });

  });

})();