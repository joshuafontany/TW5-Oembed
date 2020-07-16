/*\
module-type: utils
tags: 
title: $:/plugins/joshuafontany/oembed/modules/utils/embedutils.js
type: application/javascript

Various embed utility functions added to $tw.utils

\*/
(function(){

    /*jslint node: true, browser: true */
    /*global $tw: false */
    "use strict";
    /**
     * RegExp-escapes all characters in the given string.
     */
    exports.regExpEscape = function (s) {
        return s.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
    }
    /**
     * Creates a RegExp from the given string, converting asterisks to .* expressions,
     * and escaping all other regex characters. Call with tw.utils.wildcardToRegExp(string).
     */
    exports.wildcardToRegExp = function (s) {
        return new RegExp(s.split(/\*+/).map($tw.utils.regExpEscape).join('.*'));
    }
    
})();