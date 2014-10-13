'use strict';

var http = require('http');

var Response = function(response) {

  this.ok = function(result) {
    result = result || {};

    if(typeof result.success == 'undefined') {
      result.success = true;
    }

    response.writeHead(200, {
      'Content-Type': 'text/plain'
    });
    return response.end(JSON.stringify(result));
  };

  this.forbidden = function() {
    response.writeHead(403);
    return response.end('Forbidden.');
  };

};

var Server = function(port, requestFunction) {

  var _server = http.createServer(function(request, response) {

    response = new Response(response);

    if(request.method == 'POST') {
      var body = '';
      request.on('data', function (data) {
        body += data;
        // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
        if (body.length > 1e6) {
          // FLOOD ATTACK OR FAULTY CLIENT, NUKE REQUEST
          request.connection.destroy();
        }
      });
      request.on('end', function () {
        requestFunction(request, response, body);
      });
    }
    else {
      requestFunction(request, response);
    }

  }).listen(port);

  this.http = function() {
    return _server;
  };

};

module.exports = Server;