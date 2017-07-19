"use strict";
exports.__esModule = true;
var fs = require("fs");
var ts = require("typescript");
var logger_1 = require("./logger");
exports.defaultPlugins = [
    {
        handlers: (_a = {},
            _a["/~ads/ping"] = function (req, res, next) {
                res.setHeader("content-type", "text/plain; charset=utf-8");
                res.write(new Date().toISOString());
                res.write("\r\n");
                res.write("\r\n");
                req.pipe(res);
            },
            _a),
        injections: [],
        transformers: {
            typescript: function (settings) {
                return compile(settings);
            }
        }
    },
];
function compile(settings) {
    var files = {};
    var servicesHost = {
        fileExists: ts.sys.fileExists,
        getCompilationSettings: function () { return settings.options; },
        getCurrentDirectory: function () { return process.cwd(); },
        getDefaultLibFileName: function (opts) { return ts.getDefaultLibFilePath(opts); },
        getScriptFileNames: function () { return []; },
        getScriptSnapshot: function (fileName) {
            if (!fs.existsSync(fileName)) {
                return undefined;
            }
            return ts.ScriptSnapshot.fromString(fs.readFileSync(fileName).toString());
        },
        getScriptVersion: function (fileName) { return files[fileName] && files[fileName].version.toString(); },
        readDirectory: ts.sys.readDirectory,
        readFile: ts.sys.readFile
    };
    var services = ts.createLanguageService(servicesHost, ts.createDocumentRegistry());
    var w = ts.sys.watchDirectory(settings.project_path, fileChanged, true);
    return {
        stop: function () {
            w.close();
        }
    };
    function fileChanged(fileName, removed) {
        files[fileName].version++;
        emitFile(fileName);
    }
    function emitFile(fileName) {
        var output = services.getEmitOutput(fileName);
        if (output.emitSkipped) {
            logErrors(fileName);
        }
        output.outputFiles.forEach(function (o) {
            fs.writeFileSync(o.name, o.text, "utf8");
        });
    }
    function logErrors(fileName) {
        var allDiagnostics = services.getCompilerOptionsDiagnostics()
            .concat(services.getSyntacticDiagnostics(fileName))
            .concat(services.getSemanticDiagnostics(fileName));
        allDiagnostics.forEach(function (diagnostic) {
            var message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
            if (diagnostic.file) {
                var _a = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start), line = _a.line, character = _a.character;
                logger_1.log({
                    character: character + 1,
                    file: diagnostic.file.fileName,
                    kind: "error",
                    line: line + 1,
                    message: message
                });
            }
            else {
                logger_1.log({
                    kind: "error",
                    message: message
                });
            }
        });
    }
}
var _a;
//# sourceMappingURL=plugins.js.map