'use strict';

var expect = require('chai').expect,
    fs = require('fs-extra');

describe('Build status', function() {

  describe('Files', function() {

    it('should have the build-status.js file', function() {
      expect(fs.existsSync('features/build-status/build-status.js')).to.be.true;
    });

  });

  describe('Feature', function() {

    beforeEach(function() {
      this.buildStatus = require('../features/build-status/build-status.js');
    });

    it('shouldn\'t create the status picture', function() {
      expect(this.buildStatus.status('anythingelse')).to.be.false;
    });

    it('should create the "processing" status picture', function() {
      expect(this.buildStatus.status('processing')).to.be.true;
    });

    it('should create the "error" status picture', function() {
      expect(this.buildStatus.status('error')).to.be.true;
    });

    it('should create the "ok" status picture', function() {
      expect(this.buildStatus.status('ok')).to.be.true;
    });

  });

});