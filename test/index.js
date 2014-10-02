(function() {
  'use strict';

  var assert = require('chai').assert,
      fs = require('fs');

  describe('Configuration', function() {

    it('should have a README file', function() {
      assert(fs.existsSync('./README.md') === true, 'Project has a README file');
    });

    it('should have a LICENSE file', function() {
      assert(fs.existsSync('./README.md') === true, 'Project has a LICENSE file');
    });

  });

})();