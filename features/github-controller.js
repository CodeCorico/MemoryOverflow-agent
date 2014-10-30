'use strict';

// github module doc: http://mikedeboer.github.io/node-github

var GitHubApi = require('github'),
    extend = require('extend'),

    LABELS = {
      NEEDS_FORMATTING: 'needs: user story/bug format',
      NEEDS_COMMIT_GUIDELINES: 'needs: commit guidelines',
      VOTE_10: 'votes: +10',
      VOTE_20: 'votes: +20',
      VOTE_50: 'votes: +50'
    },
    CONTRIBUTING = {
      URL: 'https://github.com/CodeCorico/MemoryOverflow/blob/master/CONTRIBUTING.md',
      USERSTORY: '#write-a-user-story-for-a-new-feature',
      BUG: '#write-a-how-to-reproduce-for-a-bug',
      COMMIT: '#commit-message-format',
      TYPES: '#type'
    },
    COMMIT_TYPES = ['mo', 'chore', 'feat', 'fix', 'test', 'card', 'rules', 'tpl', 'style', 'refactor', 'perf'],
    VOTE_SYMBOL = '+1';

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

  var issue = config.post.issue || config.post.pull_request,
      github = _github(config.MEMORYOVERFLOW_OWNER, config.MEMORYOVERFLOW_PROJECT, config.USER_AGENT, config.SECRET);

  // get issue labels for PR
  if(!issue.labels) {
    github.exec(github.issues.getIssueLabels, {
      number: issue.number
    }, function(error, labels) {
      issue.labels = labels;
      _controller(config, github, issue, callback);
    });

    return;
  }

  _controller(config, github, issue, callback);
};

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

function _controller(config, github, issue, callback) {
  var rules = [],
      labels = issue.labels.map(function(label) {
        return label.name;
      }),
      labelsOrigin = JSON.stringify(labels);

  // new issue
  if(config.event == 'issues' && config.post.action == 'opened') {
    _checkIssueMessage(rules, labels, issue);

    _applyChanges(rules, issue, labels, labelsOrigin, github, callback);

    return;
  }

  // new PR
  else if(config.event == 'pull_request' && config.post.action == 'opened') {
    // add/remove label and post comment
    _checkPR(rules, labels, issue, github, true, function() {
      _applyChanges(rules, issue, labels, labelsOrigin, github, callback);
    });

    return;
  }

  // commented issue (or PR)
  else if(config.event == 'issue_comment' && config.post.action == 'created') {
    var comment = config.post.comment;

    // if PR
    if(issue.pull_request) {

      // just add/remove label
      console.log('checkPR');
      _checkPR(rules, labels, issue, github, false, function() {

        // update votes label
        console.log('checkVotes');
        _checkVotes(rules, labels, issue, comment, github, config.USER_AGENT, function() {
          console.log('applyChanges', labels, labelsOrigin);
          _applyChanges(rules, issue, labels, labelsOrigin, github, callback);
        });
      });
    }

    // if simple issue
    else {

      // remove needs formating label case
      if(labels.indexOf(LABELS.NEEDS_FORMATTING) > -1 && issue.user.login == comment.user.login) {
        _checkIssueFormatting(rules, labels, issue);
      }

      // update votes label
      _checkVotes(rules, labels, issue, comment, github, config.USER_AGENT, function() {
        _applyChanges(rules, issue, labels, labelsOrigin, github, callback);
      });
    }

    return;
  }

  callback();
}

function _issueIsFormatted(issue) {
  var userstoryRegex = /^as a .* i want .* so that/gi,
      bugRegex = /^\*\*bug\*\*\n\n((.|\n)*)\n\n\*\*how to reproduce\*\*/gi,
      body = issue.body
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n');

  return body && (userstoryRegex.test(body) || bugRegex.test(body));
}

function _checkIssueMessage(rules, labels, issue) {
  if(!_issueIsFormatted(issue)) {
    rules.push(
      'Your issue should be in [User Story](USERSTORY_LINK) or [Bug](BUG_LINK) format.'
        .replace(/USERSTORY_LINK/g, CONTRIBUTING.URL + CONTRIBUTING.USERSTORY)
        .replace(/BUG_LINK/g, CONTRIBUTING.URL + CONTRIBUTING.BUG)
    );

    labels.push(LABELS.NEEDS_FORMATTING);
  }
}

function _checkIssueFormatting(rules, labels, issue) {
  if(_issueIsFormatted(issue)) {
    var index = labels.indexOf(LABELS.NEEDS_FORMATTING);
    if(index > -1) {
      labels.splice(index, 1);
    }
  }
}

function _checkVotes(rules, labels, issue, comment, github, USER_AGENT, callback) {
  if(comment.body.indexOf(VOTE_SYMBOL) > -1) {

    var voteLabels = [],
        labelKey;

    for(labelKey in LABELS) {
      if(labelKey.indexOf('VOTE_') === 0) {
        voteLabels.push(labelKey);
      }
    }
    voteLabels.sort();

    github.exec(github.issues.getComments, {
      number: issue.number
    }, function(error, comments) {

      for(var i = 0, len = voteLabels.length; i < len; i++) {
        var index = labels.indexOf(LABELS[voteLabels[i]]);
        if(index > -1) {
          labels.splice(index, 1);
        }
      }

      var votes = 0;

      if(comments && comments.length > 0) {
        for(var i = 0, len = comments.length; i < len; i++) {
          if(
            issue.user.login != comments[i].user.login &&
            comments[i].user.login.toLowerCase() != USER_AGENT.toLowerCase() &&
            comments[i].body.indexOf(VOTE_SYMBOL) > -1
          ) {
            votes++;
          }
        }
      }

      for(var i = voteLabels.length - 1; i >= 0; i--) {
        var number = parseInt(voteLabels[i].replace('VOTE_', ''), 10);
        if(votes >= number) {
          labels.push(LABELS[voteLabels[i]]);
          break;
        }
      }

      callback();
    });

    return;
  }

  callback();
}

function _checkPR(rules, labels, issue, github, postComment, callback) {
  github.exec(github.pullRequests.getCommits, {
    number: issue.number
  }, function(error, commits) {

    if(!commits) {
      callback();
      return;
    }

    for(var i = 0, len = commits.length; i < len; i++) {
      var commit = commits[i],
          messageRegex = /^(\w+)\([\w -\$]+\): .*/, // <type>(<scope>): <subject>
          message = commit.commit.message
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n'),
          subject = message.split('\n')[0],
          index = labels.indexOf(LABELS.NEEDS_COMMIT_GUIDELINES);

      if(index > -1) {
        labels.splice(index, 1);
      }

      var search = messageRegex.exec(subject);

      console.log(labels);
      console.log(search);

      if(!search) {
        if(postComment) {
          rules.push(
            'Your commit SHA does not match the [Commit message format](COMMIT_LINK).'
              .replace(/SHA/g, commit.sha)
              .replace(/COMMIT_LINK/g, CONTRIBUTING.URL + CONTRIBUTING.COMMIT)
          );
        }

        labels.push(LABELS.NEEDS_COMMIT_GUIDELINES);
      }
      else if(search.length < 2 || COMMIT_TYPES.indexOf(search[1].toLowerCase()) === -1) {
        if(postComment) {
          rules.push(
            'Your commit SHA uses an [unallowed type](TYPES_LINK).'
              .replace(/SHA/g, commit.sha)
              .replace(/COMMIT_LINK/g, CONTRIBUTING.URL + CONTRIBUTING.COMMIT)
          );
        }

        labels.push(LABELS.NEEDS_COMMIT_GUIDELINES);
      }
    }

    callback();

  });
}

function _applyChanges(rules, issue, labels, labelsOrigin, github, callback) {
  var checkbox = '- [ ] ',
      labelsChanged = labelsOrigin != JSON.stringify(labels);

  if(rules.length > 0) {
    var commentBody =
      ':+1: Thanks for your contribution **Agent ' + issue.user.login + '!**\n\n' +
      'However, The Machine has very specific contribution rules. Please update your contribution by following these goals:\n' +
      checkbox + rules.join('\n' + checkbox) + '\n\n' +
      'When you have updated your work, add a comment below to inform me.';

    github.exec(github.issues.createComment, {
      number: issue.number,
      body: commentBody
    }, function() { });
  }

  if(labelsChanged) {
    github.exec(github.issues.edit, {
      number: issue.number,
      labels: labels
    }, function() { });
  }

  callback();
}