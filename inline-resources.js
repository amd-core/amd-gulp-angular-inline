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
  return [inlineTemplate, inlineStyle, removeModuleId]
    .reduce((content, fn) => fn(content, componentResources, transpilers, callback), content);
}

/**
 * Inline the templates for a source file. Simply search for instances of `templateUrl: ...` and
 * replace with `template: ...` (with the content of the file included).
 * @param content {string} The source file's content.
 * @param urlResolver {Function} A resolver that takes a URL and return a path.
 * @return {string} The content with all templates inlined.
 */
function inlineTemplate(content, componentResources, transpilers, callback) {

  let result = content.replace(/(")?templateUrl(")?:\s*('|")([^']+?\.html)('|")/g,
    (match, quote1, quote2, quote3, templateUrl) => {

      const normalizedTemplateUrl = path.normalize(templateUrl);
      const absoluteTemplateUrl = componentResources.get(normalizedTemplateUrl);
      const templateContent = fs.readFileSync(absoluteTemplateUrl, 'utf-8');

      return `${quote1 || ''}template${quote2 || ''}: "${shortenContent(templateContent)}"`;
    });

  callback(result);
}

/**
 * Inline the styles for a source file. Simply search for instances of `styleUrls: [...]` and
 * replace with `styles: [...]` (with the content of the file included).
 * @param urlResolver {Function} A resolver that takes a URL and return a path.
 * @param content {string} The source file's content.
 * @return {string} The content with all styles inlined.
 */
function inlineStyle(content, componentResources, transpilers, callback) {
  let result = content.replace(/(")?styleUrls(")?:\s*(\[[\s\S]*?\])/gm,
    (match, quote1, quote2, styleUrls) => {

      const urls = eval(styleUrls);

      let transpilationPromises = [];

      urls.forEach((styleUrl) => {
        const normalizedStyleUrl = path.normalize(styleUrl);
        const ext = path.extname(normalizedStyleUrl);
        const absoluteStyleUrl = componentResources.get(normalizedStyleUrl);
        const styleContent = fs.readFileSync(absoluteStyleUrl, 'utf-8');

        transpilationPromises.push(transpile(styleContent, transpilers, ext));
      });

      Promise.all(transpilationPromises).then((results) => {
        return callback(`${quote1 || ''}styles${quote2 || ''}: [${results.join(',\n')}]`)
      });
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
  const transpiler = transpilers[ext];

  return new Promise((resolve, reject) => {
    if (!transpile) {
      return resolve(source);
    }

    transpiler(source, (transpilationResult) => {
      let minifiedResult = shortenContent(transpilationResult);

      resolve(minifiedResult);
    });
  });
}

module.exports = inlineResourcesFromString;