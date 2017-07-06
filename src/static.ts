import express = require('express');
import http = require('http');
import fs = require('fs');
import path = require('path');
import url = require('url');
import { warn } from './logger';
import es = require("event-stream");
var send = require('send');

// from https://github.com/tapio/live-server

let INJECTED_CODE = '';

export function appendInjetion(script: string) {
    INJECTED_CODE = [
        INJECTED_CODE,
        '<script src="',
        script,
        '"></script>'
    ].join('');
}
export function serveStatic(wwwroot: string, fsroot: string) {
    if (wwwroot[wwwroot.length-1]!=='/')
      wwwroot+='/';
    fsroot = path.resolve(fsroot);
    debugger
    var isFile = fs.statSync(fsroot).isFile();
    return function (req: express.Request, res: express.Response, next: express.NextFunction) {
        debugger
        if (req.method !== "GET" && req.method !== "HEAD") return next();
        let pathname = url.parse(req.originalUrl).pathname;        
        if (pathname.substr(0, wwwroot.length) !== wwwroot) return next();

        pathname = pathname.substr(wwwroot.length);
        let reqpath = isFile ? "" : pathname;
        var hasNoOrigin = !req.headers.origin;
        var injectCandidates = [new RegExp("</body>", "i"), new RegExp("</svg>"), new RegExp("</head>", "i")];
        var injectTag: string = null;

        function directory() {  
            res.statusCode = 301;
            const to=wwwroot + (pathname ? pathname + '/' : '')+ 'index.html';
            res.setHeader('Location', to);
            res.end('Redirecting to ' + escape(to));
        }

        function file(filepath: string /*, stat*/) {  
            var x = path.extname(filepath).toLocaleLowerCase(), match,
                possibleExtensions = ["", ".html", ".htm", ".xhtml", ".php", ".svg"];
            if (hasNoOrigin && (possibleExtensions.indexOf(x) > -1)) {
                var contents = fs.readFileSync(filepath, "utf8");
                for (var i = 0; i < injectCandidates.length; ++i) {
                    match = injectCandidates[i].exec(contents);
                    if (match) {
                        injectTag = match[0];
                        break;
                    }
                }
                if (injectTag === null) {
                    warn("Failed to inject refresh script!",
                        "Couldn't find any of the tags ", injectCandidates, "from", filepath);
                }
            }
        }

        function error(err: any) {
            next();
            // if (err.status === 404) return next();
            // next(err);
        }

        function inject(stream: NodeJS.ReadWriteStream) {
            if (injectTag) {
                var len = INJECTED_CODE.length + Number.parseInt(res.getHeader('Content-Length') as any);
                res.setHeader('Content-Length', len.toString());
                var originalPipe = stream.pipe;
                stream.pipe = function (resp: any) {
                    originalPipe.call(stream, es.replace(new RegExp(injectTag, "i"), INJECTED_CODE + injectTag)).pipe(resp);
                };
            }
        }

        send(req, reqpath, { root: fsroot })
            .on('error', error)
            .on('directory', directory)
            .on('file', file)
            .on('stream', inject)
            .pipe(res);
    };
}

function escape(html: string) {
    return String(html)
        .replace(/&(?!\w+;)/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}