ReadMe
======

Oembed for TiddlyWiki5, Version 0.1.1
=====================================

Manually or automatically generate embeddable html from user supplied urls. This plugin requires the `tiddlywiki/consent-banner` core plugin installed in the wiki, and that the user has accepted cookies in order to render the embeddable html code.

For a server to automatically generate the API requests, this plugin requires running TiddlyWiki on Node.js with the Bob plugin (or through Bob.exe). When run with Bob it also requires installing the oembetter npm package from within your TiddlyWiki5 directory (or cloning the 'oembetter' package locally and creating a global link by using `npm link` in the oembetter directory and `npm link oembetter` in the tiddlywiki5 directory).

If Bob and oembetter are not available, the plugin will prompt the user with a form to call the correct API. If this is not available (for example, Facebook and Instagram now require all API requests to be "token authenticated"), the user can visit the website and enter the website suppied "embeddable HTML" code.  This makes the user into the *server* ;) .

Docs & Using Oembed
============

Examples and further documentation is found in the [Using Oembed](https://joshuafontany.github.io/TW5-Oembed#Using%20Oembed) tiddler in the demo wiki:

<https://joshuafontany.github.io/TW5-Oembed/>

Installation
============

Node Install: Clone the GitHub repository into a `./joshuafontany/oembed` directory within your TiddlyWiki Plugins path, and install the required consent-banner plugin from the core TW repository by listing both in your wiki's `tiddlywiki.info` file.

Stand-alone Install: Click through to the Example Wioki and drag and drop both of the following plugins into your wiki:

-   [$:/plugins/joshuafontany/oembed](https://joshuafontany.github.io/TW5-Oembed#%24%3A%2Fplugins%2Fjoshuafontany%2Foembed)
-   [$:/plugins/tiddlywiki/consent-banner](https://joshuafontany.github.io/TW5-Oembed#%24%3A%2Fplugins%2Ftiddlywiki%2Fconsent-banner)