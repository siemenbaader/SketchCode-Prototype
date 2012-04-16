"use strict";

var jsDAV = require("jsDAV/lib/jsdav"),
    jsDAV_Locks_Backend_FS = require("jsDAV/lib/DAV/plugins/locks/fs");

// jsDAV.debugMode = true;

jsDAV.createServer({
    node: __dirname,
    locksBackend: new jsDAV_Locks_Backend_FS(__dirname + "/assets")
}, 8000);
