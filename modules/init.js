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
	if($tw.node) {
		if(!$tw.modules.titles["$:/plugins/OokTech/Bob/ServerSide.js"]) {
			$tw.Bob.logger.log("The plugin 'joshuafontany/oembed' requires the 'OokTech/Bob' plugin to be installed when running on node.js.");
		}
		try {
			$tw.Bob.oembetter = require("oembetter")();
			var whitelist = $tw.Bob.oembetter.suggestedWhitelist.concat(
				["reddit.com"]
			)
			$tw.Bob.oembetter.whitelist(whitelist);
			var endpoints = $tw.Bob.oembetter.suggestedEndpoints.concat([
				{ domain: 'twitter.com', endpoint: 'https://publish.twitter.com/oembed' },
				{ domain: 'reddit.com', path: /\/r\/[^\/]*\/comments\/[^\/]*\/[^\/]*/,endpoint: 'https://www.reddit.com/oembed' },
			]);
			$tw.Bob.oembetter.endpoints(endpoints);
			$tw.Bob.urls = $tw.Bob.urls || {};
			  
		} catch(e) {
			$tw.Bob.logger.log(e.toString());
			$tw.Bob.logger.log("The plugin 'joshuafontany/oembed' requires the oembetter node package to be installed. Run 'npm install oembetter' in the root of the TiddlyWiki repository, or clone oembetter and run 'npm link' from that directory to create a global link.");
		}
	}
};

})();
