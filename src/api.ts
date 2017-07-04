
import express = require('express');
import http = require('http');
import fs = require('fs');
import { defaultPlugins } from './plugins';

const app = express();
const server = http.createServer(app);

export type Plugin = {
    handlers: {
        [path: string]: (req: express.Request, res: express.Response, next: express.NextFunction) => any
    }
};
const plugins: Array<Plugin> = defaultPlugins;
let config: {
    port: number
    plugins: string[]
};

export function registerPlugin(plugin: Plugin) {
    if (plugins)
        plugins.push(plugin);
    else
        throw new Error('Server yet started');
}

export function loadPlugins() {
    plugins.forEach(p => {
        loadPlugin(p);
    })
}

export function loadPlugin(plugin: Plugin) {
    initHandlers();
    function initHandlers() {
        Object.keys(plugin.handlers).forEach(path => {
            app.use(path, plugin.handlers[path]);
        })
    }
}

export function startServer(callback: () => void = null) {
    server.listen(config.port, function listening() {
        console.log('Listening on %d', server.address().port);
        callback && callback();
    });
}

export function stopServer(callback: () => void = null) {
    server.close(callback);
}

export function loadConfig() {
    if (!fs.existsSync('package.json')) {
        console.error('package.json not found in current directory');
        process.exit(1);
    }
    let text = fs.readFileSync('package.json', 'utf-8');
    let json = JSON.parse(text);
    config = json['archol-dev-server'];
    if (!config) {
        console.error('archol-dev-server not found in package.json');
        process.exit(2);
    }
}

