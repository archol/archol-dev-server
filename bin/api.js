"use strict";
exports.__esModule = true;
var plugins = [];
function registerPlugin(plugin) {
    if (plugins)
        plugins.push(plugin);
    else
        throw new Error('Server yet started');
}
exports.registerPlugin = registerPlugin;
function initServer(app) {
    plugins.forEach(function (p) {
        initHandlers(p);
    });
    function initHandlers(plugin) {
        Object.keys(plugin.handlers).forEach(function (path) {
            app.use(path, plugin.handlers[path]);
        });
    }
}
exports.initServer = initServer;
