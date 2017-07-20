"use strict";
exports.__esModule = true;
var fs = require("fs");
var path = require("path");
var ts = require("typescript");
var logger_1 = require("./logger");
exports.defaultPlugins = [
    {
        handlers: (_a = {},
            _a['/~ads/ping'] = function (req, res, next) {
                res.setHeader('content-type', 'text/plain; charset=utf-8');
                res.write(new Date().toISOString());
                res.write('\r\n');
                res.write('\r\n');
                req.pipe(res);
            },
            _a),
        injections: [],
        transformers: {
            typescript: typescript_projection
        }
    },
];
function typescript_projection(config, projection) {
    var files = {};
    var services;
    try {
        var options_1 = JSON.parse(ts.sys.readFile(path.join(config.dir, 'tsconfig.json'), 'utf-8'));
        var servicesHost = {
            fileExists: ts.sys.fileExists,
            getCompilationSettings: function () { return options_1; },
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
        services = ts.createLanguageService(servicesHost, ts.createDocumentRegistry());
        var w_1 = ts.sys.watchDirectory(path.join(config.dir, projection.from), fileChanged, true);
        return {
            stop: function () {
                w_1.close();
            }
        };
    }
    catch (e) {
        logger_1.log({
            kind: 'error',
            message: e.message
        });
        return undefined;
    }
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
            fs.writeFileSync(o.name, o.text, 'utf8');
        });
    }
    function logErrors(fileName) {
        var allDiagnostics = services.getCompilerOptionsDiagnostics()
            .concat(services.getSyntacticDiagnostics(fileName))
            .concat(services.getSemanticDiagnostics(fileName));
        allDiagnostics.forEach(function (diagnostic) {
            var message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
            if (diagnostic.file) {
                var _a = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start), line = _a.line, character = _a.character;
                logger_1.log({
                    character: character + 1,
                    file: diagnostic.file.fileName,
                    kind: 'error',
                    line: line + 1,
                    message: message
                });
            }
            else {
                logger_1.log({
                    kind: 'error',
                    message: message
                });
            }
        });
    }
}
var _a;
//# sourceMappingURL=plugins.js.map