/*
 * see http://www.webdav.org/specs/rfc4918.html
 */
var webdav = {
  parsePropFind: function(res) {
    var responses = res.getElementsByTagNameNS('DAV:', 'response');
    var items = [];
    for (var i = 1; i < responses.length; i++) {
      var response = responses[i];
      var href = utils.getTextContentByTagNameNS(response, 'DAV:', 'href');
      if (href !== null) {
        console.log('href: "' + href + '"');
        var directory = utils.endsWith(href, '/');
        items.push({
          href: href,
          name: decodeURIComponent(utils.filename(directory ? href.substring(0, href.length - 1) : href)),
          directory: directory,
          contentType: utils.getTextContentByTagNameNS(response, 'DAV:', 'getcontenttype'),
          creationDate: utils.getTextContentByTagNameNS(response, 'DAV:', 'creationdate'),
          lastModified: utils.getTextContentByTagNameNS(response, 'DAV:', 'getlastmodified'),
          contentLength: directory ? 0 : utils.getTextContentByTagNameNS(response, 'DAV:', 'getcontentlength')
        });
      }
    }
    return items;
  },
  propFind: function(path, username, password) {
    return $.ajax({
      url: path,
      // OPTIONS,GET,HEAD,POST,DELETE,TRACE,PROPFIND,PROPPATCH,COPY,MOVE,LOCK,UNLOCK
      type: 'PROPFIND',
      username: username,
      password: password,
      headers: {
          "Depth": 1
      }
    });
  },
  /**
   * file API
   */
  find: function(path, username, password) {
    return webdav.propFind(path, username, password).then(function (res) {
      return webdav.parsePropFind(res);
    });
  },
  loadPath: function(path, username, password) {
    return $.ajax({
      url: path,
      type: 'GET',
      username: username,
      password: password,
      dataType: 'text'
    });
  },
  savePath: function(path, content, username, password) {
    return $.ajax({
      url: path,
      type: 'PUT',
      username: username,
      password: password,
      data: content,
      contentType: 'text/plain',
      processData: false
    });
  },
  deletePath: function(path, username, password) {
    return $.ajax({
      url: path,
      type: 'DELETE',
      username: username,
      password: password,
      processData: false
    });
  },
  mkColl: function(path, username, password) {
    return $.ajax({
      url: path,
      type: 'MKCOL',
      username: username,
      password: password,
      processData: false
    });
  },
  copyPath: function(path, toPath, username, password) {
    return $.ajax({
      url: path,
      type: 'COPY',
      username: username,
      password: password,
      headers: {
        'Depth': 'infinity',
        'Overwrite': 'F',
        'Destination': toPath
      },
      processData: false
    }); // 201 expected
  },
  movePath: function(path, toPath, username, password) {
    return $.ajax({
      url: path,
      type: 'MOVE',
      username: username,
      password: password,
      headers: {
        'Overwrite': 'F',
        'Destination': toPath
      },
      processData: false
    }); // 201 expected
  }
};
console.log('webdav.js initialized');
