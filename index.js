const through = require('through2');
const inlineResources = require('./inline-resources');
const path = require('path');

const parse = (fileContents, filePath, fileDirname) => {
  const urlResolver = (url) => {
    return path.join(fileDirname, url);
  }

  return inlineResources(fileContents, urlResolver);
}

module.exports = () => {
  return through.obj((file, encoding, callback) => {
    const result = parse(
      file.contents.toString(),
      file.path,
      path.dirname(file.path)
    );

    file.contents = new Buffer(result);

    callback(null, file);
  });
};
