'use strict';

var crypto = require('crypto'),
    fs = require('fs-extra'),
    workerFarm = require('worker-farm'),
    releaseWorker = workerFarm(require.resolve('./features/release.js')),
    Server = require('./features/server.js'),

    SECRET = fs.readFileSync('SECRET', 'utf8').trim(),
    SERVER_PORT = 8124,
    USER_AGENT = 'MemoryOverflowAgent',
    USER_AGENT_EMAIL = 'memoryoverflow@codecorico.com',
    MEMORYOVERFLOW_REPO = 'https://github.com/CodeCorico/MemoryOverflow.git',
    MEMORYOVERFLOW_PATH = 'memoryoverflow',
    WEBSITE_REPO = 'https://github.com/CodeCorico/MemoryOverflow-website.git',
    WEBSITE_PATH = 'website',
    COMMIT_LABEL = 'release: master-{commitID}\n\nMemoryOverflow commit origin: {commitUrl}';

function _status(status) {
  if(fs.existsSync('status.svg')) {
    fs.remove('status.svg');
  }

  fs.copy(status + '.svg', 'status.svg');
}

var server = new Server(SERVER_PORT, function(request, response, body) {
  if(request.method != 'POST') {
    return response.forbidden();
  }

  var event = request.headers['x-github-event'] || null,
      signature = request.headers['x-hub-signature'] || null,
      hash = crypto.createHmac('sha1', SECRET).update(body).digest('hex'),
      post = JSON.parse(body);

  signature = signature ? signature.replace('sha1=', '') : signature;

  if(event != 'push' || signature != hash) {
    return response.forbidden();
  }

  var commitID = post.after || null,
      commitUrl = post.commits && post.commits.length ? post.commits[0].url : null;

  if(!commitID || !commitUrl) {
    return response.forbidden();
  }

  _status('processing');

  releaseWorker({
    USER_AGENT: USER_AGENT,
    USER_AGENT_EMAIL: USER_AGENT_EMAIL,
    SECRET: SECRET,
    MEMORYOVERFLOW_REPO: MEMORYOVERFLOW_REPO,
    MEMORYOVERFLOW_PATH: MEMORYOVERFLOW_PATH,
    WEBSITE_REPO: WEBSITE_REPO,
    WEBSITE_PATH: WEBSITE_PATH,
    COMMIT_LABEL: COMMIT_LABEL,
    commitID: commitID,
    commitUrl: commitUrl
  }, function(success) {

    if(success) {
      _status('ok');
    }
    else {
      _status('error');
    }

  });

  response.ok();
});