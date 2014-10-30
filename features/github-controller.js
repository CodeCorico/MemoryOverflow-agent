'use strict';

// http://mikedeboer.github.io/node-github/

var GitHubApi = require('github'),
    extend = require('extend'),

    LABELS = {
      NEEDS_FORMATTING: 'needs: user story/bug format'
    },
    USERSTORY_LINK = 'https://github.com/CodeCorico/MemoryOverflow/blob/master/CONTRIBUTING.md#write-a-user-story-for-a-new-feature',
    BUG_LINK = 'https://github.com/CodeCorico/MemoryOverflow/blob/master/CONTRIBUTING.md#write-a-how-to-reproduce-for-a-bug';

function _github(OWNER, PROJECT, AGENT, SECRET) {
  var github = new GitHubApi({
    version: '3.0.0'
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

function _issueIsFormatted(issue) {
  var userstoryRegex = /^as a .* i want .* so that/gi,
      bugRegex = /^\*\*bug\*\*\n\n((.|\n)*)\n\n\*\*how to reproduce\*\*/gi,
      body = issue.body
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n');

  return body && (userstoryRegex.test(body) || bugRegex.test(body));
}

function _checkIssueMessage(comments, labels, issue) {
  if(!_issueIsFormatted(issue)) {
    comments.push(
      'Your issue should be in [User Story](USERSTORY_LINK) or [Bug](BUG_LINK) format.'
        .replace('USERSTORY_LINK', USERSTORY_LINK)
        .replace('BUG_LINK', BUG_LINK)
    );

    labels.push(LABELS.NEEDS_FORMATTING);
  }
}

function _checkIssueFormatting(comments, labels, issue) {
  if(_issueIsFormatted(issue)) {
    var index = labels.indexOf(LABELS.NEEDS_FORMATTING);
    if(index > -1) {
      labels.splice(index, 1);
    }
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
  // commented issue
  else if(config.event == 'issue_comment' && config.post.action == 'created') {
    var comment = config.post.comment;

    if(labels.indexOf(LABELS.NEEDS_FORMATTING) > -1 && issue.user.login == comment.user.login) {
      _checkIssueFormatting(comments, labels, issue);
    }
  }

  labelsChanged = labelsOrigin != JSON.stringify(labels);

  if(comments.length > 0 || labelsChanged) {
    github = _github(config.MEMORYOVERFLOW_OWNER, config.MEMORYOVERFLOW_PROJECT, config.USER_AGENT, config.SECRET);
  }

  if(comments.length > 0) {
    var commentBody =
      ':+1: Thanks for your issue **Agent ' + issue.user.login + '!**\n\n' +
      'However, The Machine has very specific contribution rules. Please update your issue by following these goals:\n' +
      checkbox + comments.join('\n' + checkbox) + '\n\n' +
      'When you have updated your issue, add a comment below to inform me.';

    github.exec(github.issues.createComment, {
      number: issue.number,
      body: commentBody
    }, function() {
      console.log('commented');
    });
  }

  if(labelsChanged) {
    github.exec(github.issues.edit, {
      number: issue.number,
      labels: labels
    }, function() {
      console.log('labels updated: ', labels);
    });
  }

  callback();
};