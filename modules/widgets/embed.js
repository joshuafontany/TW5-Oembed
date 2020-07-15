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
    this.embedClass+" tc-embedded-content" : "tc-embedded-content" ;
     // Default template is an external link to the url
    var templateTree = [
      {
        type: "element", tag: "p", attributes: {
          class: {type: "string", value: "tc-embedded-link"}
        }, 
        children: [
          {
            type: "transclude",
            attributes: {
              tiddler: {type: "string", value: "$:/core/images/link"}
            }
          },
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
        ]
      },
      {
        type: "element", tag: tag, attributes: {
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
    } else {
      // get the data tiddler
      var stateExists = this.wiki.tiddlerExists(this.stateTitle);
      if (!stateExists && !$tw.Bob) {
        /**
         * Creates a RegExp from the given string, converting asterisks to .* expressions,
         * and escaping all other characters.
         */
        function wildcardToRegExp (s) {
          return new RegExp('^' + s.split(/\*+/).map(regExpEscape).join('.*') + '$');
        }
        /**
         * RegExp-escapes all characters in the given string.
         */
        function regExpEscape (s) {
          return s.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
        }
        var requestUrl, providers = JSON.parse($tw.wiki.getTiddlerText("$:/plugins/joshuafontany/oembed/providers/oembed"));
        providers.forEach(function(provider){
          for (let e = 0; e < provider.endpoints.length; e++) {
            const endpoint = provider.endpoints[e];
            for (let s = 0; s < endpoint.schemas.length; s++) {
              const schema = endpoint.schemas[s];
              if (this.target.match(wildcardToRegExp(schema))) {
                requestUrl = endpoint.url
                break;
              }
            }
            if (requestUrl) break;
          }
        });
        
        this.setVariable("requestUrl", requestUrl);
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
        const wikiName = $tw.wiki.getTiddlerText("$:/WikiName");
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
          // use the response
          var response = JSON.parse(tiddler.fields.text);
          if(false) { //if(response["html"].match(/(?:^<iframe|^<video)/)) {
            var parsed = $tw.wiki.parseText("text/html", response["html"], {});
            templateTree[1].children = parsed.tree;
          } else {
            if (response["html"]) {
              var iframeStyles = $tw.wiki.parseText("text/vnd.tiddlywiki", $tw.wiki.getTiddlerText("$:/plugins/joshuafontany/oembed/styles/iframe-body"));
              var embed = '<html><head><style>'+iframeStyles+'</style></head><body><div class="contents">';
              if (response["provider_url"] && response["provider_url"] === "https://www.facebook.com"){
                embed = embed+'<div id="fb-root"></div>';
                embed = embed+response["html"];
                embed = embed+"</body></html>";
              } else {
                embed = embed+response["html"]+"</div></body></html>";
              }
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
            classes = classes + " tc-embedded-responsive";
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
    // component encode the url
    this.stateTitle = "$:/oembed/url/"+encodeURIComponent(this.target);
    this.setVariable("url", this.target);
    this.setVariable("stateTiddler", this.stateTitle);
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