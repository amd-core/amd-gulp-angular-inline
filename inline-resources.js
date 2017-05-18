const fs = require('fs');

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
function inlineResourcesFromString(content, urlResolver) {

  // Curry through the inlining functions.
  return [
    inlineTemplate,
    inlineStyle,
    removeModuleId
  ].reduce((content, fn) => {
    return fn(content, urlResolver);
  }, content);
}

/**
 * Inline the templates for a source file. Simply search for instances of `templateUrl: ...` and
 * replace with `template: ...` (with the content of the file included).
 * @param content {string} The source file's content.
 * @param urlResolver {Function} A resolver that takes a URL and return a path.
 * @return {string} The content with all templates inlined.
 */
function inlineTemplate(content, urlResolver) {
  return content.replace(/(")?templateUrl(")?:\s*('|")([^']+?\.html)('|")/g,
    (match, quote1, quote2, quote3, templateUrl) => {

      const templateFile = urlResolver(templateUrl);
      const templateContent = fs.readFileSync(templateFile, 'utf-8');

      return `${quote1 || ''}template${quote2 || ''}: "${shortenContent(templateContent)}"`;
    });
}

/**
 * Inline the styles for a source file. Simply search for instances of `styleUrls: [...]` and
 * replace with `styles: [...]` (with the content of the file included).
 * @param urlResolver {Function} A resolver that takes a URL and return a path.
 * @param content {string} The source file's content.
 * @return {string} The content with all styles inlined.
 */
function inlineStyle(content, urlResolver) {
  return content.replace(/(")?styleUrls(")?:\s*(\[[\s\S]*?\])/gm,
    (match, quote1, quote2, styleUrls) => {
      console.log(quote1, quote2, styleUrls);

      const urls = eval(styleUrls);
      return `${quote1 || ''}styles${quote2 || ''}: [`
        + urls.map((styleUrl) => {
        
          const styleFile = urlResolver(styleUrl);
          const styleContent = fs.readFileSync(styleFile, 'utf-8');
        
          return `"${shortenContent(styleContent)}"`;
        })
          .join(',\n')
        + ']';
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

module.exports = inlineResourcesFromString;
