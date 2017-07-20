
import express = require('express');
import http = require('http');
import fs = require('fs');
import path = require('path');
import { serverOnlyLog } from './logger';
import { defaultPlugins } from './plugins';
import { appendInjetion, serveStatic } from './static';

const app = express();
const server = http.createServer(app);
let listening = false;

export type Middleware = (req: express.Request, res: express.Response, next: express.NextFunction) => any;
export type StaticFolder = string;

export interface IProjection {
    from: string;
    to: string;
    transformer: string;
}

export type Transformer<T extends IProjection> = (config: IConfig, projection: T) => {
    stop(): void;
};

export interface IPlugin {
    handlers: {
        [path: string]: Middleware | StaticFolder,
    };
    injections: string[];
    transformers: { [name: string]: Transformer<any> };
}

export interface IConfig {
    dir: string;
    port: number;
    plugins: string[];
    projections: IProjection[];
}

let config: IConfig;

defaultPlugins.forEach(registerPlugin);

export function registerPlugin(plugin: IPlugin) {
    if (listening) {
        throw new Error('Server yet started');
    }
    loadPlugin(plugin);
}

export function loadPlugin(plugin: IPlugin) {
    Object.keys(plugin.handlers).forEach((urlpath) => {
        const h = plugin.handlers[urlpath];
        if (typeof h === 'function') {
            app.use(urlpath, h);
        }
        if (typeof h === 'string') {
            app.use(urlpath, serveStatic(urlpath, h));
        }
    });
    plugin.injections.forEach((script) => {
        appendInjetion(script);
    });
}

export function startServer(callback: () => void) {
    server.listen(config.port, () => {
        listening = true;
        serverOnlyLog({
            kind: 'hint',
            message: 'Listening on http://localhost: ' + server.address().port + '/',
        });
        callback();
    });
}

export function serverLink(urlpath: string) {
    const r: http.RequestOptions = {
        hostname: 'localhost',
        method: 'GET',
        path: urlpath,
        port: config.port,
        protocol: 'http:',
    };
    return r;
}

export function stopServer(callback: () => void) {
    server.close(() => {
        listening = false;
        callback();
    });
}

export function loadConfig(dir: string) {
    dir = path.resolve(dir);
    const packageJson = path.join(dir, 'package.json');
    if (!fs.existsSync(packageJson)) {
        serverOnlyLog({
            kind: 'error',
            message: packageJson + ' not found in current directory',
        });
        return false;
    }
    const text = fs.readFileSync(packageJson, 'utf-8');
    const json = JSON.parse(text);
    config = json['archol-dev-server'];
    if (!config) {
        serverOnlyLog({
            kind: 'error',
            message: 'archol-dev-server not found in ' + packageJson,
        });
        return false;
    }
    if (typeof config === 'object') {
        config.dir = dir;
    }
    return loadPluginsFromConfig()
        && loadProjectionsFromConfig();

    function loadPluginsFromConfig() {
        if (!(config.plugins && Array.isArray(config.plugins))) {
            serverOnlyLog({
                kind: 'error',
                message: 'archol-dev-server.plugins must be an array in ' + packageJson,
            });
            return false;
        }
        config.plugins.forEach((p) => {
            require(path.resolve(path.join(dir, p)));
        });
        return true;
    }

    function loadProjectionsFromConfig() {
        if (!(config.projections && Array.isArray(config.projections))) {
            serverOnlyLog({
                kind: 'error',
                message: 'archol-dev-server.plugins must be an array in ' + packageJson,
            });
            return false;
        }
        return true;
    }
}
