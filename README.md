# webdav-explorer
Small WebDAV File Explorer

The WebDAV file explorer provides a light and simple way to access your documents anywhere. It also embbeds a text file editor allowing note taking.

## Get Started

The htdocs directory contains the files to expose by your Apache HTTP server.

You shall add the required dependencies:
* Font-Awesome https://fortawesome.github.io/Font-Awesome/
* jQuery http://jquery.com/
* Ace https://ace.c9.io/

You shall configure your Apache HTTP server to support WebDAV requests. Consult the configuration example for more details.
Using HTTPS is highly recommended as the current version use the basic authentication.