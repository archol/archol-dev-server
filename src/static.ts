import express = require("express");
import http = require("http");
import fs = require("fs");
import path = require("path");
import url = require("url");
import { warn } from "./logger";
import es = require("event-stream");
import assert = require("assert");
// tslint:disable-next-line:no-var-requires
const send = require("send");

// from https://github.com/tapio/live-server

let INJECTED_CODE = "";

export function appendInjetion(script: string) {
    INJECTED_CODE = [
        INJECTED_CODE,
        '<script src="',
        script,
        '"></script>',
    ].join("");
}

interface IStaticData {
    wwwroot: string;
    fsroot: string;
    isFile: boolean;
    pathname?: string;
    reqpath?: string;
    hasNoOrigin?: boolean;
    injectTag?: string;
}

export function serveStatic(wwwroot: string, fsroot: string) {
    fsroot = path.resolve(fsroot);
    const isFile = fs.statSync(fsroot).isFile();
    if ((!isFile) && wwwroot[wwwroot.length - 1] !== "/") {
        wwwroot += "/";
    }

    const data: IStaticData = {
        fsroot,
        isFile,
        wwwroot,
    };

    return createMiddleware(data);
}

const injectCandidates = [new RegExp("</body>", "i"), new RegExp("</svg>"), new RegExp("</head>", "i")];
function createMiddleware(data: IStaticData) {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
        if (req.method !== "GET" && req.method !== "HEAD") {
            return next();
        }
        data.pathname = url.parse(req.originalUrl).pathname;
        assert.equal(data.pathname.substr(0, data.wwwroot.length), data.wwwroot);

        data.pathname = data.pathname.substr(data.wwwroot.length - 1);
        data.reqpath = data.isFile ? "" : data.pathname;
        data.hasNoOrigin = !req.headers.origin;
        data.injectTag = null;

        sendResponse(data, req, res, next);
    };
}

function sendResponse(data: IStaticData, req: express.Request, res: express.Response, next: express.NextFunction) {
    send(req, data.reqpath, { root: data.fsroot })
        .on("error", (err: any) => {
            next();
            // if (err.status === 404) return next();
            // next(err);
        })
        .on("directory", directoryResponse(data, res))
        .on("file", fileResponse(data))
        .on("stream", injections(data, res))
        .pipe(res);
}

function directoryResponse(data: IStaticData, res: express.Response) {
    return () => {
        res.statusCode = 301;
        const to = data.wwwroot + data.pathname + "/index.html";
        res.setHeader("Location", to);
        res.end("Redirecting to " + escape(to));
    };
}

function fileResponse(data: IStaticData) {
    return (filepath: string /*, stat*/) => {
        const x = path.extname(filepath).toLocaleLowerCase();
        let match;
        const possibleExtensions = ["", ".html", ".htm", ".xhtml", ".php", ".svg"];
        if (!(data.hasNoOrigin && (possibleExtensions.indexOf(x) > -1))) {
            return;
        }
        const contents = fs.readFileSync(filepath, "utf8");
        for (const c of injectCandidates) {
            match = c.exec(contents);
            if (match) {
                data.injectTag = match[0];
                break;
            }
        }
        if (data.injectTag === null) {
            warn("Failed to inject refresh script!",
                "Couldn't find any of the tags ", injectCandidates, "from", filepath);
        }
    };
}

function injections(data: IStaticData, res: express.Response) {
    return (stream: any) => {
        if (!data.injectTag) {
            return;
        }
        const len = INJECTED_CODE.length + Number.parseInt(res.getHeader("Content-Length") as any);
        res.setHeader("Content-Length", len.toString());
        const originalPipe = stream.pipe;
        stream.pipe = (resp: any) => {
            originalPipe.call(stream,
                es.replace(new RegExp(data.injectTag, "i"),
                    INJECTED_CODE + data.injectTag))
                .pipe(resp);
        };
    };
}

function escape(html: string) {
    return String(html)
        .replace(/&(?!\w+;)/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
