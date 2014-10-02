'use strict';

var crypto = require('crypto'),
    fs = require('fs'),
    Server = require('./features/server.js'),
    SECRET = fs.readFileSync('SECRET', 'utf8').trim(),
    SERVER_PORT = 8124,
    LABEL = 'release: master-{commitID}\n\nCommit: {url}';

var server = new Server(SERVER_PORT, function(request, response, body) {
  if(request.method != 'POST') {
    return response.forbidden();
  }

  var event = request.headers['x-github-event'] || null,
      signature = request.headers['x-hub-signature'] || null,
      hash = crypto.createHmac('sha1', SECRET).update(body).digest('hex'),
      post = JSON.parse(body);

  if(event != 'push' || signature != hash) {
    console.log('new hash:', hash);
    return response.forbidden();
  }

  var commitID = post.after || null,
      url = post.commits && post.commits.length ? post.commits[0].url : null;

  if(!commitID || !url) {
    response.forbidden();
  }

  var commitLabel = LABEL
    .replace('{commitID}', commitID)
    .replace('{url}', url);

  console.log(commitLabel);

  return response.ok();
});