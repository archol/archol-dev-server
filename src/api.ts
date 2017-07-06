
import express = require('express');
import http = require('http');
import fs = require('fs');
import path = require('path');
import { defaultPlugins } from './plugins';
import { appendInjetion, serveStatic } from './static';
import { serverLog, serverError } from './logger';

const app = express();
const server = http.createServer(app);
let listening = false;

export type Middleware = (req: express.Request, res: express.Response, next: express.NextFunction) => any
export type StaticFolder = string;

export type Plugin = {
    handlers: {
        [path: string]: Middleware | StaticFolder
    },
    injections: string[]
};

let config: {
    port: number
    plugins: string[]
};

defaultPlugins.forEach(registerPlugin);

export function registerPlugin(plugin: Plugin) {
    if (listening)
        throw new Error('Server yet started');
    loadPlugin(plugin);
}

export function loadPlugin(plugin: Plugin) {
    initHandlers();
    initInjections();
    function initHandlers() {
        Object.keys(plugin.handlers).forEach(path => {
            const h = plugin.handlers[path];
            if (typeof h === 'function')
                app.use(path, h);
            if (typeof h === 'string')
                app.use(path, serveStatic(path, h));
        })
    }
    function initInjections() {
        plugin.injections.forEach(script => {
            appendInjetion(script);
        })
    }
}

export function startServer(callback?: () => void) {
    server.listen(config.port, () => {
        listening = true;
        serverLog('Listening on http://localhost:', server.address().port, '/');
        callback && callback();
    });
}
 
export function serverLink(path: string) {
  return ['http://localhost:', config.port, path || '/'].join('');
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
        serverError(packageJson + ' not found in current directory');
        return false;
    }
    let text = fs.readFileSync(packageJson, 'utf-8');
    let json = JSON.parse(text);
    config = json['archol-dev-server'];
    if (!config) {
        serverError('archol-dev-server not found in ' + packageJson);
        return false;
    }
    if (!(config.plugins && Array.isArray(config.plugins))) {
        serverError('archol-dev-server.plugins must be an array in ' + packageJson);
        return false;
    }
    config.plugins.forEach(function (p) {
        require(path.resolve(path.join(dir, p)));
    });
    return true;
}
