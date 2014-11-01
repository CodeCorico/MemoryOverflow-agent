'use strict';

var expect = require('chai').expect,
    fs = require('fs-extra');

describe('Configuration', function() {

  it('should have a README file', function() {
    expect(fs.existsSync('README.md')).to.be.true;
  });

  it('should have a LICENSE file', function() {
    expect(fs.existsSync('LICENSE')).to.be.true;
  });

});