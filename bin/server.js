"use strict";
exports.__esModule = true;
var api_1 = require("./api");
setTimeout(function () {
    if (api_1.loadConfig(process.cwd())) {
        api_1.startServer(function () {
            //
        });
    }
}, 500);
//# sourceMappingURL=server.js.map