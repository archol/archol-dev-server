
import express = require("express");
import http = require("http");
import fs = require("fs");
import path = require("path");
import { serverError, serverLog } from "./logger";
import { defaultPlugins } from "./plugins";
import { appendInjetion, serveStatic } from "./static";

const app = express();
const server = http.createServer(app);
let listening = false;

export type Middleware = (req: express.Request, res: express.Response, next: express.NextFunction) => any;
export type StaticFolder = string;

export interface IPlugin {
    handlers: {
        [path: string]: Middleware | StaticFolder,
    };
    injections: string[];
}

let config: {
    port: number
    plugins: string[],
};

defaultPlugins.forEach(registerPlugin);

export function registerPlugin(plugin: IPlugin) {
    if (listening) {
        throw new Error("Server yet started");
    }
    loadPlugin(plugin);
}

export function loadPlugin(plugin: IPlugin) {
    Object.keys(plugin.handlers).forEach((urlpath) => {
        const h = plugin.handlers[urlpath];
        if (typeof h === "function") {
            app.use(urlpath, h);
        }
        if (typeof h === "string") {
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
        serverLog("Listening on http://localhost:", server.address().port, "/");
        callback();
    });
}

export function serverLink(urlpath: string) {
    const r: http.RequestOptions = {
        hostname: "localhost",
        method: "GET",
        path: urlpath,
        port: config.port,
        protocol: "http:",
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
    const packageJson = path.join(dir, "package.json");
    if (!fs.existsSync(packageJson)) {
        serverError(packageJson + " not found in current directory");
        return false;
    }
    const text = fs.readFileSync(packageJson, "utf-8");
    const json = JSON.parse(text);
    config = json["archol-dev-server"];
    if (!config) {
        serverError("archol-dev-server not found in " + packageJson);
        return false;
    }
    if (!(config.plugins && Array.isArray(config.plugins))) {
        serverError("archol-dev-server.plugins must be an array in " + packageJson);
        return false;
    }
    config.plugins.forEach((p) => {
        require(path.resolve(path.join(dir, p)));
    });
    return true;
}
