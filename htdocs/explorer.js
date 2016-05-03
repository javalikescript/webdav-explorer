
var transitionOppositeMap = {
  'left': 'right',
  'right': 'left',
  'up': 'down',
  'down': 'up'
};
var selectSection = function(fromSection, toSection, transition) {
  transition = transition || 'right';
  var transitionOpposite = transitionOppositeMap[transition];
  fromSection.getNode().addClass('hide-' + transitionOpposite);
  toSection.getNode().removeClass('hide-' + transition);
};

var Section = function(id, transition) {
  this._id = id;
  this._transition = transition || 'right';
  this._node = $('#' + id);
  this._preferences = {};
}
utils.merge(Section.prototype, {
  getId: function() {
    return this._id;
  },
  getNode: function() {
    return this._node;
  },
  getPreferences: function() {
    return this._preferences;
  },
  setPreferences: function(preferences) {
    this._preferences = preferences;
    this.applyPreferences();
  },
  applyPreferences: function() {},
  refresh: function() {},
  open: function(fromSection) {
    this._callerSection = fromSection;
    //console.log('open(): ' + fromSection.getId() + ' -> ' + this.getId());
    selectSection(fromSection, this, this._transition);
    this.refresh();
  },
  close: function() {
    //console.log('close(): ' + this.getId() + ' -> ' + this._callerSection.getId());
    selectSection(this, this._callerSection, transitionOppositeMap[this._transition]);
    return this._callerSection;
  }
});

var DialogSection = function(id) {
  DialogSection.baseConstructor.call(this, id, 'down');
}
utils.inheritsFrom(DialogSection, Section);

var PanelSection = function(id) {
  PanelSection.baseConstructor.call(this, id, 'right');
}
utils.inheritsFrom(PanelSection, Section);
utils.merge(PanelSection.prototype, {
  applyPreferences: function() {
    if (this._preferences.showFooter) {
      this.getNode().addClass('footer');
    } else {
      this.getNode().removeClass('footer');
    }
  },
  toggleOptions: function() {
    this.getNode().toggleClass('footer');
    this._preferences.showFooter = this.getNode().hasClass('footer');
  }
});
var SectionManager = function() {
  this._sections = [];
}
utils.merge(SectionManager.prototype, {
  createDialogSection: function(id) {
    var section = new DialogSection(id);
    this._sections.push(section);
    return section;
  },
  createPanelSection: function(id) {
    var section = new PanelSection(id);
    this._sections.push(section);
    return section;
  },
  setPreferences: function(preferences) {
    for (var i = 0; i < this._sections.length; i++) {
      var section = this._sections[i];
      var id = section.getId();
      if (id in preferences) {
        section.setPreferences(preferences[id]);
      }
    }
  },
  getPreferences: function() {
    var preferences = {};
    for (var i = 0; i < this._sections.length; i++) {
      var section = this._sections[i];
      preferences[section.getId()] = section.getPreferences();
    }
    return preferences;
  },
  getSections: function() {
    return this._sections;
  }
});

var configuration = utils.getLocalStorageObject('explorer_configuration', {
  welcome: true,
  webdavPath: '/wddocs/',
  webdavUser: null,
  webdavPassword: null
});

var rootItem = {
  href: '/wddocs/',
  name: '/',
  directory: true,
  contentLength: 0
};

var editor = null;
var breadcrumbItems = [];
var currentFolderItem = rootItem;
var currentFileItem = null;
var clipboard = null;

var webdavOrigin = window.location.origin;

var webdav = new WebDAV(configuration.webdavUser, configuration.webdavPassword);

var $items = $('#items');

var sectionMgr = new SectionManager();
var welcomeSection = sectionMgr.createPanelSection('welcome');
var folderSection = sectionMgr.createPanelSection('folder');
var fileSection = sectionMgr.createPanelSection('file');
fileSection.refresh = function() {
  this.getNode().find('header h1').text(currentFileItem.name);
  this.getNode().find('footer a[name=file-link]').attr('href', currentFileItem.href);
  this.getNode().find('span[name=file-content-type]').text(currentFileItem.contentType);
  this.getNode().find('span[name=file-creation-date]').text(currentFileItem.creationDate);
  this.getNode().find('span[name=file-last-modified]').text(currentFileItem.lastModified);
  this.getNode().find('span[name=file-content-length]').text(currentFileItem.contentLength);
};
var settingsSection = sectionMgr.createDialogSection('settings');
settingsSection.refresh = function() {
  $('input[name=settings-webdav-path]').val(rootItem.href);
  $('input[name=settings-webdav-user]').val(webdav.getUserName());
  $('input[name=settings-webdav-password]').val(webdav.getPassword());
  $('input[name=settings-show-welcome]').prop('checked', configuration.welcome);
};
var foldernameSection = sectionMgr.createDialogSection('foldername');
foldernameSection.refresh = function() {
  this.getNode().find('header h1').text(currentFolderItem.name);
};
var foldernewSection = sectionMgr.createDialogSection('foldernew');
var filenewSection = sectionMgr.createDialogSection('filenew');
var filenameSection = sectionMgr.createDialogSection('filename');
filenameSection.refresh = function() {
  this.getNode().find('header h1').text(currentFileItem.name);
};
var editorSection = sectionMgr.createPanelSection('editor');
editorSection.refresh = function() {
  initializeEditor();
  this.getNode().find('header h1').text(currentFileItem.name);
  editor.setValue('...', -1);
  webdav.loadPath(currentFileItem.href).done(function (content) {
    editor.setValue(content, -1);
  });
};
var imageSection = sectionMgr.createPanelSection('image');
imageSection.refresh = function() {
  this.getNode().find('img').prop('src', currentFileItem.href);
};
var videoSection = sectionMgr.createPanelSection('video');
videoSection.refresh = function() {
  this.getNode().find('video').prop('src', currentFileItem.href);
};

sectionMgr.setPreferences(utils.getLocalStorageObject('explorer_sections_preferences', {}));


var notify = (function () {
  var $notification = $("#notification");
  var $notificationText = $notification.children('span').first();
  return function(text) {
    $notificationText.text(text);
    $notification.fadeIn('slow').delay(3000).fadeOut('fast', function() {
      $notificationText.text('...');
    });
  };
})();
var initializeEditor = function() {
  if (editor !== null) {
    return;
  }
  editor = ace.edit("editor-content");
  editor.setTheme("ace/theme/eclipse");
  editor.session.setMode("ace/mode/javascript");
  // TODO use configuration property (key, type, value)
  editor.session.setUseWrapMode(true);
  editor.setShowPrintMargin(false);
  editor.renderer.setShowGutter(false);
};
var itemToHtml = function(item) {
  var shortName = item.name.length > 64 ? item.name.substring(0, 64) : item.name;
  var buttons = '<button name="item-open"><i class="fa fa-chevron-right"></i></button>';
  var classes = 'item';
  var icon;
  if (item.directory) {
    classes += ' directory';
    icon = 'fa-folder';
  } else {
    classes += ' file';
    icon = 'fa-file';
  }
  if (utils.startsWith(item.contentType, 'text/')) {
    buttons = '<button name="item-edit"><i class="fa fa-paragraph"></i></button>' + buttons;
  } else if (utils.startsWith(item.contentType, 'image/')) {
    buttons = '<button name="item-image"><i class="fa fa-picture-o"></i></button>' + buttons;
  } else if (utils.startsWith(item.contentType, 'video/')) {
    buttons = '<button name="item-video"><i class="fa fa-film"></i></button>' + buttons;
  }
  return '<li class="' + classes + '" href="' + item.href + '" title="' + item.name
      + '" contentType="' + item.contentType + '" creationDate="' + item.creationDate
      + '" lastModified="' + item.lastModified + '" contentLength="' + item.contentLength + '">'
      + '<i class="fa ' + icon + '"></i> <span class="name">' + shortName + '</span>'
      + '<span class="toolbar">' + buttons + '</span></li>';
};
var itemFromElement = function($item) {
  return {
    href: $item.attr('href'),
    name: $item.children('span.name').first().text(),
    contentType: $item.attr('contentType'),
    creationDate: $item.attr('creationDate'),
    lastModified: $item.attr('lastModified'),
    contentLength: parseInt($item.attr('contentLength'), 10),
    directory: $item.hasClass('directory')
  };
};
var itemSortFn = function(a, b) {
  if (a.directory != b.directory) {
    return a.directory ? -1 : 1;
  }
  if (a.name == b.name) {
    return 0;
  }
  return a.name.toUpperCase() < b.name.toUpperCase() ? -1 : 1;
};

var displayFolderItem = function(folderItem) {
  currentFolderItem = folderItem;
  folderSection.getNode().find('header h1').text(folderItem.name);
  folderSection.getNode().find('footer a[name=folder-link]').attr('href', folderItem.href);
  $items.empty();
  for (var i = 0; i < folderItem.items.length; i++) {
    var item = folderItem.items[i];
    $items.append(itemToHtml(item));
  }
};
var openFolderItem = function(item) {
  return webdav.find(item.href).done(function (items) {
    breadcrumbItems.push(item);
    item.items = items;
    item.items.sort(itemSortFn);
    displayFolderItem(item);
  });
};
var refreshFolder = function() {
  openFolderItem(currentFolderItem).fail(function() {
    notify('Cannot refresh folder');
  });
};
var openRootFolder = function () {
  breadcrumbItems = [];
  return openFolderItem(rootItem);
};
var setRootPath = function(href) {
  rootItem.href = href;
};

var newFile = function(content, name) {
  name = name || 'New file';
  var item = currentFolderItem;
  if (item && item.directory && item.href) {
    var path = item.href + name;
    webdav.savePath(path, content).done(function() {
      refreshFolder();
      /*
      item.items.push({
        href: path,
        name: name,
        directory: false,
        contentLength: content.length
      });
      item.items.sort(itemSortFn);
      displayFolderItem(item);
      */
    });
  }
};

/***************************************************************
 * Section welcome
 ***************************************************************/
$('button[name=welcome-settings]').click(function () {
  settingsSection.open(welcomeSection);
});
$('button[name=welcome-explore]').click(function () {
  folderSection.open(welcomeSection);
});
/***************************************************************
 * Section settings
 ***************************************************************/
$('button[name=settings-hide]').click(function () {
  settingsSection.close();
});
$('button[name=settings-apply]').click(function () {
  rootItem.href = $('input[name=settings-webdav-path]').val();
  var webdavUsername = $('input[name=settings-webdav-user]').val();
  var webdavPassword = $('input[name=settings-webdav-password]').val();
  webdav.setUser(webdavUsername, webdavPassword);
  settingsSection.close();
});
$('button[name=settings-save]').click(function () {
  configuration.webdavPath = $('input[name=settings-webdav-path]').val();
  configuration.webdavUser = $('input[name=settings-webdav-user]').val();
  configuration.webdavPassword = $('input[name=settings-webdav-password]').val();
  configuration.welcome = $('input[name=settings-show-welcome]').prop('checked');
  utils.setLocalStorageObject('explorer_configuration', configuration);
  // section preferences
  utils.setLocalStorageObject('explorer_sections_preferences', sectionMgr.getPreferences());
});
$('button[name=settings-clear]').click(function () {
  utils.removeLocalStorageObject('explorer_configuration');
});

/***************************************************************
 * Section folder
 ***************************************************************/
$("button[name='folder-home']").click(function () {
  openRootFolder().fail(function() {
    notify('Cannot open root folder');
  });
});
$("button[name='folder-refresh']").click(function () {
  refreshFolder();
});
$("button[name='folder-back']").click(function () {
  if (breadcrumbItems.length > 1) {
    breadcrumbItems.pop();
    var item = breadcrumbItems[breadcrumbItems.length - 1];
    displayFolderItem(item);
  } else {
    folderSection.close();
  }
});
$("button[name='folder-show-details']").click(function () {
  folderSection.toggleOptions();
});
$('button[name=file-upload]').click(function () {
  $('#file-input').trigger( "click" );
});
$('#file-input').on('change', function(e) {
  var file = e.target.files[0];
  if (file) {
    //console.log('file name is ' + file.name + ', size is ' + file.size + ', type is ' + file.type);
    var reader = new FileReader();
    reader.onload = function(e) {
      var content = e.target.result;
      newFile(content, file.name);
    };
    if (file.type.indexOf('text/') == 0) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  }
});
$items.click(function (event) {
  var $element = $(event.target);
	var $item = $element.closest('li.item');
	if ($item.length !== 1) {
		return;
	}
  var item = itemFromElement($item);
  if (item.directory) {
    openFolderItem(item).fail(function() {
      notify('Cannot open folder ' + item.name);
    });
		return;
  }
  if ($element.prop('nodeName') == 'I') {
    $element = $element.parent();
  }
  var name = $element.attr('name');
  currentFileItem = item;
  if (name === 'item-edit') {
    editorSection.open(folderSection);
  } else if (name === 'item-image') {
    imageSection.open(folderSection);
  } else if (name === 'item-video') {
    videoSection.open(folderSection);
  } else {
    fileSection.open(folderSection);
  }
});
$('button[name=folder-rename]').click(function () {
  foldernameSection.open(folderSection);
});
$('button[name=folder-new]').click(function () {
  foldernewSection.open(folderSection);
});
$('button[name=file-new]').click(function () {
  filenewSection.open(folderSection);
});
$('button[name=folder-settings]').click(function () {
  settingsSection.open(folderSection);
});

/***************************************************************
 * Section foldername
 ***************************************************************/
$('button[name=foldername-hide]').click(function () {
  foldernameSection.close();
});
$('button[name=foldername-apply]').click(function () {
  var newName = $('input[name=foldername-input]').val();
  if (! newName) {
    console.log('newName is "' + newName + '"');
    notify('Enter a valid name');
    return;
  }
  var item = currentFolderItem;
  if (item && (item.directory) && item.href) {
    var newHRef = item.href + encodeURIComponent(newName);
    webdav.movePath(item.href, webdavOrigin + newHRef).done(function () {
      notify('folder ' + newName + ' renamed');
      refreshFolder();
    });
  }
  foldernameSection.close();
});

/***************************************************************
 * Section foldernew
 ***************************************************************/
$('button[name=foldernew-hide]').click(function () {
  foldernewSection.close();
});
$('button[name=foldernew-apply]').click(function () {
  var newName = $('input[name=foldernew-input]').val();
  if (! newName) {
    console.log('newName is "' + newName + '"');
    notify('Enter a valid name');
    return;
  }
  //console.log('new folder "' + newName + '"');
  var item = currentFolderItem;
  if (item && (item.directory) && item.href) {
    var newHRef = item.href + encodeURIComponent(newName);
    webdav.mkColl(newHRef).done(function () {
      notify('folder ' + newName + ' created');
      refreshFolder();
    });
  }
  foldernewSection.close();
});

/***************************************************************
 * Section filenew
 ***************************************************************/
$('button[name=filenew-hide]').click(function () {
  filenewSection.close();
});
$('button[name=filenew-apply]').click(function () {
  var newName = $('input[name=filenew-input]').val();
  if (! newName) {
    console.log('newName is "' + newName + '"');
    notify('Enter a valid name');
    return;
  }
  newFile('', newName);
  filenewSection.close();
});

/***************************************************************
 * Section file
 ***************************************************************/
$("button[name='file-show-details']").click(function () {
  fileSection.toggleOptions();
});
$('button[name=file-hide]').click(function () {
  fileSection.close();
});
$("button[name='file-show-editor']").click(function () {
  editorSection.open(fileSection);
});
$("button[name='file-show-image']").click(function () {
  imageSection.open(fileSection);
});
$("button[name='file-show-video']").click(function () {
  videoSection.open(fileSection);
});
$('button[name=file-copy]').click(function () {
  clipboard = currentFileItem;
  notify('File put in the clipboard');
});
$('button[name=file-paste]').click(function () {
  if (clipboard !== null) {
    var item = clipboard;
    clipboard = null;
    notify('Paste file ' + item.name);
  } else {
    notify('The clipboard is empty');
  }
});
$('button[name=file-delete]').click(function () {
  var item = currentFileItem;
  if (item && (! item.directory) && item.href) {
    webdav.deletePath(item.href).done(function () {
      notify('file ' + item.name + ' deleted');
      refreshFolder();
    });
  }
});
$('button[name=file-rename]').click(function () {
  filenameSection.open(fileSection);
});
$('button[name=file-download]').click(function () {
  webdav.loadPath(currentFileItem.href).done(function (content) {
    var blob = new Blob([content], {type : 'text/plain'});
    window.open(URL.createObjectURL(blob));
  });
});

/***************************************************************
 * Section filename
 ***************************************************************/
$('button[name=filename-hide]').click(function () {
  filenameSection.close();
});
$('button[name=filename-apply]').click(function () {
  var newName = $('input[name=filename-input]').val();
  if (! newName) {
    console.log('newName is "' + newName + '"');
    notify('Enter a valid name');
    return;
  }
  var item = currentFileItem;
  if (item && (! item.directory) && item.href) {
    var newHRef = utils.dirname(item.href) + encodeURIComponent(newName);
    webdav.movePath(item.href, webdavOrigin + newHRef).done(function () {
      notify('file ' + item.name + ' renamed');
      refreshFolder();
    });
  }
  filenameSection.close();
});

/***************************************************************
 * Section editor
 ***************************************************************/
$("button[name='editor-show-details']").click(function () {
  editorSection.toggleOptions();
});
$('button[name=editor-hide]').click(function () {
  editorSection.close();
});
$("button[name='editor-wrap-lines']").click(function () {
  var useWrapMode = editor.session.getUseWrapMode();
  editor.session.setUseWrapMode(! useWrapMode);
});
$('button[name=editor-reload]').click(function () {
  editor.setValue('...', -1);
  webdav.loadPath(currentFileItem.href).done(function (content) {
    editor.setValue(content, -1);
  });
});
$('button[name=editor-save]').click(function () {
  var content = editor.getValue();
  webdav.savePath(currentFileItem.href, content).done(function () {
    notify('File saved');
  });
});
/***************************************************************
 * Section image
 ***************************************************************/
$('button[name=image-hide]').click(function () {
  imageSection.close();
});
/***************************************************************
 * Section video
 ***************************************************************/
$('button[name=video-hide]').click(function () {
  videoSection.close();
});

console.log('explorer.js initialized');
