"use strict";
exports.__esModule = true;
var api_1 = require("./api");
api_1.registerPlugin({
    handlers: (_a = {},
        _a['/~ads/ping'] = function (req, res, next) {
            res.setHeader('content-type', 'text/plain; charset=utf-8');
            res.write(new Date().toISOString());
            res.write('\r\n');
            res.write('\r\n');
            req.pipe(res);
        },
        _a)
});
var _a;
