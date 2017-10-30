'use strict';

var http = require('http');

var Response = function(response) {

  this.ok = function(result) {
    result = result || {};
    result.success = true;

    response.writeHead(200, {
      'Content-Type': 'text/plain'
    });
    return response.end(JSON.stringify(result));
  };

  this.forbidden = function() {
    response.writeHead(403);
    return response.end('Forbidden.');
  };

  this.flood = function() {
    response.writeHead(418);
    return response.end('');
  };

  this.response = response;

};

var Server = function(port, requestFunction) {

  var _server = http.createServer(function(request, response) {

    response = new Response(response);

    var flood = false;

    if(request.method == 'POST') {
      var body = '';
      request.on('data', function (data) {
        if(flood) {
          return;
        }

        body += data;
        // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
        if (body.length > 1e6) {
          // FLOOD ATTACK OR FAULTY CLIENT, NUKE REQUEST
          flood = true;
          body = '';
        }
      });
      request.on('end', function () {
        if(flood) {
          return response.flood();
        }

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