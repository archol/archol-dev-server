"use strict";
exports.__esModule = true;
var express = require("express");
var http = require("http");
var api_1 = require("./api");
require("./ping");
exports.app = express();
setTimeout(function () {
    api_1.initServer(exports.app);
    var server = http.createServer(exports.app);
    server.listen(3000, function listening() {
        console.log('Listening on %d', server.address().port);
    });
}, 500);
