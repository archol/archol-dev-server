var api = require('../..');

api.registerPlugin(
    {
        handlers: {
            '/~samplesite': __dirname,
            '/~samplefile': __dirname+'/index.html',
            '/~sample/echo'(req, res, next) {
                res.setHeader('content-type', 'text/plain; charset=utf-8');
                res.end(req.query.s);
            }
        },
        injections: [
            '~samplesite/index.js'
        ]
    }
);

