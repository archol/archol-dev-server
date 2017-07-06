"use strict";
exports.__esModule = true;
var fs = require("fs");
var path = require("path");
var url = require("url");
var logger_1 = require("./logger");
var es = require("event-stream");
var assert = require("assert");
// tslint:disable-next-line:no-var-requires
var send = require("send");
// from https://github.com/tapio/live-server
var INJECTED_CODE = "";
function appendInjetion(script) {
    INJECTED_CODE = [
        INJECTED_CODE,
        '<script src="',
        script,
        '"></script>',
    ].join("");
}
exports.appendInjetion = appendInjetion;
function serveStatic(wwwroot, fsroot) {
    fsroot = path.resolve(fsroot);
    var isFile = fs.statSync(fsroot).isFile();
    if ((!isFile) && wwwroot[wwwroot.length - 1] !== "/") {
        wwwroot += "/";
    }
    var data = {
        fsroot: fsroot,
        isFile: isFile,
        wwwroot: wwwroot
    };
    return createMiddleware(data);
}
exports.serveStatic = serveStatic;
var injectCandidates = [new RegExp("</body>", "i"), new RegExp("</svg>"), new RegExp("</head>", "i")];
function createMiddleware(data) {
    return function (req, res, next) {
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
function sendResponse(data, req, res, next) {
    send(req, data.reqpath, { root: data.fsroot })
        .on("error", function (err) {
        next();
        // if (err.status === 404) return next();
        // next(err);
    })
        .on("directory", function () {
        res.statusCode = 301;
        var to = data.wwwroot + data.pathname + "/index.html";
        res.setHeader("Location", to);
        res.end("Redirecting to " + escape(to));
    })
        .on("file", function (filepath /*, stat*/) {
        var x = path.extname(filepath).toLocaleLowerCase();
        var match;
        var possibleExtensions = ["", ".html", ".htm", ".xhtml", ".php", ".svg"];
        if (!(data.hasNoOrigin && (possibleExtensions.indexOf(x) > -1))) {
            return;
        }
        var contents = fs.readFileSync(filepath, "utf8");
        for (var _i = 0, injectCandidates_1 = injectCandidates; _i < injectCandidates_1.length; _i++) {
            var c = injectCandidates_1[_i];
            match = c.exec(contents);
            if (match) {
                data.injectTag = match[0];
                break;
            }
        }
        if (data.injectTag === null) {
            logger_1.warn("Failed to inject refresh script!", "Couldn't find any of the tags ", injectCandidates, "from", filepath);
        }
    })
        .on("stream", function (stream) {
        if (data.injectTag) {
            var len = INJECTED_CODE.length + Number.parseInt(res.getHeader("Content-Length"));
            res.setHeader("Content-Length", len.toString());
            var originalPipe_1 = stream.pipe;
            stream.pipe = function (resp) {
                originalPipe_1.call(stream, es.replace(new RegExp(data.injectTag, "i"), INJECTED_CODE + data.injectTag))
                    .pipe(resp);
            };
        }
    })
        .pipe(res);
}
function escape(html) {
    return String(html)
        .replace(/&(?!\w+;)/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
//# sourceMappingURL=static.js.map