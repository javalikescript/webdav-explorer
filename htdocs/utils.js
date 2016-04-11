var utils = {
  startsWith: function(s, v) {
    return s.lastIndexOf(v, 0) === 0;
  },
  endsWith: function(s, v) {
    return s.indexOf(v, s.length - v.length) !== -1;
  },
  filename: function(p) {
    var i = p.lastIndexOf('/');
    if (i >= 0) {
      return p.substring(i + 1);
    }
    return p;
  },
  dirname: function(p) {
    var i = p.lastIndexOf('/');
    if (i >= 0) {
      return p.substring(0, i + 1);
    }
    return '';
  },
  getTextContentByTagNameNS: function(node, ns, tn) {
    var elements = node.getElementsByTagNameNS(ns, tn);
    if (elements.length >= 1) {
      return elements[0].textContent;
    }
    return null;
  },
  setLocalStorageObject: function(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value, null, ''));
  },
  getLocalStorageObject: function(key, defaultValue) {
    var value = window.localStorage.getItem(key);
    if (value == null) {
      return defaultValue;
    }
    return JSON.parse(value);
  },
  removeLocalStorageObject: function(key, all) {
    if (all) {
      window.localStorage.clear();
    } else {
      window.localStorage.removeItem(key);
    }
  },
  forEachLocalStorageKey: function(fn) {
    for (var i = 0; i < window.localStorage.length; i++) {
      var key = window.localStorage.key(i);
      fn(key);
    }
  },
  windowLocationHash: function(value) {
    if (typeof value == 'undefined') {
      var hash = window.location.hash;
      return hash && hash.length > 1 ? hash.substr(1) : '';
    }
    if (value) {
      window.location.replace(window.location.pathname + '#' + value);
    } else {
      window.location.replace(window.location.pathname + '#');
    }
  }
};
console.log('utils.js initialized');
