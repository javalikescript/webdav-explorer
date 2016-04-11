# WebDAV Explorer

Web-based Distributed Authoring and Versioning (WebDAV) allows creating, moving,
copying, and deleting resources and collections on a remote web server.
See http://www.webdav.org/specs/rfc4918.html

## What is WebDAV Explorer?

The WebDAV file explorer provides a light and simple way to access your documents anywhere.
It provides a mobile friendly user interface for browsing files exposed through WebDAV.
It also embedds a text file editor allowing note taking.

## How it looks like?

See [here](http://javalikescript.github.io/webdav-explorer/).

## What are the features?

* Browse folders and files
* Create, rename and delete files
* Make, rename and remove directories
* Basic text file editor
* Basic image viewer

## How to use it?

The htdocs directory contains the files to expose by your Apache HTTP server.

You shall add the required dependencies:
* [Font-Awesome](http://fontawesome.io/)
* [jQuery](http://jquery.com/)
* [Ace](https://ace.c9.io/)

You shall configure your Apache HTTP server to support WebDAV requests.
See https://httpd.apache.org/docs/2.2/mod/mod_dav.html
You shall enable WebDAV on the directory that you want to share.
Consult the configuration example for more details.
Please note by doing so, the files are not only available by WebDAV Explorer but other tools.

## Disclaimer

This application is provided as-is and may contains bugs.
Using this application may result in data loss, security vulnerability and other unpleasant situations.

Exposing and manipulating documents is dangerous.
Do not expose important documents. Make sure that you have a copy of each document.
Secure your web server using at least Basic Authentication over HTTPS.
