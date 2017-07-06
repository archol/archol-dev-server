"use strict";
exports.__esModule = true;
var express = require("express");
var http = require("http");
var fs = require("fs");
var path = require("path");
var plugins_1 = require("./plugins");
var static_1 = require("./static");
var logger_1 = require("./logger");
var app = express();
var server = http.createServer(app);
var listening = false;
var config;
plugins_1.defaultPlugins.forEach(registerPlugin);
function registerPlugin(plugin) {
    if (listening)
        throw new Error('Server yet started');
    loadPlugin(plugin);
}
exports.registerPlugin = registerPlugin;
function loadPlugin(plugin) {
    initHandlers();
    initInjections();
    function initHandlers() {
        Object.keys(plugin.handlers).forEach(function (path) {
            var h = plugin.handlers[path];
            if (typeof h === 'function')
                app.use(path, h);
            if (typeof h === 'string')
                app.use(path, static_1.serveStatic(path, h));
        });
    }
    function initInjections() {
        plugin.injections.forEach(function (script) {
            static_1.appendInjetion(script);
        });
    }
}
exports.loadPlugin = loadPlugin;
function startServer(callback) {
    server.listen(config.port, function () {
        listening = true;
        logger_1.serverLog('Listening on http://localhost:', server.address().port, '/');
        callback && callback();
    });
}
exports.startServer = startServer;
function serverLink(path) {
    return ['http://localhost:', config.port, path || '/'].join('');
}
exports.serverLink = serverLink;
function stopServer(callback) {
    server.close(function () {
        listening = false;
        callback && callback();
    });
}
exports.stopServer = stopServer;
function loadConfig(dir) {
    dir = path.resolve(dir);
    var packageJson = path.join(dir, 'package.json');
    if (!fs.existsSync(packageJson)) {
        logger_1.serverError(packageJson + ' not found in current directory');
        return false;
    }
    var text = fs.readFileSync(packageJson, 'utf-8');
    var json = JSON.parse(text);
    config = json['archol-dev-server'];
    if (!config) {
        logger_1.serverError('archol-dev-server not found in ' + packageJson);
        return false;
    }
    if (!(config.plugins && Array.isArray(config.plugins))) {
        logger_1.serverError('archol-dev-server.plugins must be an array in ' + packageJson);
        return false;
    }
    config.plugins.forEach(function (p) {
        require(path.resolve(path.join(dir, p)));
    });
    return true;
}
exports.loadConfig = loadConfig;
//# sourceMappingURL=api.js.map