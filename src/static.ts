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
export function serveStatic(wwwroot: string, fsroot: string) {
    fsroot = path.resolve(fsroot);
    const isFile = fs.statSync(fsroot).isFile();
    if ((!isFile) && wwwroot[wwwroot.length - 1] !== "/") {
        wwwroot += "/";
    }

    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
        if (req.method !== "GET" && req.method !== "HEAD") {
            return next();
        }
        let pathname = url.parse(req.originalUrl).pathname;
        assert.equal(pathname.substr(0, wwwroot.length), wwwroot);

        pathname = pathname.substr(wwwroot.length - 1);
        const reqpath = isFile ? "" : pathname;
        const hasNoOrigin = !req.headers.origin;
        const injectCandidates = [new RegExp("</body>", "i"), new RegExp("</svg>"), new RegExp("</head>", "i")];
        let injectTag: string = null;

        send(req, reqpath, { root: fsroot })
            .on("error", (err: any) => {
                next();
                // if (err.status === 404) return next();
                // next(err);
            })
            .on("directory", () => {
                res.statusCode = 301;
                const to = wwwroot + pathname + "/index.html";
                res.setHeader("Location", to);
                res.end("Redirecting to " + escape(to));
            })
            .on("file", (filepath: string /*, stat*/) => {
                const x = path.extname(filepath).toLocaleLowerCase();
                let match;
                const possibleExtensions = ["", ".html", ".htm", ".xhtml", ".php", ".svg"];
                if (!(hasNoOrigin && (possibleExtensions.indexOf(x) > -1))) {
                    return;
                }
                const contents = fs.readFileSync(filepath, "utf8");
                for (const c of injectCandidates) {
                    match = c.exec(contents);
                    if (match) {
                        injectTag = match[0];
                        break;
                    }
                }
                if (injectTag === null) {
                    warn("Failed to inject refresh script!",
                        "Couldn't find any of the tags ", injectCandidates, "from", filepath);
                }
            })
            .on("stream", (stream: any) => {
                if (injectTag) {
                    const len = INJECTED_CODE.length + Number.parseInt(res.getHeader("Content-Length") as any);
                    res.setHeader("Content-Length", len.toString());
                    const originalPipe = stream.pipe;
                    stream.pipe = (resp: any) => {
                        originalPipe.call(stream,
                            es.replace(new RegExp(injectTag, "i"),
                                INJECTED_CODE + injectTag))
                            .pipe(resp);
                    };
                }
            })
            .pipe(res);
    };
}

function escape(html: string) {
    return String(html)
        .replace(/&(?!\w+;)/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
