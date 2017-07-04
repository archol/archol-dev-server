"use strict";
exports.__esModule = true;
var api_1 = require("./api");
setTimeout(function () {
    api_1.loadConfig();
    api_1.loadPlugins();
    api_1.startServer();
}, 500);
