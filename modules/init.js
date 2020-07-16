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
	if($tw.node) var urls = require('url');
	var endpoints = [], regexlist = [], 
	whitelist = JSON.parse($tw.wiki.getTiddlerText("$:/plugins/joshuafontany/oembed/config/whitelist", "[]")),
	providers = JSON.parse($tw.wiki.getTiddlerText("$:/plugins/joshuafontany/oembed/providers/oembed", "[]"));
	try {
		whitelist.forEach(function(domain){
			regexlist.push($tw.utils.regExpEscape(domain));
		});
		for (let p = 0; p < providers.length; p++) {
			const provider = providers[p];
			var testRegExp = new RegExp(regexlist.join("|"));
			if (!provider.provider_url.match(testRegExp)) {
				continue;
			}
			var providerURL = ($tw.node)? urls.parse(provider.provider_url): new URL(provider.provider_url);
			for (let e = 0; e < provider.endpoints.length; e++) {
				const endpoint = provider.endpoints[e];
				if (endpoint.schemes) {
					for (let s = 0; s < endpoint.schemes.length; s++) {
						const scheme = endpoint.schemes[s];
						var schemaURL = ($tw.node)? urls.parse(scheme): new URL(scheme);
						var config = {
							domain: providerURL.hostname,
							endpoint: endpoint.url
						}, path = $tw.utils.wildcardToRegExp(schemaURL.pathname);
						config.path = path;
						endpoints.push(config);
					}
				} else {
					var config = {
						domain: providerURL.hostname,
						endpoint: endpoint.url,
						path: /\//
					};
					endpoints.push(config);
				}
			}
		};
	} catch (error) {
		$tw.Bob.logger.log(error.toString());
	}
	if($tw.node) {
		if(!$tw.modules.titles["$:/plugins/OokTech/Bob/ServerSide.js"]) {
			$tw.Bob.logger.log("The plugin 'joshuafontany/oembed' requires the 'OokTech/Bob' plugin to be installed when running on node.js.");
		}
		try {
			$tw.Bob.oembetter = require("oembetter")();
			$tw.Bob.oembetter.whitelist(whitelist);
			$tw.Bob.oembetter.endpoints(endpoints);
			$tw.Bob.oembetter.after = []; //clear old fb video filter
			$tw.Bob.urls = $tw.Bob.urls || {};
		} catch(e) {
			$tw.Bob.logger.log(e.toString());
			$tw.Bob.logger.log("The plugin 'joshuafontany/oembed' requires the oembetter node package to be installed. Run 'npm install oembetter' in the root of the TiddlyWiki repository, or clone oembetter and run 'npm link' from that directory to create a global link.");
		}
		
	} else {
		$tw.oembed = $tw.oembed || {};
		$tw.oembed.whitelist = whitelist;
		$tw.oembed.endpoints = endpoints;
	}
};

})();
