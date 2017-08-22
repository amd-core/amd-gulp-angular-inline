const path = require('path');
const fs = require('fs');

const through = require('through2');
const glob = require('glob').sync;
const asyncReplace = require('async-replace');

const util = require('gulp-util');

const templateUrlRegex = /["'`]?templateUrl["'`]?\s*:\s*['"`](.*?)['"`]\s*(,?)/gm;
const styleUrlsRegex = /["']?styleUrls["']?\s*:(\s*\[[^\]]*?\])\s*(,?)/g;
const stringRegex = /(['`"])((?:[^\\]\\\1|.)*?)\1/g;

let basePath = '';
let fileExts = [];
let transpilers = {};
let componentResources = new Map();

/**
 * Create a Gulp error for this plugin
 * @param {string} message 
 */
function createError(message) {
  return new util.PluginError({
    plugin: '@amd-core/gulp-angular-inline',
    message
  });
}

/**
 * Retrieves all options and sets them as local variables.
 * @param {object} options 
 * @param {Function} callback 
 */
function getOptions(options, callback) {
  options = options || {};

  if (!options) {
    return callback(createError('No configuration object provided, this is required'));
  }

  if (!options.basePath) {
    return callback(createError('No basePath option provided, this is required'));
  }

  basePath = options.basePath;
  fileExts = options.fileExts || ['html', 'css'];
  transpilers = options.transpilers || {};
  componentResources = new Map();
}

function getComponentResources() {
  glob(path.join(basePath, `**/*.+(${fileExts.join('|')})`))
    .forEach((resourcePath) => {
      componentResources.set(path.basename(resourcePath), resourcePath);
    });
}

/**
 * Inlines templates and styles for the given source.
 * @param {string} source 
 */
function inlineResources(source) {
  return inlineTemplates(source)
    .then((result) => inlineStyles(result));
}

/**
 * Inline templates for the given source.
 * @param {string} source 
 */
function inlineTemplates(source) {

  if (!templateUrlRegex.test(source)) {
    console.log('No templates to inline!');
  }

  return new Promise((resolve, reject) => {
    console.log('Inlining templates');

    return asyncReplace(source, templateUrlRegex,
      (match, group1, group2, group3, group4, done) => {
        let url = group1;
        let comma = group2;

        console.log('Normal URL', url);

        return getContentForUrl(url)
          .then((content) => {
            console.log('Finished getting template content for url', content);
            return done(null, `"template":"${content}"${comma}`);
          }).catch((err) => {
            console.error('Error getting template content', err);
            return done(err);
          });
      }, (err, result) => {
        console.log('Finished inlining templates', err);
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
  });
}

/**
 * Inline styles for the given source.
 * @param {string} source 
 */
function inlineStyles(source) {

  if (!styleUrlsRegex.test(source)) {
    console.log('No styles to inline!');
  }

  return new Promise((resolve, reject) => {
    console.log('Inlining styles');

    return asyncReplace(source, styleUrlsRegex,
      (match, group1, group2, group3, group4, done) => {
        console.log('Group 1', group1);
        console.log('Group 2', group2);
        console.log('Group 3', group3);
        console.log('Group 4', group4);

        let styleUrls = eval(group1);
        let comma = group2;
        let transpilationPromises = [];

        styleUrls.forEach((url) => {
          transpilationPromises.push(getContentForUrl(url));
        });

        return Promise.all(transpilationPromises)
          .then((results) => {
            console.log('Finished getting content for url');
            return done(null, `"styles":["${results.join('","')}"]${comma}`);
          }).catch((err) => {
            console.error('Error getting style content', err);
            return done(err);
          });
      }, (err, result) => {
        console.log('Finished inlining styles', err);
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
  });
}

/**
 * Get source content for the given file URL.
 * @param {string} url 
 * @param {Function} done 
 */
function getContentForUrl(url) {
  return new Promise((resolve, reject) => {
    try {
      const normalizedUrl = path.normalize(url);
      const ext = path.extname(normalizedUrl);
      const absoluteUrl = componentResources.get(normalizedUrl);
      const content = fs.readFileSync(absoluteUrl, 'utf-8');
      const transpilerFunction = transpilers[ext];

      if (!transpilerFunction) {
        return resolve(content);
      }

      return transpilerFunction(content, (result) => {
        return resolve(result);
      });
    } catch (err) {
      return reject(err);
    }
  });
}

module.exports = (options) => {
  getOptions(options);
  getComponentResources();

  return through.obj((file, encoding, callback) => {
    inlineResources(file.contents.toString())
      .then((result) => {
        file.contents = new Buffer(result);
        return callback(null, file);
      }).catch((err) => {
        return callback(err);
      });
  });
};