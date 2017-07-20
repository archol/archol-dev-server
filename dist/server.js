"use strict";
exports.__esModule = true;
var api_1 = require("./api");
var logger_1 = require("./logger");
logger_1.addLogListenner(function (data) {
    // tslint:disable-next-line:no-console
    console.dir(data);
});
logger_1.addServerOnlyLogListenner(function (data) {
    // tslint:disable-next-line:no-console
    console.dir(data);
});
setTimeout(function () {
    if (api_1.loadConfig(process.cwd())) {
        api_1.startServer(function () {
            //
        });
    }
}, 500);
//# sourceMappingURL=server.js.map