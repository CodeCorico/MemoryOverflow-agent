'use strict';

var extend = require('extend'),
    path = require('path'),
    fs = require('fs-extra'),
    cmd = require('child_process'),
    glob = require('glob'),

    WORK_PATH = 'work';

function _cleanWorkspace() {
  if(fs.existsSync(WORK_PATH)) {
    console.log(_date() + 'Cleaning workspace...');
    fs.removeSync(WORK_PATH);
  }
}

function _error(error, callback) {
  console.error(_date() + 'ERROR!');
  console.error(error);

  _cleanWorkspace();

  if(callback) {
    callback(false);
  }

  return false;
}

function _success(callback) {
  _cleanWorkspace();

  console.log(_date() + 'Website released');

  if(callback) {
    callback(true);
  }

  return true;
}

function _date() {
  const date = new Date();
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let seconds = date.getSeconds();

  hours = hours > 9 ? hours : `0${hours}`;
  minutes = minutes > 9 ? minutes : `0${minutes}`;
  seconds = seconds > 9 ? seconds : `0${seconds}`;

  return `[${hours}:${minutes}:${seconds}] `;
}

module.exports = function websiteRelease(config, callback) {
  config = extend(true, {
    USER_AGENT: '',
    USER_AGENT_EMAIL: '',
    SECRET: '',
    MEMORYOVERFLOW_REPO: '',
    MEMORYOVERFLOW_PATH: '',
    WEBSITE_REPO: '',
    WEBSITE_PATH: '',
    THEMACHINE_PATH: '',
    COMMIT_LABEL: '',
    commitID: '',
    commitUrl: ''
  }, config);

  _cleanWorkspace();

  config.MEMORYOVERFLOW_PATH = WORK_PATH + '/' + config.MEMORYOVERFLOW_PATH;
  config.WEBSITE_PATH = WORK_PATH + '/' + config.WEBSITE_PATH;
  config.THEMACHINE_PATH = config.MEMORYOVERFLOW_PATH + '/' + config.THEMACHINE_PATH;
  config.WEBSITE_ABSOLUTE_PATH = path.join(__dirname, '..', config.WEBSITE_PATH);

  console.log(_date() + 'Cloning The Machine...');

  cmd.exec('git clone --depth 1 ' + config.MEMORYOVERFLOW_REPO + ' ' + config.MEMORYOVERFLOW_PATH, function(error) {
    if(error) {
      return _error(error, callback);
    }

    console.log(_date() + 'Installing The Machine...');

    cmd.exec('npm install', {
      cwd: config.THEMACHINE_PATH
    }, function(error) {
      if(error) {
        return _error(error, callback);
      }

      fs.writeFileSync(config.THEMACHINE_PATH + '/.env', 'WEBSITE_TARGET=' + config.WEBSITE_ABSOLUTE_PATH);

      console.log(_date() + 'Cloning the website...');

      cmd.exec('git clone ' + config.WEBSITE_REPO + ' ' + config.WEBSITE_PATH, function(error) {
        if(error) {
          return _error(error, callback);
        }

        console.log(_date() + 'Starting The Machine...');

        cmd.exec('npm run generate', {
          cwd: config.THEMACHINE_PATH
        }, function(error) {
          if(error) {
            return _error(error, callback);
          }

          console.log(_date() + 'Pushing the new website release...')

          cmd.exec('git config user.name "' + config.USER_AGENT + '"', {
            cwd: config.WEBSITE_PATH
          }, function(error) {
            if(error) {
              return _error(error, callback);
            }

            cmd.exec('git config user.email "' + config.USER_AGENT_EMAIL + '"', {
              cwd: config.WEBSITE_PATH
            }, function(error) {
              if(error) {
                return _error(error, callback);
              }

              cmd.exec('git add -A', {
                cwd: config.WEBSITE_PATH
              }, function(error, stdout) {
                if(error) {
                  return _error(error, callback);
                }

                cmd.exec('git status', {
                  cwd: config.WEBSITE_PATH
                }, function(error, stdout) {
                  if(error) {
                    return _error(error, callback);
                  }

                  var status = stdout.split('\n');
                  if(status.length && status[1].trim() == 'nothing to commit, working directory clean') {
                    console.log(_date() + '[NOTHING TO COMMIT]');
                    return _success(callback);
                  }

                  var commitAuthor = ' --author="' + config.USER_AGENT + ' <' + config.USER_AGENT_EMAIL + '>"',
                      commitLabel = config.COMMIT_LABEL
                        .replace('{commitID}', config.commitID)
                        .replace('{commitUrl}', config.commitUrl)
                        .split('\n')
                        .map(function(line) {
                          return ' -m "' + line + '"';
                        })
                        .join('');

                  cmd.exec('git commit' + commitAuthor + commitLabel, {
                    cwd: config.WEBSITE_PATH
                  }, function(error) {
                    if(error) {
                      return _error(error, callback);
                    }

                    var pushRepo = config.WEBSITE_REPO.replace('https://', 'https://' + config.USER_AGENT + ':' + config.SECRET + '@');

                    cmd.exec('git push ' + pushRepo + ' gh-pages', {
                      cwd: config.WEBSITE_PATH
                    }, function(error) {
                      if(error) {
                        return _error(error, callback);
                      }

                      return _success(callback);
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
};
