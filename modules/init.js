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
	var endpoints = [],
	whitelist =  $tw.wiki.getTiddlerList("$:/config/plugins/joshuafontany/oembed/whitelist"),
	providerlist =  $tw.wiki.getTiddlerList("$:/config/plugins/joshuafontany/oembed/whitelist", "oembed-providers"),
	providers = JSON.parse($tw.wiki.getTiddlerText("$:/plugins/joshuafontany/oembed/providers/oembed", "[]"));
	try {
		for (let p = 0; p < providers.length; p++) {
			const provider = providers[p];
			if(!providerlist.includes(provider["provider_name"])){
				providerlist.push(provider["provider_name"]);
			}
			var testRegExp = new RegExp(whitelist.map($tw.utils.regExpEscape).join("|"));
			if (!provider.provider_name.match(testRegExp)) {
				continue;
			}
			for (let e = 0; e < provider.endpoints.length; e++) {
				const endpoint = provider.endpoints[e];
				if (endpoint.schemes) {
					for (let s = 0; s < endpoint.schemes.length; s++) {
						const scheme = endpoint.schemes[s];
						var cleanScheme = scheme.replace(/(?<=http:|https:)(\/\/\*\.)/, "\/\/");
						var schemeURL = ($tw.node)? urls.parse(cleanScheme): new URL(cleanScheme);
						var domain = schemeURL.hostname.match(/(?<hostname>(\w+\.)*)(?<domainname>(\w+\.\w+))/)[0] || schemeURL.host.match(/(?<hostname>(\w+\.)*)(?<domainname>(\w+\.\w+))/)[0] ||schemeURL.hostname,
							path = $tw.utils.wildcardToRegExp(cleanScheme.split(domain)[1]);
						var config = {
							domain: domain,
							path: path,
							endpoint: endpoint.url							
						}
						var check = endpoints.some(function(e) {
							return (e.domain +"" == this.domain +""
								&& e.path +"" == this.path +""
							)}, config);
						if(!check) endpoints.push(config);
					}
				} else {
					var cleanScheme = provider["provider_url"].replace(/(?<=http:|https:)(\/\/\*\.)/, "\/\/");
					var schemeURL = ($tw.node)? urls.parse(cleanScheme): new URL(cleanScheme);
					var domain = schemeURL.hostname.match(/(?<hostname>(\w+\.)*)(?<domainname>(\w+\.\w+))/)[0] || schemeURL.host.match(/(?<hostname>(\w+\.)*)(?<domainname>(\w+\.\w+))/)[0] ||schemeURL.hostname;
					var config = {
						domain: domain,
						path: /\//,
						endpoint: endpoint.url							
					}
					var check = endpoints.some(function(e) {
						return (e.domain +"" == this.domain +""
							&& e.path +"" == this.path +""
						)}, config);
					if(!check) endpoints.push(config);
				}
			}
		};
	} catch (error) {
		if ($tw.Bob.logger) {
			$tw.Bob.logger.log(error.toString());			
		} else {
			console.log(error.toString());
		}
	}
	 $tw.wiki.setText("$:/config/plugins/joshuafontany/oembed/whitelist","oembed-providers",undefined,$tw.utils.stringifyList(providerlist));
	if($tw.node) {
		if(!$tw.modules.titles["$:/plugins/OokTech/Bob/ServerSide.js"]) {
			$tw.Bob.logger.log("The plugin 'joshuafontany/oembed' requires the 'OokTech/Bob' plugin to be installed when running on node.js.");
		} else { 
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
		}
	} else {
		$tw.oembed = $tw.oembed || {};
		$tw.oembed.whitelist = whitelist;
		$tw.oembed.endpoints = endpoints;
	}
};

})();
