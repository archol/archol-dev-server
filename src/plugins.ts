import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { IConfig, IPlugin, IProjection } from './api';
import { log } from './logger';

export const defaultPlugins: IPlugin[] = [
    {
        handlers: {
            ['/~ads/ping'](req, res, next) {
                res.setHeader('content-type', 'text/plain; charset=utf-8');
                res.write(new Date().toISOString());
                res.write('\r\n');
                res.write('\r\n');
                req.pipe(res);
            },
        },
        injections: [],
        transformers: {
            typescript: typescript_projection,
        },
    },
];

function typescript_projection(config: IConfig, projection: IProjection) {
    const files: ts.MapLike<{ version: number }> = {};
    let services: ts.LanguageService;
    try {
        const options: ts.CompilerOptions = JSON.parse(
            ts.sys.readFile(path.join(config.dir, 'tsconfig.json'), 'utf-8'));
        const servicesHost: ts.LanguageServiceHost = {
            fileExists: ts.sys.fileExists,
            getCompilationSettings: () => options,
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

        services = ts.createLanguageService(servicesHost, ts.createDocumentRegistry());

        const w = ts.sys.watchDirectory(path.join(config.dir, projection.from), fileChanged, true);

        return {
            stop() {
                w.close();
            },
        };
    } catch (e) {
        log({
            kind: 'error',
            message: e.message,
        });
        return undefined;
    }
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
            fs.writeFileSync(o.name, o.text, 'utf8');
        });
    }
    function logErrors(fileName: string) {
        const allDiagnostics = services.getCompilerOptionsDiagnostics()
            .concat(services.getSyntacticDiagnostics(fileName))
            .concat(services.getSemanticDiagnostics(fileName));

        allDiagnostics.forEach((diagnostic) => {
            const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
            if (diagnostic.file) {
                const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
                log({
                    character: character + 1,
                    file: diagnostic.file.fileName,
                    kind: 'error',
                    line: line + 1,
                    message,
                });
            } else {
                log({
                    kind: 'error',
                    message,
                });
            }
        });
    }
}
