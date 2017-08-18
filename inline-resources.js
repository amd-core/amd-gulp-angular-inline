const fs = require('fs');
const path = require('path');

function shortenContent(content) {
  return content
    .replace(/([\n\r]\s*)+/gm, ' ')
    .replace(/"/g, '\\"');
}

/**
 * Inline resources from a string content.
 * @param content {string} The source file's content.
 * @param urlResolver {Function} A resolver that takes a URL and return a path.
 * @returns {string} The content with resources inlined.
 */
function inlineResourcesFromString(content, componentResources, transpilers, callback) {
  inlineTemplate(content, componentResources, transpilers)
    .then((inlineTemplateContent) => {
      return inlineStyle(inlineTemplateContent, componentResources, transpilers);
    }).then((inlineStyleContent) => {
      let finalContent = removeModuleId(inlineStyleContent);
      callback(finalContent);
    }).catch((err) => {
      console.error('ERROR', err);
    });
}

/**
 * Inline the templates for a source file. Simply search for instances of `templateUrl: ...` and
 * replace with `template: ...` (with the content of the file included).
 * @param content {string} The source file's content.
 * @param urlResolver {Function} A resolver that takes a URL and return a path.
 * @return {string} The content with all templates inlined.
 */
function inlineTemplate(content, componentResources, transpilers) {

  let result = content.replace(/(")?templateUrl(")?:\s*('|")([^']+?\.html)('|")/g,
    (match, quote1, quote2, quote3, templateUrl) => {

      const normalizedTemplateUrl = path.normalize(templateUrl);
      const absoluteTemplateUrl = componentResources.get(normalizedTemplateUrl);
      const templateContent = fs.readFileSync(absoluteTemplateUrl, 'utf-8');

      return `${quote1 || ''}template${quote2 || ''}: "${shortenContent(templateContent)}"`;
    });

  return Promise.resolve(result);
}

/**
 * Inline the styles for a source file. Simply search for instances of `styleUrls: [...]` and
 * replace with `styles: [...]` (with the content of the file included).
 * @param urlResolver {Function} A resolver that takes a URL and return a path.
 * @param content {string} The source file's content.
 * @return {string} The content with all styles inlined.
 */
function inlineStyle(content, componentResources, transpilers) {
  let regExp = new RegExp(/(")?styleUrls(")?:\s*(\[[\s\S]*?\])/, 'gm');

  if (!regExp.test(content)) {
    return Promise.resolve(content);
  }

  let urls = eval(content.match(regExp));
  let transpilationPromises = [];

  urls.forEach((styleUrl) => {
    if (/['\s']/.test(styleUrl)) {
      styleUrl = styleUrl.split('[\'')[1].split('\']')[0];
    } else if (/["\s"]/.test(styleUrl)) {
      styleUrl = styleUrl.split('["')[1].split('"]')[0];
    } else {
      console.error('noQuotes');
    }

    let normalizedStyleUrl = path.normalize(styleUrl);
    let ext = path.extname(normalizedStyleUrl);
    let absoluteStyleUrl = componentResources.get(normalizedStyleUrl);
    let styleContent = fs.readFileSync(absoluteStyleUrl, 'utf-8');

    transpilationPromises.push(transpile(styleContent, transpilers, ext));
  });

  return Promise.all(transpilationPromises).then((results) => {
    return Promise.resolve(content.replace(regExp, `"styles": [${results.join(',\n')}]`));
  });
}

/**
 * Remove every mention of `moduleId: module.id`.
 * @param content {string} The source file's content.
 * @returns {string} The content with all moduleId: mentions removed.
 */
function removeModuleId(content) {
  return content.replace(/\s*"?moduleId"?:\s*module\.id\s*,?\s*/gm, '');
}

function transpile(source, transpilers, ext) {
  return new Promise((resolve, reject) => {
    const transpilerFunction = transpilers[ext];

    if (!transpilerFunction) {
      return resolve(source);
    }

    transpilerFunction(source, (transpilationResult) => {
      let minifiedResult = shortenContent(transpilationResult);

      return resolve(JSON.stringify(minifiedResult));
    });
  });
}

module.exports = inlineResourcesFromString;