"use strict";
exports.__esModule = true;
var express = require("express");
var http = require("http");
var fs = require("fs");
var path = require("path");
var plugins_1 = require("./plugins");
var app = express();
var server = http.createServer(app);
var listening = false;
var plugins = plugins_1.defaultPlugins;
var config;
function registerPlugin(plugin) {
    if (listening)
        throw new Error('Server yet started');
    plugins.push(plugin);
}
exports.registerPlugin = registerPlugin;
function loadPlugins() {
    plugins.forEach(function (p) {
        loadPlugin(p);
    });
}
exports.loadPlugins = loadPlugins;
function loadPlugin(plugin) {
    initHandlers();
    function initHandlers() {
        Object.keys(plugin.handlers).forEach(function (path) {
            app.use(path, plugin.handlers[path]);
        });
    }
}
exports.loadPlugin = loadPlugin;
function startServer(callback) {
    server.listen(config.port, function () {
        listening = true;
        console.log('Listening on %d', server.address().port);
        callback && callback();
    });
}
exports.startServer = startServer;
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
        console.error(packageJson + ' not found in current directory');
        return false;
    }
    var text = fs.readFileSync(packageJson, 'utf-8');
    var json = JSON.parse(text);
    config = json['archol-dev-server'];
    if (!config) {
        console.error('archol-dev-server not found in ' + packageJson);
        return false;
    }
    if (!(config.plugins && Array.isArray(config.plugins))) {
        console.error('archol-dev-server.plugins must be an array in ' + packageJson);
        return false;
    }
    config.plugins.forEach(function (p) {
        require(path.resolve(path.join(dir, p)));
    });
    return true;
}
exports.loadConfig = loadConfig;
//# sourceMappingURL=api.js.map