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
  if($tw.node) var urls = require('url');
  
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
    this.embedClass+" tc-embedded tc-embedded-responsive" : "tc-embedded tc-embedded-responsive" ;
     // Default template is an external link to the url
    var templateTree = [
      {
        type: "transclude", 
        attributes: {
          tiddler: {type: "string", value: "$:/plugins/joshuafontany/oembed/embed-link"}
        }
      },
      {
        type: "element", tag: tag, 
        attributes: {
          class: {type: "string", value: classes}
        }, 
        children: []
      }
    ];
    // Get the cookies permissions from tiddlywiki/consent-banner
    var blockEmbeds = this.getVariable("tv-block-embedded-content", "yes");
    if (blockEmbeds === "yes") {
      // blocked-embed-message templateTree
		  templateTree[1].children = [{
        type: "transclude", 
        attributes: {
          tiddler: {type: "string", value: "$:/config/plugins/tiddlywiki/consent-banner/blocked-embed-message"}
        }
      }];
    } else if(this.requestEndpoint === "") {
      // not-whitelisted-message templateTree
		  templateTree[1].children = [{
        type: "transclude", 
        attributes: {
          tiddler: {type: "string", value: "$:/plugins/joshuafontany/oembed/not-whitelisted-message"}
        }
      }];
    } else {
      //find out where we are served from
      var protocol = this.wiki.getTiddlerText("$:/info/url/protocol")
      // get the data tiddler
      var stateExists = this.wiki.tiddlerExists(this.stateTitle);
      if (!stateExists && !$tw.Bob) {
        // manual embed templateTree
        templateTree[1].children = [{
          type: "transclude", 
          attributes: {
            tiddler: {type: "string", value: "$:/plugins/joshuafontany/oembed/manual-embed"}
          }
        }];
      } else if (!stateExists && $tw.Bob) {
        // Create the empty message object
        let message = {};
        // Add in the message type and param, if they exist
        message.type = "oembed";
        //message.param = {};
        message.url = this.target;
        message.maxWidth = this.embedMaxWidth
        message.dataTitle = this.stateTitle;
        // This is needed for when you serve multiple wikis
        const wikiName = this.wiki.getTiddlerText("$:/WikiName");
        message.wiki = wikiName?wikiName:'';
        const token = localStorage.getItem('ws-token');
        message["token"] = token;
        // We need a message type at a minimum to send anything
        if(message.type) {
          // send web-socket request
          $tw.Bob.Shared.sendMessage(message, 0)
          console.log("Requesting oembed for " + this.stateTitle)
        }        
      } else if (stateExists) {
        var tiddler = this.wiki.getTiddler(this.stateTitle);
        try {
          //find out if we are a local file on `file:` protocol
          var response, responseHTML;
          // use the response
          response = JSON.parse(tiddler.fields.text);
          if(protocol === "file:"){
            responseHTML = response["html"].replace(/(?<=<script.+?)(src="\/\/)(?=.*?>)/g, 'src="http:\/\/');
          } else {
            responseHTML = response["html"];
          }
          if(responseHTML && responseHTML.match(/(?:^<iframe)/)) {
            templateTree[1].children = [ {
              type: "transclude",
              attributes: {
                tiddler: {type: "string", value: this.stateTitle},
                index: {type: "string", value: "html"}
              }
            }];
          } else {
            if (responseHTML) {
              var iframeStyles = this.wiki.getTiddlerText("$:/plugins/joshuafontany/oembed/styles/iframe-body");
              if (protocol === "file:" 
                && response["provider_name" === "Facebook"]
                && response["type"] === "video") {
                  iframeStyle += this.wiki.getTiddlerText("$:/plugins/joshuafontany/oembed/styles/local-fb-video-fix");
                }
              var embed = '<html><head><style>'+iframeStyles+'</style></head><body>';
              embed = embed+responseHTML;
              embed = embed+"</body></html>";
            } else {
              embed = JSON.stringify(response, null, 2);
            }
            templateTree[1].children =  [{
              type: "element",
              tag: "iframe",
              attributes: {
                srcdoc: {type: "string", value: embed},
                sandbox: {type: "string", value: "allow-same-origin allow-scripts allow-popups allow-forms allow-presentation"}
              }
            }];
          }
          if (response["width"] && response["height"]) {
            var aspectClass, aspect = parseInt(0 + response["height"]) / parseInt( 0 + response["width"]) * 100;
            switch (true) {
              case Math.floor(aspect) == 0: aspectClass = "tc-embedded-default";                
                break;
              case Math.floor(aspect) <= 56: aspectClass = "tc-embedded-16-9";                
                break;
              case Math.floor(aspect) <= 62: aspectClass = "tc-embedded-8-5"                
                break;
              case Math.floor(aspect) <= 66: aspectClass = "tc-embedded-3-2"                
                break;
              case Math.floor(aspect) <= 75: aspectClass = "tc-embedded-4-3"                
                break;
              case Math.floor(aspect) <= 100: aspectClass = "tc-embedded-1-1"                
                break;
              default: aspectClass = "tc-embedded-default";
                break;
            }
            if(aspectClass) classes = classes + " "+ aspectClass;
          } else if (response["width"] && !response["height"]) {
            classes = classes + " "+ "tc-embedded-default";
          }
          templateTree[1].attributes["class"].value = classes;
        } catch (error) {
          console.log("Invalid JSON response to oembed request " + this.stateTitle);
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
    //Parse the URL
    this.requestURL = ($tw.node)? urls.parse(this.target): new URL(this.target);
    this.requestEndpoint = "";
        for (let e = 0; e < $tw.oembed.endpoints.length; e++) {
          var endpoint = $tw.oembed.endpoints[e];
          var domainMatch = (this.requestURL.hostname.indexOf(endpoint.domain) !== -1);
          if (domainMatch && this.requestURL.pathname.match(endpoint.path)) {
            this.requestEndpoint = endpoint.endpoint;
          }
          if (this.requestEndpoint !== "") break;
        }
    this.setVariable("requestEndpoint", this.requestEndpoint);
    // component encode the url for the stateTitle
    this.stateTitle = "$:/oembed/url/"+encodeURIComponent(this.target);
    this.setVariable("url", this.target);
    this.setVariable("urlDomain", this.requestURL.hostname);
    this.setVariable("stateTitle", this.stateTitle);
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
      || newUrl || changedTiddlers[this.stateTitle]) {
      this.refreshSelf();
      return true;
    } else {
      return false;		
    }
  };
  
  exports.embed = EmbedWidget;
  
  })();  