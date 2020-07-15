/*\
title: $:/plugins/joshuafontany/oembed/EmbedMessageHandlers.js
type: application/javascript
module-type: startup

These are the embed message handler functions for the web socket servers. Use this file
as a template for extending the web socket funcitons.

This handles embed messages sent to the node process.
\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.platforms = ["node"];

if($tw.node) {
  //const oembetter = require("oembetter")();
  $tw.nodeMessageHandlers = $tw.nodeMessageHandlers || {};
  $tw.Bob.Shared = require('$:/plugins/OokTech/Bob/SharedFunctions.js');
    /*
    This handles oembed messages sent from the browser.

    The mesage should contain all parameters as uri-component-encoded strings.
    The [embed[]] | <$embed/> widget will call oembetter to encode these strings for you.
  */
 $tw.nodeMessageHandlers.oembed = function(data) {
  // Acknowledge the message.
  $tw.Bob.Shared.sendAck(data);
  // Make sure there is actually a urlEncoded sent
  const prefix = data.wiki || '';
  $tw.Bob.urls[prefix] = $tw.Bob.urls[prefix] || [];
  var options = {};
  if (data.url && $tw.Bob.urls[prefix].includes(data.url)) $tw.Bob.logger.log("oembed url already enqueued: "+data.url);
  if(data.url && !$tw.Bob.urls[prefix].includes(data.url)) {
    $tw.Bob.urls[prefix].push(data.url);
    $tw.Bob.logger.log("oembed query: " + data.url);
    if (data.maxWidth) options.maxwidth = data.maxWidth;
    //Provider specific options
    //Fetch
    $tw.Bob.oembetter.fetch(data.url, options, function(err, response) {
      var success = false;
      var responseTiddler = $tw.wiki.getModificationFields();
      responseTiddler.title = data.dataTitle;
      if (!err) {
        if (response.success) success = response.success;
        else success = (response.type)? true : false;
        $tw.Bob.logger.log("oembed success: " + success);
        $tw.Bob.logger.log("oembed type: " + response.type.toString());
        // Parse query...
        try {
          responseTiddler.type = "application/json";
          responseTiddler.text = JSON.stringify(response, null, 2);
          $tw.syncadaptor.saveTiddler(new $tw.Tiddler(responseTiddler), prefix);
        } catch (error) {
          $tw.Bob.logger.log("Invalid JSON response to oembed request " + data.dataTitle);
          $tw.Bob.logger.log(error.toString());
          var responseError = {success: success, error: error, response: response};
          responseTiddler.type = "application/json";
          responseTiddler.text = JSON.stringify(responseError, null, 2);
          $tw.syncadaptor.saveTiddler(new $tw.Tiddler(responseTiddler), prefix);
        } 
        // thumbnail_url points to an image
        //$tw.Bob.logger.log(response.thumbnail_url);
      } else {
        $tw.Bob.logger.log("oembed error:" + err.toString());
        var responseError = {success: success, error: error, response: response};
        responseTiddler.type = "application/json";
        responseTiddler.text = JSON.stringify(response, null, 2);
        $tw.syncadaptor.saveTiddler(new $tw.Tiddler(responseTiddler), prefix)
      }
      $tw.Bob.urls[prefix].splice($tw.Bob.urls[prefix].indexOf(data.url), 1)
      return success;
      });  
  }
}

}
})();
