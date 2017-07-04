"use strict";
exports.__esModule = true;
var fs = require("fs");
var path = require("path");
var url = require("url");
var logger_1 = require("./logger");
var es = require("event-stream");
var send = require('send');
// from https://github.com/tapio/live-server
var INJECTED_CODE = '';
function appendInjetion(script) {
    INJECTED_CODE = [
        INJECTED_CODE,
        '<script src="',
        script,
        '"></script>'
    ].join('');
}
exports.appendInjetion = appendInjetion;
function serveStatic(wwwroot, fsroot) {
    fsroot = path.resolve(fsroot);
    var isFile = false;
    try {
        isFile = fs.statSync(fsroot).isFile();
    }
    catch (e) {
        if (e.code !== "ENOENT")
            throw e;
    }
    return function (req, res, next) {
        if (req.method !== "GET" && req.method !== "HEAD")
            return next();
        var pathname = url.parse(req.originalUrl).pathname;
        debugger;
        if (pathname.substr(0, wwwroot.length) !== wwwroot)
            return next();
        pathname = pathname.substr(wwwroot.length);
        var reqpath = isFile ? "" : pathname;
        var hasNoOrigin = !req.headers.origin;
        var injectCandidates = [new RegExp("</body>", "i"), new RegExp("</svg>"), new RegExp("</head>", "i")];
        var injectTag = null;
        function directory() {
            debugger;
            file(pathname + '/index.html');
            // res.statusCode = 301;
            // res.setHeader('Location', pathname + '/');
            // res.end('Redirecting to ' + escape(pathname) + '/');
        }
        function file(filepath /*, stat*/) {
            debugger;
            var x = path.extname(filepath).toLocaleLowerCase(), match, possibleExtensions = ["", ".html", ".htm", ".xhtml", ".php", ".svg"];
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
                    logger_1.warn("Failed to inject refresh script!", "Couldn't find any of the tags ", injectCandidates, "from", filepath);
                }
            }
        }
        function error(err) {
            if (err.status === 404)
                return next();
            next(err);
        }
        function inject(stream) {
            if (injectTag) {
                var len = INJECTED_CODE.length + Number.parseInt(res.getHeader('Content-Length'));
                res.setHeader('Content-Length', len.toString());
                var originalPipe = stream.pipe;
                stream.pipe = function (resp) {
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
exports.serveStatic = serveStatic;
function escape(html) {
    return String(html)
        .replace(/&(?!\w+;)/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
//# sourceMappingURL=static.js.map