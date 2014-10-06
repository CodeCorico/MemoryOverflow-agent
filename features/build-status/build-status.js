(function() {
  'use strict';

  var fs = require('fs-extra');

  module.exports = new (function BuildStatus() {

    var _this = this;

    this.STATUS = {
      ok: 'ok',
      error: 'error',
      processing: 'processing'
    };

    this.status = function(status) {
      if(!_this.STATUS[status]) {
        return false;
      }

      if(fs.existsSync('status.svg')) {
        fs.removeSync('status.svg');
      }

      fs.copySync(__dirname + '/' + status + '.svg', 'status.svg');

      return true;
    };

  })();

})();