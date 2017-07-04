
import express = require('express');
import http = require('http');
import fs = require('fs');
import path = require('path');
import { defaultPlugins } from './plugins';

const app = express();
const server = http.createServer(app);
let listening = false;

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
    if (listening)
        throw new Error('Server yet started');
    plugins.push(plugin);    
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

export function startServer(callback?: () => void) {
    server.listen(config.port, () => {
        listening = true;
        console.log('Listening on %d', server.address().port);
        callback && callback();
    });
}

export function stopServer(callback?: () => void) {
    server.close(() => {
        listening = false;
        callback && callback();
    });
}

export function loadConfig(dir: string) {
    dir = path.resolve(dir);
    let packageJson = path.join(dir, 'package.json')
    if (!fs.existsSync(packageJson)) {
        console.error(packageJson + ' not found in current directory');
        return false;
    }
    let text = fs.readFileSync(packageJson, 'utf-8');
    let json = JSON.parse(text);
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

