var extend = require('extend'),
    fs = require('fs'),
    cmd = require('child_process'),
    ncp = require('ncp').ncp,
    isWindows = /^win/.test(process.platform),

    WORK_PATH = 'work';

function _rmRecursive(path, callback) {
  if(isWindows) {
    cmd.exec('rmdir /S/Q ' + path, callback);
    return;
  }

  var files = [];
  if(fs.existsSync(path)) {
    files = fs.readdirSync(path);
    files.forEach(function(file, index) {
      var curPath = path + '/' + file;
      if(fs.lstatSync(curPath).isDirectory()) {
        _rmRecursive(curPath);
      }
      else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }

  if(callback) {
    callback();
  }
}

function _cleanWorkspace() {
  if(fs.existsSync(WORK_PATH)) {
    console.log('rm -F ' + WORK_PATH);
    _rmRecursive(WORK_PATH);
  }
}

function _error(error, callback) {
  console.error('\n\nERROR!\n');
  console.error(error);
  console.error('\n\n');

  _cleanWorkspace();

  if(callback) {
    callback();
  }

  return false;
}

module.exports = function release(config, callback) {
  config = extend(true, {
    USER_AGENT: '',
    SECRET: '',
    MEMORYOVERFLOW_REPO: '',
    MEMORYOVERFLOW_PATH: '',
    WEBSITE_REPO: '',
    WEBSITE_PATH: '',
    COMMIT_LABEL: '',
    commitID: '',
    commitUrl: ''
  }, config);

  _cleanWorkspace();

  config.MEMORYOVERFLOW_PATH = WORK_PATH + '/' + config.MEMORYOVERFLOW_PATH;
  config.WEBSITE_PATH = WORK_PATH + '/' + config.WEBSITE_PATH;

  console.log('\ngit clone ' + config.MEMORYOVERFLOW_REPO + ' ' + config.MEMORYOVERFLOW_PATH + '...');

  cmd.exec('git clone ' + config.MEMORYOVERFLOW_REPO + ' ' + config.MEMORYOVERFLOW_PATH, function(error, stdout, stderr) {
    if(error) {
      return _error(error, callback);
    }

    console.log('\ngit clone ' + config.WEBSITE_REPO + ' ' + config.WEBSITE_PATH + '...');

    cmd.exec('git clone ' + config.WEBSITE_REPO + ' ' + config.WEBSITE_PATH, function(error, stdout, stderr) {
      if(error) {
        return _error(error, callback);
      }

      console.log('\ncopy ' + config.MEMORYOVERFLOW_PATH + '/website' + ' ' + config.WEBSITE_PATH + '...');

      ncp(config.MEMORYOVERFLOW_PATH + '/website', config.WEBSITE_PATH, function (error) {
        if(error) {
          return _error(error, callback);
        }

        console.log('\ngit add -A');

        cmd.exec('git add -A', {
          cwd: config.WEBSITE_PATH
        }, function(error, stdout, stderr) {
          if(error) {
            return _error(error, callback);
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

          console.log('\ngit commit' + commitAuthor + commitLabel);

          cmd.exec('git commit' + commitAuthor + commitLabel, {
            cwd: config.WEBSITE_PATH
          }, function(error, stdout, stderr) {
            if(error) {
              return _error(error, callback);
            }

            var pushRepo = config.WEBSITE_REPO.replace('https://', 'https://' + config.USER_AGENT + ':' + config.SECRET + '@');

            console.log('\ngit push ' + pushRepo + ' gh-pages');

            cmd.exec('git push ' + pushRepo + ' gh-pages', {
              cwd: config.WEBSITE_PATH
            }, function(error, stdout, stderr) {
              if(error) {
                return _error(error, callback);
              }

              _cleanWorkspace();

              console.log('\n\nALL IS DONE!\n\n');

              callback();

            });
          });
        });
      });
    });
  });
};