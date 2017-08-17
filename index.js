const path = require('path');
const through = require('through2');

const glob = require('glob').sync;
const util = require('gulp-util');

const inlineResources = require('./inline-resources');

const parse = (fileContents, componentResources) => {
  return inlineResources(fileContents, componentResources);
}

module.exports = (options) => {
  options = options || {};

  if (!options) {
    callback(new util.PluginError({
      plugin: '@amd-core/gulp-angular-inline',
      message: 'No configuration object provided, this is required'
    }));
  }

  if (!options.basePath) {
    callback(new util.PluginError({
      plugin: '@amd-core/gulp-angular-inline',
      message: 'No basePath option provided, this is required'
    }));
  }

  const basePath = options.basePath;
  const fileExts = options.fileExts || ['html', 'css'];
  const transpilers = options.transpilers || {};
  const componentResources = new Map();

  glob(path.join(basePath, `**/*.+(${fileExts.join('|')})`))
    .forEach((resourcePath) => {
      componentResources.set(path.basename(resourcePath), resourcePath);
    });

  return through.obj((file, encoding, callback) => {
    const transpile = transpilers[path.extname(file.path)];

    if (transpile) {
      transpile(file.contents.toString(), (transpilationResult) => {
        file.contents = new Buffer(parse(transpilationResult, componentResources));
        callback(null, file);
      });
    } else {
      file.contents = new Buffer(parse(file.contents.toString(), componentResources));
      callback(null, file);
    }
  });
};