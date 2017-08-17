const path = require('path');
const through = require('through2');

const glob = require('glob').sync;
const util = require('gulp-util');

const inlineResources = require('./inline-resources');

const parse = (fileContents, componentResources, transpiler) => {
  if (transpiler) { fileContents = transpiler(fileContents); }
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
    let ext = path.extname(file.path);
    const result = parse(
      file.contents.toString(),
      componentResources,
      transpilers[ext]
    );

    file.contents = new Buffer(result);

    callback(null, file);
  });
};
