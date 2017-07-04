"use strict";
exports.__esModule = true;
var express = require("express");
var http = require("http");
var fs = require("fs");
var plugins_1 = require("./plugins");
var app = express();
var server = http.createServer(app);
var plugins = plugins_1.defaultPlugins;
var config;
function registerPlugin(plugin) {
    if (plugins)
        plugins.push(plugin);
    else
        throw new Error('Server yet started');
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
    server.listen(config.port, function listening() {
        console.log('Listening on %d', server.address().port);
        callback && callback();
    });
}
exports.startServer = startServer;
function stopServer(callback) {
    server.close(callback);
}
exports.stopServer = stopServer;
function loadConfig() {
    if (!fs.existsSync('package.json')) {
        console.error('package.json not found in current directory');
        process.exit(1);
    }
    var text = fs.readFileSync('package.json', 'utf-8');
    var json = JSON.parse(text);
    config = json['archol-dev-server'];
    if (!config) {
        console.error('archol-dev-server not found in package.json');
        process.exit(2);
    }
}
exports.loadConfig = loadConfig;
