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
  $tw.nodeMessageHandlers = $tw.nodeMessageHandlers || {};
  $tw.Bob.Shared = require('$:/plugins/OokTech/Bob/SharedFunctions.js');
  $tw.Bob.oembetter = $tw.Bob.oembetter || {};
    /*
    This handles oembed messages sent from the browser.

    The mesage should contain all parameters as uri-component-encoded strings.
    The [embed[]] | <$embed/> widget will encode these strings for you.
  */
 $tw.nodeMessageHandlers.oembed = function(data) {
  // Acknowledge the message.
  $tw.Bob.Shared.sendAck(data);
  // Make sure there is actually a urlEncoded sent
  if(data.url) {
    const prefix = data.wiki || '';
    $tw.Bob.logger.log("oembed query:" + url);
    $tw.Bob.oembetter.fetch(url, {maxwidth: message.maxWidth}, function(err, response) {
      if (!err) {
        $tw.Bob.logger.log("oembed type:" + response.type.toString());
        $tw.Bob.logger.log("oembed success:" + response.success.toString());
        var responseTiddler = $tw.wiki.getModificationFields();
        responseTiddler.title = message.dataTitle;
        // Parse query...
        try {
          responseTiddler.text = JSON.stringify(response, null, 2);
          $tw.syncadaptor.saveTiddler(new $tw.Tiddler(responseTiddler), prefix);
          $tw.Bob.Wikis[prefix].modified = true;
        } catch (error) {
          $tw.Bob.logger.log("Invalid JSON response to oembed request " + message.dataTitle);
          $tw.Bob.logger.log(error.toString());
        } 
        // thumbnail_url points to an image
        //$tw.Bob.logger.log(response.thumbnail_url);
      }
      });  
  }
}

}
})();
