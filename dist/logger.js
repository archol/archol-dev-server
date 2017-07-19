"use strict";
exports.__esModule = true;
var logListenners = [];
function log(data) {
    if (logListenners.length) {
        logListenners.forEach(function (fn) { return fn(data); });
    }
    else {
        throw new Error("has no logListenners");
    }
}
exports.log = log;
function addLogListenner(fn) {
    var i = logListenners.indexOf(fn);
    if (i === -1) {
        logListenners.push(fn);
    }
}
exports.addLogListenner = addLogListenner;
function removeLogListenner(fn) {
    var i = logListenners.indexOf(fn);
    if (i >= 0) {
        logListenners.splice(i, 1);
    }
}
exports.removeLogListenner = removeLogListenner;
var serverOnlyLogListenners = [];
function serverOnlyLog(data) {
    if (serverOnlyLogListenners.length) {
        serverOnlyLogListenners.forEach(function (fn) { return fn(data); });
    }
    else {
        throw new Error("has no logListenners");
    }
}
exports.serverOnlyLog = serverOnlyLog;
function addServerOnlyLogListenner(fn) {
    var i = serverOnlyLogListenners.indexOf(fn);
    if (i === -1) {
        serverOnlyLogListenners.push(fn);
    }
}
exports.addServerOnlyLogListenner = addServerOnlyLogListenner;
function removeServerOnlyLogListenner(fn) {
    var i = serverOnlyLogListenners.indexOf(fn);
    if (i >= 0) {
        serverOnlyLogListenners.splice(i, 1);
    }
}
exports.removeServerOnlyLogListenner = removeServerOnlyLogListenner;
//# sourceMappingURL=logger.js.map