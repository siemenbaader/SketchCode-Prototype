/*
 Selection save and restore module for Rangy.
 Saves and restores user selections using marker invisible elements in the DOM.

 Part of Rangy, a cross-browser JavaScript range and selection library
 http://code.google.com/p/rangy/

 Depends on Rangy core.

 Copyright 2010, Tim Down
 Licensed under the MIT license.
 Version: 1.0b1
 Build date: 11 November 2010
*/
rangy.createModule("SaveRestore",function(h){function m(a,f){var b=h.util.randomString("selectionBoundary_"),c,d=o.getDocument(a.startContainer),g=a.cloneRange();g.collapse(f);c=d.createElement("span");c.id=b;c.appendChild(d.createTextNode(p));g.insertNode(c);g.detach();return c}function n(a,f,b,c){a=a.getElementById(b);f[c?"setStartBefore":"setEndBefore"](a);a.parentNode.removeChild(a)}function k(a,f){var b=a.getElementById(f);b&&b.parentNode.removeChild(b)}h.requireModules(["DomUtil","DomRange",
"WrappedRange"]);var o=h.dom,p="\ufeff";h.saveSelection=function(a){a=a||window;for(var f=h.getSelection(a),b=f.getAllRanges(),c=[],d,g,i=0,j=b.length,e;i<j;++i){e=b[i];if(e.collapsed){g=m(e,false);c.push({markerId:g.id,collapsed:true});e.collapseBefore(g)}else{g=m(e,false);d=m(e,true);e.setEndBefore(g);e.setStartAfter(d);c.push({startMarkerId:d.id,endMarkerId:g.id,collapsed:false,backwards:j==1&&f.isBackwards()})}}f.setRanges(b);return{win:a,doc:a.document,rangeInfos:c,restored:false}};h.restoreSelection=
function(a,f){if(!a.restored){var b=a.rangeInfos,c=h.getSelection(a.win);c.removeAllRanges();for(var d=0,g=b.length,i,j;d<g;++d){i=b[d];j=h.createRange(a.doc);if(i.collapsed){var e=a.doc.getElementById(i.markerId),l=e.previousSibling;if(l&&l.nodeType==3){e.parentNode.removeChild(e);j.collapseToPoint(l,l.length)}else{j.collapseBefore(e);e.parentNode.removeChild(e)}}else{n(a.doc,j,i.startMarkerId,true);n(a.doc,j,i.endMarkerId,false)}j.normalizeBoundaries();c.addRange(j,f&&i.backwards&&h.features.selectionHasExtend)}a.restored=
true}};h.removeMarkerElement=k;h.removeMarkers=function(a){for(var f=a.rangeInfos,b=0,c=f.length,d;b<c;++b){d=f[b];if(a.collapsed)k(a.doc,d.markerId);else{k(a.doc,d.startMarkerId);k(a.doc,d.endMarkerId)}}}});