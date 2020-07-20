/*\
title: $:/core/modules/parsers/wikiparser/rules/embedlink.js
type: application/javascript
module-type: wikirule

Wiki text inline rule for embedded external links. For example:

```
[embed[https://tiddlywiki.com/fractalveg.jpg]]
[embed width=500 [https://tiddlywiki.com/fractalveg.jpg]]
[embed width={{!!width}} [https://tiddlywiki.com/fractalveg.jpg]]
[embed width={{$:/themes/tiddlywiki/vanilla/metrics/tiddlerwidth}} [https://tiddlywiki.com/fractalveg.jpg]]
[embed height="32em" class="custom-embed" [TiddlerTitle]]
```

Generates the `<$embed>` widget.

\*/
(function(){

    /*jslint node: true, browser: true */
    /*global $tw: false */
    "use strict";
    
    exports.name = "embed";
    exports.types = {inline: true};
    
    exports.init = function(parser) {
        this.parser = parser;
    };
    
    exports.findNextMatch = function(startPos) {
        // Find the next tag
        this.nextEmbed = this.findnextEmbed(this.parser.source,startPos);
        return this.nextEmbed ? this.nextEmbed.start : undefined;
    };
    
    exports.parse = function() {
        // Move past the match
        this.parser.pos = this.nextEmbed.end;
        var node = {
            type: "embed",
            attributes: this.nextEmbed.attributes
        };
        return [node];
    };
    
    /*
    Find the next embed from the current position
    */
    exports.findnextEmbed = function(source,pos) {
        // A regexp for finding candidate HTML tags
        var reLookahead = /(\[embed)/g;
        // Find the next candidate
        reLookahead.lastIndex = pos;
        var match = reLookahead.exec(source);
        while(match) {
            // Try to parse the candidate as a tag
            var tag = this.parseembed(source,match.index);
            // Return success
            if(tag) {
                return tag;
            }
            // Look for the next match
            reLookahead.lastIndex = match.index + 1;
            match = reLookahead.exec(source);
        }
        // Failed
        return null;
    };
    
    /*
    Look for an embed at the specified position. Returns null if not found, otherwise returns {type: "embed", attributes: [], isSelfClosing:, start:, end:,}
    */
    exports.parseembed = function(source,pos) {
        var token,
            node = {
                type: "embed",
                start: pos,
                attributes: {}
            };
        // Skip whitespace
        pos = $tw.utils.skipWhiteSpace(source,pos);
        // Look for the `[embed`
        token = $tw.utils.parseTokenString(source,pos,"[embed");
        if(!token) {
            return null;
        }
        pos = token.end;
        // Skip whitespace
        pos = $tw.utils.skipWhiteSpace(source,pos);
        // Process attributes
        if(source.charAt(pos) !== "[") {
            var attribute = $tw.utils.parseAttribute(source,pos);
            while(attribute) {
                node.attributes[attribute.name] = attribute;
                pos = attribute.end;
                pos = $tw.utils.skipWhiteSpace(source,pos);
                if(source.charAt(pos) !== "[") {
                    // Get the next attribute
                    attribute = $tw.utils.parseAttribute(source,pos);
                } else {
                    attribute = null;
                }
            }
        }
        // Skip whitespace
        pos = $tw.utils.skipWhiteSpace(source,pos);
        // Look for the `[` after the attributes
        token = $tw.utils.parseTokenString(source,pos,"[");
        if(!token) {
            return null;
        }
        pos = token.end;
        // Skip whitespace
        pos = $tw.utils.skipWhiteSpace(source,pos);
        // Get the source up to the terminating `]]`
        token = $tw.utils.parseTokenRegExp(source,pos,/([^\]]+?)\]\]/g);
        if(!token) {
            return null;
        }
        pos = token.end;
        node.attributes.target = {type: "string", value: (token.match[1] || this.wiki.getVariable("currentTiddler")).trim()};
        // Update the end position
        node.end = pos;
        return node;
    };
    
    })();    