
export interface ILogData {
    message: string;
    args?: string[];
    file?: string;
    line?: number;
    character?: number;
    kind: "hint" | "warning" | "error" | "fatal";
}

export type LogHook = (data: ILogData) => void;

const logListenners: LogHook[] = [];
export function log(data: ILogData) {
    if (logListenners.length) {
        logListenners.forEach((fn) => fn(data));
    } else {
        throw new Error("has no logListenners");
    }
}
export function addLogListenner(fn: LogHook) {
    const i = logListenners.indexOf(fn);
    if (i === -1) {
        logListenners.push(fn);
    }
}
export function removeLogListenner(fn: LogHook) {
    const i = logListenners.indexOf(fn);
    if (i >= 0) {
        logListenners.splice(i, 1);
    }
}

const serverOnlyLogListenners: LogHook[] = [];
export function serverOnlyLog(data: ILogData) {
    if (serverOnlyLogListenners.length) {
        serverOnlyLogListenners.forEach((fn) => fn(data));
    } else {
        throw new Error("has no logListenners");
    }
}
export function addServerOnlyLogListenner(fn: LogHook) {
    const i = serverOnlyLogListenners.indexOf(fn);
    if (i === -1) {
        serverOnlyLogListenners.push(fn);
    }
}
export function removeServerOnlyLogListenner(fn: LogHook) {
    const i = serverOnlyLogListenners.indexOf(fn);
    if (i >= 0) {
        serverOnlyLogListenners.splice(i, 1);
    }
}
