import * as fs from "fs";
import * as ts from "typescript";
import { IPlugin, ITransformerSettings } from "./api";
import { log } from "./logger";

export const defaultPlugins: IPlugin[] = [
    {
        handlers: {
            ["/~ads/ping"](req, res, next) {
                res.setHeader("content-type", "text/plain; charset=utf-8");
                res.write(new Date().toISOString());
                res.write("\r\n");
                res.write("\r\n");
                req.pipe(res);
            },
        },
        injections: [],
        transformers: {
            typescript(settings: ITypescriptSettings) {
                return compile(settings);
            },
        },
    },
];

// / <reference path="typings/node/node.d.ts" />

interface ITypescriptSettings extends ITransformerSettings {
    options: ts.CompilerOptions;
}
function compile(settings: ITypescriptSettings) {
    const files: ts.MapLike<{ version: number }> = {};
    const servicesHost: ts.LanguageServiceHost = {
        fileExists: ts.sys.fileExists,
        getCompilationSettings: () => settings.options,
        getCurrentDirectory: () => process.cwd(),
        getDefaultLibFileName: (opts) => ts.getDefaultLibFilePath(opts),
        getScriptFileNames: () => [],
        getScriptSnapshot: (fileName) => {
            if (!fs.existsSync(fileName)) {
                return undefined;
            }

            return ts.ScriptSnapshot.fromString(fs.readFileSync(fileName).toString());
        },
        getScriptVersion: (fileName) => files[fileName] && files[fileName].version.toString(),
        readDirectory: ts.sys.readDirectory,
        readFile: ts.sys.readFile,
    };

    const services = ts.createLanguageService(servicesHost, ts.createDocumentRegistry());

    const w = ts.sys.watchDirectory(settings.project_path, fileChanged, true);

    return {
        stop() {
            w.close();
        },
    };

    function fileChanged(fileName: string, removed?: boolean) {
        files[fileName].version++;
        emitFile(fileName);
    }
    function emitFile(fileName: string) {
        const output = services.getEmitOutput(fileName);

        if (output.emitSkipped) {
            logErrors(fileName);
        }

        output.outputFiles.forEach((o) => {
            fs.writeFileSync(o.name, o.text, "utf8");
        });
    }
    function logErrors(fileName: string) {
        const allDiagnostics = services.getCompilerOptionsDiagnostics()
            .concat(services.getSyntacticDiagnostics(fileName))
            .concat(services.getSemanticDiagnostics(fileName));

        allDiagnostics.forEach((diagnostic) => {
            const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
            if (diagnostic.file) {
                const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
                log({
                    character: character + 1,
                    file: diagnostic.file.fileName,
                    kind: "error",
                    line: line + 1,
                    message,
                });
            } else {
                log({
                    kind: "error",
                    message,
                });
            }
        });
    }
}
