// export function log(...args: any[]) {
//     console.log.apply(console, args)
// }
"use strict";
exports.__esModule = true;
function warn() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    console.warn.apply(console, args);
}
exports.warn = warn;
// export function error(...args: any[]) {
//     console.error.apply(console, args)
// }
function serverLog() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    console.error.apply(console, args);
}
exports.serverLog = serverLog;
function serverError() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    console.error.apply(console, args);
}
exports.serverError = serverError;
//# sourceMappingURL=logger.js.map