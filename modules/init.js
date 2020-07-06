/*\
title: $:/plugins/joshuafontany/oembed/init.js
type: application/javascript
module-type: startup

oembetter initialisation
https://github.com/apostrophecms/oembetter

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "oembed-init";
exports.before = ["startup"];
exports.synchronous = true;

exports.startup = function() {
	var logger = new $tw.utils.Logger("oembed");
	if($tw.node) {
		if(!$tw.modules.titles["$:/plugins/OokTech/Bob/ServerSide.js"]) {
			$tw.Bob.logger.log("The plugin 'joshuafontany/oembed' requires the 'OokTech/Bob' plugin to be installed when running on node.js.");
		}
		try {
			$tw.Bob.oembetter = require("oembetter");
		} catch(e) {
			$tw.Bob.logger.log("The plugin 'joshuafontany/oembed' requires the oembetter node package to be installed. Run 'npm install oembetter' in the root of the TiddlyWiki repository, or clone oembetter and run 'npm link' from that directory to create a global link.");
		}
	}
};

})();
