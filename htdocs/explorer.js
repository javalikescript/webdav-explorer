
var configuration = utils.getLocalStorageObject('explorer_configuration', {
  welcome: true,
  webdavPath: '/wddocs/',
  webdavUser: null,
  webdavPassword: null
});
var editor = null;
var breadcrumbItems = [];
var currentFolderItem = null;
var currentFileItem = null;
var clipboard = null;

var webdavOrigin = window.location.origin;
var webdavPath = configuration.webdavPath;
var webdavUser = configuration.webdavUser;
var webdavPassword = configuration.webdavPassword;

var $items = $('#items');
var $welcomeSection = $('#welcome');
var $settingsSection = $('#settings');
var $folderSection = $('#folder');
var $foldernameSection = $('#foldername');
var $foldernewSection = $('#foldernew');
var $filenewSection = $('#filenew');
var $fileSection = $('#file');
var $filenameSection = $('#filename');
var $editorSection = $('#editor');
var $imageSection = $('#image');

var $currentSection = $welcomeSection;
var $editorPreviousSection = null;
var $imagePreviousSection = null;
var $settingsPreviousSection = null;

var rootItem = {
  href: '/wddocs/',
  name: '/',
  directory: true,
  contentLength: 0
};

var notify = (function () {
  var $notification = $("#notification");
  var $notificationText = $notification.children('span').first();
  return function(text) {
    $notificationText.text(text);
    $notification.fadeIn('slow').delay(1500).fadeOut('fast', function() {
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
  var shortName = item.name.length > 18 ? item.name.substring(0, 18) : item.name;
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
  $folderSection.find('header h1').text(folderItem.name);
  $folderSection.find('footer a[name=folder-link]').attr('href', folderItem.href);
  $items.empty();
  for (var i = 0; i < folderItem.items.length; i++) {
    var item = folderItem.items[i];
    $items.append(itemToHtml(item));
  }
};
var openFolderItem = function(item) {
  webdav.find(item.href, webdavUser, webdavPassword).done(function (items) {
    breadcrumbItems.push(item);
    item.items = items;
    item.items.sort(itemSortFn);
    displayFolderItem(item);
  }).fail(function() {
    notify('Cannot open folder ' + item.name);
  });
};
var refreshFolder = function() {
  openFolderItem(currentFolderItem);
};
var openRootFolder = function () {
  breadcrumbItems = [];
  openFolderItem(rootItem);
};
var setRootPath = function(href) {
  rootItem.href = href;
};
var transitionOppositeMap = {
  'left': 'right',
  'right': 'left',
  'up': 'down',
  'down': 'up'
};
var selectSection = function($section, transition) {
  transition = transition || 'right';
  var transitionOpposite = transitionOppositeMap[transition];
  $currentSection.addClass('hide-' + transitionOpposite);
  $section.removeClass('hide-' + transition);
  $currentSection = $section;
};

var newFile = function(content, name) {
  name = name || 'New file';
  var item = currentFolderItem;
  if (item && item.directory && item.href) {
    var path = item.href + name;
    webdav.savePath(path, content, webdavUser, webdavPassword).done(function() {
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
 * Section helpers
 * TODO Create class
 ***************************************************************/
var openFileItem = function() {
  $fileSection.find('header h1').text(currentFileItem.name);
  $fileSection.find('footer a[name=file-link]').attr('href', currentFileItem.href);
  $fileSection.find('span[name=file-content-type]').text(currentFileItem.contentType);
  $fileSection.find('span[name=file-creation-date]').text(currentFileItem.creationDate);
  $fileSection.find('span[name=file-last-modified]').text(currentFileItem.lastModified);
  $fileSection.find('span[name=file-content-length]').text(currentFileItem.contentLength);
  selectSection($fileSection);
};
var closeEditor = function() {
  selectSection($editorPreviousSection, 'left');
};
var openEditor = function() {
  initializeEditor();
  $editorSection.find('header h1').text(currentFileItem.name);
  editor.setValue('...', -1);
  webdav.loadPath(currentFileItem.href, webdavUser, webdavPassword).done(function (content) {
    editor.setValue(content, -1);
  });
  $editorPreviousSection = $currentSection;
  selectSection($editorSection);
};
var closeSettings = function(apply) {
  if (apply) {
    webdavPath = $('input[name=settings-webdav-path]').val();
    webdavUser = $('input[name=settings-webdav-user]').val();
    webdavPassword = $('input[name=settings-webdav-password]').val();
    //setRootPath(webdavPath);
  }
  selectSection($settingsPreviousSection, 'up');
};
var openSettings = function() {
  $settingsPreviousSection = $currentSection;
  $('input[name=settings-webdav-path]').val(webdavPath);
  $('input[name=settings-webdav-user]').val(webdavUser);
  $('input[name=settings-webdav-password]').val(webdavPassword);
  $('input[name=settings-show-welcome]').prop('checked', configuration.welcome);
  selectSection($settingsSection, 'down');
};
var closeImage = function() {
  selectSection($imagePreviousSection, 'left');
};
var openImage = function() {
  $imageSection.find('img').prop('src', currentFileItem.href);
  $imagePreviousSection = $currentSection;
  selectSection($imageSection);
};

/***************************************************************
 * Section welcome
 ***************************************************************/
/*$('button[name=settings]').click(function () {
  openSettings();
});*/
$('button[name=welcome-explore]').click(function () {
  selectSection($folderSection);
});
/***************************************************************
 * Section settings
 ***************************************************************/
$('button[name=settings-hide]').click(function () {
  closeSettings(false);
});
$('button[name=settings-apply]').click(function () {
  closeSettings(true);
});
$('button[name=settings-save]').click(function () {
  webdavPath = $('input[name=settings-webdav-path]').val();
  webdavUser = $('input[name=settings-webdav-user]').val();
  webdavPassword = $('input[name=settings-webdav-password]').val();
  configuration.webdavPath = webdavPath;
  configuration.webdavUser = webdavUser;
  configuration.webdavPassword = webdavPassword;
  configuration.welcome = $('input[name=settings-show-welcome]').prop('checked');
  utils.setLocalStorageObject('explorer_configuration', configuration);
});
$('button[name=settings-clear]').click(function () {
  utils.removeLocalStorageObject('explorer_configuration');
});

/***************************************************************
 * Section folder
 ***************************************************************/
$("button[name='folder-home']").click(openRootFolder);
$("button[name='folder-refresh']").click(function () {
  /*var item = breadcrumbItems.pop();
  openFolderItem(item);*/
  refreshFolder();
});
$("button[name='folder-back']").click(function () {
  if (breadcrumbItems.length > 1) {
    breadcrumbItems.pop();
    var item = breadcrumbItems[breadcrumbItems.length - 1];
    displayFolderItem(item);
  } else {
    selectSection($welcomeSection, 'left');
  }
});
$("button[name='folder-show-details']").click(function () {
  $currentSection.toggleClass('footer');
});
$('button[name=file-upload]').click(function () {
  $('#file-input').trigger( "click" );
});
$('#file-input').on('change', function(e) {
  var file = e.target.files[0];
  if (file) {
    var reader = new FileReader();
    reader.onload = function(e) {
      var content = e.target.result;
      newFile(content, 'uploaded_file');
    };
    reader.readAsText(file);
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
    openFolderItem(item);
		return;
  }
  var name = $element.attr('name');
  currentFileItem = item;
  if (name === 'item-edit') {
    openEditor();
  } else if (name === 'item-image') {
    openImage();
  } else {
    openFileItem();
  }
});
$('button[name=folder-rename]').click(function () {
  $foldernameSection.find('header h1').text(currentFolderItem.name);
  selectSection($foldernameSection, 'down');
});
$('button[name=folder-new]').click(function () {
  selectSection($foldernewSection, 'down');
});
$('button[name=file-new]').click(function () {
  selectSection($filenewSection, 'down');
});
$('button[name=settings]').click(function () {
  openSettings();
});

/***************************************************************
 * Section foldername
 ***************************************************************/
$('button[name=foldername-hide]').click(function () {
  selectSection($folderSection, 'up');
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
    webdav.movePath(item.href, webdavOrigin + newHRef, webdavUser, webdavPassword).done(function () {
      notify('folder ' + newName + ' renamed');
      refreshFolder();
    });
  }
  selectSection($folderSection, 'up');
});

/***************************************************************
 * Section foldernew
 ***************************************************************/
$('button[name=foldernew-hide]').click(function () {
  selectSection($folderSection, 'up');
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
    webdav.mkColl(newHRef, webdavUser, webdavPassword).done(function () {
      notify('folder ' + newName + ' created');
      refreshFolder();
    });
  }
  selectSection($folderSection, 'up');
});

/***************************************************************
 * Section filenew
 ***************************************************************/
$('button[name=filenew-hide]').click(function () {
  selectSection($folderSection, 'up');
});
$('button[name=filenew-apply]').click(function () {
  var newName = $('input[name=filenew-input]').val();
  if (! newName) {
    console.log('newName is "' + newName + '"');
    notify('Enter a valid name');
    return;
  }
  newFile('', newName);
  selectSection($folderSection, 'up');
});

/***************************************************************
 * Section file
 ***************************************************************/
$("button[name='file-show-details']").click(function () {
  $currentSection.toggleClass('footer');
});
$('button[name=file-hide]').click(function () {
  selectSection($folderSection, 'left');
});
$("button[name='file-show-editor']").click(function () {
  openEditor();
});
$("button[name='file-show-image']").click(function () {
  openImage();
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
    webdav.deletePath(item.href, webdavUser, webdavPassword).done(function () {
      notify('file ' + item.name + ' deleted');
      refreshFolder();
    });
  }
});
$('button[name=file-rename]').click(function () {
  $filenameSection.find('header h1').text(currentFileItem.name);
  selectSection($filenameSection, 'down');
});
$('button[name=file-download]').click(function () {
  webdav.loadPath(currentFileItem.href, webdavUser, webdavPassword).done(function (content) {
    var blob = new Blob([content], {type : 'text/plain'});
    window.open(URL.createObjectURL(blob));
  });
});

/***************************************************************
 * Section filename
 ***************************************************************/
$('button[name=filename-hide]').click(function () {
  selectSection($fileSection, 'up');
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
    webdav.movePath(item.href, webdavOrigin + newHRef, webdavUser, webdavPassword).done(function () {
      notify('file ' + item.name + ' renamed');
      refreshFolder();
    });
  }
  selectSection($fileSection, 'up');
});

/***************************************************************
 * Section editor
 ***************************************************************/
$("button[name='editor-show-details']").click(function () {
  $currentSection.toggleClass('footer');
});
$('button[name=editor-hide]').click(function () {
  closeEditor();
});
$("button[name='editor-wrap-lines']").click(function () {
  var useWrapMode = editor.session.getUseWrapMode();
  editor.session.setUseWrapMode(! useWrapMode);
});
$('button[name=editor-reload]').click(function () {
  editor.setValue('...', -1);
  webdav.loadPath(currentFileItem.href, webdavUser, webdavPassword).done(function (content) {
    editor.setValue(content, -1);
  });
});
$('button[name=editor-save]').click(function () {
  var content = editor.getValue();
  webdav.savePath(currentFileItem.href, content, webdavUser, webdavPassword).done(function () {
    notify('File saved');
  });
});
/***************************************************************
 * Section image
 ***************************************************************/
$('button[name=image-hide]').click(function () {
  closeImage();
});

console.log('explorer.js initialized');
