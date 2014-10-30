(function() {
  'use strict';

  var crypto = require('crypto'),
      fs = require('fs-extra'),
      workerFarm = require('worker-farm'),
      websiteReleaseWorker = workerFarm(require.resolve('./features/website-release.js')),
      Server = require('./features/server.js'),
      buildStatus = require('./features/build-status/build-status.js'),

      SECRET = fs.readFileSync('SECRET', 'utf8').trim(),
      SERVER_PORT = 8124,
      USER_AGENT = 'MemoryOverflowAgent',
      USER_AGENT_EMAIL = 'memoryoverflow@codecorico.com',
      MEMORYOVERFLOW_REPO = 'https://github.com/CodeCorico/MemoryOverflow.git',
      MEMORYOVERFLOW_PATH = 'memoryoverflow',
      WEBSITE_REPO = 'https://github.com/CodeCorico/MemoryOverflow-website.git',
      WEBSITE_PATH = 'website',
      THEMACHINE_PATH = 'the-machine',
      COMMIT_LABEL = 'release: master-{commitID}\n\nMemoryOverflow commit origin: {commitUrl}';

  new Server(SERVER_PORT, function(request, response, body) {
    if(request.method != 'POST') {
      return response.forbidden();
    }

    var event = request.headers['x-github-event'] || null,
        signature = request.headers['x-hub-signature'] || null,
        hash = crypto.createHmac('sha1', SECRET).update(body).digest('hex'),
        post = JSON.parse(body);

    console.log(request.headers);
    console.log('\n\n');
    console.log(post);
    return response.ok();

    signature = signature ? signature.replace('sha1=', '') : signature;

    if(event != 'push' || signature != hash) {
      return response.forbidden();
    }

    var commitID = post.after || null,
        commitUrl = post.commits && post.commits.length ? post.commits[0].url : null;

    if(!commitID || !commitUrl) {
      return response.forbidden();
    }

    if(post.action == 'push') {
      buildStatus.status('processing');

      websiteReleaseWorker({
        USER_AGENT: USER_AGENT,
        USER_AGENT_EMAIL: USER_AGENT_EMAIL,
        SECRET: SECRET,
        MEMORYOVERFLOW_REPO: MEMORYOVERFLOW_REPO,
        MEMORYOVERFLOW_PATH: MEMORYOVERFLOW_PATH,
        THEMACHINE_PATH: THEMACHINE_PATH,
        WEBSITE_REPO: WEBSITE_REPO,
        WEBSITE_PATH: WEBSITE_PATH,
        COMMIT_LABEL: COMMIT_LABEL,
        commitID: commitID,
        commitUrl: commitUrl
      }, function(success) {
        buildStatus.status(success ? 'ok' : 'error');
      });
    }
    else if(post.action == 'pull_request') {

    }
    else if(post.action == 'issues') {

    }

    response.ok();
  });

})();
