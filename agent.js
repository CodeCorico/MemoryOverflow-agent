(function() {
  'use strict';

  var crypto = require('crypto'),
      path = require('path'),
      fs = require('fs-extra'),
      workerFarm = require('worker-farm'),
      websiteReleaseWorker = workerFarm(require.resolve('./features/website-release.js')),
      githubControllerWorker = workerFarm(require.resolve('./features/github-controller.js')),
      Server = require('./features/server.js'),
      buildStatus = require('./features/build-status/build-status.js'),

      SECRET = fs.readFileSync('SECRET', 'utf8').trim(),
      SERVER_PORT = 8124,
      USER_AGENT = 'MemoryOverflowAgent',
      USER_AGENT_EMAIL = 'memoryoverflow@codecorico.com',
      MEMORYOVERFLOW_OWNER = 'CodeCorico',
      MEMORYOVERFLOW_PROJECT = 'MemoryOverflow',
      MEMORYOVERFLOW_REPO = 'https://github.com/' + MEMORYOVERFLOW_OWNER + '/' + MEMORYOVERFLOW_PROJECT + '.git',
      MEMORYOVERFLOW_PATH = 'memoryoverflow',
      WEBSITE_REPO = 'https://github.com/CodeCorico/MemoryOverflow-website.git',
      WEBSITE_PATH = 'website',
      THEMACHINE_PATH = 'the-machine',
      COMMIT_LABEL = 'release: master-{commitID}\n\nMemoryOverflow commit origin: {commitUrl}';

  buildStatus.status('ok');

  new Server(SERVER_PORT, function(request, response, body) {
    if (request.method == 'GET' && request.url == '/status.svg') {
      var filePath = path.join(__dirname, 'status.svg');
      var stat = fs.statSync(filePath);

      response.response.writeHead(200, {
          'Content-Type': 'image/svg+xml',
          'Content-Length': stat.size
      });

      var readStream = fs.createReadStream(filePath);
      readStream.pipe(response.response);

      return;
    }

    if(request.method != 'POST') {
      return response.forbidden();
    }

    var event = request.headers['x-github-event'] || null,
        signature = request.headers['x-hub-signature'] || null,
        hash = crypto.createHmac('sha1', SECRET).update(body).digest('hex'),
        post = JSON.parse(body);

    signature = signature ? signature.replace('sha1=', '') : signature;

    if(signature != hash) {
      return response.forbidden();
    }

    if(event == 'push') {
      var commitID = post.after || null,
          commitUrl = post.commits && post.commits.length ? post.commits[0].url : null;

      if(!commitID || !commitUrl) {
        return response.forbidden();
      }

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
    else if(
      (event == 'issues' && post.action == 'opened') ||
      (event == 'issue_comment' && post.action == 'created') ||
      (event == 'pull_request' && post.action == 'opened')
    ) {

      githubControllerWorker({
        USER_AGENT: USER_AGENT,
        USER_AGENT_EMAIL: USER_AGENT_EMAIL,
        SECRET: SECRET,
        MEMORYOVERFLOW_OWNER: MEMORYOVERFLOW_OWNER,
        MEMORYOVERFLOW_PROJECT: MEMORYOVERFLOW_PROJECT,
        event: event,
        post: post
      }, function() {});

    }
    else {
      return response.forbidden();
    }

    response.ok();
  });

})();
