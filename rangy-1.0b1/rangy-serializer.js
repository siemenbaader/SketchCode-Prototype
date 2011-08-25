/*
 Serializer module for Rangy.
 Serializes Ranges and Selections. An example use would be to store a user's selection on a particular page in a
 cookie or local storage and restore it on the user's next visit to the same page.

 Part of Rangy, a cross-browser JavaScript range and selection library
 http://code.google.com/p/rangy/

 Depends on Rangy core.

 Copyright 2010, Tim Down
 Licensed under the MIT license.
 Version: 1.0b1
 Build date: 11 November 2010
*/
rangy.createModule("Serializer",function(h,n){function o(b,a){a=a||[];var c=b.nodeType,e=b.childNodes,d=e.length,f=[c,b.nodeName,d].join(":"),g="",j="";switch(c){case 3:g=b.nodeValue.replace(/</g,"&lt;").replace(/>/g,"&gt;");break;case 8:g="<!--"+b.nodeValue.replace(/</g,"&lt;").replace(/>/g,"&gt;")+"--\>";break;default:g="<"+f+">";j="</>";break}g&&a.push(g);for(c=0;c<d;++c)o(e[c],a);j&&a.push(j);return a}function k(b){b=o(b).join("");return t(b).toString(16)}function l(b,a,c){var e=[],d=b;for(c=
c||i.getDocument(b).documentElement;d&&d!=c;){e.push(i.getNodeIndex(d,true));d=d.parentNode}return e.join("/")+":"+a}function m(b,a,c){if(a)c||i.getDocument(a);else{c=c||document;a=c.documentElement}b=b.split(":");a=a;c=b[0]?b[0].split("/"):[];for(var e=c.length,d;e--;){d=parseInt(c[e],10);if(d<a.childNodes.length)a=a.childNodes[parseInt(c[e],10)];else throw n.createError("deserializePosition failed: node "+i.inspectNode(a)+" has no child with index "+d+", "+e);}return new i.DomPosition(a,parseInt(b[1],
10))}function p(b,a,c){c=c||h.DomRange.getRangeDocument(b).documentElement;if(!i.isAncestorOf(c,b.commonAncestorContainer,true))throw Error("serializeRange: range is not wholly contained within specified root node");b=l(b.startContainer,b.startOffset,c)+","+l(b.endContainer,b.endOffset,c);a||(b+="{"+k(c)+"}");return b}function q(b,a,c){if(a)c=c||i.getDocument(a);else{c=c||document;a=c.documentElement}var e=/^([^,]+),([^,]+)({([^}]+)})?$/.exec(b);if((b=e[3])&&b!==k(a))throw Error("deserializeRange: checksums of serialized range root node and target root node do not match");
b=m(e[1],a,c);a=m(e[2],a,c);c=h.createRange(c);c.setStart(b.node,b.offset);c.setEnd(a.node,a.offset);return c}function r(b,a,c){b=b||rangy.getSelection();b=b.getAllRanges();for(var e=[],d=0,f=b.length;d<f;++d)e[d]=p(b[d],a,c);return e.join("|")}function s(b,a,c){if(a)c=c||i.getWindow(a);else{c=c||window;a=c.document.documentElement}b=b.split("|");for(var e=h.getSelection(c),d=[],f=0,g=b.length;f<g;++f)d[f]=q(b[f],a,c.document);e.setRanges(d);return e}h.requireModules(["WrappedSelection","WrappedRange"]);
if(typeof encodeURIComponent=="undefined"||typeof decodeURIComponent=="undefined")n.fail("Global object is missing encodeURIComponent and/or decodeURIComponent method");var t=function(){var b=null;return function(a){for(var c=[],e=0,d=a.length,f;e<d;++e){f=a.charCodeAt(e);if(f<128)c.push(f);else f<2048?c.push(f>>6|192,f&63|128):c.push(f>>12|224,f>>6&63|128,f&63|128)}a=-1;if(!b){e=[];d=0;for(var g;d<256;++d){g=d;for(f=8;f--;)if((g&1)==1)g=g>>>1^3988292384;else g>>>=1;e[d]=g>>>0}b=e}e=b;d=0;for(f=c.length;d<
f;++d){g=(a^c[d])&255;a=a>>>8^e[g]}return(a^-1)>>>0}}(),i=h.dom;h.serializePosition=l;h.deserializePosition=m;h.serializeRange=p;h.deserializeRange=q;h.serializeSelection=r;h.deserializeSelection=s;h.restoreSelectionFromCookie=function(b){b=b||window;var a;a:{a=b.document.cookie.split(/[;,]/);for(var c=0,e=a.length,d;c<e;++c){d=a[c].split("=");if(d[0].replace(/^\s+/,"")=="rangySerializedSelection")if(d=d[1]){a=decodeURIComponent(d.replace(/\s+$/,""));break a}}a=null}a&&s(a,b.doc)};h.saveSelectionCookie=
function(b,a){b=b||window;a=typeof a=="object"?a:{};var c=a.expires?";expires="+a.expires.toUTCString():"",e=a.path?";path="+a.path:"",d=a.domain?";domain="+a.domain:"",f=a.secure?";secure":"",g=r(rangy.getSelection(b));b.document.cookie=encodeURIComponent("rangySerializedSelection")+"="+encodeURIComponent(g)+c+e+d+f};h.getElementChecksum=k});