// see http://www.webdav.org/specs/rfc4918.html
var WebDAV = function(username, password) {
  this._username = username || null;
  this._password = password || null;
  //this._jquery = $;
}
utils.merge(WebDAV.prototype, {
  setUser: function(username, password) {
    this._username = username;
    this._password = password;
  },
  getUserName: function() {
    return this._username;
  },
  getPassword: function() {
    return this._password;
  },
  propFind: function(path) {
    return $.ajax({
      url: path,
      // OPTIONS,GET,HEAD,POST,DELETE,TRACE,PROPFIND,PROPPATCH,COPY,MOVE,LOCK,UNLOCK
      type: 'PROPFIND',
      username: this._username,
      password: this._password,
      headers: {
          "Depth": 1
      }
    });
  },
  /**
   * file API
   */
  find: function(path) {
    return this.propFind(path).then(function (res) {
      return WebDAV.parsePropFind(res);
    });
  },
  loadPath: function(path) {
    return $.ajax({
      url: path,
      type: 'GET',
      username: this._username,
      password: this._password,
      dataType: 'text'
    });
  },
  savePath: function(path, content) {
    if (typeof content === 'string') {
      return $.ajax({
        url: path,
        type: 'PUT',
        username: this._username,
        password: this._password,
        data: content,
        contentType: 'text/plain',
        processData: false
      });
    }
    return $.ajax({
      url: path,
      type: 'PUT',
      username: this._username,
      password: this._password,
      data: content,
      /*headers: {
        "content-length": content.byteLength
      },*/
      processData: false
    });
  },
  deletePath: function(path) {
    return $.ajax({
      url: path,
      type: 'DELETE',
      username: this._username,
      password: this._password,
      processData: false
    });
  },
  mkColl: function(path) {
    return $.ajax({
      url: path,
      type: 'MKCOL',
      username: this._username,
      password: this._password,
      processData: false
    });
  },
  copyPath: function(path, toPath) {
    return $.ajax({
      url: path,
      type: 'COPY',
      username: this._username,
      password: this._password,
      headers: {
        'Depth': 'infinity',
        'Overwrite': 'F',
        'Destination': toPath
      },
      processData: false
    }); // 201 expected
  },
  movePath: function(path, toPath) {
    return $.ajax({
      url: path,
      type: 'MOVE',
      username: this._username,
      password: this._password,
      headers: {
        'Overwrite': 'F',
        'Destination': toPath
      },
      processData: false
    }); // 201 expected
  }
});
WebDAV.parsePropFind = function(res) {
  var responses = res.getElementsByTagNameNS('DAV:', 'response');
  var items = [];
  for (var i = 1; i < responses.length; i++) {
    var response = responses[i];
    var href = utils.getTextContentByTagNameNS(response, 'DAV:', 'href');
    if (href !== null) {
      //console.log('href: "' + href + '"');
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
};

console.log('webdav.js initialized');
