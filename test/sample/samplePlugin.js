var api = require('../..');

api.registerPlugin(
    {
        handlers: {
            ['/~sample/echo'](req, res, next) {
                res.setHeader('content-type', 'text/plain; charset=utf-8');
                res.end(req.query.s);
            }
        }
    }
);

