/*\
title: $:/plugins/joshuafontany/oembed/modules/widgets/embed.js
type: application/javascript
module-type: widget

The embed widget displays an oembed html block referenced with an external Url or with a local tiddler title. The tiddler should have a `url` field with the resource to embed.

```
<$embed tiddler="TiddlerTitle" maxwidth="500" class="classnames" />

<$embed url="https://example.com/post12345" maxwidth={{$:/themes/tiddlywiki/vanilla/metrics/tiddlerwidth}} class="classnames" />
```

The url source can be the title of an existing tiddler or the url of an external resource. Passing a url attribute to the widget will override the tiddler's url.

Embed widgets always generate an HTML `<div>` tag to host the content.

If the user has not consented to cookies, the div will display the blocked-embed-message (see $:/plugins/tiddlywiki/consent-banner/readme).

If the user has accepted cookies, it will attempt to display the HTML code located in the `$:/oembed/url/$uri-component-encoded-url$` json tiddler for the URL.

If this data tiddler does not exist, the widget will fire a web-socket message to the local Bob server requesting an oembed api call. Once the oembed state tiddler for the requested Url contains json data, it is automatically updated as the div's content by TW's refresh mechanism.

The maxwidth attribute is interpreted as a number of pixels, and does not need to include the "px" suffix. The class attribute can be used to give custom classes to the div, added to the base "tc-embedded-content" class.

\*/
(function(){

  /*jslint node: true, browser: true */
  /*global $tw: false */
  "use strict";
  
  var Widget = require("$:/core/modules/widgets/widget.js").widget;
  
  var EmbedWidget = function(parseTreeNode,options) {
    this.initialise(parseTreeNode,options);
  };
  
  /*
  Inherit from the base widget class
  */
  EmbedWidget.prototype = new Widget();
  
  /*
  Render this widget into the DOM
  */
  EmbedWidget.prototype.render = function(parent,nextSibling) {
    this.parentDomNode = parent;
    this.computeAttributes();
    this.execute();
    var tag = "div", classes = (this.embedClass.length > 0) ?
    "tc-embedded-content "+this.embedClass : "tc-embedded-content" ;
     // Default template is an external link to the url
    var templateTree = [{type: "element", tag: tag, attributes: {
       classes: {type: "string", value: classes}
      }, children: [
        {
          type: "element",
          tag: "a",
          attributes: {
            href: {type: "string", value: this.target},
            "class": {type: "string", value: "tc-tiddlylink-external"},
            target: {type: "string", value: "_blank"},
            rel: {type: "string", value: "noopener noreferrer"}
          },
          children: [{
            type: "text", text: this.target
          }]
        }
      ]}];
    // component encode the url
    this.dataTitle = "$:/oembed/url/"+encodeURIComponent(this.target);
    // Get the cookies permissions from tiddlywiki/consent-banner
    var blockEmbeds = this.getVariable("tv-block-embedded-content", "yes");
    if (blockEmbeds === "yes") {
      // blocked-embed-message templateTree
      var blockedEmbedMessage = 'Blocked embedded content from<br/><a href=<<url>> class="tc-tiddlylink-external" target="_blank" rel="noopener noreferrer" tooltip="Accept cookies to unblock"><$text text=<<url>>/></a>"'
		  templateTree[0].children = [{type: "text", text: blockedEmbedMessage}];
    } else {
      // get the data tiddler
      var dataTiddler = this.wiki.tiddlerExists(this.dataTitle);
      if (!dataTiddler && $tw.Bob.Shared) {
        // Create the empty message object
        let message = {};
        // Add in the message type and param, if they exist
        message.type = "oembed";
        //message.param = {};
        message.url = this.target;
        message.maxWidth = this.embedMaxWidth
        message.dataTitle = this.dataTitle;
        // This is needed for when you serve multiple wikis
        const wikiName = $tw.wiki.getTiddlerText("$:/WikiName");
        message.wiki = wikiName?wikiName:'';
        const token = localStorage.getItem('ws-token');
        message["token"] = token;
        // We need a message type at a minimum to send anything
        if(message.type) {
          // send web-socket request
          $tw.Bob.Shared.sendMessage(message, 0)
          console.log("Requesting oembed data for " + this.dataTitle)
        }        
      } else if (dataTiddler) {
        // use the response
        var response = {};
        try {
          var path = "html";
          templateTree[0].children = [{type: "transclude", attributes: {
            tiddler: {type: "string", value: this.dataTitle},
            index: {type: "string", value: path}}}];
        } catch (error) {
          console.log("Invalid JSON response to oembed request " + this.dataTitle);
          console.log(error.toString());
        }
      }
    }
    // Render contents
    this.makeChildWidgets(templateTree);
    this.renderChildren(this.parentDomNode,null);
  };
  
  /*
  Compute the internal state of the widget
  */
  EmbedWidget.prototype.execute = function() {
    // Get our parameters
    this.embedTarget = this.getAttribute("target", this.getVariable("currentTiddler"));
    this.embedMaxWidth = this.getAttribute("maxwidth");
    this.embedClass = this.getAttribute("class", "");

    this.target = this.embedTarget;
    // Determine what type of embed it is
    var tiddler = this.wiki.getTiddler(this.embedTarget);
    if(tiddler){
      // Check if it has a url we need
      if(tiddler.fields.url && tiddler.fields.url !== "") {
        this.target = tiddler.fields.url;
      }
    }
  };
  
  /*
  Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
  */
  EmbedWidget.prototype.refresh = function(changedTiddlers) {
    var changedAttributes = this.computeAttributes();
    var newUrl = false;
    if (changedTiddlers[this.embedTarget]) {
      var tiddler = this.wiki.getTiddler(this.embedTarget); 
      if (tiddler && tiddler.fields.url !== this.target) newUrl = true;
    }
    if(changedAttributes.target || changedAttributes.maxwidth || changedAttributes["class"] 
      || newUrl || changedTiddlers[this.dataTitle]) {
      this.refreshSelf();
      return true;
    } else {
      return false;		
    }
  };
  
  exports.embed = EmbedWidget;
  
  })();  