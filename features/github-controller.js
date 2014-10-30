'use strict';

// http://mikedeboer.github.io/node-github/#issues.prototype.createComment

var GitHubApi = require('github'),
    extend = require('extend');

function _github(OWNER, PROJECT, AGENT, SECRET) {
  var github = new GitHubApi({
    version: '3.0.0',
    debug: true
  });

  github.authenticate({
    type: 'basic',
    username: AGENT,
    password: SECRET
  });

  github.exec = function(func, msg, callback) {
    func(extend(true, msg, {
      user: OWNER,
      repo: PROJECT
    }), callback);
  };

  return github;
}

function _checkIssueMessage(comments, labels, issue) {
  var userstoryRegex = /^as a .* i want .* so that/gi,
      bugRegex = /^\*\*bug\*\*\n\n((.|\n)*)\n\n\*\*how to reproduce\*\*/gi,
      userstoryLink = 'https://github.com/CodeCorico/MemoryOverflow/blob/master/CONTRIBUTING.md#write-a-user-story-for-a-new-feature',
      bugLink = 'https://github.com/CodeCorico/MemoryOverflow/blob/master/CONTRIBUTING.md#write-a-how-to-reproduce-for-a-bug';

  if(!issue.body || !userstoryRegex.exec(issue.body) || !bugRegex.exec(issue.body)) {
    comments.push(
      'Your issue should be in [User Story](userstoryLink) or [Bug](bugLink) format.'
        .replace('userstoryLink', userstoryLink)
        .replace('bugLink', bugLink)
    );

    labels.push('needs: user story/bug format');
  }
}

module.exports = function githubController(config, callback) {
  config = extend(true, {
    USER_AGENT: '',
    USER_AGENT_EMAIL: '',
    SECRET: '',
    MEMORYOVERFLOW_OWNER: '',
    MEMORYOVERFLOW_PROJECT: '',
    event: '',
    post: ''
  }, config);

  var issue = config.post.issue,
      github = null,
      comments = [],
      labels = [],
      labelsChanged = false,
      checkbox = '- [ ] ';

  if(issue.labels) {
    labels = issue.labels.map(function(label) {
      return label.name;
    });
  }
  var labelsOrigin = JSON.stringify(labels);

  // new issue
  if(config.event == 'issues' && config.post.action == 'opened') {
    _checkIssueMessage(comments, labels, issue);
  }

  labelsChanged = labelsOrigin != JSON.stringify(labels);

  if(comments.length > 0 || labelsChanged) {
    github = _github(config.MEMORYOVERFLOW_OWNER, config.MEMORYOVERFLOW_PROJECT, config.USER_AGENT, config.SECRET);
  }

  if(comments.length > 0) {
    var comment =
      ':+1: Thanks for your issue **Agent ' + issue.user.login + '!**\n\n' +
      'However, The Machine has very specific contribution rules. Please update your issue by following these goals:\n' +
      checkbox + comments.join('\n' + checkbox) + '\n\n' +
      'When you have updated your issue, add a comment below to inform me.';

    github.exec(github.issues.createComment, {
      number: issue.number,
      body: comment
    }, function(err, res) {
      console.log(JSON.stringify(res));
    });
  }

  if(labelsChanged) {
    github.exec(github.issues.edit, {
      number: issue.number,
      labels: labels
    }, function(err, res) {
      console.log(err);
      console.log('----------------------');
      console.log(JSON.stringify(res));
    });
  }

  callback();
};